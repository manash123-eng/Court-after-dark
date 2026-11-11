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
import EmptyState from "@/components/EmptyState";
import AvailabilityGrid from "@/components/AvailabilityGrid";
import Modal from "@/components/Modal";
import PaymentModal from "@/components/PaymentModal";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { formatSlotLabel } from "@/lib/slotUtils";
import { getEquipmentImage, handleEquipmentImageError } from "@/lib/equipmentImages";

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function dateAfterDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

export default function FacilityDetailPage({ params }) {
  const routeParams = useParams();
  const id = params?.id || routeParams?.id;
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
  const [pendingAction, setPendingAction] = useState(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [bookingNotes, setBookingNotes] = useState("");
  const [isFavorited, setIsFavorited] = useState(false);

  function loadAvailability() {
    if (!id) return;
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
  }, [id, date]);

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
      showToast("Please choose an available time slot first.", "error");
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
      const loggedUser = await loginDemo("player");
      showToast(`Welcome ${loggedUser.name}! Signed in as Demo Student.`);
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

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || "Could not complete booking.", "error");
        loadAvailability();
        return;
      }

      showToast("Facility reserved successfully! Your digital gate pass is ready.");
      const bookingId = data.booking?._id || data.booking?.id;
      if (bookingId) {
        router.push(`/bookings/${bookingId}`);
      } else {
        router.push("/bookings");
      }
    } catch (err) {
      console.error("Booking error:", err);
      showToast(err.message || "Something went wrong during reservation. Please retry.", "error");
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
  if (!facility) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <EmptyState
          icon={AlertCircle}
          title="Facility Not Found"
          description="The court or arena you requested could not be located, or may have been updated. Explore all available campus facilities in our directory."
          action={
            <div className="flex items-center gap-3">
              <button
                onClick={loadAvailability}
                className="rounded-lg bg-[#a71d2a] px-4 py-2 text-xs font-bold text-white hover:bg-[#8e1520] transition"
              >
                Retry Loading
              </button>
              <Link
                href="/facilities"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Browse All Facilities
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  const maxAdvance = rules?.maxAdvanceBookingDays || 14;
  const maxBookingDate = dateAfterDays(maxAdvance);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/facilities"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#a71d2a] transition"
        >
          <ChevronLeft size={16} /> Back to Facilities Directory
        </Link>
        <button
          onClick={handleToggleFavorite}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition cursor-pointer ${
            isFavorited
              ? "bg-red-50 text-[#a71d2a] border-red-200"
              : "border-slate-300 bg-white text-slate-600 hover:text-slate-900"
          }`}
        >
          <Heart size={14} fill={isFavorited ? "currentColor" : "none"} />
          <span>{isFavorited ? "Favorited" : "Save to Favorites"}</span>
        </button>
      </div>

      {/* Main Grid: Left Details & Right Booking Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (7 cols): Facility Info & Photos */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Hero Banner Photo */}
          <div className="relative h-72 sm:h-96 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-xs">
            <img
              src={
                facility.image ||
                "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&q=80&auto=format&fit=crop"
              }
              alt={facility.name}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              <Badge>{facility.status}</Badge>
              {facility.indoorOutdoor && (
                <span className="rounded-full bg-white/95 border border-slate-300 px-3 py-1 text-xs font-bold text-slate-800 shadow-xs">
                  {facility.indoorOutdoor}
                </span>
              )}
            </div>

            <div className="absolute bottom-5 left-5 right-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-white">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  {facility.type}
                </span>
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                  {facility.name}
                </h1>
                <div className="flex items-center gap-1.5 text-xs text-slate-200 mt-1">
                  <MapPin size={14} className="text-[#f87171]" />
                  <span>
                    {facility.campusLocation || facility.location} • Lovely Professional University
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-white/95 border border-slate-200 px-3.5 py-1.5 shadow-sm text-slate-800 self-start sm:self-auto">
                <span className="text-xs text-slate-500 font-semibold">Rate: </span>
                <span className="text-xl font-black text-[#a71d2a]">₹{pricePerHour}</span>
                <span className="text-xs text-slate-500"> / hr</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <span className="text-[11px] text-slate-500 flex items-center gap-1 font-semibold">
                <Users size={12} className="text-[#a71d2a]" /> Max Players
              </span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{facility.capacity} Persons</p>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 flex items-center gap-1 font-semibold">
                <Clock size={12} className="text-[#a71d2a]" /> Operating Hours
              </span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {facility.openingTime} – {facility.closingTime}
              </p>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 flex items-center gap-1 font-semibold">
                <Layers size={12} className="text-[#a71d2a]" /> Surface Type
              </span>
              <p className="text-sm font-bold text-slate-900 mt-0.5 truncate">
                {facility.surfaceType || "Synthetic Professional"}
              </p>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 flex items-center gap-1 font-semibold">
                <ShieldCheck size={12} className="text-emerald-600" /> Free Cancellation
              </span>
              <p className="text-sm font-bold text-emerald-700 mt-0.5">
                Up to {facility.cancellationHours || 4}h prior
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
            <h2 className="text-base font-bold text-slate-900">Facility Overview</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {facility.description ||
                `${facility.name} is an official athletic facility maintained to university standards with full evening illumination and regular maintenance by the LPU Department of Sports.`}
            </p>
          </div>

          {/* Amenities & Infrastructure */}
          {facility.amenities?.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
              <h2 className="text-base font-bold text-slate-900">Amenities & Infrastructure</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {facility.amenities.map((amenity) => (
                  <div
                    key={amenity}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
                  >
                    <CheckCircle size={14} className="text-[#a71d2a] shrink-0" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Facility Rules */}
          {facility.rules?.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
              <h2 className="text-base font-bold text-slate-900">Rules & Guidelines</h2>
              <ul className="space-y-2">
                {facility.rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                    <span className="text-[#a71d2a] font-bold">•</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Sticky Live Court Booking & Equipment Add-ons */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="sticky top-20 rounded-xl border border-slate-200 bg-white p-6 space-y-5 shadow-xs">
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">Reserve Facility Slot</h2>
                <span className="text-xs text-[#a71d2a] font-bold flex items-center gap-1">
                  <Sparkles size={13} /> Live System
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Select your session date and available 1-hour slot.
              </p>
            </div>

            {/* Date Picker */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Calendar size={13} className="text-[#a71d2a]" /> Select Date
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
                    className={`rounded-lg py-1.5 text-xs font-bold transition cursor-pointer ${
                      date === d.dateStr
                        ? "bg-[#a71d2a] text-white shadow-xs"
                        : "border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100"
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
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-[#a71d2a] focus:bg-white cursor-pointer"
              />
            </div>

            {/* Availability Slots Grid */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
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
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Dumbbell size={14} className="text-[#a71d2a]" />
                    <span>Add Sports Gear to Session</span>
                  </h4>
                  <span className="text-[10px] text-slate-500 font-semibold">Store Checkout</span>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {availableEquipment.slice(0, 4).map((eq) => {
                    const qty = selectedEquipment[eq._id] || 0;
                    return (
                      <div
                        key={eq._id}
                        className="flex items-center justify-between rounded-lg bg-white p-2 text-xs border border-slate-200"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <div className="h-8 w-8 rounded overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                            <img
                              src={getEquipmentImage(eq)}
                              alt={eq.name}
                              onError={(e) => handleEquipmentImageError(e, eq)}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="text-slate-900 font-bold truncate">{eq.name}</div>
                            <div className="text-[10px] text-slate-500">
                              +₹{eq.rentalPrice || 5} • {eq.category}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {qty > 0 ? (
                            <div className="flex items-center gap-1 bg-slate-100 rounded p-1 border border-slate-200">
                              <button
                                type="button"
                                onClick={() => handleRemoveEquipmentQty(eq._id)}
                                className="h-5 w-5 flex items-center justify-center rounded bg-white text-slate-700 hover:bg-slate-200 cursor-pointer"
                              >
                                <Minus size={10} />
                              </button>
                              <span className="w-4 text-center font-bold text-slate-900 text-xs">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAddEquipmentQty(eq._id)}
                                className="h-5 w-5 flex items-center justify-center rounded bg-[#a71d2a] text-white font-bold cursor-pointer"
                              >
                                <Plus size={10} />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddEquipmentQty(eq._id)}
                              className="rounded border border-slate-300 bg-slate-50 hover:bg-slate-100 px-2 py-1 text-[11px] font-bold text-[#a71d2a] cursor-pointer"
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
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Session Notes (Optional)
              </label>
              <input
                type="text"
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                placeholder="e.g. 4 players, need floodlight power..."
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-[#a71d2a] focus:bg-white"
              />
            </div>

            {/* Pricing Summary */}
            {selectedSlot && (
              <div className="rounded-lg border border-red-200 bg-red-50/70 p-3.5 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-700">
                  <span>Selected Time:</span>
                  <strong className="text-slate-900">{formatSlotLabel(selectedSlot)}</strong>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Court Rate (1 hr):</span>
                  <span>₹{pricePerHour}</span>
                </div>
                {equipmentTotal > 0 && (
                  <div className="flex justify-between text-slate-700">
                    <span>Equipment Add-ons:</span>
                    <span>+₹{equipmentTotal}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-red-200 pt-2">
                  <span>Total Amount:</span>
                  <span className="text-[#a71d2a] text-base">₹{grandTotal}</span>
                </div>
              </div>
            )}

            {/* Proceed to Payment Button */}
            <button
              type="button"
              onClick={handleStartBooking}
              disabled={!selectedSlot || bookingLoading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#a71d2a] py-3 text-sm font-bold text-white hover:bg-[#8e1520] disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs cursor-pointer"
            >
              <CreditCard size={16} />
              <span>
                {selectedSlot
                  ? `Proceed to Payment (₹${grandTotal})`
                  : "Select an Open Slot to Book"}
              </span>
            </button>

            {/* Fair-Play Policy Explanation */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1 text-[11px] text-slate-600">
              <div className="font-bold text-slate-800 flex items-center gap-1">
                <Info size={12} className="text-[#a71d2a]" /> Fair Allocation Rules
              </div>
              <p>• Max 2 active bookings per student across all campus venues.</p>
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
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmWaitlist}
              className="rounded-lg bg-[#a71d2a] px-5 py-2 text-xs font-bold text-white hover:bg-[#8e1520]"
            >
              Join Waitlist Queue
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-xs text-slate-700">
          <p>
            You are joining the priority waitlist for <strong className="text-slate-900">{facility.name}</strong> on{" "}
            <strong className="text-slate-900">{date}</strong> at{" "}
            <strong className="text-[#a71d2a]">
              {waitlistSlot ? formatSlotLabel(waitlistSlot) : ""}
            </strong>.
          </p>
          <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-200 space-y-1.5 text-[11px] text-slate-600">
            <p>• If the slot is cancelled by the booked student, you will be notified immediately.</p>
            <p>• Fair queuing: waitlist positions are allocated strictly in first-come, first-served order.</p>
          </div>
        </div>
      </Modal>

      {/* Guest Authentication Prompt Modal */}
      <Modal
        open={guestAuthModalOpen}
        onClose={() => setGuestAuthModalOpen(false)}
        title="Student Authentication Required"
      >
        <div className="space-y-4 text-xs text-slate-700">
          <p className="leading-relaxed">
            Please log in with your LPU student credentials or use an instant 1-click demo role to reserve this facility.
          </p>

          <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
            <div className="flex items-center gap-1.5 font-bold text-[#a71d2a]">
              <Sparkles size={14} />
              <span>Instant 1-Click Demo Option</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Skip typing passwords! Instantly authenticate as our Demo Student and immediately continue your reservation:
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
                  <span>Signing In as Demo Student...</span>
                </>
              ) : (
                <>
                  <User size={13} />
                  <span>Continue as Demo Student (Aarav Sharma)</span>
                </>
              )}
            </button>
          </div>

          <div className="relative flex items-center justify-center pt-2">
            <div className="w-full border-t border-slate-200"></div>
            <span className="absolute bg-white px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
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
              className="rounded-lg border border-slate-300 bg-white py-2 text-center text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Student Login
            </button>
            <button
              type="button"
              onClick={() => {
                setGuestAuthModalOpen(false);
                router.push("/register");
              }}
              className="rounded-lg bg-[#a71d2a] py-2 text-center text-xs font-bold text-white hover:bg-[#8e1520] transition cursor-pointer"
            >
              Register Free
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
