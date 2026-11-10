import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Equipment from "@/models/Equipment";
import { getSessionUser } from "@/lib/auth";
import { MOCK_EQUIPMENT } from "@/lib/mockData";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";

  try {
    await connectDB();

    const totalInDb = await Equipment.countDocuments({});
    if (totalInDb === 0) {
      console.warn("[Equipment API] Equipment collection has 0 documents in database. Serving mock catalogue fallback.");
      throw new Error("Empty equipment collection");
    }

    const query = {};
    if (category && category !== "All") {
      query.$or = [{ category }, { sportCategory: category }];
    }
    if (search) {
      const searchRegex = { $regex: search, $options: "i" };
      query.$or = [
        { name: searchRegex },
        { category: searchRegex },
        { sportCategory: searchRegex },
        { description: searchRegex },
      ];
    }
    const rawEquipment = await Equipment.find(query).sort({ category: 1, sportCategory: 1, name: 1 });
    const equipment = rawEquipment.map((item) => {
      const obj = item.toObject ? item.toObject() : { ...item };
      obj.category = obj.category || obj.sportCategory || "General";
      obj.sportCategory = obj.sportCategory || obj.category || "General";
      obj.rentalPrice = obj.rentalPrice ?? obj.rentalFee ?? 0;
      obj.rentalFee = obj.rentalFee ?? obj.rentalPrice ?? 0;
      return obj;
    });
    return NextResponse.json({ equipment });
  } catch (err) {
    let filtered = MOCK_EQUIPMENT.map((item) => ({
      ...item,
      category: item.category || item.sportCategory || "General",
      sportCategory: item.sportCategory || item.category || "General",
      rentalPrice: item.rentalPrice ?? item.rentalFee ?? 0,
      rentalFee: item.rentalFee ?? item.rentalPrice ?? 0,
    }));
    if (category && category !== "All") {
      filtered = filtered.filter((e) => e.category === category || e.sportCategory === category);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          (e.name && e.name.toLowerCase().includes(q)) ||
          (e.category && e.category.toLowerCase().includes(q)) ||
          (e.sportCategory && e.sportCategory.toLowerCase().includes(q)) ||
          (e.description && e.description.toLowerCase().includes(q))
      );
    }
    return NextResponse.json({ equipment: filtered });
  }
}

export async function POST(request) {
  const session = getSessionUser(request);
  if (!session || (session.role !== "admin" && session.role !== "sports_admin" && session.role !== "super_admin" && session.role !== "equipment_manager")) {
    return NextResponse.json({ error: "Sports store or Admin access required." }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const itemCategory = body.category || body.sportCategory;
  if (!body.name || !itemCategory || body.totalQuantity == null) {
    return NextResponse.json({ error: "Name, category and total quantity are required." }, { status: 400 });
  }

  const rentalRate = Number(body.rentalPrice ?? body.rentalFee) || 5;

  try {
    await connectDB();
    const item = await Equipment.create({
      ...body,
      category: itemCategory,
      sportCategory: itemCategory,
      rentalPrice: rentalRate,
      rentalFee: rentalRate,
      availableQuantity: body.availableQuantity ?? body.totalQuantity,
    });
    return NextResponse.json({ message: "Equipment added.", item }, { status: 201 });
  } catch (err) {
    const fallbackItem = {
      _id: "eq_" + Date.now(),
      ...body,
      category: itemCategory,
      sportCategory: itemCategory,
      rentalPrice: rentalRate,
      rentalFee: rentalRate,
      availableQuantity: body.availableQuantity ?? body.totalQuantity,
    };
    MOCK_EQUIPMENT.unshift(fallbackItem);
    return NextResponse.json({ message: "Equipment added (in-memory mode).", item: fallbackItem }, { status: 201 });
  }
}
