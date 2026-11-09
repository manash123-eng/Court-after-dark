"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Waves,
  Calendar,
  Clock,
  Users,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Info,
  ChevronRight,
  CreditCard,
  QrCode,
  ArrowRight,
  Building2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import Loading from "@/components/Loading";
import PaymentModal from "@/components/PaymentModal";

const INITIAL_SWIM_SLOTS = [
  { _id: "init_swim_0", startTime: "06:00", endTime: "06:50", category: "General", bookedCount: 8, poolName: "Shanti Devi Mittal Olympic Swimming Complex", maxCapacity: 30 },
  { _id: "init_swim_1", startTime: "07:00", endTime: "07:50", category: "General", bookedCount: 14, poolName: "Shanti Devi Mittal Olympic Swimming Complex", maxCapacity: 30 },
  { _id: "init_swim_2", startTime: "08:00", endTime: "08:50", category: "General", bookedCount: 11, poolName: "Shanti Devi Mittal Olympic Swimming Complex", maxCapacity: 30 },
  { _id: "init_swim_3", startTime: "16:00", endTime: "16:50", category: "General", bookedCount: 19, poolName: "Shanti Devi Mittal Olympic Swimming Complex", maxCapacity: 30 },
  { _id: "init_swim_4", startTime: "17:00", endTime: "17:50", category: "Girls", bookedCount: 12, poolName: "Shanti Devi Mittal Olympic Swimming Complex", maxCapacity: 30 },
  { _id: "init_swim_5", startTime: "18:00", endTime: "18:50", category: "General", bookedCount: 24, poolName: "Shanti Devi Mittal Olympic Swimming Complex", maxCapacity: 30 },
  { _id: "init_swim_6", startTime: "19:00", endTime: "19:50", category: "General", bookedCount: 18, poolName: "Shanti Devi Mittal Olympic Swimming Complex", maxCapacity: 30 },
  { _id: "init_swim_7", startTime: "20:00", endTime: "20:50", category: "General", bookedCount: 7, poolName: "Shanti Devi Mittal Olympic Swimming Complex", maxCapacity: 30 },
];

