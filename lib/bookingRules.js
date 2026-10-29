// lib/bookingRules.js
// Central place for booking rules, validation, and fair slot allocation logic.

import SystemRule from "@/models/SystemRule";
import AuditLog from "@/models/AuditLog";
import { connectDB } from "@/lib/mongodb";

// Standard 1-hour bookable slots
export const TIME_SLOTS = [
  "06:00-07:00",
  "07:00-08:00",
  "08:00-09:00",
  "09:00-10:00",
  "10:00-11:00",
  "11:00-12:00",
  "12:00-13:00",
  "13:00-14:00",
  "14:00-15:00",
  "15:00-16:00",
  "16:00-17:00",
  "17:00-18:00",
  "18:00-19:00",
  "19:00-20:00",
  "20:00-21:00",
  "21:00-22:00",
];

// Fallback defaults if database has not been initialized
export const DEFAULT_RULES = {
  maxActiveBookingsPerUser: 2,
  maxAdvanceBookingDays: 14,
  maxBookingDurationHours: 2,
  cancellationDeadlineHours: 4,
  primeTimeStart: "18:00",
  primeTimeEnd: "21:00",
  maxPrimeTimeBookingsPerWeek: 3,
  allowWaitlist: true,
};

// Legacy exports for backwards compatibility
export const MAX_ACTIVE_BOOKINGS_PER_USER = DEFAULT_RULES.maxActiveBookingsPerUser;
export const MAX_BOOKING_DURATION_HOURS = DEFAULT_RULES.maxBookingDurationHours;

export async function getSystemRules() {
  try {
    await connectDB();
    let rules = await SystemRule.findOne({ key: "default_rules" });
    if (!rules) {
      rules = await SystemRule.create({ key: "default_rules", ...DEFAULT_RULES });
    }
    return rules;
  } catch (err) {
    console.warn("Could not fetch DB system rules, using defaults", err.message);
    return DEFAULT_RULES;
  }
}

export function timeToMinutes(hhmm) {
  if (!hhmm || typeof hhmm !== "string") return 0;
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

// Returns true if [aStart, aEnd) overlaps [bStart, bEnd)
export function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return (
    timeToMinutes(aStart) < timeToMinutes(bEnd) &&
    timeToMinutes(bStart) < timeToMinutes(aEnd)
  );
}

export function isWithinOperatingHours(startTime, endTime, openingTime, closingTime) {
  return (
    timeToMinutes(startTime) >= timeToMinutes(openingTime) &&
    timeToMinutes(endTime) <= timeToMinutes(closingTime)
  );
}

export function isPrimeTimeSlot(startTime, primeStart = "18:00", primeEnd = "21:00") {
  const startMin = timeToMinutes(startTime);
  return startMin >= timeToMinutes(primeStart) && startMin < timeToMinutes(primeEnd);
}

export function formatSlotLabel(slot) {
  if (!slot) return "";
  const [start, end] = slot.split("-");
  return `${to12Hour(start)} - ${to12Hour(end)}`;
}

export function to12Hour(hhmm) {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${(m || 0).toString().padStart(2, "0")} ${period}`;
}

export async function recordAuditLog({
  action,
  performedBy = null,
  performedByName = "System",
  entityType,
  entityId = "",
  details = "",
  severity = "info",
}) {
  try {
    await connectDB();
    await AuditLog.create({
      action,
      performedBy,
      performedByName,
      entityType,
      entityId,
      details,
      severity,
    });
  } catch (err) {
    console.error("Audit log error:", err.message);
  }
}
