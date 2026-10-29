"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Dumbbell,
  Search,
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
  Calendar,
  Sparkles,
  Info,
  User,
  Loader2,
  ShoppingBag,
  CreditCard,
  QrCode,
  Tag,
} from "lucide-react";
import EquipmentCard from "@/components/EquipmentCard";
import EquipmentBookingModal from "@/components/EquipmentBookingModal";
import Loading from "@/components/Loading";
import EmptyState from "@/components/EmptyState";
import Badge from "@/components/Badge";
import Modal from "@/components/Modal";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

const CATEGORIES = [
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

export default function EquipmentPage() {
  const { user, loginDemo } = useAuth();
  const { showToast } = useToast();

  const [equipment, setEquipment] = useState([]);
  const [checkouts, setCheckouts] = useState([]);
  const [userBookings, setUserBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

  // Booking modal state
  const [selectedItemForBooking, setSelectedItemForBooking] = useState(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [guestAuthModalOpen, setGuestAuthModalOpen] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  function loadAll() {
    setLoading(true);
    Promise.all([
      fetch("/api/equipment").then((r) => r.json()),
      user
        ? fetch("/api/equipment/checkout").then((r) => r.json())
        : Promise.resolve({ checkouts: [] }),
      user
        ? fetch("/api/bookings").then((r) => r.json())
        : Promise.resolve({ bookings: [] }),
    ])
      .then(([eq, co, bk]) => {
        setEquipment(eq.equipment || []);
        setCheckouts(co.checkouts || []);
        setUserBookings((bk.bookings || []).filter((b) => b.status === "Confirmed"));
      })
      .catch(() => showToast("Could not load equipment.", "error"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function handleStartBooking(item) {
    setSelectedItemForBooking(item);
    if (!user) {
      setGuestAuthModalOpen(true);
      return;
    }
    setBookingModalOpen(true);
  }

  async function handleContinueAsDemoPlayer() {
    setDemoLoading(true);
    try {
      const logged = await loginDemo("player");
      showToast(`Welcome! Logged in as Demo Player (${logged.name}).`);
      setGuestAuthModalOpen(false);
      setBookingModalOpen(true);
    } catch (err) {
      showToast(err.message || "Failed to start demo session.", "error");
    } finally {
      setDemoLoading(false);
    }
  }

  function handleBookingSuccess(data) {
    showToast(data.message || "Equipment booked successfully!");
    loadAll();
  }

  async function handleReturn(checkoutId) {
    try {
      const res = await fetch("/api/equipment/checkout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkoutId }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Could not return equipment.", "error");
        return;
      }
      showToast("Equipment returned and inventory restored. Thank you!");
      loadAll();
    } catch {
      showToast("Return failed.", "error");
    }
  }

  if (loading) return <Loading label="Loading sports gear catalog..." />;

  const activeCheckouts = checkouts.filter((c) => c.status === "Checked Out");

  const filtered = equipment.filter((item) => {
    const matchesCat = category === "All" || item.category === category;
    const matchesSearch =
      !search.trim() ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary-400/30 bg-primary-400/10 px-3 py-0.5 text-xs font-bold text-primary-300 mb-2">
            <Sparkles size={13} className="text-primary-400" />
            <span>Sports Equipment & Locker Booking</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Rent & Reserve Sports Gear
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Book tournament rackets, match balls, and training gear. Pay online with Credit/Debit Card or Razorpay, or pay at venue reception upon pickup.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/search?tab=equipment"
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-dark-850 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-primary-400/40 hover:text-white transition"
          >
            <Search size={14} className="text-primary-400" />
            <span>Search Available Gear</span>
          </Link>
          <div className="flex items-center gap-2 rounded-xl bg-dark-850 border border-slate-800 px-3.5 py-2 text-xs text-slate-300">
            <Dumbbell size={15} className="text-primary-400" />
            <span>
              Catalog: <strong className="text-white">{equipment.length}</strong> Items
            </span>
          </div>
        </div>
      </div>

      {/* User's Active Equipment Bookings */}
      {user && (
        <section className="rounded-3xl border border-slate-800 bg-dark-850 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 size={18} className="text-primary-400" />
              My Active Equipment Bookings ({activeCheckouts.length})
            </h2>
            <span className="text-xs text-slate-400">
              Return items when your match finishes to restore inventory
            </span>
          </div>

          {activeCheckouts.length === 0 ? (
            <p className="text-xs text-slate-500 py-2">
              You currently have no active gear checkouts. Select items below to reserve for your upcoming court session.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
              {activeCheckouts.map((c) => (
                <div
                  key={c._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-dark-900 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl overflow-hidden bg-dark-800 shrink-0 border border-slate-700">
                      <img
                        src={c.equipmentId?.image || "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&q=80"}
                        alt={c.equipmentId?.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-primary-400">
                          {c.bookingReference || "EQ-PASS"}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          {c.equipmentId?.category}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white">
                        {c.equipmentId?.name} × {c.quantity}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="text-primary-300 font-semibold">
                          ${c.totalAmount || c.rentalPrice || 6}
                        </span>
                        <span>• Method: {c.paymentMethod || "Card"} ({c.paymentStatus || "Paid"})</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Badge size="sm">{c.status}</Badge>
                    <button
                      onClick={() => handleReturn(c._id)}
                      className="rounded-xl bg-primary-400/10 border border-primary-400/30 px-3 py-1.5 text-xs font-bold text-primary-300 hover:bg-primary-400/20 transition"
                    >
                      Return Gear
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Categories & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition whitespace-nowrap ${
                category === cat
                  ? "bg-primary-400 text-dark-950 shadow-glow-sm"
                  : "border border-slate-800 bg-dark-850 text-slate-400 hover:text-white hover:bg-dark-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search equipment name or sport..."
            className="w-full rounded-xl border border-slate-700 bg-dark-850 pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-primary-400"
          />
        </div>
      </div>

      {/* Equipment Cards Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No sports gear found"
          description="Try selecting another category or clearing your search term."
          action={
            <button
              onClick={() => {
                setCategory("All");
                setSearch("");
              }}
              className="rounded-xl bg-primary-400 px-4 py-2 text-xs font-bold text-dark-950"
            >
              Reset Filters
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <EquipmentCard key={item._id} item={item} onCheckout={handleStartBooking} />
          ))}
        </div>
      )}

      {/* Equipment Booking Modal */}
      <EquipmentBookingModal
        open={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        item={selectedItemForBooking}
        userBookings={userBookings}
        onBookingComplete={handleBookingSuccess}
      />

      {/* Guest Authentication Modal */}
      <Modal
        open={guestAuthModalOpen}
        onClose={() => setGuestAuthModalOpen(false)}
        title="Athlete Profile Required for Gear Booking"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-300 leading-relaxed">
            Equipment booking requires an athlete account so venue coordinators can generate your digital rental pass and track active borrowed items.
          </p>

          <div className="rounded-2xl border border-primary-400/30 bg-primary-400/10 p-4 space-y-3">
            <div className="flex items-center gap-1.5 font-bold text-primary-400">
              <Sparkles size={14} className="animate-pulse" />
              <span>Instant 1-Click Demo Option</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Skip registration and instantly authenticate as our Demo Athlete:
            </p>
            <button
              type="button"
              disabled={demoLoading}
              onClick={handleContinueAsDemoPlayer}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary-400 py-2.5 text-xs font-bold text-dark-950 hover:bg-primary-300 transition shadow-glow-sm"
            >
              {demoLoading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Signing In as Demo Player...</span>
                </>
              ) : (
                <>
                  <User size={13} />
                  <span>Continue with Demo Player (Aarav)</span>
                </>
              )}
            </button>
          </div>

          <div className="relative flex items-center justify-center pt-2">
            <div className="w-full border-t border-slate-800"></div>
            <span className="absolute bg-dark-850 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              or use personal account
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Link
              href="/login"
              className="rounded-xl border border-slate-700 bg-dark-900 py-2 text-center text-xs font-semibold text-slate-200 hover:text-white hover:bg-dark-800 transition"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="rounded-xl border border-slate-700 bg-dark-900 py-2 text-center text-xs font-semibold text-slate-200 hover:text-white hover:bg-dark-800 transition"
            >
              Register Free
            </Link>
          </div>
        </div>
      </Modal>
    </div>
  );
}
