import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true }, // stored as a bcrypt hash, never plain text
  role: { type: String, enum: ["player", "admin"], default: "player" },
  phone: { type: String, default: "" },
  bio: { type: String, default: "" },
  preferredSports: [{ type: String }],
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Facility" }],
  status: { type: String, enum: ["active", "suspended"], default: "active" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
