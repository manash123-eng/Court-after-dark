// scripts/test-booking-repro.cjs
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });
const mongoose = require("mongoose");

async function testBooking() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Booking = (await import("../models/Booking.js")).default;
  const Facility = (await import("../models/Facility.js")).default;
  const User = (await import("../models/User.js")).default;

  const fac = await Facility.findOne({});
  console.log("Found facility:", fac ? fac.name : "None", fac ? fac._id : "");

  const user = await User.findOne({});
  console.log("Found user:", user ? user.name : "None", "studentCategory:", user ? user.studentCategory : "");

  try {
    const booking = await Booking.create({
      bookingReference: "TEST-LPU-1234",
      qrCodeToken: "QR-TEST-1234",
      userId: user._id,
      facilityId: fac._id,
      date: "2026-11-12",
      startTime: "18:00",
      endTime: "19:00",
      durationHours: 1,
      pricePerHour: 0,
      equipmentAddons: [],
      equipmentTotal: 0,
      totalPrice: 0,
      paymentMethod: "UPI",
      paymentStatus: "Complimentary / Membership", // Value passed in route.js
      studentCategory: user.studentCategory,       // Value passed in route.js ("Hosteller with EDB")
      status: "Confirmed",
    });
    console.log("Booking created successfully:", booking._id);
  } catch (err) {
    console.error("Booking.create FAILED with:", err.message);
  }

  await mongoose.disconnect();
}

testBooking().catch(console.error);
