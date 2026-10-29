"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  CalendarCheck,
  Trophy,
  Flame,
  ArrowRight,
  ShieldCheck,
  Dumbbell,
  Clock,
  Sparkles,
  Layers,
  MapPin,
  CheckCircle,
  User,
  Shield,
  Compass,
  Loader2,
  CreditCard,
  Smartphone,
  ShoppingBag,
} from "lucide-react";
import FacilityCard from "@/components/FacilityCard";
import EquipmentCard from "@/components/EquipmentCard";
import EquipmentBookingModal from "@/components/EquipmentBookingModal";
import Loading from "@/components/Loading";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

const CATEGORIES = [
  { name: "Badminton Court", label: "Badminton", icon: "🏸", sport: "Badminton" },
  { name: "Basketball Court", label: "Basketball", icon: "🏀", sport: "Basketball" },
  { name: "Football Ground", label: "Football 7v7", icon: "⚽", sport: "Football" },
  { name: "Cricket Ground", label: "Cricket Oval", icon: "🏏", sport: "Cricket" },
  { name: "Tennis Court", label: "Tennis", icon: "🎾", sport: "Tennis" },
  { name: "Volleyball Court", label: "Volleyball", icon: "🏐", sport: "Volleyball" },
  { name: "Gym", label: "Gym & Studio", icon: "💪", sport: "Gym" },
  { name: "Table Tennis", label: "Table Tennis", icon: "🏓", sport: "Table Tennis" },
];

const POPULAR_SLOTS = [
  { time: "18:00 - 19:00", label: "Sunset Rallies", demand: "High Demand", tag: "Prime Time" },
  { time: "19:00 - 20:00", label: "Peak Floodlight Hour", demand: "High Demand", tag: "Prime Time" },
  { time: "20:00 - 21:00", label: "After-Hours Clash", demand: "High Demand", tag: "Prime Time" },
  { time: "21:00 - 22:00", label: "Late Night League", demand: "Moderate", tag: "Night Slot" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Real-Time Discovery",
    desc: "Search available courts, turfs, and sports gear by sport, location, or prime-time floodlight hours.",
    icon: Search,
  },
  {
    step: "02",
    title: "Slot & Gear Allocation",
    desc: "Concurrency-safe double booking prevention enforces fair anti-monopoly caps and transparent queues.",
    icon: Clock,
  },
  {
    step: "03",
    title: "Card & Razorpay Checkout",
    desc: "Settle court fees and gear rentals securely with Credit/Debit Card, Razorpay UPI, or choose Pay at Venue.",
    icon: CreditCard,
  },
  {
    step: "04",
    title: "Digital Game Pass",
    desc: "Present your QR match pass at venue reception to unlock floodlit courts and grab checked-out equipment.",
    icon: Trophy,
  },
];

