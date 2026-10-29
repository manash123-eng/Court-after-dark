import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Equipment from "@/models/Equipment";
import { getSessionUser } from "@/lib/auth";

export async function PUT(request, { params }) {
  const session = getSessionUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
  await connectDB();
  const body = await request.json();
  const item = await Equipment.findByIdAndUpdate(params.id, body, { new: true });
  if (!item) {
    return NextResponse.json({ error: "Equipment not found." }, { status: 404 });
  }
  return NextResponse.json({ message: "Equipment updated.", item });
}

export async function DELETE(request, { params }) {
  const session = getSessionUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
  await connectDB();
  const item = await Equipment.findByIdAndDelete(params.id);
  if (!item) {
    return NextResponse.json({ error: "Equipment not found." }, { status: 404 });
  }
  return NextResponse.json({ message: "Equipment deleted." });
}