export default function SwimmingPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [slots, setSlots] = useState(INITIAL_SWIM_SLOTS);
  const [pricing, setPricing] = useState({
    hourlyRateHosteller: 50,
    hourlyRateDayScholar: 100,
    monthlyRateHosteller: 750,
    monthlyRateDayScholar: 1000,
    semesterRateHosteller: 2000,
    semesterRateDayScholar: 3000,
  });
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(null); // slotId
  const [lastBooking, setLastBooking] = useState(null);

  // Payment Modal State
  const [selectedSlotForPayment, setSelectedSlotForPayment] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  useEffect(() => {
    fetchSlots();
  }, [date, categoryFilter]);

  async function fetchSlots() {
    setLoading(true);
    try {
      const q = new URLSearchParams({ date });
      if (categoryFilter !== "All") q.set("category", categoryFilter);
      const res = await fetch(`/api/swimming/slots?${q.toString()}`);
      const data = await res.json();
      setSlots(data.slots || []);
      setPricing(data.pricing || null);
    } catch (err) {
      showToast("Failed to load swimming slots.", "error");
    } finally {
      setLoading(false);
    }
  }

  function calculateSlotPrice() {
    const studentCategory = user?.studentCategory || "Hosteller with EDB";
    const isHosteller = studentCategory.toLowerCase().includes("hosteller");
    const isFree = Boolean(user?.isComplimentaryApproved);
    return isFree ? 0 : isHosteller ? 50 : 100;
  }

  function handleBookSlot(slot) {
    if (!user) {
      showToast("Please log in with your LPU student account to book swimming sessions.", "error");
      window.location.href = "/login";
      return;
    }

    const price = calculateSlotPrice();
    if (price === 0) {
      // Complimentary medalist pass or active membership pass
      submitSwimmingBooking(slot, {
        method: "Active Swimming Pass",
        paymentId: `pass_waiver_${Date.now()}`,
      });
    } else {
      // Open Payment Modal so student pays first before pass is activated
      setSelectedSlotForPayment(slot);
      setPaymentModalOpen(true);
    }
  }

  async function handlePaymentSuccess(paymentResult) {
    setPaymentModalOpen(false);
    if (!selectedSlotForPayment) return;
    await submitSwimmingBooking(selectedSlotForPayment, paymentResult);
  }

  async function submitSwimmingBooking(slot, paymentResult) {
    setBookingLoading(slot._id);
    try {
      const res = await fetch("/api/swimming/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: slot._id,
          paymentMethod: paymentResult.method || "UPI",
          paymentStatus: "Paid",
          paymentDetails: paymentResult,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to book swimming slot.");
      }
      showToast(data.message || "Payment verified! Swimming slot reserved successfully.");
      setLastBooking(data.booking);
      fetchSlots();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setBookingLoading(null);
    }
  }

  const nextDates = [0, 1, 2, 3].map((offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return {
      iso: d.toISOString().split("T")[0],
      dayName: d.toLocaleDateString("en-IN", { weekday: "short" }),
      formatted: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    };
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Institutional Header Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-3xl space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-cyan-50 border border-cyan-200 px-2.5 py-0.5 text-[11px] font-bold text-cyan-800 uppercase tracking-wider flex items-center gap-1.5">
                <Waves size={13} className="text-cyan-700" /> Shanti Devi Mittal Aquatics Complex
              </span>
              <span className="rounded bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                Olympic Competition Spec • 50m Pool (8 Lanes)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              LPU Olympic Swimming Pool (50-Minute Slots)
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Official university swimming sessions run in strict <strong>50-minute time windows</strong> with dedicated
              lifeguards on duty. Includes exclusive <strong>Girls-Only sessions (17:00–17:50)</strong> and varsity training.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3 shrink-0">
            <Clock size={20} className="text-[#a71d2a]" />
            <div>
              <div className="text-base font-black text-slate-900">50 Min</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">Session Duration</div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Booking Notice */}
      {lastBooking && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-950">
                Swimming Pass Generated: {lastBooking.bookingReference}
              </h4>
              <p className="text-xs text-emerald-800">
                Slot: {lastBooking.date} ({lastBooking.startTime}–{lastBooking.endTime}) • Pass Token: {lastBooking.qrCodeToken}
              </p>
            </div>
          </div>
          <Link
            href="/bookings"
            className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition flex items-center gap-1 shrink-0"
          >
            View Digital Pass <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Girls Only Window Alert Banner */}
      <div className="rounded-xl border border-pink-200 bg-pink-50 p-4 flex items-start gap-3 text-xs text-pink-900">
        <Sparkles size={16} className="text-pink-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-pink-950 uppercase tracking-wider block mb-0.5">
            LPU Girls-Only Swimming Window Policy (17:00 – 17:50 IST)
          </span>
          <p className="text-pink-900/90 leading-relaxed">
            The 5:00 PM – 5:50 PM session is exclusively reserved for female LPU students and faculty, supervised by female lifeguards and pool coaches. Male students may reserve any of the other 7 daily slots.
          </p>
        </div>
      </div>

      {/* Slot Selection Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        {/* Date Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {nextDates.map((d) => (
            <button
              key={d.iso}
              type="button"
              onClick={() => setDate(d.iso)}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition flex flex-col items-center min-w-[76px] cursor-pointer ${
                date === d.iso
                  ? "bg-[#a71d2a] text-white shadow-xs"
                  : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span className="text-[10px] uppercase opacity-80">{d.dayName}</span>
              <span>{d.formatted}</span>
            </button>
          ))}
        </div>

        {/* Filter Category */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600">Category:</span>
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {["All", "General", "Girls"].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`rounded px-3 py-1 text-xs font-bold transition cursor-pointer ${
                  categoryFilter === cat
                    ? "bg-[#a71d2a] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 50-Minute Slots Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock size={16} className="text-[#a71d2a]" /> Published 50-Minute Sessions for {date}
          </h2>
          <span className="text-xs text-slate-500 font-semibold">30 swimmers capacity per session</span>
        </div>

        {loading ? (
          <Loading type="skeleton" />
        ) : slots.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center space-y-3 shadow-xs">
            <Waves size={36} className="mx-auto text-slate-400" />
            <h3 className="text-base font-bold text-slate-900">No Swimming Sessions Scheduled</h3>
            <p className="text-xs text-slate-500">Please choose another date or check with the sports desk.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {slots.map((slot) => {
              const isFull = slot.bookedCount >= slot.maxCapacity;
              const isGirls = slot.category === "Girls";
              const availableSpots = Math.max(0, slot.maxCapacity - slot.bookedCount);

              return (
                <div
                  key={slot._id}
                  className={`rounded-xl border p-4 flex flex-col justify-between space-y-4 transition bg-white shadow-xs ${
                    isGirls
                      ? "border-pink-300 bg-pink-50/30"
                      : "border-slate-200 hover:border-[#a71d2a]/50"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold border ${
                          isGirls
                            ? "bg-pink-100 text-pink-800 border-pink-200"
                            : "bg-cyan-50 text-cyan-800 border-cyan-200"
                        }`}
                      >
                        {isGirls ? "Girls Only (50 min)" : "General (50 min)"}
                      </span>
                      <span className="text-[11px] font-bold text-slate-600">
                        {availableSpots} spots left
                      </span>
                    </div>

                    <div className="text-lg font-black text-slate-900 tracking-tight">
                      {slot.startTime} – {slot.endTime}
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">
                      Lane 1–8 • Shanti Devi Mittal Pool
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                      <span className="text-slate-500">Session Fee:</span>
                      <span className="font-extrabold text-[#a71d2a]">
                        {calculateSlotPrice() === 0 ? "Complimentary Pass" : `₹${calculateSlotPrice()}`}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleBookSlot(slot)}
                    disabled={isFull || bookingLoading === slot._id}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      isFull
                        ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                        : "bg-[#a71d2a] text-white hover:bg-[#8e1520] shadow-xs"
                    }`}
                  >
                    {bookingLoading === slot._id ? (
                      "Reserving..."
                    ) : isFull ? (
                      "Slot Full"
                    ) : (
                      <>
                        <QrCode size={14} />
                        <span>
                          {calculateSlotPrice() === 0
                            ? "Reserve with Pass"
                            : `Pay ₹${calculateSlotPrice()} via UPI & Book`}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Guidelines Box */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-3 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
          <ShieldCheck size={16} className="text-[#a71d2a]" />
          LPU Swimming Pool Conduct Guidelines
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600">
          <div>• Showering is mandatory before stepping into the 50m competition pool.</div>
          <div>• Approved Lycra/silicone swim cap and recognized swimming costume required.</div>
          <div>• Swimmers must check in at the reception 10 minutes prior to session start.</div>
          <div>• Hostellers with valid EDB benefits receive complimentary standard access.</div>
        </div>
      </div>

      {/* Real Payment Modal for Swimming Slot (Must pay first before activation) */}
      {selectedSlotForPayment && (
        <PaymentModal
          open={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          title="Pay & Reserve Olympic Swimming Pool Pass"
          itemTitle={`Olympic 50m Pool Session (${selectedSlotForPayment.startTime}–${selectedSlotForPayment.endTime})`}
          itemSubtitle={`Date: ${selectedSlotForPayment.date} • ${selectedSlotForPayment.category} Window`}
          amount={calculateSlotPrice()}
          allowPayAtVenue={false}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
