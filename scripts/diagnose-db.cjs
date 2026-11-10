// scripts/diagnose-db.cjs
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });
const mongoose = require("mongoose");

async function check() {
  const uri = process.env.MONGODB_URI;
  try {
    await mongoose.connect(uri);
    const users = await mongoose.connection.db.collection("users").find({}).toArray();
    console.log("Users in courtsafterdark.users:", users.map(u => ({ id: u._id, email: u.email, name: u.name, createdAt: u.createdAt })));

    // Also check if any collection in the cluster has facility or equipment data
    const admin = mongoose.connection.db.admin();
    const dbs = await admin.listDatabases();
    for (const d of dbs.databases) {
      const db = mongoose.connection.client.db(d.name);
      const cols = await db.listCollections().toArray();
      for (const col of cols) {
        if (col.name.includes("facil") || col.name.includes("equip")) {
          const count = await db.collection(col.name).countDocuments();
          console.log(`Found relevant collection: ${d.name}.${col.name} -> ${count} documents`);
        }
      }
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}
check();
