import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Facility from "@/models/Facility";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/bookingRules";
import { MOCK_FACILITIES } from "@/lib/mockData";

export async function GET(request, { params }) {
  try {
    await connectDB();
    const facility = await Facility.findById(params.id);
    if (facility) return NextResponse.json({ facility });
  } catch (err) {
    // fallback
  }

  const mock = MOCK_FACILITIES.find((f) => f._id === params.id) || MOCK_FACILITIES[0];
  if (mock) {
    return NextResponse.json({ facility: mock });
  }

  return NextResponse.json({ error: "Facility not found." }, { status: 404 });
}

export async function PUT(request, { params }) {
  const session = getSessionUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
  await connectDB();
  const body = await request.json();

  if (body.pricePerHour) body.pricePerHour = Number(body.pricePerHour);
  if (body.capacity) body.capacity = Number(body.capacity);

  const facility = await Facility.findByIdAndUpdate(params.id, body, { new: true });
  if (!facility) {
    return NextResponse.json({ error: "Facility not found." }, { status: 404 });
  }

  await recordAuditLog({
    action: "FACILITY_UPDATED",
    performedBy: session.id,
    performedByName: session.name || session.email,
    entityType: "Facility",
    entityId: params.id,
    details: `Updated facility details for ${facility.name}`,
    severity: "info",
  });

  return NextResponse.json({ message: "Facility updated successfully.", facility });
}

export async function DELETE(request, { params }) {
  const session = getSessionUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
  await connectDB();
  const facility = await Facility.findByIdAndDelete(params.id);
  if (!facility) {
    return NextResponse.json({ error: "Facility not found." }, { status: 404 });
  }

  await recordAuditLog({
    action: "FACILITY_DELETED",
    performedBy: session.id,
    performedByName: session.name || session.email,
    entityType: "Facility",
    entityId: params.id,
    details: `Deleted facility ${facility.name}`,
    severity: "warning",
  });

  return NextResponse.json({ message: "Facility deleted successfully." });
}
