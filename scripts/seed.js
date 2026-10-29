// scripts/seed.js
// Populates the database with realistic sample data for Courts After Dark.
// Run with: npm run seed

require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is not set. Add it to .env.local first.");
  process.exit(1);
}

const UserSchema = new mongoose.Schema({
  name: String, email: String, password: String, role: String, phone: String, bio: String,
  preferredSports: [String], favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Facility" }],
  status: String, createdAt: Date,
});

const FacilitySchema = new mongoose.Schema({
  name: String, type: String, location: String, city: String, description: String,
  capacity: Number, openingTime: String, closingTime: String, pricePerHour: Number,
  indoorOutdoor: String, surfaceType: String, amenities: [String], rules: [String],
  equipmentAvailable: [String], image: String, status: String, cancellationHours: Number,
  featured: Boolean, bookingCount: Number, createdAt: Date,
});

const BookingSchema = new mongoose.Schema({
  bookingReference: String, userId: mongoose.Schema.Types.ObjectId, facilityId: mongoose.Schema.Types.ObjectId,
  date: String, startTime: String, endTime: String, durationHours: Number, pricePerHour: Number,
  totalPrice: Number, paymentStatus: String, status: String, notes: String,
  cancellationReason: String, cancelledAt: Date, createdAt: Date,
});

const EquipmentSchema = new mongoose.Schema({
  name: String, category: String, totalQuantity: Number, availableQuantity: Number,
  condition: String, status: String, createdAt: Date,
});

const EquipmentCheckoutSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId, equipmentId: mongoose.Schema.Types.ObjectId,
  bookingId: mongoose.Schema.Types.ObjectId, quantity: Number, checkoutTime: Date,
  returnTime: Date, status: String,
});

const MaintenanceSchema = new mongoose.Schema({
  facilityId: mongoose.Schema.Types.ObjectId, date: String, startTime: String, endTime: String,
  reason: String, status: String, createdAt: Date,
});

const SystemRuleSchema = new mongoose.Schema({
  key: String, maxActiveBookingsPerUser: Number, maxAdvanceBookingDays: Number,
  maxBookingDurationHours: Number, cancellationDeadlineHours: Number,
  primeTimeStart: String, primeTimeEnd: String, maxPrimeTimeBookingsPerWeek: Number,
  allowWaitlist: Boolean, updatedAt: Date,
});

const WaitlistSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId, facilityId: mongoose.Schema.Types.ObjectId,
  date: String, startTime: String, endTime: String, status: String, notifiedAt: Date, createdAt: Date,
});

const AuditLogSchema = new mongoose.Schema({
  action: String, performedBy: mongoose.Schema.Types.ObjectId, performedByName: String,
  entityType: String, entityId: String, details: String, severity: String, createdAt: Date,
});

