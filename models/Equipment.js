import mongoose from "mongoose";

const EquipmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sportCategory: { type: String }, // e.g. "Badminton", "Football", "Cricket"
  category: { type: String }, // synonym for frontend and API compatibility
  description: { type: String, default: "" },
  image: { type: String, default: "" },

  totalQuantity: { type: Number, required: true, default: 0 },
  availableQuantity: { type: Number, required: true, default: 0 },
  issuedQuantity: { type: Number, default: 0 },
  damagedQuantity: { type: Number, default: 0 },
  underMaintenanceQuantity: { type: Number, default: 0 },

  condition: {
    type: String,
    enum: ["New", "Good", "Fair", "Worn", "Damaged"],
    default: "Good",
  },
  rentalEligibility: {
    type: String,
    enum: ["All Students", "Hostellers Only", "Club Members Only", "Coach Approval Required"],
    default: "All Students",
  },
  rentalFee: { type: Number, default: 0 }, // 0 = Free with student ID unless configured
  rentalPrice: { type: Number, default: 0 }, // synonym for frontend compatibility
  securityDeposit: { type: Number, default: 0 },
  storeLocation: {
    type: String,
    default: "Shanti Devi Mittal Indoor Sports Complex - Central Sports Store",
  },

  // Proposed vs Confirmed flag as specified by university governance
  isProposedCatalog: { type: Boolean, default: true },
  sourceNote: {
    type: String,
    default: "Proposed sports store catalogue pending physical store audit confirmation",
  },

  status: {
    type: String,
    enum: ["Available", "Out of Stock", "Maintenance", "Archived"],
    default: "Available",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

EquipmentSchema.pre("save", function (next) {
  if (this.sportCategory && !this.category) this.category = this.sportCategory;
  if (this.category && !this.sportCategory) this.sportCategory = this.category;
  if (this.rentalFee != null && this.rentalPrice == null) this.rentalPrice = this.rentalFee;
  if (this.rentalPrice != null && this.rentalFee == null) this.rentalFee = this.rentalPrice;
  next();
});

EquipmentSchema.index({ sportCategory: 1, category: 1, status: 1 });

export default mongoose.models.Equipment || mongoose.model("Equipment", EquipmentSchema);
