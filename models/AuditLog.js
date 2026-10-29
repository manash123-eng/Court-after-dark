import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema({
  action: { type: String, required: true }, // e.g., "BOOKING_CREATED", "BOOKING_CANCELLED", "MAINTENANCE_SCHEDULED", "RULES_UPDATED", "EQUIPMENT_CHECKOUT"
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  performedByName: { type: String, default: "System" },
  entityType: { type: String, required: true }, // "Booking", "Facility", "Maintenance", "Equipment", "SystemRule", "User"
  entityId: { type: String, default: "" },
  details: { type: String, default: "" },
  severity: { type: String, enum: ["info", "warning", "critical"], default: "info" },
  createdAt: { type: Date, default: Date.now },
});

AuditLogSchema.index({ createdAt: -1 });

export default mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);
