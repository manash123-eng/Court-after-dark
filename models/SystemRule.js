import mongoose from "mongoose";

const SystemRuleSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: "default_rules" },
  maxActiveBookingsPerUser: { type: Number, default: 2 },
  maxAdvanceBookingDays: { type: Number, default: 14 },
  maxBookingDurationHours: { type: Number, default: 2 },
  cancellationDeadlineHours: { type: Number, default: 4 },
  primeTimeStart: { type: String, default: "18:00" },
  primeTimeEnd: { type: String, default: "21:00" },
  maxPrimeTimeBookingsPerWeek: { type: Number, default: 3 },
  allowWaitlist: { type: Boolean, default: true },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.SystemRule || mongoose.model("SystemRule", SystemRuleSchema);
