// scripts/test-api-catalogue.cjs
// Tests the facility and equipment APIs against MongoDB Atlas.

const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });
const mongoose = require("mongoose");
const assert = require("node:assert/strict");

async function runTests() {
  console.log("🧪 Testing Database & Catalogue APIs against MongoDB Atlas...\n");

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  const db = mongoose.connection.db;

  // 1. Verify Facility documents
  console.log("1. Testing Facilities querying...");
  const facilitiesCol = db.collection("facilities");
  const totalFacilities = await facilitiesCol.countDocuments({});
  console.log(`   - Total facilities in MongoDB Atlas: ${totalFacilities}`);
  assert(totalFacilities >= 30, `Expected at least 30 facilities, got ${totalFacilities}`);

  const badminton = await facilitiesCol.find({ type: "Badminton Court" }).toArray();
  console.log(`   - Badminton courts found: ${badminton.length}`);
  assert(badminton.length >= 1, "Must find at least 1 badminton facility");
  assert(badminton[0].name.length > 0, "Facility must have a valid name");

  const indoorFacilities = await facilitiesCol.find({ indoorOutdoor: "Indoor" }).toArray();
  console.log(`   - Indoor facilities found: ${indoorFacilities.length}`);
  assert(indoorFacilities.length >= 15, "Expected at least 15 indoor facilities");

  const searchBasketball = await facilitiesCol.find({
    $or: [
      { name: { $regex: "basketball", $options: "i" } },
      { type: { $regex: "basketball", $options: "i" } },
    ]
  }).toArray();
  console.log(`   - Basketball search results: ${searchBasketball.length}`);
  assert(searchBasketball.length >= 2, "Expected at least 2 basketball facilities (indoor + outdoor complex)");
  console.log("   ✓ Facilities database query tests passed.");

  // 2. Verify Equipment documents
  console.log("\n2. Testing Equipment querying...");
  const equipmentCol = db.collection("equipment");
  const totalEquipment = await equipmentCol.countDocuments({});
  console.log(`   - Total equipment in MongoDB Atlas: ${totalEquipment}`);
  assert(totalEquipment >= 25, `Expected at least 25 equipment items, got ${totalEquipment}`);

  // Test category & sportCategory dual query
  const badmintonGear = await equipmentCol.find({
    $or: [{ category: "Badminton" }, { sportCategory: "Badminton" }]
  }).toArray();
  console.log(`   - Badminton gear found: ${badmintonGear.length}`);
  assert(badmintonGear.length >= 3, "Expected at least 3 badminton gear items");
  for (const item of badmintonGear) {
    assert(item.category || item.sportCategory, "Category must be defined");
    assert(item.name, "Name must be defined");
    assert(item.availableQuantity != null, "availableQuantity must be defined");
    assert(item.rentalPrice != null || item.rentalFee != null, "rentalPrice/rentalFee must be defined");
  }

  // Test keyword search
  const cricketSearch = await equipmentCol.find({
    $or: [
      { name: { $regex: "cricket", $options: "i" } },
      { category: { $regex: "cricket", $options: "i" } },
      { sportCategory: { $regex: "cricket", $options: "i" } },
      { description: { $regex: "cricket", $options: "i" } },
    ]
  }).toArray();
  console.log(`   - Cricket gear search results: ${cricketSearch.length}`);
  assert(cricketSearch.length >= 5, "Expected at least 5 cricket items (bats, balls, pads, helmet, stumps)");
  console.log("   ✓ Equipment database query tests passed.");

  // 3. Verify Swimming Slots
  console.log("\n3. Testing Swimming Slots...");
  const swimmingSlotsCol = db.collection("swimmingslots");
  const totalSlots = await swimmingSlotsCol.countDocuments({});
  console.log(`   - Total swimming slots in MongoDB Atlas: ${totalSlots}`);
  assert(totalSlots >= 8, `Expected swimming slots, got ${totalSlots}`);

  const girlsOnlySlot = await swimmingSlotsCol.findOne({ category: "Girls" });
  assert(girlsOnlySlot !== null, "Girls-Only 17:00 slot must exist");
  console.log(`   - Found dedicated Girls-Only swimming slot: ${girlsOnlySlot.startTime}-${girlsOnlySlot.endTime}`);
  console.log("   ✓ Swimming slots tests passed.");

  // 4. Verify User accounts
  console.log("\n4. Testing User Accounts...");
  const usersCol = db.collection("users");
  const preservedUser = await usersCol.findOne({ email: "manash213@gmail.com" });
  assert(preservedUser !== null, "User account manash213@gmail.com must be preserved!");
  console.log(`   - Verified user account preserved: ${preservedUser.name} (${preservedUser.email})`);

  const secondUser = await usersCol.findOne({ email: "krish@gmail.com" });
  assert(secondUser !== null, "User account krish@gmail.com must be preserved!");
  console.log(`   - Verified user account preserved: ${secondUser.name} (${secondUser.email})`);

  const adminUser = await usersCol.findOne({ email: "superadmin@lpu.co.in" });
  assert(adminUser !== null, "Institutional admin account must exist!");
  console.log(`   - Verified admin account: ${adminUser.name} (${adminUser.email})`);
  console.log("   ✓ User account preservation tests passed.");

  await mongoose.disconnect();
  console.log("\n🎉 All database and catalogue tests PASSED 100% cleanly!");
}

runTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
