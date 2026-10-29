// lib/auth.js
// Authentication helper for Courts After Dark.
// Passwords are hashed with bcrypt.
// Signed JWT is stored in an httpOnly cookie called "cad_token" and verified on protected requests.

import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

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
  if (!token) {
    try {
      const cookieStore = cookies();
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

  // 4. Fallback: Check Authorization: Bearer <token>
  if (!token && request?.headers) {
    try {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    } catch {
      // ignore
    }
  }

  if (!token) return null;
  return verifyToken(token);
}

export const AUTH_COOKIE_NAME = COOKIE_NAME;
