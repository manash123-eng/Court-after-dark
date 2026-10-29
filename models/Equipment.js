import mongoose from "mongoose";

const EquipmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  totalQuantity: { type: Number, required: true, default: 0 },
  availableQuantity: { type: Number, required: true, default: 0 },
  rentalPrice: { type: Number, default: 5 }, // Hourly / session rental rate in USD
  condition: { type: String, enum: ["New", "Good", "Fair", "Worn"], default: "Good" },
  status: { type: String, enum: ["Available", "Unavailable"], default: "Available" },
  image: { type: String, default: "" },
  description: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Equipment || mongoose.model("Equipment", EquipmentSchema);
