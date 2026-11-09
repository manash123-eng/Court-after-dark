// app/api/auth/register/route.js
// Direct student registration endpoint with immediate session creation (No OTP required).

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { signToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { findInMemoryUser, createInMemoryUser } from "@/lib/inMemoryUsers";
import { normalizeIndianPhone } from "@/lib/otpService";
import { isValidEmail, isValidName, evaluatePasswordStrength } from "@/lib/validators";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      password,
      studentCategory = "Hosteller with EDB",
      regNo = "",
      department = "",
      hostelBlock = "",
      gender = "Other",
    } = body;

    // 1. Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Full student name, university email, and password are required." },
        { status: 400 }
      );
    }

    if (!isValidName(name)) {
      return NextResponse.json(
        { error: "Name must be between 2 and 50 characters." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address (e.g. athlete@example.com)." },
        { status: 400 }
      );
    }

    let formattedPhone = phone || "";
    if (phone) {
      const norm = normalizeIndianPhone(phone);
      if (norm.valid) {
        formattedPhone = norm.e164;
      }
    }

    const strength = evaluatePasswordStrength(password);
    if (!strength.passed) {
      return NextResponse.json(
        { error: `Password is too weak: ${strength.requirements.join(", ")}.` },
        { status: 400 }
      );
    }

    // 2. Check for duplicate account
    let isDuplicate = false;
    try {
      await connectDB();
      const existing = await User.findOne({
        $or: [
          { email: email.toLowerCase() },
          ...(formattedPhone ? [{ phone: formattedPhone }] : []),
        ],
      });
      if (existing) {
        isDuplicate = true;
      }
    } catch (dbErr) {
      // Check in-memory users if DB is offline
      if (findInMemoryUser(email) || (formattedPhone && findInMemoryUser(formattedPhone))) {
        isDuplicate = true;
      }
    }

    if (isDuplicate) {
      return NextResponse.json(
        { error: "An account with this email or mobile number already exists. Please sign in." },
        { status: 409 }
      );
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create User directly (Active status, No OTP required)
    let user = null;
    try {
      await connectDB();
      user = await User.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: formattedPhone,
        phoneVerified: true,
        password: hashedPassword,
        role: "student",
        status: "active",
        studentCategory,
        regNo,
        department,
        hostelBlock,
        gender,
      });
    } catch (createErr) {
      console.warn("[Register] DB write unavailable, persisting to in-memory store:", createErr.message);
      user = createInMemoryUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: formattedPhone,
        password: hashedPassword,
        role: "student",
        studentCategory,
        regNo,
        department,
        hostelBlock,
        gender,
      });
    }

    const userId = (user._id || user.id).toString();
    const token = signToken({
      id: userId,
      role: user.role,
      name: user.name,
      studentCategory: user.studentCategory,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Account created successfully! Welcome to LPU Sports Portal.",
        user: {
          id: userId,
          _id: userId,
          name: user.name,
          email: user.email,
          role: user.role,
          studentCategory: user.studentCategory,
        },
      },
      { status: 201 }
    );

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("[Register Controller Error]", err);
    return NextResponse.json(
      { error: err.message || "Failed to complete registration." },
      { status: 500 }
    );
  }
}
