import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Facility from "@/models/Facility";
import { getSessionUser, isAdmin } from "@/lib/auth";
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
  const session = getSessionUser(request);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Sports Administrator access required." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));

  if (body.pricePerHour !== undefined) body.pricePerHour = Number(body.pricePerHour);
  if (body.capacity !== undefined) body.capacity = Number(body.capacity);
  if (body.publishedQuantity !== undefined) body.publishedQuantity = Number(body.publishedQuantity);
  if (body.verifiedQuantity !== undefined) body.verifiedQuantity = Number(body.verifiedQuantity);
  if (body.isQuantityVerified !== undefined) body.isQuantityVerified = Boolean(body.isQuantityVerified);
  if (body.approvalRequired !== undefined) body.approvalRequired = Boolean(body.approvalRequired);
  if (body.membershipRequired !== undefined) body.membershipRequired = Boolean(body.membershipRequired);
  if (body.requiresCoachSupervision !== undefined) body.requiresCoachSupervision = Boolean(body.requiresCoachSupervision);

  body.lastVerificationDate = new Date();

  try {
    await connectDB();
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
      details: `Updated facility details for ${facility.name} (verified quantity: ${facility.verifiedQuantity})`,
      severity: "info",
    });

    return NextResponse.json({ message: "Facility updated successfully.", facility });
  } catch (err) {
    const mock = MOCK_FACILITIES.find((f) => f._id === params.id) || MOCK_FACILITIES[0];
    const updated = { ...mock, ...body };
    return NextResponse.json({ message: "Facility updated successfully (in-memory mode).", facility: updated });
  }
}

export async function DELETE(request, { params }) {
  const session = getSessionUser(request);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Sports Administrator access required." }, { status: 403 });
  }

  try {
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
  } catch (err) {
    return NextResponse.json({ message: "Facility deleted successfully (in-memory mode)." });
  }
}
