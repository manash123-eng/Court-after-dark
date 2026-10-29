import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Facility from "@/models/Facility";
import Equipment from "@/models/Equipment";
import User from "@/models/User";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const session = getSessionUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
  await connectDB();

  const [bookings, facilities, equipment, users] = await Promise.all([
    Booking.find().populate("facilityId", "name type pricePerHour"),
    Facility.find(),
    Equipment.find(),
    User.find({ role: "player" }),
  ]);

  // Total revenue & status distribution
  let totalRevenue = 0;
  let confirmedCount = 0;
  let completedCount = 0;
  let cancelledCount = 0;
  const hourCounts = {};
  const sportCounts = {};
  const dayCounts = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  bookings.forEach((b) => {
    if (b.status === "Confirmed" || b.status === "Completed") {
      totalRevenue += b.totalPrice || b.pricePerHour || 40;
    }
    if (b.status === "Confirmed") confirmedCount++;
    if (b.status === "Completed") completedCount++;
    if (b.status === "Cancelled") cancelledCount++;

    // Hour distribution
    if (b.startTime) {
      hourCounts[b.startTime] = (hourCounts[b.startTime] || 0) + 1;
    }

    // Sport distribution
    const sport = b.facilityId?.type || "Other";
    sportCounts[sport] = (sportCounts[sport] || 0) + 1;

    // Day of week
    if (b.date) {
      const d = new Date(`${b.date}T00:00:00`);
      if (!isNaN(d.getTime())) {
        const day = dayNames[d.getDay()];
        dayCounts[day] = (dayCounts[day] || 0) + 1;
      }
    }
  });

  const totalBookings = bookings.length;
  const cancellationRate = totalBookings > 0 ? ((cancelledCount / totalBookings) * 100).toFixed(1) : 0;

  // Equipment inventory utilization
  const totalGear = equipment.reduce((acc, e) => acc + (e.totalQuantity || 0), 0);
  const availableGear = equipment.reduce((acc, e) => acc + (e.availableQuantity || 0), 0);
  const inUseGear = totalGear - availableGear;

  return NextResponse.json({
    metrics: {
      totalRevenue,
      totalBookings,
      confirmedCount,
      completedCount,
      cancelledCount,
      cancellationRate,
      totalPlayers: users.length,
      totalFacilities: facilities.length,
      gearUtilization: totalGear > 0 ? ((inUseGear / totalGear) * 100).toFixed(1) : 0,
      totalGear,
      inUseGear,
    },
    sportCounts,
    hourCounts,
    dayCounts,
  });
}
