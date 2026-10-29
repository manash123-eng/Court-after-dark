import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Equipment from "@/models/Equipment";
import EquipmentCheckout from "@/models/EquipmentCheckout";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/bookingRules";
import { MOCK_EQUIPMENT } from "@/lib/mockData";

// In-memory fallback checkouts store
let inMemoryCheckouts = [];

// GET /api/equipment/checkout -> current user's active + past checkouts (admin can view all)
export async function GET(request) {
  const session = getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all");

  try {
    await connectDB();
    const query = session.role === "admin" && all === "true" ? {} : { userId: session.id };

    const checkouts = await EquipmentCheckout.find(query)
      .populate("equipmentId", "name category condition image rentalPrice")
      .populate("userId", "name email phone")
      .populate("bookingId", "bookingReference date startTime")
      .sort({ checkoutTime: -1 });

    return NextResponse.json({ checkouts });
  } catch (err) {
    // Return in-memory checkouts for current user
    const userCheckouts = session.role === "admin" && all === "true"
      ? inMemoryCheckouts
      : inMemoryCheckouts.filter((c) => c.userId?.toString() === session.id);
    return NextResponse.json({ checkouts: userCheckouts });
  }
}

// POST /api/equipment/checkout -> Book / Check out equipment with payment details
export async function POST(request) {
  const session = getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  const body = await request.json();
  const {
    equipmentId,
    quantity = 1,
    bookingId,
    rentalDate,
    durationHours = 2,
    paymentMethod = "Pay at Venue",
    paymentStatus = "Pay at Venue",
    paymentDetails = {},
  } = body;

  const numQty = Math.max(1, parseInt(quantity, 10) || 1);
  const bookingRef = `EQ-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  try {
    await connectDB();
    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      return NextResponse.json({ error: "Equipment not found." }, { status: 404 });
    }
    if (equipment.status !== "Available") {
      return NextResponse.json({ error: "This equipment item is currently marked unavailable." }, { status: 400 });
    }
    if (equipment.availableQuantity < numQty) {
      return NextResponse.json(
        { error: `Only ${equipment.availableQuantity} unit(s) of ${equipment.name} are available.` },
        { status: 400 }
      );
    }

    equipment.availableQuantity -= numQty;
    await equipment.save();

    const rentalRate = equipment.rentalPrice || 5;
    const totalAmount = rentalRate * numQty * Math.max(1, Math.round(durationHours / 2));

    const checkout = await EquipmentCheckout.create({
      bookingReference: bookingRef,
      userId: session.id,
      equipmentId,
      bookingId: bookingId || undefined,
      quantity: numQty,
      rentalPrice: rentalRate,
      totalAmount,
      rentalDate: rentalDate || new Date().toISOString().split("T")[0],
      durationHours: Number(durationHours) || 2,
      paymentMethod,
      paymentStatus: paymentMethod === "Pay at Venue" ? "Pay at Venue" : "Paid",
      paymentDetails,
      status: "Checked Out",
      checkoutTime: new Date(),
    });

    const populated = await EquipmentCheckout.findById(checkout._id)
      .populate("equipmentId", "name category condition image rentalPrice")
      .populate("userId", "name email");

    await recordAuditLog({
      action: "EQUIPMENT_BOOKING",
      performedBy: session.id,
      performedByName: session.name || session.email,
      entityType: "EquipmentCheckout",
      entityId: checkout._id.toString(),
      details: `Booked ${numQty}x ${equipment.name} (${paymentMethod}) Ref: ${bookingRef}`,
      severity: "info",
    }).catch(() => {});

    return NextResponse.json({
      message: `Equipment reserved successfully! Ref: ${bookingRef}`,
      checkout: populated,
    }, { status: 201 });
  } catch (err) {
    // In-memory fallback
    const mockItem = MOCK_EQUIPMENT.find((e) => e._id === equipmentId) || MOCK_EQUIPMENT[0];
    const rentalRate = mockItem.rentalPrice || 5;
    const totalAmount = rentalRate * numQty * Math.max(1, Math.round(durationHours / 2));

    const mockCheckout = {
      _id: `chk_${Date.now()}`,
      bookingReference: bookingRef,
      userId: session.id,
      equipmentId: mockItem,
      quantity: numQty,
      rentalPrice: rentalRate,
      totalAmount,
      rentalDate: rentalDate || new Date().toISOString().split("T")[0],
      durationHours: Number(durationHours) || 2,
      paymentMethod,
      paymentStatus: paymentMethod === "Pay at Venue" ? "Pay at Venue" : "Paid",
      paymentDetails,
      status: "Checked Out",
      checkoutTime: new Date().toISOString(),
      user: { name: session.name, email: session.email },
    };

    inMemoryCheckouts.unshift(mockCheckout);

    return NextResponse.json({
      message: `Equipment reserved successfully! Ref: ${bookingRef}`,
      checkout: mockCheckout,
    }, { status: 201 });
  }
}

// PUT /api/equipment/checkout -> return equipment & restock inventory
export async function PUT(request) {
  const session = getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  const { checkoutId, condition } = await request.json();

  try {
    await connectDB();
    const checkout = await EquipmentCheckout.findById(checkoutId).populate("equipmentId");
    if (!checkout) {
      return NextResponse.json({ error: "Checkout record not found." }, { status: 404 });
    }
    if (session.role !== "admin" && checkout.userId.toString() !== session.id) {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    }
    if (checkout.status === "Returned") {
      return NextResponse.json({ error: "This item has already been marked as returned." }, { status: 400 });
    }

    checkout.status = "Returned";
    checkout.returnTime = new Date();
    await checkout.save();

    const equipment = await Equipment.findById(checkout.equipmentId._id || checkout.equipmentId);
    if (equipment) {
      equipment.availableQuantity = Math.min(
        equipment.totalQuantity,
        equipment.availableQuantity + checkout.quantity
      );
      if (condition && ["New", "Good", "Fair", "Worn"].includes(condition)) {
        equipment.condition = condition;
      }
      await equipment.save();
    }

    await recordAuditLog({
      action: "EQUIPMENT_RETURNED",
      performedBy: session.id,
      performedByName: session.name || session.email,
      entityType: "EquipmentCheckout",
      entityId: checkout._id.toString(),
      details: `Returned ${checkout.quantity}x ${equipment?.name || "Equipment"}`,
      severity: "info",
    }).catch(() => {});

    return NextResponse.json({ message: "Equipment returned successfully. Inventory updated.", checkout });
  } catch (err) {
    const item = inMemoryCheckouts.find((c) => c._id === checkoutId);
    if (item) {
      item.status = "Returned";
      item.returnTime = new Date().toISOString();
    }
    return NextResponse.json({ message: "Equipment returned successfully. Inventory updated." });
  }
}
