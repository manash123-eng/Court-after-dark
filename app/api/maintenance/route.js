import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Maintenance from "@/models/Maintenance";
import Facility from "@/models/Facility";
import Booking from "@/models/Booking";
import { getSessionUser } from "@/lib/auth";
import { rangesOverlap, recordAuditLog } from "@/lib/bookingRules";

let inMemoryMaintenance = global._inMemoryMaintenance;
if (!inMemoryMaintenance) {
  inMemoryMaintenance = global._inMemoryMaintenance = [];
}

export async function GET() {
  try {
    await connectDB();
    const blocks = await Maintenance.find()
      .populate("facilityId", "name type location")
      .sort({ date: 1, startTime: 1 });
    return NextResponse.json({ blocks });
  } catch (err) {
    return NextResponse.json({ blocks: inMemoryMaintenance });
  }
}

export async function POST(request) {
  const session = getSessionUser(request);
  if (!session || (session.role !== "admin" && session.role !== "sports_admin" && session.role !== "super_admin")) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { facilityId, date, startTime, endTime, reason } = await request.json().catch(() => ({}));

  if (!facilityId || !date || !startTime || !endTime) {
    return NextResponse.json({ error: "Facility, date, start and end time are required." }, { status: 400 });
  }

  try {
    await connectDB();
    const facility = await Facility.findById(facilityId);
    if (!facility) {
      return NextResponse.json({ error: "Facility not found." }, { status: 404 });
    }

    const activeBookings = await Booking.find({ facilityId, date, status: "Confirmed" });
    const hasClashes = activeBookings.filter((b) =>
      rangesOverlap(startTime, endTime, b.startTime, b.endTime)
    );

    const block = await Maintenance.create({
      facilityId,
      date,
      startTime,
      endTime,
      reason: reason || "Routine Maintenance",
      createdBy: session.id,
      status: "Scheduled",
    });

    await recordAuditLog({
      action: "MAINTENANCE_SCHEDULED",
      performedBy: session.id,
      performedByName: session.name || session.email,
      entityType: "Maintenance",
      entityId: block._id.toString(),
      details: `Scheduled maintenance for ${facility.name} on ${date} (${startTime}-${endTime}): ${reason || "Routine"}`,
      severity: "warning",
    });

    return NextResponse.json(
      {
        message: "Maintenance window scheduled successfully.",
        block,
        clashingBookingsCount: hasClashes.length,
      },
      { status: 201 }
    );
  } catch (err) {
    const fallbackBlock = {
      _id: "maint_" + Date.now(),
      facilityId,
      date,
      startTime,
      endTime,
      reason: reason || "Routine Maintenance",
      createdBy: session.id,
      status: "Scheduled",
      createdAt: new Date().toISOString(),
    };
    inMemoryMaintenance.unshift(fallbackBlock);

    return NextResponse.json(
      {
        message: "Maintenance window scheduled successfully (in-memory mode).",
        block: fallbackBlock,
        clashingBookingsCount: 0,
      },
      { status: 201 }
    );
  }
}
