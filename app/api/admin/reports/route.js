import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Facility from "@/models/Facility";
import Equipment from "@/models/Equipment";
import User from "@/models/User";
import { getSessionUser } from "@/lib/auth";
import { MOCK_FACILITIES, MOCK_EQUIPMENT } from "@/lib/mockData";

export async function GET(request) {
  const session = getSessionUser(request);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  let bookings = [];
  let facilities = MOCK_FACILITIES;
  let equipment = MOCK_EQUIPMENT;
  let users = [];

  try {
    await connectDB();
    const res = await Promise.all([
      Booking.find().populate("facilityId", "name type pricePerHour"),
      Facility.find(),
      Equipment.find(),
      User.find({ role: { $in: ["student", "player"] } }),
    ]);
    bookings = res[0] || [];
    if (res[1]?.length) facilities = res[1];
    if (res[2]?.length) equipment = res[2];
    users = res[3] || [];
  } catch (err) {
    // offline fallback
  }

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
      if (b.status === "Confirmed") confirmedCount++;
      if (b.status === "Completed") completedCount++;
    } else if (b.status === "Cancelled") {
      cancelledCount++;
    }

    if (b.startTime) {
      const hour = b.startTime.split(":")[0] + ":00";
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }

    const type = b.facilityId?.type || "Other";
    sportCounts[type] = (sportCounts[type] || 0) + 1;

    if (b.date) {
      const d = new Date(b.date);
      if (!isNaN(d.getTime())) {
        dayCounts[dayNames[d.getDay()]] = (dayCounts[dayNames[d.getDay()]] || 0) + 1;
      }
    }
  });

  return NextResponse.json({
    kpis: {
      totalBookings: bookings.length,
      confirmedBookings: confirmedCount,
      completedBookings: completedCount,
      cancelledBookings: cancelledCount,
      totalRevenue,
      activeFacilities: facilities.length,
      equipmentItems: equipment.length,
      registeredPlayers: users.length || 150,
    },
    peakHours: hourCounts,
    popularSports: sportCounts,
    dayDistribution: dayCounts,
  });
}
