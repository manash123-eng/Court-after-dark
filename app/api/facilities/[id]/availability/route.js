import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Facility from "@/models/Facility";
import Booking from "@/models/Booking";
import Maintenance from "@/models/Maintenance";
import Waitlist from "@/models/Waitlist";
import { getSessionUser } from "@/lib/auth";
import {
  TIME_SLOTS,
  rangesOverlap,
  isWithinOperatingHours,
  getSystemRules,
  isPrimeTimeSlot,
} from "@/lib/bookingRules";
import { MOCK_FACILITIES } from "@/lib/mockData";

// GET /api/facilities/[id]/availability?date=YYYY-MM-DD
export async function GET(request, { params }) {
  const session = getSessionUser();
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json({ error: "A date query parameter is required." }, { status: 400 });
  }

  let facility = null;
  let bookings = [];
  let maintenanceBlocks = [];
  let waitlists = [];
  let rules = {
    maxActiveBookingsPerUser: 2,
    maxAdvanceBookingDays: 14,
    maxBookingDurationHours: 2,
    primeTimeStart: "18:00",
    primeTimeEnd: "21:00",
    cancellationDeadlineHours: 4,
  };

  try {
    await connectDB();
    facility = await Facility.findById(params.id);
    if (!facility) {
      facility = MOCK_FACILITIES.find((f) => f._id === params.id);
    }

    if (facility) {
      rules = await getSystemRules().catch(() => rules);
      bookings = await Booking.find({
        facilityId: params.id,
        date,
        status: "Confirmed",
      }).catch(() => []);

      maintenanceBlocks = await Maintenance.find({
        facilityId: params.id,
        date,
        status: "Scheduled",
      }).catch(() => []);

      waitlists = await Waitlist.find({
        facilityId: params.id,
        date,
        status: "Waiting",
      }).catch(() => []);
    }
  } catch (err) {
    facility = MOCK_FACILITIES.find((f) => f._id === params.id) || MOCK_FACILITIES[0];
  }

  if (!facility) {
    facility = MOCK_FACILITIES[0];
  }

  const slots = TIME_SLOTS.map((slot) => {
    const [start, end] = slot.split("-");
    const isPrime = isPrimeTimeSlot(start, rules.primeTimeStart, rules.primeTimeEnd);

    // Check operating hours
    const inOperatingHours = isWithinOperatingHours(
      start,
      end,
      facility.openingTime || "06:00",
      facility.closingTime || "23:00"
    );

    if (facility.status === "Closed" || !inOperatingHours) {
      return { slot, status: "Closed", isPrime, waitlistCount: 0, isUserWaitlisted: false };
    }

    const inMaintenance = maintenanceBlocks.some((m) =>
      rangesOverlap(start, end, m.startTime, m.endTime)
    );
    if (inMaintenance || facility.status === "Maintenance") {
      return { slot, status: "Maintenance", isPrime, waitlistCount: 0, isUserWaitlisted: false };
    }

    const isBooked = bookings.some((b) =>
      rangesOverlap(start, end, b.startTime, b.endTime)
    );

    if (isBooked) {
      const slotWaitlists = waitlists.filter((w) => w.startTime === start);
      const isUserWaitlisted = session
        ? slotWaitlists.some((w) => w.userId?.toString() === session.id)
        : false;

      return {
        slot,
        status: "Booked",
        isPrime,
        waitlistCount: slotWaitlists.length,
        isUserWaitlisted,
      };
    }

    return { slot, status: "Available", isPrime, waitlistCount: 0, isUserWaitlisted: false };
  });

  return NextResponse.json({
    facility,
    date,
    slots,
    rules: {
      maxActiveBookingsPerUser: rules.maxActiveBookingsPerUser,
      maxAdvanceBookingDays: rules.maxAdvanceBookingDays,
      maxBookingDurationHours: rules.maxBookingDurationHours,
      primeTimeStart: rules.primeTimeStart,
      primeTimeEnd: rules.primeTimeEnd,
      cancellationDeadlineHours: facility.cancellationHours ?? rules.cancellationDeadlineHours,
    },
  });
}
