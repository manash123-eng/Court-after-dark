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
    const query = {};
    if (category && category !== "All") query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    const equipment = await Equipment.find(query).sort({ category: 1, name: 1 });
    return NextResponse.json({ equipment });
  } catch (err) {
    let filtered = [...MOCK_EQUIPMENT];
    if (category && category !== "All") {
      filtered = filtered.filter((e) => e.category === category);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          (e.description && e.description.toLowerCase().includes(q))
      );
    }
    return NextResponse.json({ equipment: filtered });
  }
}

export async function POST(request) {
  const session = getSessionUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
  await connectDB();
  const body = await request.json();
  if (!body.name || !body.category || body.totalQuantity == null) {
    return NextResponse.json({ error: "Name, category and total quantity are required." }, { status: 400 });
  }
  const item = await Equipment.create({
    ...body,
    rentalPrice: Number(body.rentalPrice) || 5,
    availableQuantity: body.availableQuantity ?? body.totalQuantity,
  });
  return NextResponse.json({ message: "Equipment added.", item }, { status: 201 });
}
