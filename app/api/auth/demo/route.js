import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { signToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function POST(request) {
  try {
    let role = "player";
    try {
      const body = await request.json();
      if (body?.role === "admin" || body?.role === "player") {
        role = body.role;
      }
    } catch {
      // default to player if body empty
    }

    let user = null;
    try {
      await connectDB();
      if (role === "admin") {
        user = await User.findOne({ email: "admin@courtsafterdark.com" });
        if (!user) {
          const hashedPassword = await bcrypt.hash("admin123", 10);
          user = await User.create({
            name: "Admin User",
            email: "admin@courtsafterdark.com",
            password: hashedPassword,
            role: "admin",
            bio: "Head Facility Director & Night Allocator",
            phone: "+91 98765 43210",
          });
        }
      } else {
        user = await User.findOne({ email: "aarav@example.com" });
        if (!user) {
          const hashedPassword = await bcrypt.hash("player123", 10);
          user = await User.create({
            name: "Aarav Sharma",
            email: "aarav@example.com",
            password: hashedPassword,
            role: "player",
            bio: "Weekend badminton and evening football enthusiast.",
            phone: "+91 98765 11111",
            preferredSports: ["Badminton Court", "Football Ground"],
          });
        }
      }
    } catch (dbErr) {
      // DB offline, create a fallback mock user object
      user = {
        _id: role === "admin" ? "admin_demo_id" : "player_demo_id",
        name: role === "admin" ? "Admin User" : "Aarav Sharma",
        email: role === "admin" ? "admin@courtsafterdark.com" : "aarav@example.com",
        role,
      };
    }

    if (user.status === "suspended") {
      return NextResponse.json({ error: "Demo account is currently suspended." }, { status: 403 });
    }

    const token = signToken({
      id: user._id.toString(),
      role: user.role,
      name: user.name,
      email: user.email,
    });

    const response = NextResponse.json({
      message: `Signed in as Demo ${user.role === "admin" ? "Admin" : "Player"} (${user.name}).`,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isDemo: true,
      },
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Demo login error:", err);
    return NextResponse.json({ error: "Failed to initialize demo session." }, { status: 500 });
  }
}
