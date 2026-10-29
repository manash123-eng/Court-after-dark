import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Facility from "@/models/Facility";
import { getSessionUser } from "@/lib/auth";

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
      // DB offline, fallback to session info
    }

    return NextResponse.json({
      user: {
        _id: session.id,
        id: session.id,
        name: session.name || (session.role === "admin" ? "Admin User" : "Aarav Sharma"),
        email: session.role === "admin" ? "admin@courtsafterdark.com" : "aarav@example.com",
        role: session.role || "player",
        favorites: [],
      },
    });
  } catch (err) {
    console.error("Error in /api/auth/me:", err);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