const User = mongoose.model("User", UserSchema);
const Facility = mongoose.model("Facility", FacilitySchema);
const Booking = mongoose.model("Booking", BookingSchema);
const Equipment = mongoose.model("Equipment", EquipmentSchema);
const EquipmentCheckout = mongoose.model("EquipmentCheckout", EquipmentCheckoutSchema);
const Maintenance = mongoose.model("Maintenance", MaintenanceSchema);
const SystemRule = mongoose.model("SystemRule", SystemRuleSchema);
const Waitlist = mongoose.model("Waitlist", WaitlistSchema);
const AuditLog = mongoose.model("AuditLog", AuditLogSchema);

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB. Clearing old data...");

  await Promise.all([
    User.deleteMany({}),
    Facility.deleteMany({}),
    Booking.deleteMany({}),
    Equipment.deleteMany({}),
    EquipmentCheckout.deleteMany({}),
    Maintenance.deleteMany({}),
    SystemRule.deleteMany({}),
    Waitlist.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  // 1. ---- System Rules ----
  await SystemRule.create({
    key: "default_rules",
    maxActiveBookingsPerUser: 2,
    maxAdvanceBookingDays: 14,
    maxBookingDurationHours: 2,
    cancellationDeadlineHours: 4,
    primeTimeStart: "18:00",
    primeTimeEnd: "21:00",
    maxPrimeTimeBookingsPerWeek: 3,
    allowWaitlist: true,
    updatedAt: new Date(),
  });
  console.log("Initialized configurable system rules.");

  // 2. ---- Users ----
  const adminPassword = await bcrypt.hash("admin123", 10);
  const playerPassword = await bcrypt.hash("player123", 10);

  const userDocs = [
    { name: "Admin User", email: "admin@courtsafterdark.com", password: adminPassword, role: "admin", phone: "+1 555-0100", bio: "Platform Director & Athletics Coordinator", preferredSports: ["Badminton Court", "Tennis Court"] },
    { name: "Aarav Sharma", email: "aarav@example.com", password: playerPassword, role: "player", phone: "+1 555-0101", bio: "Weekend badminton enthusiast and runner", preferredSports: ["Badminton Court", "Football Ground"] },
    { name: "Priya Nair", email: "priya@example.com", password: playerPassword, role: "player", phone: "+1 555-0102", bio: "Competitive tennis player", preferredSports: ["Tennis Court", "Gym"] },
    { name: "Rohan Verma", email: "rohan@example.com", password: playerPassword, role: "player", phone: "+1 555-0103", bio: "Cricket league captain", preferredSports: ["Cricket Ground"] },
    { name: "Sneha Kapoor", email: "sneha@example.com", password: playerPassword, role: "player", phone: "+1 555-0104", bio: "Basketball point guard", preferredSports: ["Basketball Court"] },
    { name: "Karan Mehta", email: "karan@example.com", password: playerPassword, role: "player", phone: "+1 555-0105", bio: "Fitness enthusiast", preferredSports: ["Gym", "Table Tennis"] },
    { name: "Ananya Iyer", email: "ananya@example.com", password: playerPassword, role: "player", phone: "+1 555-0106", bio: "Volleyball spiker", preferredSports: ["Volleyball Court"] },
    { name: "Vikram Singh", email: "vikram@example.com", password: playerPassword, role: "player", phone: "+1 555-0107", bio: "Football striker", preferredSports: ["Football Ground"] },
    { name: "Neha Joshi", email: "neha@example.com", password: playerPassword, role: "player", phone: "+1 555-0108", bio: "Casual table tennis player", preferredSports: ["Table Tennis"] },
    { name: "Arjun Reddy", email: "arjun@example.com", password: playerPassword, role: "player", phone: "+1 555-0109", bio: "Gym regular", preferredSports: ["Gym"] },
  ].map((u) => ({ ...u, status: "active", favorites: [], createdAt: new Date() }));

  const users = await User.insertMany(userDocs);
  console.log(`Created ${users.length} users.`);

  // 3. ---- Facilities ----
  const facilityDocs = [
    {
      name: "Apex Arena Badminton 1",
      type: "Badminton Court",
      location: "Sports Complex - North Wing",
      city: "Downtown",
      description: "BWF-standard wooden sprung court with Yonex synthetic matting and glare-free LED lighting.",
      capacity: 4,
      openingTime: "06:00",
      closingTime: "23:00",
      pricePerHour: 35,
      indoorOutdoor: "Indoor",
      surfaceType: "Synthetic Yonex Mat",
      amenities: ["Air Conditioned", "Locker Rooms", "Shower", "Water Station", "Pro Shop", "Parking"],
      rules: ["Non-marking gum rubber shoes compulsory", "No food inside the playing area", "Bring personal rackets or rent from desk"],
      equipmentAvailable: ["Badminton Racket", "Shuttlecock"],
      image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=900&q=80&auto=format&fit=crop",
      featured: true,
    },
    {
      name: "Apex Arena Badminton 2",
      type: "Badminton Court",
      location: "Sports Complex - North Wing",
      city: "Downtown",
      description: "Tournament court with high ceiling clearance, umpire chair, and electronic scoreboard.",
      capacity: 4,
      openingTime: "06:00",
      closingTime: "23:00",
      pricePerHour: 35,
      indoorOutdoor: "Indoor",
      surfaceType: "Synthetic Yonex Mat",
      amenities: ["Air Conditioned", "Locker Rooms", "Shower", "Water Station", "Parking"],
      rules: ["Non-marking shoes required", "Maximum 4 players per court"],
      equipmentAvailable: ["Badminton Racket", "Shuttlecock"],
      image: "https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?w=900&q=80&auto=format&fit=crop",
      featured: false,
    },
    {
      name: "Skyline Rooftop Hoops",
      type: "Basketball Court",
      location: "Skyline Center - 5th Floor",
      city: "Midtown",
      description: "Spectacular open-air rooftop basketball court with panoramic city night views and NBA-grade glass backboards.",
      capacity: 10,
      openingTime: "06:00",
      closingTime: "22:00",
      pricePerHour: 55,
      indoorOutdoor: "Outdoor",
      surfaceType: "Cushioned Acrylic",
      amenities: ["Floodlights", "Spectator Seating", "Water Station", "Locker Rooms", "Parking"],
      rules: ["Basketball sneakers only", "No dunking on adjustable rims during casual sessions"],
      equipmentAvailable: ["Basketball"],
      image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=900&q=80&auto=format&fit=crop",
      featured: true,
    },
    {
      name: "Metro Dome Indoor Basketball",
      type: "Basketball Court",
      location: "Metro Dome - Level 1",
      city: "Downtown",
      description: "Climate-controlled maple hardwood court with 3-point lines for high school, college, and FIBA standards.",
      capacity: 10,
      openingTime: "06:00",
      closingTime: "23:00",
      pricePerHour: 60,
      indoorOutdoor: "Indoor",
      surfaceType: "Hard Maple Wood",
      amenities: ["Air Conditioned", "Locker Rooms", "Shower", "First Aid", "Digital Scoreboard"],
      rules: ["Non-marking basketball shoes only", "Balls must be kept within court boundary"],
      equipmentAvailable: ["Basketball"],
      image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=900&q=80&auto=format&fit=crop",
      featured: false,
    },
    {
      name: "Thunder Turf 7v7 Arena",
      type: "Football Ground",
      location: "Eastside Athletic Park",
      city: "Eastside",
      description: "FIFA-certified 4G artificial turf with shock-absorption pad, perimeter nets, and high-intensity night floodlights.",
      capacity: 14,
      openingTime: "06:00",
      closingTime: "23:00",
      pricePerHour: 80,
      indoorOutdoor: "Outdoor",
      surfaceType: "FIFA 4G Turf",
      amenities: ["Floodlights", "Dressing Rooms", "Showers", "Parking", "Cafeteria", "First Aid"],
      rules: ["Turf shoes or moulded studs only (no metal studs)", "Shin guards strongly recommended"],
      equipmentAvailable: ["Football", "Football Cones"],
      image: "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=900&q=80&auto=format&fit=crop",
      featured: true,
    },
    {
      name: "Imperial Cricket Oval",
      type: "Cricket Ground",
      location: "Main Campus Athletic Fields",
      city: "West End",
      description: "Full-size floodlit cricket oval with two natural clay turf wickets, two artificial practice nets, and sight screens.",
      capacity: 22,
      openingTime: "06:00",
      closingTime: "21:00",
      pricePerHour: 110,
      indoorOutdoor: "Outdoor",
      surfaceType: "Natural Turf & Practice Nets",
      amenities: ["Floodlights", "Pavilion", "Dressing Rooms", "Cricket Nets", "Parking", "Scorebox"],
      rules: ["Cricket whites or team kit preferred", "Helmets mandatory when facing hard leather balls in practice nets"],
      equipmentAvailable: ["Cricket Bat", "Cricket Ball", "Cricket Stumps Set"],
      image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=900&q=80&auto=format&fit=crop",
      featured: true,
    },
    {
      name: "Grand Slam Tennis Center 1",
      type: "Tennis Court",
      location: "Sports Complex - Tennis Pavilion",
      city: "Downtown",
      description: "US Open blue hard court surface with Plexipave cushioning and shadowless LED lighting for precision nighttime rallies.",
      capacity: 4,
      openingTime: "06:00",
      closingTime: "22:00",
      pricePerHour: 45,
      indoorOutdoor: "Outdoor",
      surfaceType: "Cushioned Acrylic Hardcourt",
      amenities: ["Floodlights", "Locker Rooms", "Shower", "Ball Machine Rental", "Viewing Terrace"],
      rules: ["Proper tennis attire and tennis footwear required", "Maximum 4 players on court during play"],
      equipmentAvailable: ["Tennis Racket"],
      image: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=900&q=80&auto=format&fit=crop",
      featured: false,
    },
    {
      name: "Olympic Sand Volleyball",
      type: "Volleyball Court",
      location: "Sports Complex - South Grounds",
      city: "South Bay",
      description: "Deep silica beach sand court with padded net posts, adjustable height, and night-time halogen floodlights.",
      capacity: 12,
      openingTime: "07:00",
      closingTime: "21:00",
      pricePerHour: 30,
      indoorOutdoor: "Outdoor",
      surfaceType: "White Silica Sand",
      amenities: ["Floodlights", "Outdoor Shower", "Washrooms", "Water Cooler"],
      rules: ["Barefoot or sand socks only", "Rinse sand at wash station before entering facilities"],
      equipmentAvailable: ["Volleyball"],
      image: "https://images.unsplash.com/photo-1592656094267-764a45160876?w=900&q=80&auto=format&fit=crop",
      featured: false,
    },
    {
      name: "Titan Performance Gym & Studio",
      type: "Gym",
      location: "Sports Complex - Block C",
      city: "Downtown",
      description: "State-of-the-art strength and conditioning hub with Eleiko olympic platforms, Rogue racks, dumbbells up to 50kg, and cardio zone.",
      capacity: 30,
      openingTime: "05:00",
      closingTime: "23:00",
      pricePerHour: 20,
      indoorOutdoor: "Indoor",
      surfaceType: "High-density Rubber Flooring",
      amenities: ["Air Conditioned", "Showers", "Lockers", "Sauna", "Water Dispenser", "Towel Service"],
      rules: ["Towel mandatory at all stations", "Re-rack weights after use", "Clean athletic shoes only"],
      equipmentAvailable: ["Yoga Mat", "Skipping Rope", "Dumbbell Set"],
      image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&q=80&auto=format&fit=crop",
      featured: true,
    },
    {
      name: "Spin Master Table Tennis Suite",
      type: "Table Tennis",
      location: "Student Activity Center - 2nd Floor",
      city: "Midtown",
      description: "ITTF-approved competition table tennis hall with Taraflex flooring, barrier surrounds, and anti-glare overhead lighting.",
      capacity: 4,
      openingTime: "08:00",
      closingTime: "22:00",
      pricePerHour: 25,
      indoorOutdoor: "Indoor",
      surfaceType: "Taraflex Sports Floor",
      amenities: ["Air Conditioned", "Water Station", "Locker Storage", "Rest Area"],
      rules: ["Non-marking clean soles only", "No leaning or sitting on tournament tables"],
      equipmentAvailable: ["Table Tennis Bat", "Table Tennis Ball"],
      image: "https://images.unsplash.com/photo-1611251135345-18c56206d6d1?w=900&q=80&auto=format&fit=crop",
      featured: false,
    },
  ].map((f) => ({
    ...f,
    status: "Available",
    cancellationHours: 4,
    bookingCount: 0,
    createdAt: new Date(),
  }));

  const facilities = await Facility.insertMany(facilityDocs);
  console.log(`Created ${facilities.length} facilities.`);

  // Mark one facility in maintenance
  facilities[2].status = "Maintenance";
  await Facility.findByIdAndUpdate(facilities[2]._id, { status: "Maintenance" });

  // Add favorites for user 1 & 2
  await User.findByIdAndUpdate(users[1]._id, {
    favorites: [facilities[0]._id, facilities[4]._id],
  });
  await User.findByIdAndUpdate(users[2]._id, {
    favorites: [facilities[6]._id, facilities[8]._id],
  });

  // 4. ---- Equipment ----
  const equipmentDocs = [
    {
      name: "Pro Match Football",
      category: "Football",
      totalQuantity: 12,
      rentalPrice: 6,
      condition: "Good",
      description: "FIFA-approved thermo-bonded match soccer ball with textured casing for optimal flight and grip under floodlights.",
      image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80&auto=format&fit=crop",
    },
    {
      name: "Wilson Evolution Basketball",
      category: "Basketball",
      totalQuantity: 14,
      rentalPrice: 7,
      condition: "Good",
      description: "Official indoor/outdoor composite leather basketball with deep channels and exceptional grip control.",
      image: "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800&q=80&auto=format&fit=crop",
    },
    {
      name: "SS Pro English Willow Bat",
      category: "Cricket",
      totalQuantity: 8,
      rentalPrice: 15,
      condition: "Good",
      description: "Grade 1 English willow cricket bat with huge edges, light pickup, and factory pre-knocked surface.",
      image: "https://images.unsplash.com/photo-1593766788306-2856e051417c?w=800&q=80&auto=format&fit=crop",
    },
    {
      name: "Kookaburra Turf Leather Ball",
      category: "Cricket",
      totalQuantity: 24,
      rentalPrice: 5,
      condition: "New",
      description: "High-grade 4-piece alum tanned leather ball designed for tournament play with white seam.",
      image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80&auto=format&fit=crop",
    },
    {
      name: "Babolat Pure Drive Tennis Racket",
      category: "Tennis",
      totalQuantity: 16,
      rentalPrice: 10,
      condition: "Good",
      description: "The gold-standard graphite racket offering explosive power, pinpoint stability, and spin control.",
      image: "https://images.unsplash.com/photo-1617083934555-ac7d4efe0f46?w=800&q=80&auto=format&fit=crop",
    },
    {
      name: "Yonex Nanoflare 800 Badminton Racket",
      category: "Badminton",
      totalQuantity: 22,
      rentalPrice: 8,
      condition: "Good",
      description: "Ultra-lightweight head-light badminton racket with Sonic Flare System for rapid-fire rallies and steep smashes.",
      image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80&auto=format&fit=crop",
    },
    {
      name: "Yonex Aerosensa Shuttlecock (Tube)",
      category: "Badminton",
      totalQuantity: 40,
      rentalPrice: 6,
      condition: "New",
      description: "Tube of 6 precision-tested natural goose feather tournament shuttlecocks for consistent trajectory.",
      image: "https://images.unsplash.com/photo-1613918108466-292b78a8ef95?w=800&q=80&auto=format&fit=crop",
    },
    {
      name: "Manduka High-Grip Yoga Mat",
      category: "Gym",
      totalQuantity: 25,
      rentalPrice: 4,
      condition: "Good",
      description: "Extra-thick high-density cushioning non-slip mat for yoga, core conditioning, and mobility warmups.",
      image: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&q=80&auto=format&fit=crop",
    },
    {
      name: "Mikasa V200W Competition Volleyball",
      category: "Volleyball",
      totalQuantity: 10,
      rentalPrice: 6,
      condition: "Fair",
      description: "FIVB official 18-panel aerodynamic dimpled match volleyball with microfiber cover.",
      image: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&q=80&auto=format&fit=crop",
    },
    {
      name: "Butterfly Timo Boll Carbon Bat",
      category: "Table Tennis",
      totalQuantity: 12,
      rentalPrice: 6,
      condition: "Good",
      description: "Carbon composite paddle with high-tension rubber for offensive top-spin attacks and swift blocks.",
      image: "https://images.unsplash.com/photo-1611251135345-18c56206d6d1?w=800&q=80&auto=format&fit=crop",
    },
    {
      name: "Nittaku 3-Star Table Tennis Balls",
      category: "Table Tennis",
      totalQuantity: 50,
      rentalPrice: 3,
      condition: "New",
      description: "Pack of 3 premium ITTF competition 40+ non-celluloid balls with true bounce symmetry.",
      image: "https://images.unsplash.com/photo-1534158914592-062992fbe900?w=800&q=80&auto=format&fit=crop",
    },
    {
      name: "Crossrope Speed Jump Rope",
      category: "Gym",
      totalQuantity: 18,
      rentalPrice: 3,
      condition: "Good",
      description: "Smooth-bearing weighted jump rope with ergonomic grip handles for agility conditioning.",
      image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&q=80&auto=format&fit=crop",
    },
    {
      name: "Hex Dumbbell Pairs (5-20kg)",
      category: "Gym",
      totalQuantity: 8,
      rentalPrice: 8,
      condition: "Good",
      description: "Rubber encased hexagonal dumbbells with knurled ergonomic chrome handles.",
      image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80&auto=format&fit=crop",
    },
    {
      name: "Heavy Duty Cricket Stumps Set",
      category: "Cricket",
      totalQuantity: 6,
      rentalPrice: 10,
      condition: "Good",
      description: "Solid hardwood cricket stumps with cast-iron spring-back base and bails.",
      image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80&auto=format&fit=crop",
    },
    {
      name: "Agility Training Cones Set",
      category: "Football",
      totalQuantity: 25,
      rentalPrice: 4,
      condition: "Good",
      description: "Set of 20 high-visibility flexible marker cones with carry handle for speed and tactical drills.",
      image: "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=800&q=80&auto=format&fit=crop",
    },
  ].map((e) => ({
    ...e,
    availableQuantity: e.totalQuantity,
    status: "Available",
    createdAt: new Date(),
  }));

  const equipment = await Equipment.insertMany(equipmentDocs);
  console.log(`Created ${equipment.length} equipment items.`);

  // 5. ---- Bookings ----
  const bookingSlots = [
    { start: "07:00", end: "08:00" },
    { start: "17:00", end: "18:00" },
    { start: "18:00", end: "19:00" },
    { start: "19:00", end: "20:00" },
    { start: "20:00", end: "21:00" },
  ];
  const players = users.filter((u) => u.role === "player");
  const bookingDocs = [];
  let dayOffset = 0;
  let slotIdx = 0;
  let facilityIdx = 0;

  for (let i = 0; i < 20; i++) {
    const facility = facilities[facilityIdx % facilities.length];
    if (facility.status === "Maintenance") {
      facilityIdx++;
      continue;
    }
    const player = players[i % players.length];
    const slot = bookingSlots[slotIdx % bookingSlots.length];
    const date = daysFromNow(dayOffset % 5);
    const status = i % 7 === 0 ? "Cancelled" : i % 5 === 0 ? "Completed" : "Confirmed";

    bookingDocs.push({
      bookingReference: `CAD-${(100000 + i).toString()}`,
      userId: player._id,
      facilityId: facility._id,
      date,
      startTime: slot.start,
      endTime: slot.end,
      durationHours: 1,
      pricePerHour: facility.pricePerHour,
      totalPrice: facility.pricePerHour,
      paymentStatus: status === "Cancelled" ? "Refunded" : "Pay at Venue",
      status,
      notes: "Regular evening practice session",
      cancellationReason: status === "Cancelled" ? "Player schedule conflict" : "",
      cancelledAt: status === "Cancelled" ? new Date() : null,
      createdAt: new Date(Date.now() - (20 - i) * 3600000),
    });

    facilityIdx++;
    slotIdx++;
    if (i % 3 === 0) dayOffset++;
  }

  const bookings = await Booking.insertMany(bookingDocs);
  console.log(`Created ${bookings.length} bookings.`);

  // Update facility booking counts
  for (const b of bookings) {
    if (b.status === "Confirmed" || b.status === "Completed") {
      await Facility.findByIdAndUpdate(b.facilityId, { $inc: { bookingCount: 1 } });
    }
  }

  // 6. ---- Maintenance Blocks ----
  const maintenanceDocs = [
    { facilityId: facilities[2]._id, date: daysFromNow(0), startTime: "06:00", endTime: "12:00", reason: "Floor resurfacing & hoop realignment" },
    { facilityId: facilities[0]._id, date: daysFromNow(1), startTime: "12:00", endTime: "14:00", reason: "Overhead LED fixture inspection" },
    { facilityId: facilities[5]._id, date: daysFromNow(2), startTime: "08:00", endTime: "10:00", reason: "Pitch rolling and grass trimming" },
    { facilityId: facilities[8]._id, date: daysFromNow(3), startTime: "14:00", endTime: "16:00", reason: "HVAC filter deep clean & calibration" },
    { facilityId: facilities[6]._id, date: daysFromNow(1), startTime: "09:00", endTime: "10:00", reason: "Court line repaint" },
  ].map((m) => ({ ...m, status: "Scheduled", createdAt: new Date() }));

  const maintenance = await Maintenance.insertMany(maintenanceDocs);
  console.log(`Created ${maintenance.length} maintenance blocks.`);

  // 7. ---- Equipment Checkouts ----
  const checkouts = await EquipmentCheckout.insertMany([
    {
      userId: players[0]._id,
      equipmentId: equipment[5]._id, // Badminton racket
      bookingId: bookings[0]._id,
      quantity: 1,
      checkoutTime: new Date(Date.now() - 3600000),
      status: "Checked Out",
    },
    {
      userId: players[1]._id,
      equipmentId: equipment[4]._id, // Tennis racket
      quantity: 1,
      checkoutTime: new Date(Date.now() - 7200000),
      returnTime: new Date(Date.now() - 1800000),
      status: "Returned",
    },
  ]);
  // Decrement checked out item count
  await Equipment.findByIdAndUpdate(equipment[5]._id, { $inc: { availableQuantity: -1 } });
  console.log(`Created ${checkouts.length} sample equipment checkouts.`);

  // 8. ---- Waitlist Entry ----
  await Waitlist.create({
    userId: players[3]._id,
    facilityId: facilities[0]._id,
    date: daysFromNow(1),
    startTime: "18:00",
    endTime: "19:00",
    status: "Waiting",
    createdAt: new Date(),
  });
  console.log("Created 1 sample waitlist record.");

  // 9. ---- Audit Logs ----
  await AuditLog.insertMany([
    {
      action: "FACILITY_CREATED",
      performedBy: users[0]._id,
      performedByName: users[0].name,
      entityType: "Facility",
      entityId: facilities[0]._id.toString(),
      details: "Created Apex Arena Badminton 1 with price $35/hr",
      severity: "info",
      createdAt: new Date(Date.now() - 86400000 * 2),
    },
    {
      action: "MAINTENANCE_SCHEDULED",
      performedBy: users[0]._id,
      performedByName: users[0].name,
      entityType: "Maintenance",
      entityId: maintenance[0]._id.toString(),
      details: "Scheduled floor resurfacing for Skyline Rooftop Hoops",
      severity: "warning",
      createdAt: new Date(Date.now() - 86400000),
    },
    {
      action: "RULES_INITIALIZED",
      performedBy: users[0]._id,
      performedByName: users[0].name,
      entityType: "SystemRule",
      entityId: "default_rules",
      details: "System fair allocation rules initialized: max 2 active bookings, 14 days advance",
      severity: "info",
      createdAt: new Date(Date.now() - 86400000),
    },
  ]);
  console.log("Created initial audit logs.");

  console.log("\n==================================================");
  console.log("Courts After Dark database seeded successfully!");
  console.log("Demo Accounts:");
  console.log("  Admin:  admin@courtsafterdark.com / admin123");
  console.log("  Player: aarav@example.com / player123");
  console.log("  Player: priya@example.com / player123");
  console.log("==================================================\n");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
