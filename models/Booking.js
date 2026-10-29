import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema({
  bookingReference: {
    type: String,
    unique: true,
    required: true,
    default: () => `CAD-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  facilityId: { type: mongoose.Schema.Types.ObjectId, ref: "Facility", required: true },
  date: { type: String, required: true }, // "YYYY-MM-DD"
  startTime: { type: String, required: true }, // "18:00"
  endTime: { type: String, required: true }, // "19:00"
  durationHours: { type: Number, default: 1 },
  pricePerHour: { type: Number, default: 40 },
  equipmentAddons: [
    {
      equipmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Equipment" },
      name: { type: String },
      quantity: { type: Number, default: 1 },
      price: { type: Number, default: 0 },
    },
  ],
  equipmentTotal: { type: Number, default: 0 },
  totalPrice: { type: Number, default: 40 },
  paymentMethod: {
    type: String,
    enum: ["Card", "Razorpay", "Pay at Venue"],
    default: "Pay at Venue",
  },
  paymentStatus: {
    type: String,
    enum: ["Paid", "Pay at Venue", "Refunded"],
    default: "Pay at Venue",
  },
  paymentDetails: {
    cardBrand: { type: String, default: "" },
    cardLast4: { type: String, default: "" },
    cardholderName: { type: String, default: "" },
    razorpayPaymentId: { type: String, default: "" },
    razorpayOrderId: { type: String, default: "" },
    upiId: { type: String, default: "" },
    paidAt: { type: Date, default: null },
  },
  status: {
    type: String,
    enum: ["Confirmed", "Cancelled", "Completed", "Rejected"],
    default: "Confirmed",
  },
  notes: { type: String, default: "" },
  cancellationReason: { type: String, default: "" },
  cancelledAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

// Fast query indexes
BookingSchema.index({ facilityId: 1, date: 1, status: 1 });
BookingSchema.index({ userId: 1, status: 1 });

export default mongoose.models.Booking || mongoose.model("Booking", BookingSchema);
