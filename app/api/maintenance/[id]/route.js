import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Maintenance from "@/models/Maintenance";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/bookingRules";

export async function PUT(request, { params }) {
  const session = getSessionUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
  await connectDB();
  const body = await request.json();
  const block = await Maintenance.findByIdAndUpdate(params.id, body, { new: true });
  if (!block) {
    return NextResponse.json({ error: "Maintenance block not found." }, { status: 404 });
  }

  await recordAuditLog({
    action: "MAINTENANCE_UPDATED",
    performedBy: session.id,
    performedByName: session.name || session.email,
    entityType: "Maintenance",
    entityId: params.id,
    details: `Updated maintenance block status to ${block.status}`,
    severity: "info",
  });

  return NextResponse.json({ message: "Maintenance block updated.", block });
}

export async function DELETE(request, { params }) {
  const session = getSessionUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
  await connectDB();
  const block = await Maintenance.findByIdAndDelete(params.id);
  if (!block) {
    return NextResponse.json({ error: "Maintenance block not found." }, { status: 404 });
  }

  await recordAuditLog({
    action: "MAINTENANCE_REMOVED",
    performedBy: session.id,
    performedByName: session.name || session.email,
    entityType: "Maintenance",
    entityId: params.id,
    details: "Removed maintenance block; slot availability restored.",
    severity: "info",
  });

  return NextResponse.json({ message: "Maintenance block removed." });
}
