"use client";

import Link from "next/link";
import { useState } from "react";
import { MapPin, Users, Clock, Heart, Sparkles, ChevronRight, Layers } from "lucide-react";
import Badge from "@/components/Badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=900&q=80&auto=format&fit=crop";

export default function FacilityCard({ facility, onFavoriteToggle, isFavorited = false }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [favorite, setFavorite] = useState(
    isFavorited || user?.favorites?.some((f) => (f._id || f) === facility._id) || false
  );
  const [favLoading, setFavLoading] = useState(false);

  async function handleToggleFavorite(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      showToast("Please log in to save favorites.", "error");
      return;
    }

    setFavLoading(true);
    try {
      const res = await fetch("/api/users/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facilityId: facility._id }),
      });
      const data = await res.json();
      if (res.ok) {
        setFavorite(data.isFavorite);
        showToast(data.message);
        if (onFavoriteToggle) onFavoriteToggle(facility._id, data.isFavorite);
      }
    } catch (err) {
      showToast("Could not update favorites.", "error");
    } finally {
      setFavLoading(false);
    }
  }

  return (
    <Link
      href={`/facilities/${facility._id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-800/80 bg-dark-850 hover:border-primary-400/50 hover:bg-dark-800 transition duration-300 shadow-lg card-hover-glow"
    >
      {/* Thumbnail */}
      <div className="relative h-48 w-full overflow-hidden bg-dark-900">
        <img
          src={facility.image || FALLBACK_IMAGE}
          alt={facility.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent opacity-80" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <Badge>{facility.status}</Badge>
          {facility.indoorOutdoor && (
            <span className="rounded-full bg-dark-900/90 border border-slate-700/80 px-2.5 py-0.5 text-[10px] font-bold text-slate-200 backdrop-blur-md">
              {facility.indoorOutdoor}
            </span>
          )}
        </div>

        {/* Favorite button */}
        <button
          onClick={handleToggleFavorite}
          disabled={favLoading}
          aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
          className={`absolute top-3 right-3 h-8 w-8 rounded-full flex items-center justify-center backdrop-blur-md transition ${
            favorite
              ? "bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30"
              : "bg-dark-900/70 text-slate-400 border border-slate-700/60 hover:text-white hover:bg-dark-900"
          }`}
        >
          <Heart size={15} fill={favorite ? "currentColor" : "none"} />
        </button>

        {/* Price tag */}
        <div className="absolute bottom-3 right-3 rounded-xl bg-dark-950/90 border border-primary-400/30 px-3 py-1 backdrop-blur-md">
          <span className="text-[10px] text-slate-400">from </span>
          <span className="text-sm font-black text-primary-400">
            ${facility.pricePerHour || 40}
          </span>
          <span className="text-[10px] text-slate-400"> / hr</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4 justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary-400">
              {facility.type}
            </span>
            {facility.bookingCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                <Sparkles size={11} className="text-primary-400" />
                {facility.bookingCount} bookings
              </span>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-primary-300 transition line-clamp-1 mt-0.5">
            {facility.name}
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
            <MapPin size={13} className="shrink-0 text-primary-400" />
            <span className="truncate">{facility.location} {facility.city ? `• ${facility.city}` : ""}</span>
          </div>
        </div>

        {/* Amenities preview tags */}
        {facility.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {facility.amenities.slice(0, 3).map((amenity) => (
              <span
                key={amenity}
                className="rounded-lg bg-dark-800 border border-slate-850 px-2 py-0.5 text-[10px] text-slate-300"
              >
                {amenity}
              </span>
            ))}
            {facility.amenities.length > 3 && (
              <span className="rounded-lg bg-dark-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                +{facility.amenities.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer info & Book CTA */}
        <div className="flex items-center justify-between border-t border-slate-800/80 pt-2.5 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Users size={12} className="text-slate-500" /> {facility.capacity} max
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} className="text-slate-500" /> {facility.openingTime} - {facility.closingTime}
            </span>
          </div>

          <span className="text-xs font-bold text-primary-400 group-hover:text-primary-300 flex items-center gap-0.5">
            Book <ChevronRight size={13} />
          </span>
        </div>
      </div>
    </Link>
  );
}
