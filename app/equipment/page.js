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
  Building2,
} from "lucide-react";
import EquipmentCard from "@/components/EquipmentCard";
import EquipmentBookingModal from "@/components/EquipmentBookingModal";
import Loading from "@/components/Loading";
import EmptyState from "@/components/EmptyState";
import Badge from "@/components/Badge";
import Modal from "@/components/Modal";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { MOCK_EQUIPMENT } from "@/lib/mockData";

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

  const [equipment, setEquipment] = useState(() => MOCK_EQUIPMENT);
  const [checkouts, setCheckouts] = useState([]);
  const [userBookings, setUserBookings] = useState([]);
  const [loading, setLoading] = useState(false);
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
      const logged = await loginDemo("student");
      showToast(`Welcome! Logged in as Demo Student (${logged.name}).`);
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
    const itemCat = item.category || item.sportCategory || "";
    const matchesCat = category === "All" || itemCat.toLowerCase() === category.toLowerCase();
    const matchesSearch =
      !search.trim() ||
      (item.name && item.name.toLowerCase().includes(search.toLowerCase())) ||
      itemCat.toLowerCase().includes(search.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Institutional Header Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded bg-red-50 border border-red-200 px-2.5 py-0.5 text-xs font-bold text-[#a71d2a]">
              <Building2 size={13} /> LPU CENTRAL SPORTS STORE • BLOCK 13
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Sports Equipment Rental & Issue Desk
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Official university sports gear store. Check out tournament-grade badminton rackets, match balls, cricket kits, and fitness accessories for your session.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3 shrink-0">
            <Dumbbell size={20} className="text-[#a71d2a]" />
            <div>
              <div className="text-base font-black text-slate-900">{equipment.length} Items</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">Store Inventory</div>
            </div>
          </div>
        </div>
      </div>

      {/* User's Active Equipment Bookings */}
      {user && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#a71d2a]" />
              My Active Equipment Checkouts ({activeCheckouts.length})
            </h2>
            <span className="text-xs text-slate-500">
              Return items at Block 13 central store when match concludes
            </span>
          </div>

          {activeCheckouts.length === 0 ? (
            <p className="text-xs text-slate-500 py-1">
              You currently have no active gear checkouts. Select items below to reserve for your upcoming court session.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
              {activeCheckouts.map((c) => (
                <div
                  key={c._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg overflow-hidden bg-white shrink-0 border border-slate-200">
                      <img
                        src={
                          c.equipmentId?.image ||
                          "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&q=80"
                        }
                        alt={c.equipmentId?.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-[#a71d2a]">
                          {c.bookingReference || "EQ-PASS"}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">
                          {c.equipmentId?.category}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {c.equipmentId?.name} × {c.quantity}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="text-[#a71d2a] font-bold">
                          ₹{c.totalAmount || c.rentalPrice || 5}
                        </span>
                        <span>
                          • Method: {c.paymentMethod || "UPI"} ({c.paymentStatus || "Paid"})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Badge size="sm">{c.status}</Badge>
                    <button
                      onClick={() => handleReturn(c._id)}
                      className="rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-bold text-[#a71d2a] hover:bg-red-100 transition cursor-pointer"
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

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                category === cat
                  ? "bg-[#a71d2a] text-white shadow-xs"
                  : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sports gear..."
            className="w-full rounded-lg border border-slate-300 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-[#a71d2a] focus:bg-white"
          />
        </div>
      </div>

      {/* Equipment Cards Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="No equipment found"
          description="No sports gear matches your active category or search query."
          actionLabel="Clear Filter"
          onAction={() => {
            setCategory("All");
            setSearch("");
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <EquipmentCard key={item._id} item={item} onCheckout={handleStartBooking} />
          ))}
        </div>
      )}

      {/* Booking Checkout Modal */}
      <EquipmentBookingModal
        open={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        item={selectedItemForBooking}
        onBookingComplete={handleBookingSuccess}
      />

      {/* Guest Authentication Modal */}
      <Modal
        open={guestAuthModalOpen}
        onClose={() => setGuestAuthModalOpen(false)}
        title="Student Sign In Required"
      >
        <div className="space-y-4 text-xs text-slate-700">
          <p className="leading-relaxed">
            To rent sports equipment and link it to your university ID, please log in with your LPU student account or continue using our instant 1-click demo role.
          </p>

          <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
            <div className="flex items-center gap-1.5 font-bold text-[#a71d2a]">
              <Sparkles size={14} />
              <span>Instant 1-Click Demo Option</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Skip typing credentials! Continue as our Demo Student (Aarav Sharma) to test the equipment checkout flow:
            </p>
            <button
              type="button"
              disabled={demoLoading}
              onClick={handleContinueAsDemoPlayer}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#a71d2a] py-2.5 text-xs font-bold text-white hover:bg-[#8e1520] transition shadow-xs cursor-pointer"
            >
              {demoLoading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <User size={13} />
                  <span>Continue with Demo Student</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <Link
              href="/login"
              className="rounded-lg border border-slate-300 bg-white py-2 text-center text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Student Login
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-[#a71d2a] py-2 text-center text-xs font-bold text-white hover:bg-[#8e1520] transition"
            >
              Register Free
            </Link>
          </div>
        </div>
      </Modal>
    </div>
  );
}