export default function HomePage() {
  const router = useRouter();
  const { user, loginDemo } = useAuth();
  const { showToast } = useToast();

  const [facilities, setFacilities] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("all"); // 'all' | 'grounds' | 'equipment'
  const [selectedSport, setSelectedSport] = useState("All");
  const [demoLoading, setDemoLoading] = useState(null);

  // Equipment booking modal
  const [bookingItem, setBookingItem] = useState(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/facilities?limit=6&sort=featured").then((r) => r.json()).catch(() => ({ facilities: [] })),
      fetch("/api/equipment").then((r) => r.json()).catch(() => ({ equipment: [] })),
    ])
      .then(([facData, eqData]) => {
        setFacilities(facData.facilities || []);
        setEquipmentList((eqData.equipment || []).slice(0, 3));
      })
      .finally(() => setLoading(false));
  }, []);

  function handleHeroSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (searchType !== "all") params.set("tab", searchType);
    if (selectedSport !== "All") params.set("sport", selectedSport);
    router.push(`/search?${params.toString()}`);
  }

  async function handleDemoLogin(role) {
    setDemoLoading(role);
    try {
      const loggedUser = await loginDemo(role);
      showToast(`Welcome! Logged in as Demo ${role === "admin" ? "Admin" : "Player"} (${loggedUser.name}).`);
      if (loggedUser.role === "admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      showToast(err.message || "Failed to start demo session.", "error");
      setDemoLoading(null);
    }
  }

  function handleRentGear(item) {
    if (!user) {
      showToast("Please sign in or use Demo Player to rent equipment.", "error");
      router.push("/login");
      return;
    }
    setBookingItem(item);
    setBookingModalOpen(true);
  }

  return (
    <div className="space-y-16 sm:space-y-24 pb-16 stadium-mesh">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-dark-950 via-dark-900 to-dark-900 pt-16 pb-20 sm:pt-24 sm:pb-28">
        {/* Luminous glow backdrops */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-primary-400/10 blur-[130px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 h-72 w-72 rounded-full bg-cyan-500/10 blur-[110px] pointer-events-none" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Top pill badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-400/30 bg-primary-400/10 px-4 py-1 text-xs font-semibold text-primary-300 backdrop-blur-md mb-6 shadow-glow-sm">
            <Sparkles size={14} className="text-primary-400 animate-pulse" />
            <span>Next-Gen Court & Equipment Booking Engine</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1]">
            Own Your Game. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-cyan-300 to-emerald-400">
              Courts, Grounds & Sports Gear.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-slate-300 leading-relaxed">
            Eliminate prime-time court hoarders. Search live availability of floodlit courts and turf grounds, rent sports gear, and pay seamlessly with Card or Razorpay.
          </p>

          {/* Interactive Multi-Modal Search Bar */}
          <form
            onSubmit={handleHeroSearch}
            className="mx-auto mt-10 max-w-3xl rounded-3xl border border-slate-700/80 bg-dark-850/95 p-3 shadow-2xl backdrop-blur-xl space-y-3"
          >
            {/* Search Type Selector */}
            <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2.5 text-xs px-1">
              <span className="text-slate-500 font-semibold uppercase tracking-wider mr-1">Search:</span>
              {[
                { id: "all", label: "All Items" },
                { id: "grounds", label: "Grounds & Courts" },
                { id: "equipment", label: "Sports Gear" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSearchType(t.id)}
                  className={`rounded-lg px-3 py-1 font-bold transition ${
                    searchType === t.id
                      ? "bg-primary-400 text-dark-950 shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Input Row */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1 flex items-center">
                <Search className="absolute left-3.5 text-slate-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search court name, sport (Badminton, Cricket, Football), or gear..."
                  className="w-full rounded-xl bg-dark-900 pl-11 pr-4 py-2.5 text-sm text-white placeholder-slate-400 outline-none focus:ring-1 focus:ring-primary-400"
                />
              </div>

              <div className="sm:w-48">
                <select
                  value={selectedSport}
                  onChange={(e) => setSelectedSport(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-primary-400 cursor-pointer"
                >
                  <option value="All">All Disciplines</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.sport} value={c.sport}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="flex items-center justify-center gap-2 rounded-xl bg-primary-400 px-6 py-2.5 text-sm font-bold text-dark-950 hover:bg-primary-300 transition shadow-glow-sm"
              >
                <span>Search</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </form>

          {/* Instant Demo Exploration Bar */}
          {!user && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5 text-xs">
              <span className="text-slate-400 flex items-center gap-1 font-medium">
                <Sparkles size={13} className="text-primary-400" /> Explore without login:
              </span>
              <button
                type="button"
                onClick={() => handleDemoLogin("player")}
                disabled={demoLoading !== null}
                className="rounded-full border border-primary-400/40 bg-primary-400/15 px-3.5 py-1.5 font-bold text-primary-300 hover:bg-primary-400/25 transition flex items-center gap-1.5 shadow-sm"
              >
                {demoLoading === "player" ? (
                  <Loader2 size={12} className="animate-spin text-primary-400" />
                ) : (
                  <User size={12} className="text-primary-400" />
                )}
                <span>1-Click Demo Player</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin("admin")}
                disabled={demoLoading !== null}
                className="rounded-full border border-amber-500/40 bg-amber-500/15 px-3.5 py-1.5 font-bold text-amber-300 hover:bg-amber-500/25 transition flex items-center gap-1.5 shadow-sm"
              >
                {demoLoading === "admin" ? (
                  <Loader2 size={12} className="animate-spin text-amber-400" />
                ) : (
                  <Shield size={12} className="text-amber-400" />
                )}
                <span>1-Click Demo Admin</span>
              </button>
              <Link
                href="/search"
                className="rounded-full border border-slate-700 bg-dark-850 px-3.5 py-1.5 text-slate-300 hover:text-white hover:bg-dark-800 transition flex items-center gap-1.5"
              >
                <Compass size={12} className="text-primary-400" />
                <span>Search Available Inventory</span>
              </Link>
            </div>
          )}

          {/* Key metrics ticker */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto pt-6 border-t border-slate-800/60">
            <div>
              <p className="text-2xl sm:text-3xl font-black text-white">100%</p>
              <p className="text-xs text-slate-400 mt-0.5">Live Real-Time Inventory</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-primary-400">Card & UPI</p>
              <p className="text-xs text-slate-400 mt-0.5">Card + Razorpay Payments</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-cyan-400">15+ Gear</p>
              <p className="text-xs text-slate-400 mt-0.5">Equipment Types In Stock</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-amber-400">Fair-Share</p>
              <p className="text-xs text-slate-400 mt-0.5">Anti-Hoarding Slot Engine</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sports Categories Bar */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Browse Grounds by Discipline
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select an athletic sport to discover available courts, turfs, and rental gear
            </p>
          </div>
          <Link
            href="/search"
            className="text-xs font-bold text-primary-400 hover:underline flex items-center gap-1"
          >
            <span>Explore All</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.sport}
              href={`/search?sport=${encodeURIComponent(cat.sport)}`}
              className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-850 bg-dark-850 hover:bg-dark-800 hover:border-primary-400/50 transition group text-center shadow-md card-hover-glow"
            >
              <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                {cat.icon}
              </span>
              <span className="text-xs font-bold text-slate-200 group-hover:text-primary-300 transition-colors">
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Venues Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Featured Grounds & Floodlit Courts
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Top-rated sports arenas available for evening and night sessions
            </p>
          </div>
          <Link
            href="/facilities?sort=featured"
            className="text-xs font-bold text-primary-400 hover:underline flex items-center gap-1"
          >
            <span>Explore All Venues</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {loading ? (
          <Loading label="Loading featured facilities..." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {facilities.map((fac) => (
              <FacilityCard key={fac._id} facility={fac} />
            ))}
          </div>
        )}
      </section>

      {/* Available Sports Gear Spotlight */}
      {equipmentList.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-1.5 text-primary-400 text-xs font-bold uppercase tracking-wider mb-0.5">
                <Dumbbell size={14} />
                <span>Equipment Rental Hub</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Rent Sports Gear for Your Session
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Check out tournament rackets, match balls, and training gear. Pay online or upon pickup.
              </p>
            </div>
            <Link
              href="/equipment"
              className="text-xs font-bold text-primary-400 hover:underline flex items-center gap-1"
            >
              <span>View Gear Catalog</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {equipmentList.map((item) => (
              <EquipmentCard key={item._id} item={item} onCheckout={handleRentGear} />
            ))}
          </div>
        </section>
      )}

      {/* Payment Methods Trust Banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-800 bg-dark-850 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 justify-center md:justify-start">
              <ShieldCheck size={15} /> Instant Secure Checkout
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Pay with Credit Card, Debit Card or Razorpay
            </h3>
            <p className="text-xs text-slate-400 max-w-lg">
              Seamlessly reserve courts and rent equipment using your preferred payment method with 256-bit SSL encryption, or opt to pay at venue check-in.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <div className="rounded-2xl border border-slate-700 bg-dark-900 px-4 py-2.5 text-xs font-bold text-white flex items-center gap-2">
              <CreditCard size={16} className="text-primary-400" />
              <span>Credit / Debit Card</span>
            </div>
            <div className="rounded-2xl border border-cyan-500/40 bg-dark-900 px-4 py-2.5 text-xs font-bold text-cyan-300 flex items-center gap-2">
              <Smartphone size={16} className="text-cyan-400" />
              <span>Razorpay UPI</span>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-dark-900 px-4 py-2.5 text-xs font-bold text-slate-300">
              Visa • Mastercard • RuPay
            </div>
          </div>
        </div>
      </section>

      {/* Prime Time Slots Spotlight */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-800 bg-dark-850 p-6 sm:p-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Flame size={15} />
                <span>Prime-Time Protection</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
                High-Demand Night Floodlight Slots
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Our anti-monopoly fair allocation rules ensure evening slots between 18:00 - 22:00 are rotated fairly across athletes
              </p>
            </div>
            <Link
              href="/help"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-dark-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-dark-750 transition self-start sm:self-auto"
            >
              <span>Fair Quota Explainer</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {POPULAR_SLOTS.map((slot) => (
              <div
                key={slot.time}
                className="rounded-2xl border border-slate-800 bg-dark-900 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-primary-400/10 border border-primary-400/30 px-2.5 py-0.5 text-[10px] font-bold text-primary-400">
                    {slot.tag}
                  </span>
                  <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                    <Flame size={12} /> {slot.demand}
                  </span>
                </div>
                <div>
                  <div className="text-lg font-black text-white">{slot.time}</div>
                  <div className="text-xs text-slate-400 font-medium">{slot.label}</div>
                </div>
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1">
                  <CalendarCheck size={12} className="text-primary-400" />
                  <span>Max 3 peak slots/week</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4-Step Lifecycle Explanation */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-primary-400 uppercase tracking-wider">
            Architecture Workflow
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            How Courts After Dark Operates
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            The end-to-end lifecycle guarantees transparency, fair distribution, and zero scheduling clashes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {HOW_IT_WORKS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="relative rounded-2xl border border-slate-800 bg-dark-850 p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-slate-700 font-mono">
                      {item.step}
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-400/15 border border-primary-400/30 text-primary-400 shadow-glow-sm">
                      <Icon size={18} />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-primary-400 font-semibold flex items-center gap-1">
                  <CheckCircle size={12} /> Verified Server-Side
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-primary-400/30 bg-gradient-to-r from-dark-850 via-dark-800 to-dark-900 p-8 sm:p-12 text-center shadow-glow-emerald">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Ready for Your Next Match?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Search available courts and gear, book instantly with Card or Razorpay, or try our 1-click instant demo account.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/search"
                className="w-full sm:w-auto rounded-xl bg-primary-400 px-8 py-3 text-sm font-bold text-dark-950 hover:bg-primary-300 transition shadow-glow-sm"
              >
                Search Available Courts & Gear
              </Link>
              {!user && (
                <button
                  type="button"
                  onClick={() => handleDemoLogin("player")}
                  disabled={demoLoading !== null}
                  className="w-full sm:w-auto rounded-xl border border-primary-400/40 bg-dark-900/90 px-6 py-3 text-sm font-bold text-primary-300 hover:bg-primary-400/10 transition flex items-center justify-center gap-2"
                >
                  <Sparkles size={15} className="text-primary-400" />
                  <span>Try 1-Click Demo Account</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

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
