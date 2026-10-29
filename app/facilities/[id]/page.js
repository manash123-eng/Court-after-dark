"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Users,
  Clock,
  Dumbbell,
  ShieldCheck,
  Calendar,
  AlertCircle,
  CheckCircle,
  Flame,
  Heart,
  ChevronLeft,
  Sparkles,
  Info,
  Layers,
  Tag,
  User,
  Loader2,
  CreditCard,
  Plus,
  Minus,
  Check,
} from "lucide-react";
import Badge from "@/components/Badge";
import Loading from "@/components/Loading";
import AvailabilityGrid from "@/components/AvailabilityGrid";
import Modal from "@/components/Modal";
import PaymentModal from "@/components/PaymentModal";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { formatSlotLabel } from "@/lib/bookingRules";

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function dateAfterDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

export default function FacilityDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loginDemo } = useAuth();
  const { showToast } = useToast();

  const [facility, setFacility] = useState(null);
  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState([]);
  const [rules, setRules] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Equipment add-ons state
  const [availableEquipment, setAvailableEquipment] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState({}); // { [eqId]: quantity }

  // Modals state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [waitlistModalOpen, setWaitlistModalOpen] = useState(false);
  const [waitlistSlot, setWaitlistSlot] = useState(null);
  const [guestAuthModalOpen, setGuestAuthModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'book' | 'waitlist' | 'favorite'
  const [demoLoading, setDemoLoading] = useState(false);
  const [bookingNotes, setBookingNotes] = useState("");
  const [isFavorited, setIsFavorited] = useState(false);

  // Load availability
  function loadAvailability() {
    setLoading(true);
    setSelectedSlot(null);
    Promise.all([
      fetch(`/api/facilities/${id}/availability?date=${date}`).then((r) => r.json()),
      fetch("/api/equipment").then((r) => r.json()).catch(() => ({ equipment: [] })),
    ])
      .then(([availData, eqData]) => {
        if (availData.facility) {
          setFacility(availData.facility);
          setIsFavorited(
            user?.favorites?.some((f) => (f._id || f) === availData.facility._id) || false
          );
        }
        setSlots(availData.slots || []);
        if (availData.rules) setRules(availData.rules);
        setAvailableEquipment(eqData.equipment || []);
      })
      .catch(() => showToast("Could not load court availability.", "error"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, date, user]);

  async function handleToggleFavorite() {
    if (!user) {
      setPendingAction("favorite");
      setGuestAuthModalOpen(true);
      return;
    }
    try {
      const res = await fetch("/api/users/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facilityId: id }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsFavorited(data.isFavorite);
        showToast(data.message);
      }
    } catch {
      showToast("Could not update favorites.", "error");
    }
  }

  function handleStartBooking() {
    if (!selectedSlot) {
      showToast("Please choose an open time slot first.", "error");
      return;
    }
    if (!user) {
      setPendingAction("book");
      setGuestAuthModalOpen(true);
      return;
    }
    setPaymentModalOpen(true);
  }

  async function handleContinueAsDemoPlayer() {
    setDemoLoading(true);
    try {
      const logged = await loginDemo("player");
      showToast(`Welcome! Signed in as Demo Player (${logged.name}).`);
      setGuestAuthModalOpen(false);
      if (pendingAction === "book") {
        setPaymentModalOpen(true);
      } else if (pendingAction === "waitlist") {
        setWaitlistModalOpen(true);
      }
    } catch (err) {
      showToast(err.message || "Failed to start demo session.", "error");
    } finally {
      setDemoLoading(false);
    }
  }

  // Equipment add-on quantity handlers
  function handleAddEquipmentQty(eqId) {
    const current = selectedEquipment[eqId] || 0;
    const item = availableEquipment.find((e) => e._id === eqId);
    if (!item || current >= item.availableQuantity) return;
    setSelectedEquipment({ ...selectedEquipment, [eqId]: current + 1 });
  }

  function handleRemoveEquipmentQty(eqId) {
    const current = selectedEquipment[eqId] || 0;
    if (current <= 1) {
      const next = { ...selectedEquipment };
      delete next[eqId];
      setSelectedEquipment(next);
    } else {
      setSelectedEquipment({ ...selectedEquipment, [eqId]: current - 1 });
    }
  }

  // Calculate pricing
  const pricePerHour = facility?.pricePerHour || 40;
  const equipmentAddonsList = Object.entries(selectedEquipment).map(([eqId, qty]) => {
    const item = availableEquipment.find((e) => e._id === eqId);
    return {
      equipmentId: eqId,
      name: item?.name || "Equipment",
      quantity: qty,
      price: (item?.rentalPrice || 5) * qty,
    };
  });
  const equipmentTotal = equipmentAddonsList.reduce((sum, item) => sum + item.price, 0);
  const grandTotal = pricePerHour + equipmentTotal;

  async function handlePaymentSuccess(paymentResult) {
    if (!selectedSlot) return;
    setBookingLoading(true);
    setPaymentModalOpen(false);
    const [startTime, endTime] = selectedSlot.split("-");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facilityId: id,
          date,
          startTime,
          endTime,
          notes: bookingNotes,
          paymentMethod: paymentResult.method,
          paymentStatus: paymentResult.method === "Pay at Venue" ? "Pay at Venue" : "Paid",
          paymentDetails: paymentResult,
          equipmentAddons: equipmentAddonsList,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Could not complete booking.", "error");
        loadAvailability();
        return;
      }

      showToast("Court reserved successfully! View your game pass below.");
      router.push(`/bookings/${data.booking._id}`);
    } catch (err) {
      showToast("Something went wrong during reservation. Please retry.", "error");
    } finally {
      setBookingLoading(false);
    }
  }

  function handleOpenWaitlist(slot) {
    setWaitlistSlot(slot);
    if (!user) {
      setPendingAction("waitlist");
      setGuestAuthModalOpen(true);
      return;
    }
    setWaitlistModalOpen(true);
  }

  async function handleConfirmWaitlist() {
    if (!waitlistSlot) return;
    const [startTime, endTime] = waitlistSlot.split("-");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facilityId: id, date, startTime, endTime }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Could not join waitlist.", "error");
        return;
      }
      showToast(data.message);
      setWaitlistModalOpen(false);
      loadAvailability();
    } catch {
      showToast("Waitlist request failed.", "error");
    }
  }

  if (loading && !facility) return <Loading label="Loading facility data & slot schedule..." />;
  if (!facility) return <p className="text-center text-slate-400 py-20">Facility not found.</p>;

  const maxAdvance = rules?.maxAdvanceBookingDays || 14;
  const maxBookingDate = dateAfterDays(maxAdvance);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/facilities"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ChevronLeft size={16} /> Back to Facilities Directory
        </Link>
        <button
          onClick={handleToggleFavorite}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
            isFavorited
              ? "bg-red-500/20 text-red-300 border-red-500/40"
              : "border-slate-700 bg-dark-850 text-slate-400 hover:text-white"
          }`}
        >
          <Heart size={14} fill={isFavorited ? "currentColor" : "none"} />
          <span>{isFavorited ? "Favorited" : "Save to Favorites"}</span>
        </button>
      </div>

      {/* Main Grid: Left Details & Right Booking Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (7 cols): Facility Info & Photos */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-8">
          {/* Hero Banner Photo */}
          <div className="relative h-72 sm:h-96 w-full overflow-hidden rounded-3xl border border-slate-800 bg-dark-900 shadow-2xl">
            <img
              src={
                facility.image ||
                "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&q=80&auto=format&fit=crop"
              }
              alt={facility.name}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/40 to-transparent" />

            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              <Badge>{facility.status}</Badge>
              {facility.indoorOutdoor && (
                <span className="rounded-full bg-dark-900/90 border border-slate-700 px-3 py-1 text-xs font-bold text-slate-200 backdrop-blur-md">
                  {facility.indoorOutdoor}
                </span>
              )}
            </div>

            <div className="absolute bottom-5 left-5 right-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary-400">
                  {facility.type}
                </span>
                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  {facility.name}
                </h1>
                <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-1">
                  <MapPin size={14} className="text-primary-400" />
                  <span>
                    {facility.location} • {facility.city || "Downtown"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-dark-950/90 border border-primary-400/40 px-3.5 py-1.5 backdrop-blur-md self-start sm:self-auto">
                <span className="text-xs text-slate-400">Rate: </span>
                <span className="text-xl font-black text-primary-400">${pricePerHour}</span>
                <span className="text-xs text-slate-400"> / hour</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-dark-850 p-4 rounded-2xl border border-slate-800">
            <div>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Users size={12} className="text-primary-400" /> Max Players
              </span>
              <p className="text-sm font-bold text-white mt-0.5">{facility.capacity} Persons</p>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock size={12} className="text-primary-400" /> Operating Hours
              </span>
              <p className="text-sm font-bold text-white mt-0.5">
                {facility.openingTime} – {facility.closingTime}
              </p>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Layers size={12} className="text-primary-400" /> Court Surface
              </span>
              <p className="text-sm font-bold text-white mt-0.5 truncate">
                {facility.surfaceType || "Synthetic Professional"}
              </p>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <ShieldCheck size={12} className="text-primary-400" /> Free Cancellation
              </span>
              <p className="text-sm font-bold text-emerald-400 mt-0.5">
                Up to {facility.cancellationHours || 4}h prior
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white">Facility Overview</h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              {facility.description ||
                `${facility.name} is a premier athletic facility maintained to competition standards with night illumination and scheduled maintenance to ensure optimal playing conditions.`}
            </p>
          </div>

          {/* Amenities & Infrastructure */}
          {facility.amenities?.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-white">Amenities & Infrastructure</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {facility.amenities.map((amenity) => (
                  <div
                    key={amenity}
                    className="flex items-center gap-2 rounded-xl border border-slate-800 bg-dark-850 px-3 py-2 text-xs text-slate-200"
                  >
                    <CheckCircle size={14} className="text-primary-400 shrink-0" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Facility Rules */}
          {facility.rules?.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-white">Rules & Guidelines</h2>
              <ul className="space-y-2 rounded-2xl border border-slate-800 bg-dark-850 p-4">
                {facility.rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="text-primary-400 font-bold">•</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Sticky Live Court Booking & Equipment Add-ons */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="sticky top-20 rounded-3xl border border-slate-800 bg-dark-850 p-6 space-y-5 shadow-2xl">
            <div className="border-b border-slate-800 pb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Book Ground / Court</h2>
                <span className="text-xs text-primary-400 font-semibold flex items-center gap-1">
                  <Sparkles size={13} /> Live System
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Select your match date and 1-hour session.
              </p>
            </div>

            {/* Date Picker */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <Calendar size={13} className="text-primary-400" /> Select Match Date
                </label>
                <span className="text-[11px] text-slate-400">
                  Up to {maxAdvance} days advance
                </span>
              </div>

              {/* Quick day buttons */}
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                {[
                  { label: "Today", dateStr: todayISO() },
                  { label: "Tomorrow", dateStr: dateAfterDays(1) },
                  { label: "In 2 Days", dateStr: dateAfterDays(2) },
                ].map((d) => (
                  <button
                    key={d.label}
                    type="button"
                    onClick={() => setDate(d.dateStr)}
                    className={`rounded-xl py-1.5 text-xs font-semibold transition ${
                      date === d.dateStr
                        ? "bg-primary-400 text-dark-950 shadow-glow-sm"
                        : "border border-slate-700 bg-dark-900 text-slate-300 hover:text-white"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              <input
                type="date"
                min={todayISO()}
                max={maxBookingDate}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3.5 py-2 text-xs text-white outline-none focus:border-primary-400"
              />
            </div>

            {/* Availability Slots Grid */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Select Time Slot (1 Hour Session)
              </label>
              <AvailabilityGrid
                slots={slots}
                selectedSlot={selectedSlot}
                onSelect={setSelectedSlot}
                onJoinWaitlist={handleOpenWaitlist}
              />
            </div>

            {/* Optional Equipment Add-ons */}
            {availableEquipment.length > 0 && (
              <div className="rounded-2xl border border-slate-800 bg-dark-900 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Dumbbell size={14} className="text-primary-400" />
                    <span>Add Sports Gear to Match</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">Rent for game</span>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {availableEquipment.slice(0, 4).map((eq) => {
                    const qty = selectedEquipment[eq._id] || 0;
                    return (
                      <div
                        key={eq._id}
                        className="flex items-center justify-between rounded-xl bg-dark-850 p-2.5 text-xs border border-slate-800"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="text-white font-semibold truncate">{eq.name}</div>
                          <div className="text-[10px] text-slate-400">
                            +${eq.rentalPrice || 5} • {eq.category}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {qty > 0 ? (
                            <div className="flex items-center gap-1.5 bg-dark-900 rounded-lg p-1 border border-slate-700">
                              <button
                                type="button"
                                onClick={() => handleRemoveEquipmentQty(eq._id)}
                                className="h-5 w-5 flex items-center justify-center rounded bg-slate-800 text-slate-300 hover:text-white"
                              >
                                <Minus size={10} />
                              </button>
                              <span className="w-4 text-center font-bold text-white text-xs">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAddEquipmentQty(eq._id)}
                                className="h-5 w-5 flex items-center justify-center rounded bg-primary-400 text-dark-950 font-bold"
                              >
                                <Plus size={10} />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddEquipmentQty(eq._id)}
                              className="rounded-lg bg-dark-800 hover:bg-dark-750 border border-slate-700 px-2 py-1 text-[11px] font-semibold text-primary-300"
                            >
                              + Add
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Notes Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Session Notes (Optional)
              </label>
              <input
                type="text"
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                placeholder="e.g. 4 players, need floodlight power..."
                className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-primary-400"
              />
            </div>

            {/* Pricing Summary */}
            {selectedSlot && (
              <div className="rounded-2xl border border-primary-400/30 bg-primary-400/10 p-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Selected Time:</span>
                  <strong className="text-white">{formatSlotLabel(selectedSlot)}</strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Court Rate (1 hr):</span>
                  <span>${pricePerHour}</span>
                </div>
                {equipmentTotal > 0 && (
                  <div className="flex justify-between text-slate-300">
                    <span>Equipment Add-ons:</span>
                    <span>+${equipmentTotal}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-white border-t border-primary-400/20 pt-2">
                  <span>Total Amount:</span>
                  <span className="text-primary-300 text-base">${grandTotal}</span>
                </div>
              </div>
            )}

            {/* Proceed to Payment Button */}
            <button
              type="button"
              onClick={handleStartBooking}
              disabled={!selectedSlot || bookingLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary-400 py-3 text-sm font-bold text-dark-950 hover:bg-primary-300 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-glow-sm"
            >
              <CreditCard size={16} />
              <span>
                {selectedSlot
                  ? `Proceed to Payment ($${grandTotal})`
                  : "Select an Open Slot to Book"}
              </span>
            </button>

            {/* Fair-Play Policy Explanation */}
            <div className="rounded-xl border border-slate-800 bg-dark-900/60 p-3 space-y-1.5 text-[11px] text-slate-400">
              <div className="font-semibold text-slate-300 flex items-center gap-1">
                <Info size={12} className="text-primary-400" /> Fair Allocation Rules
              </div>
              <p>• Max 2 active bookings per player across all facilities.</p>
              <p>• Prime-time evening slots (18:00–21:00) limited to 3 per week.</p>
              <p>• Free cancellation up to {facility.cancellationHours || 4} hours prior.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Gateway Modal (Card & Razorpay) */}
      <PaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Complete Court Reservation Payment"
        itemTitle={facility.name}
        itemSubtitle={`${date} • ${selectedSlot ? formatSlotLabel(selectedSlot) : ""}`}
        amount={grandTotal}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Waitlist Modal */}
      <Modal
        open={waitlistModalOpen}
        onClose={() => setWaitlistModalOpen(false)}
        title="Join Slot Waitlist"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <button
              onClick={() => setWaitlistModalOpen(false)}
              className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmWaitlist}
              className="rounded-xl bg-primary-400 px-5 py-2 text-xs font-bold text-dark-950 hover:bg-primary-300"
            >
              Join Waitlist Queue
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-xs text-slate-300">
          <p>
            You are joining the priority waitlist for <strong className="text-white">{facility.name}</strong> on{" "}
            <strong className="text-white">{date}</strong> at{" "}
            <strong className="text-primary-400">
              {waitlistSlot ? formatSlotLabel(waitlistSlot) : ""}
            </strong>.
          </p>
          <div className="rounded-xl bg-dark-900 p-3.5 border border-slate-800 space-y-1.5 text-[11px] text-slate-400">
            <p>• If the current booking is cancelled by the player, you will be notified immediately.</p>
            <p>• Fair queuing: waitlist positions are allocated strictly in first-come, first-served order.</p>
          </div>
        </div>
      </Modal>

      {/* Guest Authentication Prompt Modal */}
      <Modal
        open={guestAuthModalOpen}
        onClose={() => setGuestAuthModalOpen(false)}
        title="Athlete Profile Required"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-300 leading-relaxed">
            You are exploring as a guest. To reserve slots, join fair-use waitlists, or save favorites, an athlete account is needed to generate your digital game pass.
          </p>

          <div className="rounded-2xl border border-primary-400/30 bg-primary-400/10 p-4 space-y-3">
            <div className="flex items-center gap-1.5 font-bold text-primary-400">
              <Sparkles size={14} className="animate-pulse" />
              <span>Instant 1-Click Demo Option</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Skip typing passwords! Instantly authenticate as our Demo Athlete and immediately continue your reservation:
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
            <button
              type="button"
              onClick={() => {
                setGuestAuthModalOpen(false);
                router.push("/login");
              }}
              className="rounded-xl border border-slate-700 bg-dark-900 py-2 text-center text-xs font-semibold text-slate-200 hover:text-white hover:bg-dark-800 transition"
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setGuestAuthModalOpen(false);
                router.push("/register");
              }}
              className="rounded-xl border border-slate-700 bg-dark-900 py-2 text-center text-xs font-semibold text-slate-200 hover:text-white hover:bg-dark-800 transition"
            >
              Register Free
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
