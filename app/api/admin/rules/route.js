import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SystemRule from "@/models/SystemRule";
import { getSessionUser } from "@/lib/auth";
import { getSystemRules, recordAuditLog } from "@/lib/bookingRules";

export async function GET() {
  const session = getSessionUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
  const rules = await getSystemRules();
  return NextResponse.json({ rules });
}

export async function PUT(request) {
  const session = getSessionUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
  await connectDB();
  const body = await request.json();

  const rules = await SystemRule.findOneAndUpdate(
    { key: "default_rules" },
    {
      maxActiveBookingsPerUser: Number(body.maxActiveBookingsPerUser),
      maxAdvanceBookingDays: Number(body.maxAdvanceBookingDays),
      maxBookingDurationHours: Number(body.maxBookingDurationHours),
      cancellationDeadlineHours: Number(body.cancellationDeadlineHours),
      primeTimeStart: body.primeTimeStart || "18:00",
      primeTimeEnd: body.primeTimeEnd || "21:00",
      maxPrimeTimeBookingsPerWeek: Number(body.maxPrimeTimeBookingsPerWeek),
      allowWaitlist: Boolean(body.allowWaitlist),
      updatedAt: new Date(),
    },
    { new: true, upsert: true }
  );

  await recordAuditLog({
    action: "RULES_UPDATED",
    performedBy: session.id,
    performedByName: session.name || session.email,
    entityType: "SystemRule",
    entityId: "default_rules",
    details: `Updated booking rules: maxActive=${rules.maxActiveBookingsPerUser}, maxAdvance=${rules.maxAdvanceBookingDays}d, primeTime=${rules.primeTimeStart}-${rules.primeTimeEnd}`,
    severity: "warning",
  });

  return NextResponse.json({ message: "Booking rules updated successfully.", rules });
}
