import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Facility from "@/models/Facility";
import { getSessionUser } from "@/lib/auth";
import { MOCK_FACILITIES } from "@/lib/mockData";

let inMemoryFavorites = global._inMemoryFavorites;
if (!inMemoryFavorites) {
  inMemoryFavorites = global._inMemoryFavorites = {};
}

// GET /api/users/favorites -> return current user's favorites
export async function GET(request) {
  const session = getSessionUser(request);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  try {
    await connectDB();
    const user = await User.findById(session.id).populate("favorites");
    if (user) {
      return NextResponse.json({ favorites: user.favorites || [] });
    }
  } catch (err) {
    // offline fallback
  }

  const userFavIds = inMemoryFavorites[session.id] || [];
  const favFacilities = MOCK_FACILITIES.filter((f) => userFavIds.includes(f._id));
  return NextResponse.json({ favorites: favFacilities });
}

// POST /api/users/favorites -> toggle favorite facility
export async function POST(request) {
  const session = getSessionUser(request);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  const { facilityId } = await request.json().catch(() => ({}));
  if (!facilityId) {
    return NextResponse.json({ error: "facilityId is required." }, { status: 400 });
  }

  try {
    await connectDB();
    const user = await User.findById(session.id);
    if (user) {
      const favIndex = user.favorites.findIndex((id) => id.toString() === facilityId);
      let isFavorite = false;

      if (favIndex >= 0) {
        user.favorites.splice(favIndex, 1);
        isFavorite = false;
      } else {
        user.favorites.push(facilityId);
        isFavorite = true;
      }

      await user.save();
      return NextResponse.json({
        message: isFavorite ? "Added to favorites" : "Removed from favorites",
        isFavorite,
        favorites: user.favorites,
      });
    }
  } catch (err) {
    // offline fallback
  }

  if (!inMemoryFavorites[session.id]) {
    inMemoryFavorites[session.id] = [];
  }

  const userFavs = inMemoryFavorites[session.id];
  const idx = userFavs.indexOf(facilityId);
  let isFav = false;

  if (idx >= 0) {
    userFavs.splice(idx, 1);
    isFav = false;
  } else {
    userFavs.push(facilityId);
    isFav = true;
  }

  return NextResponse.json({
    message: isFav ? "Added to favorites" : "Removed from favorites",
    isFavorite: isFav,
    favorites: userFavs,
  });
}
