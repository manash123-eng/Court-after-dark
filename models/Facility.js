import mongoose from "mongoose";

export const FACILITY_TYPES = [
  "Badminton Court",
  "Basketball Court",
  "Football Ground",
  "Cricket Ground",
  "Tennis Court",
  "Volleyball Court",
  "Gym",
  "Table Tennis",
];

const FacilitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: FACILITY_TYPES, required: true },
  location: { type: String, required: true },
  city: { type: String, default: "Downtown" },
  description: { type: String, default: "" },
  capacity: { type: Number, required: true },
  openingTime: { type: String, required: true }, // "06:00"
  closingTime: { type: String, required: true }, // "22:00"
  pricePerHour: { type: Number, default: 40 },
  indoorOutdoor: { type: String, enum: ["Indoor", "Outdoor"], default: "Indoor" },
  surfaceType: { type: String, default: "Professional Synthetic" },
  amenities: [{ type: String }],
  rules: [{ type: String }],
  equipmentAvailable: [{ type: String }],
  image: { type: String, default: "" },
  status: { type: String, enum: ["Available", "Maintenance", "Closed"], default: "Available" },
  cancellationHours: { type: Number, default: 4 }, // Hours prior required to cancel
  featured: { type: Boolean, default: false },
  bookingCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

FacilitySchema.index({ type: 1, status: 1, city: 1, pricePerHour: 1 });

export const FACILITY_TYPE_OPTIONS = FACILITY_TYPES;
export default mongoose.models.Facility || mongoose.model("Facility", FacilitySchema);
