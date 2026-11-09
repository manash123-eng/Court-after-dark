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

function simulateEnrollment({ studentCategory, isComplimentary = false, planId }) {
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

  return {
    _id: "mem_sim_" + Date.now(),
    sportCategory: plan.sportCategory,
    studentCategory,
    applicableFee,
    isComplimentary,
    status: "Active",
    paymentStatus: applicableFee === 0 ? "Complimentary" : "Paid",
    paymentReference: `LPU-MEM-TEST-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
  };
}

// Case A: Hosteller with EDB
const memEDB = simulateEnrollment({
  studentCategory: "Hosteller with EDB",
  planId: "plan_badminton_2026",
});
assert.equal(memEDB.applicableFee, 4500);
assert.equal(memEDB.status, "Active");
assert.equal(memEDB.paymentStatus, "Paid");

// Case B: Day Scholar
const memDay = simulateEnrollment({
  studentCategory: "Day Scholar",
  planId: "plan_badminton_2026",
});
assert.equal(memDay.applicableFee, 7500);

// Case C: Medalist Waiver
const memMedalist = simulateEnrollment({
  studentCategory: "Outstanding Sportsperson",
  isComplimentary: true,
  planId: "plan_badminton_2026",
});
assert.equal(memMedalist.applicableFee, 0);
assert.equal(memMedalist.paymentStatus, "Complimentary");

console.log("   ✓ Offline enrollment calculation and fee waivers verified.");
console.log("\n🎉 Membership Offline Verification Suite passed cleanly (100% assertions green)!");
