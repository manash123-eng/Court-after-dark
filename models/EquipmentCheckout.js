import mongoose from "mongoose";

const EquipmentCheckoutSchema = new mongoose.Schema({
  bookingReference: {
    type: String,
    required: true,
    default: () => `EQ-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  equipmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Equipment", required: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
  quantity: { type: Number, required: true, default: 1 },
  rentalPrice: { type: Number, default: 5 },
  totalAmount: { type: Number, default: 5 },
  rentalDate: { type: String }, // "YYYY-MM-DD"
  durationHours: { type: Number, default: 2 },
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
    razorpayPaymentId: { type: String, default: "" },
    razorpayOrderId: { type: String, default: "" },
    upiId: { type: String, default: "" },
    paidAt: { type: Date, default: null },
  },
  checkoutTime: { type: Date, default: Date.now },
  returnTime: { type: Date, default: null },
  status: {
    type: String,
    enum: ["Checked Out", "Returned", "Booked"],
    default: "Checked Out",
  },
});

export default mongoose.models.EquipmentCheckout ||
  mongoose.model("EquipmentCheckout", EquipmentCheckoutSchema);
