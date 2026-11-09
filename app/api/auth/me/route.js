import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getSessionUser } from "@/lib/auth";
import { getInMemoryUserById } from "@/lib/inMemoryUsers";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const session = getSessionUser(request);
    if (!session?.id) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    try {
      await connectDB();
      const user = await User.findById(session.id)
        .select("-password")
        .populate("favorites", "name type location image pricePerHour");

      if (user && user.status !== "suspended") {
        return NextResponse.json({ user });
      }
    } catch {
      // DB offline, fallback to in-memory user or session info
    }

    const inMem = getInMemoryUserById(session.id);
    if (inMem) {
      return NextResponse.json({
        user: {
          _id: inMem._id,
          id: inMem.id,
          name: inMem.name,
          email: inMem.email,
          phone: inMem.phone,
          role: inMem.role,
          studentCategory: inMem.studentCategory,
          regNo: inMem.regNo,
          department: inMem.department,
          hostelBlock: inMem.hostelBlock,
          favorites: [],
        },
      });
    }

    return NextResponse.json({
      user: {
        _id: session.id,
        id: session.id,
        name: session.name || "Aarav Sharma",
        email: session.role === "admin" ? "admin@courtsafterdark.com" : "aarav@example.com",
        role: session.role || "student",
        studentCategory: session.studentCategory || "Hosteller with EDB",
        favorites: [],
      },
    });
  } catch (err) {
    console.error("Error in /api/auth/me:", err);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
