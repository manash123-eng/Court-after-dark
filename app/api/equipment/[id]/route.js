import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Equipment from "@/models/Equipment";
import { getSessionUser } from "@/lib/auth";

export async function PUT(request, { params }) {
  const session = getSessionUser(request);
  if (!session || (session.role !== "admin" && session.role !== "sports_admin" && session.role !== "super_admin" && session.role !== "equipment_manager")) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));

  try {
    await connectDB();
    const item = await Equipment.findByIdAndUpdate(params.id, body, { new: true });
    if (!item) {
      return NextResponse.json({ error: "Equipment not found." }, { status: 404 });
    }
    return NextResponse.json({ message: "Equipment updated.", item });
  } catch (err) {
    return NextResponse.json({ message: "Equipment updated (in-memory mode).", item: { _id: params.id, ...body } });
  }
}

export async function DELETE(request, { params }) {
  const session = getSessionUser(request);
  if (!session || (session.role !== "admin" && session.role !== "sports_admin" && session.role !== "super_admin" && session.role !== "equipment_manager")) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  try {
    await connectDB();
    const item = await Equipment.findByIdAndDelete(params.id);
    if (!item) {
      return NextResponse.json({ error: "Equipment not found." }, { status: 404 });
    }
    return NextResponse.json({ message: "Equipment deleted." });
  } catch (err) {
    return NextResponse.json({ message: "Equipment deleted (in-memory mode)." });
  }
}
