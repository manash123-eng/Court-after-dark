import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/bookingRules";

export async function PUT(request) {
  const session = getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }
  await connectDB();

  const body = await request.json();
  const user = await User.findById(session.id);
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  // Update profile fields
  if (body.name && body.name.trim()) user.name = body.name.trim();
  if (body.phone !== undefined) user.phone = body.phone;
  if (body.bio !== undefined) user.bio = body.bio;
  if (Array.isArray(body.preferredSports)) user.preferredSports = body.preferredSports;

  // Optional password update
  if (body.newPassword) {
    if (!body.currentPassword) {
      return NextResponse.json({ error: "Current password is required to change password." }, { status: 400 });
    }
    const isMatch = await bcrypt.compare(body.currentPassword, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }
    if (body.newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters." }, { status: 400 });
    }
    user.password = await bcrypt.hash(body.newPassword, 10);
  }

  await user.save();

  await recordAuditLog({
    action: "PROFILE_UPDATED",
    performedBy: user._id,
    performedByName: user.name,
    entityType: "User",
    entityId: user._id.toString(),
    details: "Updated profile details/preferences",
    severity: "info",
  });

  return NextResponse.json({
    message: "Profile updated successfully.",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      bio: user.bio,
      preferredSports: user.preferredSports,
      createdAt: user.createdAt,
    },
  });
}
