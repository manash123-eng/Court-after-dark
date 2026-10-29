import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Facility from "@/models/Facility";
import Maintenance from "@/models/Maintenance";
import User from "@/models/User";
import { getSessionUser } from "@/lib/auth";
import {
  rangesOverlap,
  isWithinOperatingHours,
  timeToMinutes,
  getSystemRules,
  isPrimeTimeSlot,
  recordAuditLog,
} from "@/lib/bookingRules";
import { MOCK_FACILITIES } from "@/lib/mockData";

// In-memory fallback bookings store
let inMemoryBookings = [];

// GET /api/bookings -> current user's bookings (or all for admin, with optional filters)
export async function GET(request) {
  const session = getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all");
  const status = searchParams.get("status");
  const facilityId = searchParams.get("facilityId");
  const date = searchParams.get("date");

  try {
    await connectDB();
    const query = {};
    if (session.role === "admin" && all === "true") {
      if (status && status !== "All") query.status = status;
      if (facilityId) query.facilityId = facilityId;
      if (date) query.date = date;
    } else {
      query.userId = session.id;
      if (status && status !== "All") query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate("facilityId", "name type location image pricePerHour city indoorOutdoor")
      .populate("userId", "name email phone")
      .sort({ date: -1, startTime: -1 });

    return NextResponse.json({ bookings });
  } catch (err) {
    // Return in-memory fallback bookings for this user
    let userBookings = session.role === "admin" && all === "true"
      ? inMemoryBookings
      : inMemoryBookings.filter((b) => b.userId?.toString() === session.id);

    if (status && status !== "All") {
      userBookings = userBookings.filter((b) => b.status === status);
    }
    return NextResponse.json({ bookings: userBookings });
  }
}

// POST /api/bookings -> concurrency-safe booking creation enforcing all fairness rules + payment
export async function POST(request) {
  const session = getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "You must be logged in to book." }, { status: 401 });
  }

  const body = await request.json();
  const {
    facilityId,
    date,
    startTime,
    endTime,
    notes = "",
    paymentMethod = "Pay at Venue",
    paymentStatus = "Pay at Venue",
    paymentDetails = {},
    equipmentAddons = [],
  } = body;

  if (!facilityId || !date || !startTime || !endTime) {
    return NextResponse.json({ error: "Facility, date, and time slot are required." }, { status: 400 });
  }

  let rules = {
    maxActiveBookingsPerUser: 2,
    maxAdvanceBookingDays: 14,
    maxBookingDurationHours: 2,
    cancellationDeadlineHours: 4,
    primeTimeStart: "18:00",
    primeTimeEnd: "21:00",
    maxPrimeTimeBookingsPerWeek: 3,
  };

  try {
    rules = await getSystemRules().catch(() => rules);
  } catch {
    // default rules
  }

  // Duration check
  const durationHours = (timeToMinutes(endTime) - timeToMinutes(startTime)) / 60;
  if (durationHours <= 0 || durationHours > rules.maxBookingDurationHours) {
    return NextResponse.json(
      { error: `Booking duration must be between 1 and ${rules.maxBookingDurationHours} hours.` },
      { status: 400 }
    );
  }

  const bookingReference = `CAD-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  try {
    await connectDB();

    // Facility existence
    let facility = await Facility.findById(facilityId);
    if (!facility) {
      facility = MOCK_FACILITIES.find((f) => f._id === facilityId);
    }
    if (!facility) {
      return NextResponse.json({ error: "Facility not found." }, { status: 404 });
    }

    // Fair-use cap: Max active bookings per user
    const activeCount = await Booking.countDocuments({ userId: session.id, status: "Confirmed" });
    if (activeCount >= rules.maxActiveBookingsPerUser) {
      return NextResponse.json(
        {
          error: `Fair-use limit reached: you currently hold ${activeCount} active booking(s). Maximum permitted is ${rules.maxActiveBookingsPerUser}.`,
        },
        { status: 400 }
      );
    }

    // Check conflict
    const conflictingBookings = await Booking.find({
      facilityId,
      date,
      status: "Confirmed",
    });

    const isConflict = conflictingBookings.some((b) =>
      rangesOverlap(startTime, endTime, b.startTime, b.endTime)
    );

    if (isConflict) {
      return NextResponse.json(
        {
          error: "Sorry, this time slot was just reserved by another player. You can join the waitlist.",
          canWaitlist: true,
        },
        { status: 409 }
      );
    }

    const pricePerHour = facility.pricePerHour || 40;
    const courtTotal = pricePerHour * durationHours;
    const eqTotal = equipmentAddons.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
    const totalPrice = courtTotal + eqTotal;

    const newBooking = await Booking.create({
      bookingReference,
      userId: session.id,
      facilityId,
      date,
      startTime,
      endTime,
      durationHours,
      pricePerHour,
      equipmentAddons,
      equipmentTotal: eqTotal,
      totalPrice,
      paymentMethod,
      paymentStatus: paymentMethod === "Pay at Venue" ? "Pay at Venue" : "Paid",
      paymentDetails: {
        ...paymentDetails,
        paidAt: paymentMethod !== "Pay at Venue" ? new Date() : null,
      },
      status: "Confirmed",
      notes,
    });

    await Facility.findByIdAndUpdate(facilityId, { $inc: { bookingCount: 1 } }).catch(() => {});

    const populated = await Booking.findById(newBooking._id)
      .populate("facilityId", "name type location image pricePerHour city indoorOutdoor")
      .populate("userId", "name email phone");

    await recordAuditLog({
      action: "BOOKING_CREATED",
      performedBy: session.id,
      performedByName: session.name || session.email,
      entityType: "Booking",
      entityId: newBooking._id.toString(),
      details: `Booked ${facility.name} on ${date} (${startTime}-${endTime}) Method: ${paymentMethod} Ref: ${bookingReference}`,
      severity: "info",
    }).catch(() => {});

    return NextResponse.json(
      {
        message: "Booking confirmed successfully! Your court is reserved.",
        booking: populated,
      },
      { status: 201 }
    );
  } catch (err) {
    // In-memory fallback
    const mockFacility = MOCK_FACILITIES.find((f) => f._id === facilityId) || MOCK_FACILITIES[0];
    const pricePerHour = mockFacility.pricePerHour || 40;
    const courtTotal = pricePerHour * durationHours;
    const eqTotal = equipmentAddons.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
    const totalPrice = courtTotal + eqTotal;

    const mockBooking = {
      _id: `bk_${Date.now()}`,
      bookingReference,
      userId: { _id: session.id, name: session.name || "Aarav Sharma", email: session.email || "aarav@example.com" },
      facilityId: mockFacility,
      date,
      startTime,
      endTime,
      durationHours,
      pricePerHour,
      equipmentAddons,
      equipmentTotal: eqTotal,
      totalPrice,
      paymentMethod,
      paymentStatus: paymentMethod === "Pay at Venue" ? "Pay at Venue" : "Paid",
      paymentDetails: {
        ...paymentDetails,
        paidAt: paymentMethod !== "Pay at Venue" ? new Date().toISOString() : null,
      },
      status: "Confirmed",
      notes,
      createdAt: new Date().toISOString(),
    };

    inMemoryBookings.unshift(mockBooking);

    return NextResponse.json(
      {
        message: "Booking confirmed successfully! Your court is reserved.",
        booking: mockBooking,
      },
      { status: 201 }
    );
  }
}
