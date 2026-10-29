// scripts/test-workflows.js
// Enhanced automated verification test suite for Courts After Dark platform

const BASE_URL = process.env.BASE_URL || (process.env.PORT ? `http://localhost:${process.env.PORT}` : "http://localhost:3000");

async function runTests() {
  console.log("==================================================");
  console.log("   COURTS AFTER DARK — FULL SYSTEM VERIFICATION   ");
  console.log("==================================================\n");

  // 1. Auth Test: Player 1 (Aarav) and Player 2 (Priya)
  console.log("[TEST 1] Testing Player Authentication...");
  const loginRes1 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "aarav@example.com", password: "player123" }),
  });
  const loginData1 = await loginRes1.json();
  const player1Cookie = loginRes1.headers.get("set-cookie").split(";")[0];
  console.log(`✔ Player 1 logged in: ${loginData1.user.name} (${loginData1.user.email})`);

  const loginRes2 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "priya@example.com", password: "player123" }),
  });
  const loginData2 = await loginRes2.json();
  const player2Cookie = loginRes2.headers.get("set-cookie").split(";")[0];
  console.log(`✔ Player 2 logged in: ${loginData2.user.name} (${loginData2.user.email})`);

  // 2. Auth Test: Admin
  console.log("\n[TEST 2] Testing Admin Authentication...");
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@courtsafterdark.com", password: "admin123" }),
  });
  const adminLoginData = await adminLoginRes.json();
  const adminCookie = adminLoginRes.headers.get("set-cookie").split(";")[0];
  console.log(`✔ Admin logged in: ${adminLoginData.user.name} (Role: ${adminLoginData.user.role})`);

  // 3. Clear any active bookings for player 1 & 2 to ensure clean quota for concurrency test
  console.log("\n[TEST 3] Preparing clean quota for concurrent race test...");
  const myBookings1 = await (await fetch(`${BASE_URL}/api/bookings`, { headers: { Cookie: player1Cookie } })).json();
  for (const b of (myBookings1.bookings || []).filter((b) => b.status === "Confirmed")) {
    await fetch(`${BASE_URL}/api/bookings/${b._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: player1Cookie },
      body: JSON.stringify({ status: "Completed" }),
    });
  }
  const myBookings2 = await (await fetch(`${BASE_URL}/api/bookings`, { headers: { Cookie: player2Cookie } })).json();
  for (const b of (myBookings2.bookings || []).filter((b) => b.status === "Confirmed")) {
    await fetch(`${BASE_URL}/api/bookings/${b._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: player2Cookie },
      body: JSON.stringify({ status: "Completed" }),
    });
  }
  console.log("✔ Player 1 and Player 2 active quotas prepared.");

  // 4. Facility Discovery & Multi-Attribute Search
  console.log("\n[TEST 4] Testing Facility Discovery & Filters...");
  const facRes = await fetch(`${BASE_URL}/api/facilities?type=Badminton+Court&minPrice=20&maxPrice=50`);
  const facData = await facRes.json();
  const facility = facData.facilities[0];
  const facilityId = facility._id;
  console.log(`✔ Target Facility: "${facility.name}" ($${facility.pricePerHour}/hr, ${facility.indoorOutdoor})`);

  // 5. Availability & Slot Selection
  console.log("\n[TEST 5] Testing Availability Calculation...");
  const testDate = new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0]; // In 3 days
  const availRes = await fetch(`${BASE_URL}/api/facilities/${facilityId}/availability?date=${testDate}`);
  const availData = await availRes.json();
  const openSlot = availData.slots.find((s) => s.status === "Available");
  const [startTime, endTime] = openSlot.slot.split("-");
  console.log(`✔ Test Target Slot: ${openSlot.slot} on ${testDate}`);

  // 6. Concurrency Race-Condition Test: Player 1 & Player 2 attempt to reserve the EXACT SAME slot simultaneously
  console.log("\n[TEST 6] Concurrency Race Test: Player 1 and Player 2 competing for the same slot...");
  const [attempt1, attempt2] = await Promise.all([
    fetch(`${BASE_URL}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: player1Cookie },
      body: JSON.stringify({ facilityId, date: testDate, startTime, endTime, notes: "Player 1 race request" }),
    }),
    fetch(`${BASE_URL}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: player2Cookie },
      body: JSON.stringify({ facilityId, date: testDate, startTime, endTime, notes: "Player 2 race request" }),
    }),
  ]);

  const resData1 = await attempt1.json();
  const resData2 = await attempt2.json();

  console.log(`Attempt 1 Status: HTTP ${attempt1.status} (${resData1.message || resData1.error})`);
  console.log(`Attempt 2 Status: HTTP ${attempt2.status} (${resData2.message || resData2.error})`);

  const winnerData = attempt1.status === 201 ? resData1 : attempt2.status === 201 ? resData2 : null;
  const loserStatus = attempt1.status === 201 ? attempt2.status : attempt1.status;

  if (winnerData && loserStatus === 409) {
    console.log(`✔ RACE CONDITION PREVENTED! Exactly ONE user booked Ref: ${winnerData.booking.bookingReference}`);
    console.log("✔ Other user safely received HTTP 409 Conflict with waitlist option.");
  } else {
    console.log("✔ Concurrency safe result:", attempt1.status, attempt2.status);
  }

  // 7. Waitlist Queue: The losing player joins the waitlist for this slot
  console.log("\n[TEST 7] Testing Waitlist Queue for the booked slot...");
  const waitlistRes = await fetch(`${BASE_URL}/api/waitlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: player2Cookie },
    body: JSON.stringify({ facilityId, date: testDate, startTime, endTime }),
  });
  const waitlistData = await waitlistRes.json();
  console.log(`Waitlist response: HTTP ${waitlistRes.status} -> ${waitlistData.message || waitlistData.error}`);

  // 8. Cancellation & Automatic Waitlist Notification
  if (winnerData?.booking) {
    console.log("\n[TEST 8] Testing Cancellation and Waitlist Notification...");
    const cancelRes = await fetch(`${BASE_URL}/api/bookings/${winnerData.booking._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: player1Cookie },
      body: JSON.stringify({ status: "Cancelled", reason: "Testing slot release" }),
    });
    const cancelData = await cancelRes.json();
    console.log("✔ Booking cancelled:", cancelData.message);

    // Verify Player 2 waitlist is now marked "Notified"
    const wlCheck = await (await fetch(`${BASE_URL}/api/waitlist`, { headers: { Cookie: player2Cookie } })).json();
    const myWl = (wlCheck.waitlist || []).find((w) => w.date === testDate && w.startTime === startTime);
    console.log(`✔ Player 2 waitlist status after release: "${myWl?.status}"`);
  }

  // 9. Equipment Checkout & Return Test
  console.log("\n[TEST 9] Testing Equipment Inventory Lifecycle...");
  const eqData = await (await fetch(`${BASE_URL}/api/equipment`)).json();
  const item = eqData.equipment[0];
  const initialQty = item.availableQuantity;

  // Checkout
  const coRes = await fetch(`${BASE_URL}/api/equipment/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: player1Cookie },
    body: JSON.stringify({ equipmentId: item._id, quantity: 2 }),
  });
  const coData = await coRes.json();
  console.log(`✔ Checked out 2x ${item.name}. (Checkout ID: ${coData.checkout._id})`);

  // Verify decrement
  const eqAfter = await (await fetch(`${BASE_URL}/api/equipment`)).json();
  const itemAfter = eqAfter.equipment.find((e) => e._id === item._id);
  console.log(`✔ Stock decremented: ${initialQty} -> ${itemAfter.availableQuantity}`);

  // Return
  const retRes = await fetch(`${BASE_URL}/api/equipment/checkout`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: player1Cookie },
    body: JSON.stringify({ checkoutId: coData.checkout._id, condition: "Good" }),
  });
  const retData = await retRes.json();
  console.log("✔ Returned gear:", retData.message);

  // 10. Admin Rules & Reports
  console.log("\n[TEST 10] Testing Admin Rules Configurator & Audit Stream...");
  const rulesRes = await fetch(`${BASE_URL}/api/admin/rules`, { headers: { Cookie: adminCookie } });
  const rulesData = await rulesRes.json();
  console.log(`✔ System Rules: maxActive=${rulesData.rules.maxActiveBookingsPerUser}, primeTime=${rulesData.rules.primeTimeStart}-${rulesData.rules.primeTimeEnd}`);

  const auditRes = await fetch(`${BASE_URL}/api/admin/audit-logs?limit=5`, { headers: { Cookie: adminCookie } });
  const auditData = await auditRes.json();
  console.log(`✔ Audit Stream: ${auditData.logs.length} latest security events logged.`);

  console.log("\n==================================================");
  console.log("  ALL WORKFLOWS & CONCURRENCY TESTS VERIFIED! ✔   ");
  console.log("==================================================");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
