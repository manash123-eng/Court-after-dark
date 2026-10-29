import mongoose from "mongoose";

const MaintenanceSchema = new mongoose.Schema({
  facilityId: { type: mongoose.Schema.Types.ObjectId, ref: "Facility", required: true },
  date: { type: String, required: true }, // "YYYY-MM-DD"
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  reason: { type: String, default: "" },
  status: { type: String, enum: ["Scheduled", "Completed", "Cancelled"], default: "Scheduled" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Maintenance || mongoose.model("Maintenance", MaintenanceSchema);
