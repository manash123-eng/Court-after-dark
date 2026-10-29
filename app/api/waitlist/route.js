import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Waitlist from "@/models/Waitlist";
import Facility from "@/models/Facility";
import Booking from "@/models/Booking";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog, rangesOverlap } from "@/lib/bookingRules";

// GET /api/waitlist -> current user's waitlist entries
export async function GET() {
  const session = getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }
  await connectDB();

  const entries = await Waitlist.find({ userId: session.id })
    .populate("facilityId", "name type location image pricePerHour")
    .sort({ createdAt: -1 });

  return NextResponse.json({ waitlist: entries });
}

// POST /api/waitlist -> join waitlist for a booked slot
export async function POST(request) {
  const session = getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "You must be logged in to join the waitlist." }, { status: 401 });
  }
  await connectDB();

  const { facilityId, date, startTime, endTime } = await request.json();
  if (!facilityId || !date || !startTime || !endTime) {
    return NextResponse.json({ error: "Facility, date, and slot times are required." }, { status: 400 });
  }

  const facility = await Facility.findById(facilityId);
  if (!facility) {
    return NextResponse.json({ error: "Facility not found." }, { status: 404 });
  }

  // Ensure slot is actually booked
  const existingBooking = await Booking.findOne({
    facilityId,
    date,
    status: "Confirmed",
  });
  const isBooked = existingBooking && rangesOverlap(startTime, endTime, existingBooking.startTime, existingBooking.endTime);

  if (!isBooked) {
    return NextResponse.json(
      { error: "This slot is currently open. You can book it directly!" },
      { status: 400 }
    );
  }

  // Check if user already on waitlist for this slot
  const existingWaitlist = await Waitlist.findOne({
    userId: session.id,
    facilityId,
    date,
    startTime,
    status: "Waiting",
  });

  if (existingWaitlist) {
    return NextResponse.json(
      { error: "You are already on the waitlist for this slot." },
      { status: 400 }
    );
  }

  const waitlistEntry = await Waitlist.create({
    userId: session.id,
    facilityId,
    date,
    startTime,
    endTime,
    status: "Waiting",
  });

  await recordAuditLog({
    action: "WAITLIST_JOINED",
    performedBy: session.id,
    performedByName: session.name || session.email,
    entityType: "Waitlist",
    entityId: waitlistEntry._id.toString(),
    details: `Joined waitlist for ${facility.name} on ${date} (${startTime}-${endTime})`,
    severity: "info",
  });

  return NextResponse.json(
    { message: "You've been added to the waitlist. We will notify you if this slot becomes available!", waitlist: waitlistEntry },
    { status: 201 }
  );
}

// DELETE /api/waitlist -> leave waitlist
export async function DELETE(request) {
  const session = getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }
  await connectDB();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Waitlist entry ID is required." }, { status: 400 });
  }

  const entry = await Waitlist.findOne({ _id: id, userId: session.id });
  if (!entry) {
    return NextResponse.json({ error: "Waitlist entry not found." }, { status: 404 });
  }

  entry.status = "Cancelled";
  await entry.save();

  return NextResponse.json({ message: "Removed from waitlist." });
}
