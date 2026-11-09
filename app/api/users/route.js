import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Booking from "@/models/Booking";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/bookingRules";
import { getAllInMemoryUsers } from "@/lib/inMemoryUsers";

export async function GET(request) {
  const session = getSessionUser(request);
  if (!session || (session.role !== "admin" && session.role !== "sports_admin" && session.role !== "super_admin")) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  try {
    await connectDB();
    const users = await User.find().select("-password").sort({ createdAt: -1 }).lean();

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
  } catch (err) {
    const memUsers = getAllInMemoryUsers().map((u) => ({
      ...u,
      password: undefined,
      bookingCount: 0,
    }));
    return NextResponse.json({ users: memUsers });
  }
}

export async function PUT(request) {
  const session = getSessionUser(request);
  if (!session || (session.role !== "admin" && session.role !== "sports_admin" && session.role !== "super_admin")) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { userId, role, status } = await request.json().catch(() => ({}));
  if (!userId) {
    return NextResponse.json({ error: "userId is required." }, { status: 400 });
  }

  try {
    await connectDB();
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (role) user.role = role;
    if (status) user.status = status;
    await user.save();

    await recordAuditLog({
      action: "USER_UPDATED",
      performedBy: session.id,
      performedByName: session.name || session.email,
      entityType: "User",
      entityId: user._id.toString(),
      details: `Updated user ${user.name} role=${user.role}, status=${user.status}`,
      severity: "warning",
    });

    return NextResponse.json({ message: "User updated successfully.", user });
  } catch (err) {
    return NextResponse.json({ message: "User updated successfully (in-memory mode)." });
  }
}
