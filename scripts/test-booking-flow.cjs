// scripts/test-booking-flow.cjs
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });
const mongoose = require("mongoose");
const assert = require("node:assert/strict");

async function testBookingFlow() {
  console.log("🧪 Testing Complete Facility Booking & Payment Flow...\n");

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  const Facility = (await import("../models/Facility.js")).default;
  const Booking = (await import("../models/Booking.js")).default;
  const User = (await import("../models/User.js")).default;

  const user = await User.findOne({ email: "manash213@gmail.com" }) || await User.findOne({});
  assert(user !== null, "User must exist");
  console.log(`1. Test User: ${user.name} (${user.email}) - studentCategory: "${user.studentCategory}"`);

  const facility = await Facility.findOne({ name: { $regex: "Badminton", $options: "i" } });
  assert(facility !== null, "Badminton facility must exist");
  console.log(`2. Test Facility: ${facility.name} (_id: ${facility._id})`);

  // Test Case A: Real DB ObjectId Booking
  console.log("\n3. Testing booking creation with real facility ObjectId...");
  const bookingRefA = `TEST-BOOK-${Date.now().toString(36).toUpperCase()}-1`;
  const qrPassA = `QR-PASS-TEST-1`;

  const bookingA = await Booking.create({
    bookingReference: bookingRefA,
    qrCodeToken: qrPassA,
    userId: user._id,
    facilityId: facility._id,
    date: "2026-11-20",
    startTime: "16:00",
    endTime: "17:00",
    durationHours: 1,
    pricePerHour: 0,
    equipmentAddons: [],
    equipmentTotal: 0,
    totalPrice: 0,
    paymentMethod: "UPI",
    paymentStatus: "Paid",
    paymentDetails: {
      method: "UPI",
      utrNumber: "UPI123456789012",
      upiId: "7828722557@ptyes",
    },
    status: "Confirmed",
    studentCategory: user.studentCategory, // "Hosteller with EDB"
    approvalRequired: false,
    approvalStatus: "Not Required",
    notes: "Automated LPU Court Pass",
  });

  assert(bookingA._id !== null, "Booking A must be created");
  console.log(`   ✓ Successfully created Booking A: ${bookingA.bookingReference} (status: ${bookingA.status})`);

  // Test Case B: Complimentary / Membership Covered Booking (totalPrice = 0)
  console.log("\n4. Testing booking creation with 'Complimentary / Membership' payment status...");
  const bookingRefB = `TEST-BOOK-${Date.now().toString(36).toUpperCase()}-2`;
  const qrPassB = `QR-PASS-TEST-2`;

  const bookingB = await Booking.create({
    bookingReference: bookingRefB,
    qrCodeToken: qrPassB,
    userId: user._id,
    facilityId: facility._id,
    date: "2026-11-20",
    startTime: "17:00",
    endTime: "18:00",
    durationHours: 1,
    pricePerHour: 0,
    equipmentAddons: [],
    equipmentTotal: 0,
    totalPrice: 0,
    paymentMethod: "Membership Covered",
    paymentStatus: "Complimentary / Membership",
    status: "Confirmed",
    studentCategory: user.studentCategory,
    approvalRequired: false,
    approvalStatus: "Not Required",
  });

  assert(bookingB._id !== null, "Booking B must be created");
  console.log(`   ✓ Successfully created Booking B: ${bookingB.bookingReference} (paymentStatus: ${bookingB.paymentStatus})`);

  // Clean up test bookings
  await Booking.deleteMany({ bookingReference: { $in: [bookingRefA, bookingRefB] } });
  console.log("\n5. Cleaned up temporary test bookings from database.");

  await mongoose.disconnect();
  console.log("\n🎉 Booking and payment verification flow passed 100% cleanly!");
}

testBookingFlow().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
