import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Booking from "@/models/Booking";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/bookingRules";

export async function GET() {
  const session = getSessionUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
  await connectDB();

  const users = await User.find().select("-password").sort({ createdAt: -1 }).lean();

  // Attach booking count for each user
  const userIds = users.map((u) => u._id);
  const bookingCounts = await Booking.aggregate([
    { $match: { userId: { $in: userIds } } },
    { $group: { _id: "$userId", count: { $sum: 1 } } },
  ]);

  const countMap = {};
  bookingCounts.forEach((b) => {
    countMap[b._id.toString()] = b.count;
  });

  const enriched = users.map((u) => ({
    ...u,
    bookingCount: countMap[u._id.toString()] || 0,
  }));

  return NextResponse.json({ users: enriched });
}

export async function PUT(request) {
  const session = getSessionUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
  await connectDB();

  const { userId, role, status } = await request.json();
  if (!userId) {
    return NextResponse.json({ error: "userId is required." }, { status: 400 });
  }

  const user = await User.findById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (role) user.role = role;
  if (status) user.status = status;

  await user.save();

  await recordAuditLog({
    action: "USER_MODIFIED",
    performedBy: session.id,
    performedByName: session.name || session.email,
    entityType: "User",
    entityId: userId,
    details: `Updated user ${user.email} (role: ${user.role}, status: ${user.status})`,
    severity: "warning",
  });

  return NextResponse.json({ message: "User updated successfully.", user });
}
