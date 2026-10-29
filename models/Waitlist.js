import mongoose from "mongoose";

const WaitlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  facilityId: { type: mongoose.Schema.Types.ObjectId, ref: "Facility", required: true },
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  status: {
    type: String,
    enum: ["Waiting", "Notified", "Promoted", "Cancelled"],
    default: "Waiting",
  },
  notifiedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

WaitlistSchema.index({ facilityId: 1, date: 1, startTime: 1, status: 1 });
WaitlistSchema.index({ userId: 1, status: 1 });

export default mongoose.models.Waitlist || mongoose.model("Waitlist", WaitlistSchema);
