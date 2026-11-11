import mongoose from "mongoose";

export const BOOKING_STATUSES = [
  "Draft",
  "Pending Approval",
  "Approved",
  "Rejected",
  "Confirmed",
  "Payment Pending",
  "Payment Verification Pending",
  "Paid",
  "Cancelled",
  "Completed",
  "No Show",
];

const BookingSchema = new mongoose.Schema({
  bookingReference: {
    type: String,
    unique: true,
    required: true,
    default: () =>
      `LPU-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  facilityId: { type: mongoose.Schema.Types.ObjectId, ref: "Facility", required: true },
  date: { type: String, required: true }, // "YYYY-MM-DD"
  startTime: { type: String, required: true }, // "18:00"
  endTime: { type: String, required: true }, // "19:00"
  durationHours: { type: Number, default: 1 },
  pricePerHour: { type: Number, default: 0 },

  // --- LPU Student Category & Affiliation ---
  studentCategory: {
    type: String,
    default: "Hosteller with EDB",
  },
  regNo: { type: String, default: "" },

  // --- Flexible Approval Workflow ---
  approvalRequired: { type: Boolean, default: false },
  approvalStatus: {
    type: String,
    enum: ["Not Required", "Pending", "Approved", "Rejected"],
    default: "Not Required",
  },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  approvedByName: { type: String, default: "" },
  approvalNotes: { type: String, default: "" },
  approvedAt: { type: Date, default: null },

  // --- Equipment Addons ---
  equipmentAddons: [
    {
      equipmentId: { type: mongoose.Schema.Types.Mixed },
      name: { type: String },
      quantity: { type: Number, default: 1 },
      price: { type: Number, default: 0 },
    },
  ],
  equipmentTotal: { type: Number, default: 0 },
  totalPrice: { type: Number, default: 0 },

  // --- Payment Information ---
  paymentMethod: {
    type: String,
    default: "UPI",
  },
  paymentStatus: {
    type: String,
    enum: [
      "Paid",
      "Pay at Venue",
      "Payment Pending",
      "Payment Verification Pending",
      "Complimentary",
      "Complimentary / Membership",
      "Membership Covered",
      "Refunded",
      "Waived",
    ],
    default: "Payment Pending",
  },
  paymentDetails: {
    cardBrand: { type: String, default: "" },
    cardLast4: { type: String, default: "" },
    cardholderName: { type: String, default: "" },
    razorpayPaymentId: { type: String, default: "" },
    razorpayOrderId: { type: String, default: "" },
    upiId: { type: String, default: "" },
    merchantUpiId: { type: String, default: "" },
    utrNumber: { type: String, default: "" },
    paidAt: { type: Date, default: null },
  },

  // --- Core Lifecycle Status ---
  status: {
    type: String,
    enum: BOOKING_STATUSES,
    default: "Pending Approval",
  },

  // --- Attendance & QR Pass Verification ---
  qrCodeToken: {
    type: String,
    unique: true,
    default: () =>
      `QR-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
  },
  isAttended: { type: Boolean, default: false },
  attendedAt: { type: Date, default: null },
  attendanceVerifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

  // --- Swimming & Specialized Slots ---
  isSwimmingSlot: { type: Boolean, default: false },
  swimmingCategory: { type: String, default: "General" }, // "General" | "Girls" | "Coaching"

  notes: { type: String, default: "" },
  cancellationReason: { type: String, default: "" },
  cancelledAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

// Indexes for fast lookup and atomic conflict checking
BookingSchema.index({ facilityId: 1, date: 1, status: 1 });
BookingSchema.index({ userId: 1, status: 1 });

export default mongoose.models.Booking || mongoose.model("Booking", BookingSchema);
