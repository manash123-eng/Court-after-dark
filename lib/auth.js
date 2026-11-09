// lib/auth.js
// Authentication helper for LPU Sports Facility Booking Platform.
// Passwords are hashed with bcrypt.
// Signed JWT is stored in an httpOnly cookie called "cad_token" and verified on protected requests.

import jwt from "jsonwebtoken";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let nextCookies = null;
try {
  nextCookies = require("next/headers").cookies;
} catch {
  nextCookies = () => ({ get: () => null });
}

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const COOKIE_NAME = "cad_token";

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// Reads the current logged-in user (id, role, name) from the request cookie or headers.
// Accepts optional request object for maximum resilience in Next.js App Router route handlers.
export function getSessionUser(request = null) {
  let token = null;

  // 1. Check request.cookies if request is provided
  if (request?.cookies) {
    if (typeof request.cookies.get === "function") {
      token = request.cookies.get(COOKIE_NAME)?.value;
    } else if (typeof request.cookies === "object") {
      token = request.cookies[COOKIE_NAME];
    }
  }

  // 2. Check next/headers cookies()
  if (!token && typeof nextCookies === "function") {
    try {
      const cookieStore = nextCookies();
      token = cookieStore.get(COOKIE_NAME)?.value;
    } catch {
      // Not called within a request header scope
    }
  }

  // 3. Fallback: Parse raw Cookie header from request if available
  if (!token && request?.headers) {
    try {
      const rawCookie = request.headers.get("cookie");
      if (rawCookie) {
        const match = rawCookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
        if (match) token = match[1];
      }
    } catch {
      // ignore
    }
  }

  if (!token) return null;
  return verifyToken(token);
}

// RBAC Authorization Helpers for LPU Sports Platform (5 Distinct Roles)
export function isStaff(user) {
  return (
    user?.role === "super_admin" ||
    user?.role === "sports_admin" ||
    user?.role === "admin" ||
    user?.role === "coach" ||
    user?.role === "equipment_manager"
  );
}

export function isAdmin(user) {
  return user?.role === "super_admin" || user?.role === "sports_admin" || user?.role === "admin";
}

export function isSuperAdmin(user) {
  return user?.role === "super_admin";
}

export function canApproveBookings(user) {
  return isAdmin(user) || user?.role === "coach";
}

export function canManageEquipment(user) {
  return isAdmin(user) || user?.role === "equipment_manager";
}

export const AUTH_COOKIE_NAME = COOKIE_NAME;
