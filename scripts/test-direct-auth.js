// scripts/test-direct-auth.js
// Verification suite for direct student registration & login without OTP requirements.

process.env.NODE_ENV = "test";

import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import {
  findInMemoryUser,
  getInMemoryUserById,
  createInMemoryUser,
  getAllInMemoryUsers,
} from "../lib/inMemoryUsers.js";
import { signToken, verifyToken } from "../lib/auth.js";
import { isValidEmail, isValidName, evaluatePasswordStrength } from "../lib/validators.js";
import { normalizeIndianPhone } from "../lib/otpService.js";

console.log("🧪 Running Direct Student Registration & Login Verification Suite (No OTP)...\n");

// 1. In-Memory User Lookup by Email and Phone
console.log("1. Testing User Retrieval by Email and Phone (No OTP required)...");
const aaravByEmail = findInMemoryUser("aarav@example.com");
assert(aaravByEmail !== null, "Should find Aarav by email");
assert.equal(aaravByEmail.name, "Aarav Sharma");
assert.equal(aaravByEmail.role, "student");

const aaravByPhone = findInMemoryUser("7828722557");
assert(aaravByPhone !== null, "Should find Aarav by 10-digit mobile number");
assert.equal(aaravByPhone.email, "aarav@example.com");

const adminByEmail = findInMemoryUser("admin@courtsafterdark.com");
assert(adminByEmail !== null, "Should find DSW Admin by email");
assert.equal(adminByEmail.role, "sports_admin");
console.log("   ✓ User lookup by email and phone passed.");

// 2. Direct Registration (Creates active student account with hash and JWT)
console.log("2. Testing Direct Student Registration Flow...");
const newStudent = {
  name: "Gaurav Singh",
  email: "gaurav.singh@lpu.in",
  phone: "+919876501234",
  password: bcrypt.hashSync("GauravPass123!", 8),
  role: "student",
  studentCategory: "Hosteller with EDB",
  regNo: "12304918",
};

const registered = createInMemoryUser(newStudent);
assert.equal(registered.name, "Gaurav Singh");
assert.equal(registered.email, "gaurav.singh@lpu.in");
assert.equal(registered.status, "active", "Account must be immediately active (No OTP pending)");
assert.equal(registered.phoneVerified, true, "Phone marked verified");

// Token generation for direct login
const token = signToken({
  id: registered._id,
  role: registered.role,
  name: registered.name,
});
assert(token && typeof token === "string", "JWT token must be generated");

const decoded = verifyToken(token);
assert(decoded !== null, "Token must verify successfully");
assert.equal(decoded.name, "Gaurav Singh");
assert.equal(decoded.role, "student");
console.log("   ✓ Direct registration and session issuance passed without OTP.");

// 3. Password Verification (Bcrypt comparison)
console.log("3. Testing Password Verification...");
const validPasswordMatch = bcrypt.compareSync("GauravPass123!", registered.password);
assert.equal(validPasswordMatch, true, "Correct password must match");

const invalidPasswordMatch = bcrypt.compareSync("WrongPassword!", registered.password);
assert.equal(invalidPasswordMatch, false, "Incorrect password must be rejected");
console.log("   ✓ Direct password authentication passed.");

// 4. Registration Field Validators
console.log("4. Testing Registration Input Validations...");
assert.equal(isValidName("Aarav Sharma"), true);
assert.equal(isValidName("A"), false);
assert.equal(isValidEmail("student@lpu.in"), true);
assert.equal(isValidEmail("not-an-email"), false);
const phoneCheck = normalizeIndianPhone("7828722557");
assert.equal(phoneCheck.valid, true);
assert.equal(phoneCheck.e164, "+917828722557");
const pwdCheck = evaluatePasswordStrength("SecureP@ss123");
assert.equal(pwdCheck.passed, true);
console.log("   ✓ Registration field validators passed.");

console.log("\n🎉 Direct Authentication (No OTP) Suite passed 100% cleanly!");

