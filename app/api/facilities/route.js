import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Facility from "@/models/Facility";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/bookingRules";
import { MOCK_FACILITIES } from "@/lib/mockData";

// GET /api/facilities with multi-attribute search, filtering, and sorting
export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const search = searchParams.get("search") || "";
  const type = searchParams.get("type") || "";
  const indoorOutdoor = searchParams.get("indoorOutdoor") || "";
  const city = searchParams.get("city") || "";
  const amenity = searchParams.get("amenity") || "";
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const sort = searchParams.get("sort") || "name";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "24", 10);

  try {
    await connectDB();
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (type && type !== "All") {
      query.type = type;
    }

    if (indoorOutdoor && indoorOutdoor !== "All") {
      query.indoorOutdoor = indoorOutdoor;
    }

    if (city && city !== "All") {
      query.city = city;
    }

    if (amenity && amenity !== "All") {
      query.amenities = amenity;
    }

    if (minPrice || maxPrice) {
      query.pricePerHour = {};
      if (minPrice) query.pricePerHour.$gte = Number(minPrice);
      if (maxPrice) query.pricePerHour.$lte = Number(maxPrice);
    }

    // Sorting logic
    let sortOption = { name: 1 };
    if (sort === "price-asc") sortOption = { pricePerHour: 1 };
    else if (sort === "price-desc") sortOption = { pricePerHour: -1 };
    else if (sort === "popularity") sortOption = { bookingCount: -1 };
    else if (sort === "featured") sortOption = { featured: -1, bookingCount: -1 };

    const skip = (page - 1) * limit;
    const total = await Facility.countDocuments(query);
    const facilities = await Facility.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    return NextResponse.json({
      facilities,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    // Offline or sandbox mock fallback
    let filtered = [...MOCK_FACILITIES];

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.location.toLowerCase().includes(q) ||
          f.type.toLowerCase().includes(q) ||
          (f.city && f.city.toLowerCase().includes(q))
      );
    }
    if (type && type !== "All") {
      filtered = filtered.filter((f) => f.type === type);
    }
    if (indoorOutdoor && indoorOutdoor !== "All") {
      filtered = filtered.filter((f) => f.indoorOutdoor === indoorOutdoor);
    }
    if (city && city !== "All") {
      filtered = filtered.filter((f) => f.city === city);
    }
    if (amenity && amenity !== "All") {
      filtered = filtered.filter((f) => f.amenities?.includes(amenity));
    }
    if (minPrice) {
      filtered = filtered.filter((f) => f.pricePerHour >= Number(minPrice));
    }
    if (maxPrice) {
      filtered = filtered.filter((f) => f.pricePerHour <= Number(maxPrice));
    }

    if (sort === "price-asc") filtered.sort((a, b) => a.pricePerHour - b.pricePerHour);
    else if (sort === "price-desc") filtered.sort((a, b) => b.pricePerHour - a.pricePerHour);
    else if (sort === "popularity") filtered.sort((a, b) => b.bookingCount - a.bookingCount);
    else if (sort === "featured") filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

    const total = filtered.length;
    const skip = (page - 1) * limit;
    const paged = filtered.slice(skip, skip + limit);

    return NextResponse.json({
      facilities: paged,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  }
}

// POST /api/facilities (admin only)
export async function POST(request) {
  const session = getSessionUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
  await connectDB();
  const body = await request.json();

  if (!body.name || !body.type || !body.location || !body.capacity || !body.openingTime || !body.closingTime) {
    return NextResponse.json({ error: "Missing required facility fields." }, { status: 400 });
  }

  const facility = await Facility.create({
    ...body,
    pricePerHour: Number(body.pricePerHour) || 40,
    capacity: Number(body.capacity),
  });

  await recordAuditLog({
    action: "FACILITY_CREATED",
    performedBy: session.id,
    performedByName: session.name || session.email,
    entityType: "Facility",
    entityId: facility._id.toString(),
    details: `Created ${facility.name} (${facility.type}) at ${facility.location}`,
    severity: "info",
  });

  return NextResponse.json({ message: "Facility created successfully.", facility }, { status: 201 });
}
