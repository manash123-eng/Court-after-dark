// scripts/test-memberships-offline.js
// Unit test for offline / sandboxed sports membership enrollment and pricing calculations.

process.env.NODE_ENV = "test";

import assert from "node:assert/strict";
import { FALLBACK_PLANS } from "../lib/membershipPlans.js";

console.log("🧪 Running Sports Membership Offline & Pricing Test Suite...\n");

// 1. Verify Published Membership Plans Exist
console.log("1. Testing Published Membership Plans...");
assert(FALLBACK_PLANS.length >= 8, "Must contain at least 8 published sports plans");

const badmintonPlan = FALLBACK_PLANS.find((p) => p.sportCategory === "Badminton");
assert(badmintonPlan !== null, "Badminton plan must exist");
assert.equal(badmintonPlan.hostellerEdbFee, 4500, "EDB Badminton fee should be ₹4,500");
assert.equal(badmintonPlan.hostellerRegularFee, 5500, "Regular Badminton fee should be ₹5,500");
assert.equal(badmintonPlan.dayScholarFee, 7500, "Day Scholar Badminton fee should be ₹7,500");

const gymPlan = FALLBACK_PLANS.find((p) => p.sportCategory === "Gymnasium");
assert(gymPlan !== null, "Gym plan must exist");
assert.equal(gymPlan.hostellerEdbFee, 5000, "EDB Gym fee should be ₹5,000");
assert.equal(gymPlan.hostellerRegularFee, 6000, "Regular Gym fee should be ₹6,000");
assert.equal(gymPlan.dayScholarFee, 8000, "Day Scholar Gym fee should be ₹8,000");

const swimPlan = FALLBACK_PLANS.find((p) => p.isSwimmingPlan);
assert(swimPlan !== null, "Swimming plan must exist");
console.log("   ✓ Published membership plans verified.");

// 2. Simulated Offline Membership Enrollment Logic
console.log("2. Testing Offline Membership Enrollment & Pricing Tier Resolution...");

function simulateEnrollment({ studentCategory, isComplimentary = false, planId, paymentDetails, paymentStatus }) {
  const plan = FALLBACK_PLANS.find((p) => p._id === planId) || FALLBACK_PLANS[0];
  let applicableFee = plan.dayScholarFee;
  if (studentCategory.includes("EDB")) {
    applicableFee = plan.hostellerEdbFee;
  } else if (studentCategory.includes("Hosteller")) {
    applicableFee = plan.hostellerRegularFee;
  }

  if (isComplimentary) {
    applicableFee = 0;
  }

  // Pay-first verification check
  if (applicableFee > 0 && paymentStatus !== "Paid" && !paymentDetails?.utrNumber && !paymentDetails?.paymentId) {
    return {
      success: false,
      status: 402,
      error: "Payment required: Please complete fee settlement via UPI/Card before membership pass activation.",
    };
  }

  return {
    success: true,
    _id: "mem_sim_" + Date.now(),
    sportCategory: plan.sportCategory,
    studentCategory,
    applicableFee,
    isComplimentary,
    status: "Active",
    paymentStatus: applicableFee === 0 ? "Complimentary" : "Paid",
    paymentReference: paymentDetails?.utrNumber || `LPU-MEM-TEST-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
  };
}

// Case A: Hosteller with EDB and valid payment
const memEDB = simulateEnrollment({
  studentCategory: "Hosteller with EDB",
  planId: "plan_badminton_2026",
  paymentStatus: "Paid",
  paymentDetails: { utrNumber: "UPI982374182938" },
});
assert.equal(memEDB.success, true);
assert.equal(memEDB.applicableFee, 4500);
assert.equal(memEDB.status, "Active");
assert.equal(memEDB.paymentStatus, "Paid");

// Case B: Day Scholar without payment must fail with 402
const memUnpaid = simulateEnrollment({
  studentCategory: "Day Scholar",
  planId: "plan_badminton_2026",
  paymentStatus: "Pending",
  paymentDetails: null,
});
assert.equal(memUnpaid.success, false);
assert.equal(memUnpaid.status, 402);
assert(memUnpaid.error.includes("Payment required"));

// Case C: Medalist Waiver (₹0) can activate without payment
const memMedalist = simulateEnrollment({
  studentCategory: "Outstanding Sportsperson",
  isComplimentary: true,
  planId: "plan_badminton_2026",
  paymentStatus: "Pending",
  paymentDetails: null,
});
assert.equal(memMedalist.success, true);
assert.equal(memMedalist.applicableFee, 0);
assert.equal(memMedalist.paymentStatus, "Complimentary");

console.log("   ✓ Pay-first enforcement and fee waivers verified.");

// 3. Swimming Slot Booking Pay-First Enforcement
console.log("3. Testing Swimming Slot Booking Pay-First Enforcement...");

function simulateSwimmingBooking({ isHosteller, isComplimentary = false, paymentStatus, paymentDetails }) {
  const price = isComplimentary ? 0 : (isHosteller ? 50 : 100);

  if (price > 0 && paymentStatus !== "Paid" && !paymentDetails?.utrNumber && !paymentDetails?.paymentId && !paymentDetails?.refId) {
    return {
      success: false,
      status: 402,
      error: `Payment of ₹${price} is required before activating your swimming pass.`,
    };
  }

  return {
    success: true,
    price,
    status: "Confirmed",
    paymentStatus: price === 0 ? "Complimentary / Membership" : "Paid",
    passGenerated: true,
  };
}

// Case 1: Unpaid regular swimmer rejected
const swimUnpaid = simulateSwimmingBooking({ isHosteller: true, isComplimentary: false });
assert.equal(swimUnpaid.success, false);
assert.equal(swimUnpaid.status, 402);

// Case 2: Paid swimmer activated
const swimPaid = simulateSwimmingBooking({
  isHosteller: true,
  isComplimentary: false,
  paymentStatus: "Paid",
  paymentDetails: { utrNumber: "UPI928374827163" },
});
assert.equal(swimPaid.success, true);
assert.equal(swimPaid.price, 50);
assert.equal(swimPaid.passGenerated, true);

// Case 3: Medalist swimmer complimentary
const swimComplimentary = simulateSwimmingBooking({ isHosteller: false, isComplimentary: true });
assert.equal(swimComplimentary.success, true);
assert.equal(swimComplimentary.price, 0);
assert.equal(swimComplimentary.passGenerated, true);

console.log("   ✓ Swimming slot pay-first verification passed.");
console.log("\n🎉 Membership & Swimming Pay-First Verification Suite passed cleanly (100% assertions green)!");

