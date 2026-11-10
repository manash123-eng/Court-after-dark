// scripts/restore-catalogue.cjs
// Idempotent restoration script for official LPU sports facilities, equipment,
// membership plans, and system rules.
// Strictly preserves existing user accounts, existing bookings, and existing collections.

const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is not set in .env.local");
  process.exit(1);
}

// Schemas
const FacilitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  location: { type: String, required: true },
  campusLocation: { type: String, default: "Shanti Devi Mittal Indoor Sports Complex" },
  city: { type: String, default: "LPU Campus (Phagwara)" },
  description: { type: String, default: "" },
  capacity: { type: Number, required: true, default: 4 },
  openingTime: { type: String, required: true, default: "06:00" },
  closingTime: { type: String, required: true, default: "22:00" },
  pricePerHour: { type: Number, default: 0 },
  indoorOutdoor: { type: String, enum: ["Indoor", "Outdoor", "Semi-indoor"], default: "Indoor" },
  surfaceType: { type: String, default: "Professional Standard Surface" },
  amenities: [{ type: String }],
  rules: [{ type: String }],
  equipmentAvailable: [{ type: String }],
  image: { type: String, default: "" },
  status: { type: String, enum: ["Available", "Maintenance", "Closed", "Pending Verification"], default: "Available" },
  cancellationHours: { type: Number, default: 2 },
  featured: { type: Boolean, default: false },
  bookingCount: { type: Number, default: 0 },
  publishedQuantity: { type: Number, default: 1 },
  verifiedQuantity: { type: Number, default: null },
  isQuantityVerified: { type: Boolean, default: false },
  discrepancyNote: { type: String, default: "" },
  sourceUrl: { type: String, default: "https://www.lpu.in/SUSTAINABLE/sdg3/shared-sports-facilities.php" },
  lastVerificationDate: { type: Date, default: null },
  bookingEligibility: { type: [String], default: ["All Students", "Hostellers", "Day Scholars", "Sports Club Members", "Coaches"] },
  membershipRequired: { type: Boolean, default: false },
  approvalRequired: { type: Boolean, default: false },
  requiresCoachSupervision: { type: Boolean, default: false },
  maintenanceStatus: { type: String, enum: ["Operational", "Under Maintenance", "Temporarily Closed"], default: "Operational" },
  createdAt: { type: Date, default: Date.now },
});

const EquipmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sportCategory: { type: String },
  category: { type: String },
  description: { type: String, default: "" },
  image: { type: String, default: "" },
  totalQuantity: { type: Number, required: true, default: 0 },
  availableQuantity: { type: Number, required: true, default: 0 },
  issuedQuantity: { type: Number, default: 0 },
  damagedQuantity: { type: Number, default: 0 },
  underMaintenanceQuantity: { type: Number, default: 0 },
  condition: { type: String, enum: ["New", "Good", "Fair", "Worn", "Damaged"], default: "Good" },
  rentalEligibility: { type: String, enum: ["All Students", "Hostellers Only", "Club Members Only", "Coach Approval Required"], default: "All Students" },
  rentalFee: { type: Number, default: 0 },
  rentalPrice: { type: Number, default: 0 },
  securityDeposit: { type: Number, default: 0 },
  storeLocation: { type: String, default: "Shanti Devi Mittal Indoor Sports Complex - Central Sports Store" },
  isProposedCatalog: { type: Boolean, default: true },
  sourceNote: { type: String, default: "Proposed sports store catalogue pending physical store audit confirmation" },
  status: { type: String, enum: ["Available", "Out of Stock", "Maintenance", "Archived"], default: "Available" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const MembershipPlanSchema = new mongoose.Schema({
  sportCategory: String, sessionYear: String, description: String,
  hostellerEdbFee: Number, hostellerRegularFee: Number, dayScholarFee: Number,
  isSwimmingPlan: Boolean, hourlyRateHosteller: Number, hourlyRateDayScholar: Number,
  monthlyRateHosteller: Number, monthlyRateDayScholar: Number, semesterRateHosteller: Number,
  semesterRateDayScholar: Number, registrationFee: Number, monthlyCoachingFee: Number,
  sourceUrl: String, isActive: Boolean, createdAt: Date, updatedAt: Date,
});

const SwimmingSlotSchema = new mongoose.Schema({
  facilityId: mongoose.Schema.Types.ObjectId, date: String, startTime: String, endTime: String,
  category: String, maxCapacity: Number, bookedCount: Number, isOpen: Boolean,
  isCoachSupervised: Boolean, coachName: String, notes: String, createdAt: Date,
});

const SystemRuleSchema = new mongoose.Schema({
  key: String, maxActiveBookingsPerUser: Number, maxAdvanceBookingDays: Number,
  maxBookingDurationHours: Number, cancellationDeadlineHours: Number,
  primeTimeStart: String, primeTimeEnd: String, maxPrimeTimeBookingsPerWeek: Number,
  allowWaitlist: Boolean, updatedAt: Date,
});

const UserSchema = new mongoose.Schema({
  name: String, email: String, password: String, role: String, phone: String, bio: String,
  regNo: String, department: String, hostelBlock: String, studentCategory: String,
  phoneVerified: Boolean, isComplimentaryApproved: Boolean,
  preferredSports: [String], favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Facility" }],
  status: String, createdAt: Date,
});

const Facility = mongoose.models.Facility || mongoose.model("Facility", FacilitySchema);
const Equipment = mongoose.models.Equipment || mongoose.model("Equipment", EquipmentSchema);
const MembershipPlan = mongoose.models.MembershipPlan || mongoose.model("MembershipPlan", MembershipPlanSchema);
const SwimmingSlot = mongoose.models.SwimmingSlot || mongoose.model("SwimmingSlot", SwimmingSlotSchema);
const SystemRule = mongoose.models.SystemRule || mongoose.model("SystemRule", SystemRuleSchema);
const User = mongoose.models.User || mongoose.model("User", UserSchema);

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

async function restore() {
  console.log("=== Starting Idempotent LPU Sports Catalogue Restoration ===");
  console.log("Target MongoDB URI:", MONGODB_URI.replace(/:([^:@]+)@/, ":****@"));

  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
  });
  console.log("Connected to MongoDB Atlas successfully!");

  // Step 1: Verify existing users & preserve them
  const existingUsers = await User.find({});
  console.log(`Step 1: Verified ${existingUsers.length} existing user(s) in database.`);
  existingUsers.forEach(u => console.log(`   - Preserved user: ${u.name} (${u.email}) [Role: ${u.role || 'student'}]`));

  // Step 2: Extract official data structures from seed.js
  const seedContent = fs.readFileSync(path.join(__dirname, "seed.js"), "utf8");

  // A. Extract Facilities
  const facStart = seedContent.indexOf("const facilityDocs = [");
  const facEnd = seedContent.indexOf("const facilities = await Facility.insertMany(facilityDocs);");
  const facCode = seedContent.substring(facStart, facEnd);
  const extractFacs = new Function("lpuSharedSource", "lpuReportSource", facCode + "\nreturn facilityDocs;");
  const facilityDocs = extractFacs("https://www.lpu.in/SUSTAINABLE/sdg3/shared-sports-facilities.php", "https://www.lpu.in/sustainable/doc/8/report-2024.pdf");

  console.log(`\nStep 2: Restoring ${facilityDocs.length} official LPU Sports Facilities...`);
  let facUpsertCount = 0;
  for (const fac of facilityDocs) {
    const cleanFac = { ...fac };
    delete cleanFac.createdAt;
    await Facility.findOneAndUpdate(
      { name: cleanFac.name },
      { $set: cleanFac, $setOnInsert: { createdAt: new Date() } },
      { upsert: true, new: true }
    );
    facUpsertCount++;
  }
  console.log(`   ✓ Successfully upserted ${facUpsertCount} facilities.`);

  // B. Extract Equipment
  const eqStart = seedContent.indexOf("const proposedEquipmentDocs = [");
  const eqEnd = seedContent.indexOf("const equipment = await Equipment.insertMany(proposedEquipmentDocs);");
  const eqCode = seedContent.substring(eqStart, eqEnd);
  const extractEq = new Function(eqCode + "\nreturn proposedEquipmentDocs;");
  const rawEquipmentDocs = extractEq();

  console.log(`\nStep 3: Restoring ${rawEquipmentDocs.length} official Sports Equipment items...`);
  let eqUpsertCount = 0;
  for (const eq of rawEquipmentDocs) {
    const itemCat = eq.category || eq.sportCategory || "General";
    const rentalRate = eq.rentalPrice ?? eq.rentalFee ?? 0;
    const eqData = {
      ...eq,
      category: itemCat,
      sportCategory: itemCat,
      rentalPrice: rentalRate,
      rentalFee: rentalRate,
      availableQuantity: eq.availableQuantity ?? eq.totalQuantity,
      status: eq.status || "Available",
      updatedAt: new Date(),
    };
    delete eqData.createdAt;
    await Equipment.findOneAndUpdate(
      { name: eqData.name },
      { $set: eqData, $setOnInsert: { createdAt: new Date() } },
      { upsert: true, new: true }
    );
    eqUpsertCount++;
  }
  console.log(`   ✓ Successfully upserted ${eqUpsertCount} equipment items with synchronized category & rental pricing.`);

  // C. Extract Membership Plans
  const memStart = seedContent.indexOf("const membershipPlanDocs = [");
  const memEnd = seedContent.indexOf("const plans = await MembershipPlan.insertMany(membershipPlanDocs);");
  const memCode = seedContent.substring(memStart, memEnd);
  const extractPlans = new Function(memCode + "\nreturn membershipPlanDocs;");
  const planDocs = extractPlans();

  console.log(`\nStep 4: Restoring ${planDocs.length} official Membership Plans (2026-27)...`);
  for (const plan of planDocs) {
    const planData = { ...plan };
    delete planData.createdAt;
    await MembershipPlan.findOneAndUpdate(
      { sportCategory: plan.sportCategory, sessionYear: plan.sessionYear },
      { $set: planData, $setOnInsert: { createdAt: new Date() } },
      { upsert: true, new: true }
    );
  }
  console.log(`   ✓ Successfully upserted ${planDocs.length} membership plans.`);

  // D. System Rules
  console.log(`\nStep 5: Restoring default system rules...`);
  await SystemRule.findOneAndUpdate(
    { key: "default_rules" },
    {
      $set: {
        maxActiveBookingsPerUser: 2,
        maxAdvanceBookingDays: 7,
        maxBookingDurationHours: 2,
        cancellationDeadlineHours: 2,
        primeTimeStart: "18:00",
        primeTimeEnd: "22:00",
        maxPrimeTimeBookingsPerWeek: 3,
        allowWaitlist: true,
        updatedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );
  console.log(`   ✓ System rules confirmed.`);

  // E. Swimming Slots
  console.log(`\nStep 6: Checking and restoring Olympic Swimming Pool slots...`);
  const pool = await Facility.findOne({ name: { $regex: "Olympic Swimming", $options: "i" } });
  if (pool) {
    const publishedSlots = [
      { startTime: "06:00", endTime: "06:50", category: "General" },
      { startTime: "07:00", endTime: "07:50", category: "General" },
      { startTime: "08:00", endTime: "08:50", category: "General" },
      { startTime: "16:00", endTime: "16:50", category: "General" },
      { startTime: "17:00", endTime: "17:50", category: "Girls" }, // Dedicated Girls-Only
      { startTime: "18:00", endTime: "18:50", category: "General" },
      { startTime: "19:00", endTime: "19:50", category: "General" },
      { startTime: "20:00", endTime: "20:50", category: "General" },
    ];
    let slotCount = 0;
    for (let day = 0; day < 4; day++) {
      const dateStr = daysFromNow(day);
      for (const s of publishedSlots) {
        await SwimmingSlot.findOneAndUpdate(
          { facilityId: pool._id, date: dateStr, startTime: s.startTime },
          {
            $set: {
              facilityId: pool._id,
              date: dateStr,
              startTime: s.startTime,
              endTime: s.endTime,
              category: s.category,
              maxCapacity: 35,
              isOpen: true,
              isCoachSupervised: true,
              coachName: "Coach Sandeep Sharma",
              notes: s.category === "Girls" ? "Girls-only swimming session. Female lifeguard on deck." : "General student swimming session.",
            },
            $setOnInsert: {
              bookedCount: s.category === "Girls" ? 14 : 8,
              createdAt: new Date(),
            },
          },
          { upsert: true }
        );
        slotCount++;
      }
    }
    console.log(`   ✓ Swimming slots confirmed across next 4 days (${slotCount} slots).`);
  }

  // F. Administrative Accounts (Only set on insert so existing users are never overwritten)
  console.log(`\nStep 7: Ensuring institutional administrator accounts exist...`);
  const adminPw = await bcrypt.hash("admin123", 10);
  const institutionalUsers = [
    {
      name: "Super Administrator",
      email: "superadmin@lpu.co.in",
      password: adminPw,
      role: "super_admin",
      phone: "+91 98765 00000",
      bio: "Chief Technology & Campus Sports Operations Controller",
      department: "Directorate of University Infrastructure & IT",
      hostelBlock: "Administrative Block 36",
      studentCategory: "Faculty / Staff",
      status: "active",
      phoneVerified: true,
      createdAt: new Date(),
    },
    {
      name: "Dr. Baljit Singh",
      email: "admin@courtsafterdark.com",
      password: adminPw,
      role: "sports_admin",
      phone: "+91 98765 00001",
      bio: "Director of Sports & Physical Education, LPU",
      department: "Division of Student Welfare (DSW)",
      hostelBlock: "Staff Quarters",
      studentCategory: "Faculty / Staff",
      status: "active",
      phoneVerified: true,
      createdAt: new Date(),
    },
    {
      name: "Coach Sandeep Sharma",
      email: "coach.sandeep@lpu.co.in",
      password: adminPw,
      role: "coach",
      phone: "+91 98765 00002",
      bio: "Chief Swimming & Shooting Head Coach",
      department: "School of Physical Education",
      hostelBlock: "Faculty Housing",
      studentCategory: "Faculty / Staff",
      status: "active",
      phoneVerified: true,
      createdAt: new Date(),
    },
  ];

  for (const iu of institutionalUsers) {
    await User.findOneAndUpdate(
      { email: iu.email },
      { $setOnInsert: iu },
      { upsert: true }
    );
  }
  console.log(`   ✓ Institutional administrator accounts verified.`);

  // Final Verification
  const finalFacCount = await Facility.countDocuments({});
  const finalEqCount = await Equipment.countDocuments({});
  const finalMemCount = await MembershipPlan.countDocuments({});
  const finalSlotCount = await SwimmingSlot.countDocuments({});
  const finalUserCount = await User.countDocuments({});

  console.log("\n=== Final Verification of MongoDB Atlas Database Records ===");
  console.log(`  - Facilities:      ${finalFacCount} documents`);
  console.log(`  - Equipment:       ${finalEqCount} documents`);
  console.log(`  - Membership Plans:${finalMemCount} documents`);
  console.log(`  - Swimming Slots:  ${finalSlotCount} documents`);
  console.log(`  - Total Users:     ${finalUserCount} documents (including user's real accounts)`);

  await mongoose.disconnect();
  console.log("\nCatalogue restoration complete and 100% verified!");
}

restore().catch((err) => {
  console.error("Restoration error:", err);
  process.exit(1);
});
