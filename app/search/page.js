"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Filter,
  Dumbbell,
  Compass,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle,
  X,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import FacilityCard from "@/components/FacilityCard";
import EquipmentCard from "@/components/EquipmentCard";
import EquipmentBookingModal from "@/components/EquipmentBookingModal";
import Loading from "@/components/Loading";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

const SPORTS = [
  "All",
  "Badminton",
  "Basketball",
  "Football",
  "Cricket",
  "Tennis",
  "Volleyball",
  "Gym",
  "Table Tennis",
];

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const initialTab = searchParams.get("tab") || "all"; // 'all' | 'grounds' | 'equipment'
  const initialQuery = searchParams.get("q") || searchParams.get("search") || "";
  const initialSport = searchParams.get("sport") || "All";

  const [activeTab, setActiveTab] = useState(initialTab);
  const [search, setSearch] = useState(initialQuery);
  const [selectedSport, setSelectedSport] = useState(initialSport);
  const [availableOnly, setAvailableOnly] = useState(true);
  const [maxPrice, setMaxPrice] = useState("");

  const [facilities, setFacilities] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);

  // Equipment booking modal
  const [bookingItem, setBookingItem] = useState(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/facilities?limit=50").then((r) => r.json()).catch(() => ({ facilities: [] })),
      fetch("/api/equipment").then((r) => r.json()).catch(() => ({ equipment: [] })),
    ])
      .then(([facData, eqData]) => {
        setFacilities(facData.facilities || []);
        setEquipment(eqData.equipment || []);
      })
      .finally(() => setLoading(false));
  }, []);

  // Filter facilities
  const filteredFacilities = facilities.filter((f) => {
    if (availableOnly && f.status !== "Available") return false;
    if (selectedSport !== "All" && !f.type.toLowerCase().includes(selectedSport.toLowerCase())) {
      return false;
    }
    if (maxPrice && f.pricePerHour > Number(maxPrice)) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      f.type.toLowerCase().includes(q) ||
      f.location.toLowerCase().includes(q) ||
      (f.city && f.city.toLowerCase().includes(q)) ||
      (f.description && f.description.toLowerCase().includes(q))
    );
  });

  // Filter equipment
  const filteredEquipment = equipment.filter((e) => {
    if (availableOnly && (e.status !== "Available" || e.availableQuantity <= 0)) return false;
    if (selectedSport !== "All" && e.category.toLowerCase() !== selectedSport.toLowerCase()) {
      return false;
    }
    if (maxPrice && (e.rentalPrice || 5) > Number(maxPrice)) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      e.name.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      (e.description && e.description.toLowerCase().includes(q))
    );
  });

  function handleReset() {
    setSearch("");
    setSelectedSport("All");
    setAvailableOnly(false);
    setMaxPrice("");
    setActiveTab("all");
  }

  function handleBookEquipment(item) {
    if (!user) {
      showToast("Please sign in to reserve equipment.", "error");
      router.push("/login");
      return;
    }
    setBookingItem(item);
    setBookingModalOpen(true);
  }

  const totalResults =
    activeTab === "all"
      ? filteredFacilities.length + filteredEquipment.length
      : activeTab === "grounds"
      ? filteredFacilities.length
      : filteredEquipment.length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Search Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary-400/30 bg-primary-400/10 px-3.5 py-1 text-xs font-bold text-primary-300">
          <Sparkles size={13} className="text-primary-400" />
          <span>Unified Sports Inventory & Grounds Discovery</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Find Available Courts & Gear
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Search live available grounds, floodlit courts, tournament rackets, and athletic gear. Book instantly with Card or Razorpay.
        </p>
      </div>

      {/* Main Search Bar & Filters */}
      <div className="rounded-3xl border border-slate-800 bg-dark-850 p-4 sm:p-6 space-y-5 shadow-2xl">
        {/* Top Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by court name, sport (Badminton, Cricket, Football), gear type, or landmark..."
            className="w-full rounded-2xl border border-slate-700 bg-dark-900 pl-12 pr-10 py-3.5 text-sm sm:text-base text-white placeholder-slate-500 outline-none focus:border-primary-400"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Category Tabs: All, Grounds & Courts, Equipment */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex rounded-xl bg-dark-900 p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                activeTab === "all"
                  ? "bg-primary-400 text-dark-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              All Items ({filteredFacilities.length + filteredEquipment.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("grounds")}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "grounds"
                  ? "bg-primary-400 text-dark-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Compass size={13} />
              <span>Grounds & Courts ({filteredFacilities.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("equipment")}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "equipment"
                  ? "bg-primary-400 text-dark-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Dumbbell size={13} />
              <span>Sports Gear ({filteredEquipment.length})</span>
            </button>
          </div>

          {/* Available Only Toggle */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="rounded border-slate-700 bg-dark-900 text-primary-400 focus:ring-primary-400 h-4 w-4"
              />
              <span className="flex items-center gap-1">
                <CheckCircle size={14} className="text-emerald-400" />
                Only In Stock & Available Now
              </span>
            </label>

            {(search || selectedSport !== "All" || !availableOnly || maxPrice) && (
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-slate-400 hover:text-primary-400 flex items-center gap-1 font-semibold"
              >
                <RotateCcw size={12} /> Reset
              </button>
            )}
          </div>
        </div>

        {/* Sport Discipline Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider pr-2 whitespace-nowrap">
            Sport:
          </span>
          {SPORTS.map((sport) => (
            <button
              key={sport}
              type="button"
              onClick={() => setSelectedSport(sport)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition whitespace-nowrap ${
                selectedSport === sport
                  ? "bg-primary-400 text-dark-950 shadow-glow-sm"
                  : "bg-dark-900 border border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white"
              }`}
            >
              {sport}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <div>
          Showing <strong className="text-white font-bold">{totalResults}</strong> matches
          {selectedSport !== "All" && <span> for sport "{selectedSport}"</span>}
          {availableOnly && <span className="text-emerald-400 ml-1">• (In Stock Only)</span>}
        </div>
      </div>

      {/* Results Content */}
      {loading ? (
        <Loading label="Searching live inventory & court allocations..." />
      ) : totalResults === 0 ? (
        <EmptyState
          title="No grounds or equipment found"
          description="Try turning off 'Only In Stock & Available Now', choosing 'All' sports, or clearing your keyword filter."
          action={
            <button
              onClick={handleReset}
              className="rounded-xl bg-primary-400 px-5 py-2 text-xs font-bold text-dark-950"
            >
              Reset All Filters
            </button>
          }
        />
      ) : (
        <div className="space-y-12">
          {/* Section 1: Grounds & Courts */}
          {(activeTab === "all" || activeTab === "grounds") && filteredFacilities.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Compass size={18} className="text-primary-400" />
                  <span>Available Grounds & Courts ({filteredFacilities.length})</span>
                </h2>
                <Link
                  href="/facilities"
                  className="text-xs font-semibold text-primary-400 hover:underline flex items-center gap-1"
                >
                  View All Venues <ChevronRight size={13} />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFacilities.map((fac) => (
                  <FacilityCard key={fac._id} facility={fac} />
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Available Sports Equipment */}
          {(activeTab === "all" || activeTab === "equipment") && filteredEquipment.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Dumbbell size={18} className="text-primary-400" />
                  <span>Available Sports Gear ({filteredEquipment.length})</span>
                </h2>
                <Link
                  href="/equipment"
                  className="text-xs font-semibold text-primary-400 hover:underline flex items-center gap-1"
                >
                  View Gear Catalog <ChevronRight size={13} />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEquipment.map((item) => (
                  <EquipmentCard key={item._id} item={item} onCheckout={handleBookEquipment} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Equipment Booking Modal */}
      <EquipmentBookingModal
        open={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        item={bookingItem}
        onBookingComplete={() => {
          showToast("Equipment booked successfully!");
          router.push("/equipment");
        }}
      />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<Loading label="Loading search..." />}>
      <SearchContent />
    </Suspense>
  );
}

