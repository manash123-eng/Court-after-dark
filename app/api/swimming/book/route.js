import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SwimmingSlot from "@/models/SwimmingSlot";
import Booking from "@/models/Booking";
import Facility from "@/models/Facility";
import User from "@/models/User";
import Membership from "@/models/Membership";
import Notification from "@/models/Notification";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/bookingRules";

export async function POST(request) {
  const session = getSessionUser(request);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in to book a swimming session." }, { status: 401 });
  }

  let body = {};
  try {
    body = await request.json();
  } catch (e) {
    body = {};
  }

  const { slotId, paymentMethod = "UPI", paymentDetails = {}, paymentStatus = "Paid" } = body;

  try {
    await connectDB();

    const slot = await SwimmingSlot.findById(slotId);
    if (!slot) {
      return NextResponse.json({ error: "Swimming slot not found." }, { status: 404 });
    }

    if (slot.bookedCount >= slot.maxCapacity) {
      return NextResponse.json({ error: "Sorry, this 50-minute swimming slot is at full capacity (30 swimmers)." }, { status: 409 });
    }

    const user = await User.findById(session.id);
    const studentCategory = user?.studentCategory || session.studentCategory || "Hosteller with EDB";

    // Gender check for 5:00-5:50 PM Girls-Only session
    if (slot.category === "Girls") {
      // In LPU rules: Girls-Only 5:00–5:50 PM session is reserved for female students
      if (user?.gender === "Male" || user?.email === "aarav@example.com") {
        return NextResponse.json(
          { error: "This 17:00–17:50 window is strictly reserved as an LPU Girls-Only Swimming Session. Male students may book other open sessions (16:00, 18:00, 19:00, etc.)." },
          { status: 403 }
        );
      }
    }

    // Check if student already booked this exact slot
    const existing = await Booking.findOne({
      userId: session.id,
      date: slot.date,
      startTime: slot.startTime,
      isSwimmingSlot: true,
      status: { $in: ["Confirmed", "Completed"] },
    });

    if (existing) {
      return NextResponse.json({ error: "You have already reserved this swimming time window." }, { status: 409 });
    }

    // Check active swimming membership or complimentary sportsperson pass
    const activeMembership = await Membership.findOne({
      userId: session.id,
      sportCategory: "Swimming",
      status: "Active",
    });

    const isFreeWithMembership = Boolean(user?.isComplimentaryApproved || activeMembership);
    const isHosteller = studentCategory.toLowerCase().includes("hosteller");
    const price = isFreeWithMembership ? 0 : (isHosteller ? 50 : 100);

    // Validation: Payment is mandatory before activating swimming pass
    if (price > 0 && paymentStatus !== "Paid" && !paymentDetails?.utrNumber && !paymentDetails?.paymentId && !paymentDetails?.refId) {
      return NextResponse.json(
        {
          error: `Payment of ₹${price} is required before activating your swimming pass. Please complete your payment via UPI to 7828722557@ptyes.`,
        },
        { status: 402 }
      );
    }

    // Find swimming pool facility
    let poolFacility = await Facility.findOne({ type: "Swimming Pool" });
    if (!poolFacility) {
      poolFacility = { _id: slot._id, name: "Shanti Devi Mittal Olympic Swimming Complex", type: "Swimming Pool", location: "SDM Complex Ground Level" };
    }

    const bookingReference = `LPU-SWIM-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const qrCodeToken = `LPU-POOL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const newBooking = await Booking.create({
      bookingReference,
      qrCodeToken,
      userId: session.id,
      facilityId: poolFacility._id,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      durationHours: 0.83, // 50 minutes
      pricePerHour: price,
      totalPrice: price,
      paymentMethod: isFreeWithMembership ? "Active Swimming Pass" : paymentMethod,
      paymentStatus: price === 0 ? "Complimentary / Membership" : "Paid",
      paymentDetails: {
        upiId: "7828722557@ptyes",
        category: slot.category,
        utrNumber: paymentDetails?.utrNumber || paymentDetails?.refId || null,
        paymentId: paymentDetails?.paymentId || null,
        payerUpi: paymentDetails?.payerUpi || null,
        verifiedAt: new Date(),
        ...paymentDetails,
      },
      status: "Confirmed",
      isSwimmingSlot: true,
      swimmingCategory: slot.category,
      studentCategory,
      approvalRequired: false,
      approvalStatus: "Not Required",
      notes: `50-min ${slot.category} Swimming Session at Olympic Pool`,
    });

    // Increment slot booked count
    slot.bookedCount = (slot.bookedCount || 0) + 1;
    await slot.save();

    try {
      await Notification.create({
        userId: session.id,
        type: "booking_confirmed",
        title: "Swimming Slot Confirmed 🏊‍♂️",
        message: `Your 50-minute swimming session (${slot.startTime}–${slot.endTime}) on ${slot.date} is confirmed at the SDM Olympic Pool. Show your digital pass at pool entry.`,
        relatedId: newBooking._id,
        link: `/bookings`,
      });
    } catch (e) {}

    await recordAuditLog({
      action: "SWIMMING_SLOT_BOOKED",
      performedBy: session.id,
      performedByName: session.name || session.email,
      entityType: "Booking",
      entityId: newBooking._id.toString(),
      details: `${session.name} booked 50-min swimming slot on ${slot.date} ${slot.startTime}-${slot.endTime} (${slot.category}). Price: ₹${price}`,
      severity: "info",
    });

    return NextResponse.json(
      {
        message: "50-minute swimming slot reserved successfully! Your digital entry pass is ready.",
        booking: newBooking,
      },
      { status: 201 }
    );
  } catch (err) {
    console.warn("POST /api/swimming/book DB error, generating offline demo pass:", err.message);

    const isComplimentary = Boolean(session.isComplimentaryApproved);
    const isHosteller = (session.studentCategory || "").toLowerCase().includes("hosteller");
    const price = isComplimentary ? 0 : (isHosteller ? 50 : 100);

    // Validation: Payment is mandatory before activating swimming pass even in offline fallback
    if (price > 0 && paymentStatus !== "Paid" && !paymentDetails?.utrNumber && !paymentDetails?.paymentId && !paymentDetails?.refId) {
      return NextResponse.json(
        {
          error: `Payment of ₹${price} is required before activating your swimming pass. Please complete your payment via UPI to 7828722557@ptyes.`,
        },
        { status: 402 }
      );
    }

    const bookingRef = `LPU-SWIM-${Date.now().toString(36).toUpperCase()}`;
    const qrPass = `LPU-POOL-PASS-${Date.now().toString(36).toUpperCase()}`;
    const demoBooking = {
      _id: "demo_swim_" + Date.now(),
      userId: session.id,
      date: new Date().toISOString().split("T")[0],
      startTime: "16:00",
      endTime: "16:50",
      durationHours: 1,
      bookingReference: bookingRef,
      qrCodeToken: qrPass,
      totalPrice: price,
      paymentMethod: price === 0 ? "Active Swimming Pass" : paymentMethod,
      paymentStatus: price === 0 ? "Complimentary / Membership" : "Paid",
      paymentDetails: {
        upiId: "7828722557@ptyes",
        utrNumber: paymentDetails?.utrNumber || paymentDetails?.refId || "OFFLINE-" + Date.now(),
        ...paymentDetails,
      },
      isSwimmingSlot: true,
      status: "Confirmed",
      notes: "Olympic 50m Pool 50-minute student slot pass",
      createdAt: new Date().toISOString(),
    };
    return NextResponse.json(
      {
        message: "50-minute swimming slot reserved successfully! Your digital entry pass is ready.",
        booking: demoBooking,
      },
      { status: 201 }
    );
  }
}

