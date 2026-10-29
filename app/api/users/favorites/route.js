import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Facility from "@/models/Facility";
import { getSessionUser } from "@/lib/auth";

// GET /api/users/favorites -> return current user's favorites
export async function GET() {
  const session = getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }
  await connectDB();

  const user = await User.findById(session.id).populate("favorites");
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({ favorites: user.favorites || [] });
}

// POST /api/users/favorites -> toggle favorite facility
export async function POST(request) {
  const session = getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }
  await connectDB();

  const { facilityId } = await request.json();
  if (!facilityId) {
    return NextResponse.json({ error: "facilityId is required." }, { status: 400 });
  }

  const user = await User.findById(session.id);
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

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
