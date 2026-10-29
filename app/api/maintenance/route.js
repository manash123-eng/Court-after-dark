import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Maintenance from "@/models/Maintenance";
import Facility from "@/models/Facility";
import Booking from "@/models/Booking";
import { getSessionUser } from "@/lib/auth";
import { rangesOverlap, recordAuditLog } from "@/lib/bookingRules";

export async function GET() {
  await connectDB();
  const blocks = await Maintenance.find()
    .populate("facilityId", "name type location")
    .sort({ date: 1, startTime: 1 });
  return NextResponse.json({ blocks });
}

export async function POST(request) {
  const session = getSessionUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
  await connectDB();
  const { facilityId, date, startTime, endTime, reason } = await request.json();

  if (!facilityId || !date || !startTime || !endTime) {
    return NextResponse.json({ error: "Facility, date, start and end time are required." }, { status: 400 });
  }

  const facility = await Facility.findById(facilityId);
  if (!facility) {
    return NextResponse.json({ error: "Facility not found." }, { status: 404 });
  }

  // Warn if active bookings already exist in this window
  const activeBookings = await Booking.find({ facilityId, date, status: "Confirmed" });
  const hasClashes = activeBookings.filter((b) =>
    rangesOverlap(startTime, endTime, b.startTime, b.endTime)
  );

  const block = await Maintenance.create({
    facilityId,
    date,
    startTime,
    endTime,
    reason: reason || "General maintenance and safety inspection",
    status: "Scheduled",
  });

  await recordAuditLog({
    action: "MAINTENANCE_SCHEDULED",
    performedBy: session.id,
    performedByName: session.name || session.email,
    entityType: "Maintenance",
    entityId: block._id.toString(),
    details: `Scheduled maintenance for ${facility.name} on ${date} (${startTime}-${endTime}). Clashing bookings affected: ${hasClashes.length}`,
    severity: hasClashes.length > 0 ? "warning" : "info",
  });

  return NextResponse.json(
    {
      message: "Maintenance block created. Affected slots are now closed for booking.",
      block,
      affectedBookingsCount: hasClashes.length,
    },
    { status: 201 }
  );
}
