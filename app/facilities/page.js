"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  X,
  Heart,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  MapPin,
} from "lucide-react";
import FacilityCard from "@/components/FacilityCard";
import Loading from "@/components/Loading";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/contexts/AuthContext";

const TYPES = [
  "All",
  "Badminton Court",
  "Basketball Court",
  "Football Ground",
  "Cricket Ground",
  "Tennis Court",
  "Volleyball Court",
  "Gym",
  "Table Tennis",
];

const CITIES = ["All", "Downtown", "Midtown", "Eastside", "West End", "South Bay"];

const AMENITIES_LIST = [
  "Floodlights",
  "Air Conditioned",
  "Locker Rooms",
  "Shower",
  "Parking",
  "Water Station",
  "Pro Shop",
  "Cafeteria",
];

const SORT_OPTIONS = [
  { value: "featured", label: "Featured & Popular" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "popularity", label: "Most Booked" },
  { value: "name", label: "Alphabetical (A-Z)" },
];

function FacilitiesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  // Search & Filter state initialized from URL params
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [type, setType] = useState(searchParams.get("type") || "All");
  const [city, setCity] = useState(searchParams.get("city") || "All");
  const [indoorOutdoor, setIndoorOutdoor] = useState(searchParams.get("indoorOutdoor") || "All");
  const [selectedAmenity, setSelectedAmenity] = useState(searchParams.get("amenity") || "All");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "featured");
  const [page, setPage] = useState(1);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const [facilities, setFacilities] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, limit: 12 });
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Fetch facilities when criteria change
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    const query = new URLSearchParams();
    if (search.trim()) query.set("search", search.trim());
    if (type !== "All") query.set("type", type);
    if (city !== "All") query.set("city", city);
    if (indoorOutdoor !== "All") query.set("indoorOutdoor", indoorOutdoor);
    if (selectedAmenity !== "All") query.set("amenity", selectedAmenity);
    if (maxPrice) query.set("maxPrice", maxPrice);
    if (sort) query.set("sort", sort);
    query.set("page", page.toString());
    query.set("limit", "12");

    const timeout = setTimeout(() => {
      fetch(`/api/facilities?${query.toString()}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((data) => {
          setFacilities(data.facilities || []);
          if (data.pagination) setPagination(data.pagination);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 250);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [search, type, city, indoorOutdoor, selectedAmenity, maxPrice, sort, page]);

  function handleResetFilters() {
    setSearch("");
    setType("All");
    setCity("All");
    setIndoorOutdoor("All");
    setSelectedAmenity("All");
    setMaxPrice("");
    setSort("featured");
    setPage(1);
    setShowFavoritesOnly(false);
  }

  const hasActiveFilters =
    search ||
    type !== "All" ||
    city !== "All" ||
    indoorOutdoor !== "All" ||
    selectedAmenity !== "All" ||
    maxPrice ||
    showFavoritesOnly;

  // Filter for favorites if requested
  const displayedFacilities = showFavoritesOnly
    ? facilities.filter((f) =>
        user?.favorites?.some((fav) => (fav._id || fav) === f._id)
      )
    : facilities;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary-400 mb-1">
            <Sparkles size={14} /> Real-Time Sports Venue Inventory
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Discover Facilities
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Explore premium floodlit courts, turf grounds, and gyms. All slots updated live with fair anti-monopoly rules.
          </p>
        </div>

        {/* Action button on mobile to toggle filters */}
        <div className="flex items-center gap-2">
          {user && (
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                showFavoritesOnly
                  ? "bg-red-500/20 text-red-300 border-red-500/40"
                  : "border-slate-700 bg-dark-850 text-slate-300 hover:text-white"
              }`}
            >
              <Heart size={14} fill={showFavoritesOnly ? "currentColor" : "none"} />
              <span>Favorites Only</span>
            </button>
          )}

          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="lg:hidden flex items-center gap-1.5 rounded-xl border border-slate-700 bg-dark-850 px-3.5 py-2 text-xs font-semibold text-slate-200"
          >
            <SlidersHorizontal size={14} />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Filters Sidebar + Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <aside
          className={`${
            showMobileFilters ? "block" : "hidden"
          } lg:block lg:col-span-1 rounded-2xl border border-slate-800 bg-dark-850 p-5 space-y-6 h-fit sticky top-20`}
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <SlidersHorizontal size={15} className="text-primary-400" />
              Filter Facilities
            </h2>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-[11px] text-slate-400 hover:text-primary-400 flex items-center gap-1"
              >
                <RotateCcw size={11} /> Reset
              </button>
            )}
          </div>

          {/* Search input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Keywords
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Name or landmark..."
                className="w-full rounded-xl border border-slate-700 bg-dark-900 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-primary-400"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Sport Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Sport & Court Type
            </label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-xs text-white outline-none focus:border-primary-400"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* City / Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              City / Zone
            </label>
            <select
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-xs text-white outline-none focus:border-primary-400"
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Setting: Indoor / Outdoor */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Setting
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-dark-900 p-1 rounded-xl border border-slate-700">
              {["All", "Indoor", "Outdoor"].map((setting) => (
                <button
                  key={setting}
                  type="button"
                  onClick={() => {
                    setIndoorOutdoor(setting);
                    setPage(1);
                  }}
                  className={`rounded-lg py-1.5 text-xs font-semibold transition ${
                    indoorOutdoor === setting
                      ? "bg-primary-400 text-dark-950 shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {setting}
                </button>
              ))}
            </div>
          </div>

          {/* Max Price Filter */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">Max Hourly Rate</label>
              <span className="text-xs font-bold text-primary-400">
                {maxPrice ? `$${maxPrice}/hr` : "Any Price"}
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="150"
              step="5"
              value={maxPrice || 150}
              onChange={(e) => {
                setMaxPrice(e.target.value === "150" ? "" : e.target.value);
                setPage(1);
              }}
              className="w-full accent-primary-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>$20</span>
              <span>$75</span>
              <span>$150+</span>
            </div>
          </div>

          {/* Amenities Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Required Amenity
            </label>
            <select
              value={selectedAmenity}
              onChange={(e) => {
                setSelectedAmenity(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-xs text-white outline-none focus:border-primary-400"
            >
              <option value="All">Any Amenities</option>
              {AMENITIES_LIST.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </aside>

        {/* Results Area */}
        <main className="lg:col-span-3 space-y-6">
          {/* Top Sort & Results Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-dark-850 p-4 rounded-2xl border border-slate-800">
            <div className="text-xs text-slate-300">
              Showing{" "}
              <strong className="text-white font-bold">{displayedFacilities.length}</strong> of{" "}
              <strong className="text-primary-400">{pagination.total}</strong> venues
              {hasActiveFilters && <span className="text-slate-500 ml-1">(filtered)</span>}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-400 whitespace-nowrap">Sort by:</span>
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
                className="w-full sm:w-auto rounded-xl border border-slate-700 bg-dark-900 px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-primary-400"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active filter badges */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-slate-500">Active filters:</span>
              {search && (
                <span className="inline-flex items-center gap-1 rounded-full bg-dark-800 border border-slate-700 px-2.5 py-1 text-xs text-slate-300">
                  Search: "{search}"
                  <button onClick={() => setSearch("")}>
                    <X size={12} />
                  </button>
                </span>
              )}
              {type !== "All" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-dark-800 border border-slate-700 px-2.5 py-1 text-xs text-slate-300">
                  Sport: {type}
                  <button onClick={() => setType("All")}>
                    <X size={12} />
                  </button>
                </span>
              )}
              {city !== "All" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-dark-800 border border-slate-700 px-2.5 py-1 text-xs text-slate-300">
                  Zone: {city}
                  <button onClick={() => setCity("All")}>
                    <X size={12} />
                  </button>
                </span>
              )}
              {indoorOutdoor !== "All" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-dark-800 border border-slate-700 px-2.5 py-1 text-xs text-slate-300">
                  Setting: {indoorOutdoor}
                  <button onClick={() => setIndoorOutdoor("All")}>
                    <X size={12} />
                  </button>
                </span>
              )}
              {selectedAmenity !== "All" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-dark-800 border border-slate-700 px-2.5 py-1 text-xs text-slate-300">
                  Amenity: {selectedAmenity}
                  <button onClick={() => setSelectedAmenity("All")}>
                    <X size={12} />
                  </button>
                </span>
              )}
              {maxPrice && (
                <span className="inline-flex items-center gap-1 rounded-full bg-dark-800 border border-slate-700 px-2.5 py-1 text-xs text-slate-300">
                  Max: ${maxPrice}/hr
                  <button onClick={() => setMaxPrice("")}>
                    <X size={12} />
                  </button>
                </span>
              )}
              <button
                onClick={handleResetFilters}
                className="text-xs text-primary-400 hover:underline font-semibold ml-1"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Facilities Cards Grid */}
          {loading ? (
            <Loading type="skeleton" />
          ) : displayedFacilities.length === 0 ? (
            <EmptyState
              title="No facilities found"
              description="No venues matched your criteria. Try loosening your price limit, choosing another sport, or clearing active filters."
              action={
                <button
                  onClick={handleResetFilters}
                  className="rounded-xl bg-primary-400 px-4 py-2 text-xs font-bold text-dark-950 hover:bg-primary-300 transition"
                >
                  Reset All Filters
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayedFacilities.map((f) => (
                <FacilityCard key={f._id} facility={f} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 rounded-xl border border-slate-700 bg-dark-850 px-3 py-2 text-xs font-semibold text-slate-300 disabled:opacity-40 hover:bg-dark-800"
              >
                <ChevronLeft size={14} /> Previous
              </button>

              <span className="px-3 text-xs text-slate-400">
                Page <strong className="text-white">{page}</strong> of {pagination.pages}
              </span>

              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                className="flex items-center gap-1 rounded-xl border border-slate-700 bg-dark-850 px-3 py-2 text-xs font-semibold text-slate-300 disabled:opacity-40 hover:bg-dark-800"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function FacilitiesPage() {
  return (
    <Suspense fallback={<Loading label="Loading facilities..." type="skeleton" />}>
      <FacilitiesContent />
    </Suspense>
  );
}

