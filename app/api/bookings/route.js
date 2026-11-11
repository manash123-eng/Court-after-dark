import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Facility from "@/models/Facility";
import User from "@/models/User";
import Membership from "@/models/Membership";
import Notification from "@/models/Notification";
import { getSessionUser, isStaff, canApproveBookings } from "@/lib/auth";
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

// GET /api/bookings -> current user's bookings (or all for admin/coach, with optional filters)
export async function GET(request) {
  const session = getSessionUser(request);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all");
  const status = searchParams.get("status");
  const facilityId = searchParams.get("facilityId");
  const date = searchParams.get("date");
  const pendingApprovals = searchParams.get("pendingApprovals");

  try {
    await connectDB();
    const query = {};
    const staffUser = isStaff(session);

    if (staffUser && all === "true") {
      if (pendingApprovals === "true") {
        query.status = "Pending Approval";
      } else if (status && status !== "All") {
        query.status = status;
      }
      if (facilityId) query.facilityId = facilityId;
      if (date) query.date = date;
    } else {
      query.userId = session.id;
      if (status && status !== "All") query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate("facilityId", "name type location campusLocation image pricePerHour city indoorOutdoor approvalRequired membershipRequired")
      .populate("userId", "name email phone regNo studentCategory hostelBlock department")
      .sort({ date: -1, startTime: -1 });

    return NextResponse.json({ bookings });
  } catch (err) {
    console.error("GET /api/bookings error:", err);
    let userBookings = isStaff(session) && all === "true"
      ? inMemoryBookings
      : inMemoryBookings.filter((b) => b.userId?.toString() === session.id);

    if (status && status !== "All") {
      userBookings = userBookings.filter((b) => b.status === status);
    }
    return NextResponse.json({ bookings: userBookings });
  }
}

// POST /api/bookings -> booking creation with approval workflow, membership check, and fairness rules
export async function POST(request) {
  const session = getSessionUser(request);
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
    isSwimmingSlot = false,
    swimmingSlotId = null,
  } = body;

  if (!facilityId || !date || !startTime || !endTime) {
    return NextResponse.json({ error: "Facility, date, and time slot are required." }, { status: 400 });
  }

  let rules = {
    maxActiveBookingsPerUser: 4,
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
  if (durationHours <= 0 || durationHours > (rules.maxBookingDurationHours || 2)) {
    return NextResponse.json(
      { error: `Booking duration must be between 1 and ${rules.maxBookingDurationHours || 2} hours.` },
      { status: 400 }
    );
  }

  const bookingReference = `LPU-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const qrCodeToken = `LPU-PASS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  try {
    await connectDB();

    // Facility existence
    let facility = null;
    if (mongoose.Types.ObjectId.isValid(facilityId)) {
      facility = await Facility.findById(facilityId);
    }
    if (!facility) {
      facility = await Facility.findOne({ _id: facilityId }).catch(() => null);
    }
    if (!facility) {
      facility = MOCK_FACILITIES.find((f) => f._id === facilityId);
      if (facility) {
        // Find matching facility by name in MongoDB
        const dbFac = await Facility.findOne({ name: facility.name }).catch(() => null);
        if (dbFac) {
          facility = dbFac;
        }
      }
    }
    if (!facility) {
      return NextResponse.json({ error: "Facility not found." }, { status: 404 });
    }

    const resolvedFacilityId = mongoose.Types.ObjectId.isValid(facility._id)
      ? facility._id
      : new mongoose.Types.ObjectId();

    // Check student user details
    const studentUser = await User.findById(session.id);
    const studentCategory = studentUser?.studentCategory || session.studentCategory || "Hosteller with EDB";

    // Fair-use cap: Max active bookings per user
    const activeCount = await Booking.countDocuments({
      userId: session.id,
      status: { $in: ["Confirmed", "Pending Approval", "Approved"] },
    });

    if (activeCount >= (rules.maxActiveBookingsPerUser || 4)) {
      return NextResponse.json(
        {
          error: `Fair-use limit reached: you currently hold ${activeCount} active/pending booking(s). Maximum permitted is ${rules.maxActiveBookingsPerUser || 4}.`,
        },
        { status: 400 }
      );
    }

    // Check conflict (atomic check for double booking on Confirmed / Approved slots)
    const conflictingBookings = await Booking.find({
      facilityId,
      date,
      status: { $in: ["Confirmed", "Approved"] },
    });

    const isConflict = conflictingBookings.some((b) =>
      rangesOverlap(startTime, endTime, b.startTime, b.endTime)
    );

    if (isConflict) {
      return NextResponse.json(
        {
          error: "Sorry, this court time slot was already reserved. Please select another slot.",
          canWaitlist: true,
        },
        { status: 409 }
      );
    }

    // Check membership requirement
    let hasValidMembership = false;
    if (studentUser?.isComplimentaryApproved) {
      hasValidMembership = true;
    } else if (facility.membershipRequired) {
      const activeMembership = await Membership.findOne({
        userId: session.id,
        sportCategory: { $regex: new RegExp(facility.type, "i") },
        status: { $in: ["Active", "Approved"] },
      });
      if (activeMembership) {
        hasValidMembership = true;
      }
    }

    // Pricing: For university students with membership or non-commercial courts, price is 0
    let pricePerHour = facility.pricePerHour || 0;
    if (hasValidMembership || facility.pricePerHour === 0) {
      pricePerHour = 0;
    }

    const courtTotal = pricePerHour * durationHours;
    const eqTotal = equipmentAddons.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
    const totalPrice = courtTotal + eqTotal;

    // Status: If approvalRequired, goes to "Pending Approval", otherwise "Confirmed"
    const requiresApproval = Boolean(facility.approvalRequired);
    const initialStatus = requiresApproval ? "Pending Approval" : "Confirmed";

    const newBooking = await Booking.create({
      bookingReference,
      qrCodeToken,
      userId: session.id,
      facilityId: resolvedFacilityId,
      date,
      startTime,
      endTime,
      durationHours,
      pricePerHour,
      equipmentAddons,
      equipmentTotal: eqTotal,
      totalPrice,
      paymentMethod,
      paymentStatus: totalPrice === 0 ? "Complimentary / Membership" : (paymentMethod === "Pay at Venue" ? "Pay at Venue" : "Paid"),
      paymentDetails: {
        ...paymentDetails,
        upiId: paymentDetails?.upiId || "7828722557@ptyes",
      },
      status: initialStatus,
      studentCategory,
      approvalRequired: requiresApproval,
      approvalStatus: requiresApproval ? "Pending" : "Not Required",
      notes: notes || (requiresApproval ? "Awaiting Sports Department / Coach approval" : "Automated LPU Court Pass"),
    });

    // Notify user
    try {
      await Notification.create({
        userId: session.id,
        type: requiresApproval ? "booking_submitted" : "booking_confirmed",
        title: requiresApproval ? "Booking Request Submitted" : "Court Booking Confirmed",
        message: requiresApproval
          ? `Your booking request for ${facility.name} on ${date} (${startTime}–${endTime}) is pending approval by the Sports Department / Coach.`
          : `Your booking for ${facility.name} on ${date} (${startTime}–${endTime}) is confirmed. Show your QR pass at gate entry.`,
        relatedId: newBooking._id,
        link: `/bookings`,
      });
    } catch (notifErr) {
      // ignore
    }

    await recordAuditLog({
      action: requiresApproval ? "BOOKING_PENDING_APPROVAL" : "BOOKING_CREATED",
      performedBy: session.id,
      performedByName: session.name || session.email,
      entityType: "Booking",
      entityId: newBooking._id.toString(),
      details: `${session.name || "Student"} reserved ${facility.name} on ${date} (${startTime}-${endTime}). Status: ${initialStatus}`,
      severity: "info",
    });

    return NextResponse.json(
      {
        message: requiresApproval
          ? "Booking request submitted! Requires Sports Department or Coach approval before attendance."
          : "Booking confirmed successfully! Your digital gate pass has been generated.",
        booking: newBooking,
      },
      { status: 201 }
    );
  } catch (err) {
    console.warn("Booking DB error, saving to in-memory session:", err.message);
    const mockFacility = MOCK_FACILITIES.find((f) => f._id === facilityId) || MOCK_FACILITIES[0];
    const durationHours = Math.max(0.5, (timeToMinutes(endTime) - timeToMinutes(startTime)) / 60) || 1;
    const courtPrice = mockFacility?.pricePerHour || 0;
    const eqTotal = (equipmentAddons || []).reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
    const totalPrice = (courtPrice * durationHours) + eqTotal;
    const requiresApproval = Boolean(mockFacility?.approvalRequired);

    const fallbackBooking = {
      _id: "cad_demo_" + Date.now(),
      userId: session.id,
      facilityId: mockFacility,
      date,
      startTime,
      endTime,
      durationHours,
      bookingReference,
      qrCodeToken,
      courtNumber: 1,
      courtPrice,
      equipmentRentals: equipmentAddons || [],
      equipmentTotal: eqTotal,
      totalPrice,
      paymentMethod,
      paymentStatus: totalPrice === 0 ? "Complimentary / Membership" : (paymentMethod === "Pay at Venue" ? "Pay at Venue" : "Paid"),
      paymentDetails: {
        ...paymentDetails,
        upiId: paymentDetails?.upiId || "7828722557@ptyes",
      },
      status: requiresApproval ? "Pending Approval" : "Confirmed",
      studentCategory: session.studentCategory || "Hosteller with EDB",
      approvalRequired: requiresApproval,
      approvalStatus: requiresApproval ? "Pending" : "Not Required",
      notes: notes || "Automated LPU Court Pass",
      createdAt: new Date().toISOString(),
    };
    inMemoryBookings.unshift(fallbackBooking);
    return NextResponse.json(
      {
        message: requiresApproval
          ? "Booking request submitted! Requires Sports Department or Coach approval before attendance."
          : "Booking confirmed successfully! Your digital gate pass has been generated.",
        booking: fallbackBooking,
      },
      { status: 201 }
    );
  }
}
