"use client";

import { useState } from "react";
import {
  Calendar,
  Clock,
  Dumbbell,
  ShieldCheck,
  Check,
  CreditCard,
  Sparkles,
  Info,
  ChevronRight,
  Layers,
} from "lucide-react";
import Modal from "@/components/Modal";
import PaymentModal from "@/components/PaymentModal";

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function dateAfterDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

export default function EquipmentBookingModal({
  open,
  onClose,
  item,
  userBookings = [],
  onBookingComplete,
}) {
  const [date, setDate] = useState(todayISO());
  const [quantity, setQuantity] = useState(1);
  const [durationHours, setDurationHours] = useState(2);
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!item) return null;

  const rentalRate = item.rentalPrice || 6;
  const durationMultiplier = Math.max(1, Math.round(durationHours / 2));
  const subtotal = rentalRate * quantity * durationMultiplier;

  function handleOpenPayment() {
    setPaymentModalOpen(true);
  }

  async function handlePaymentSuccess(paymentResult) {
    setSubmitting(true);
    setPaymentModalOpen(false);

    try {
      const res = await fetch("/api/equipment/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipmentId: item._id,
          quantity,
          bookingId: selectedBookingId || undefined,
          rentalDate: date,
          durationHours,
          paymentMethod: paymentResult.method,
          paymentStatus: paymentResult.method === "Pay at Venue" ? "Pay at Venue" : "Paid",
          paymentDetails: paymentResult,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Equipment checkout failed");
      }

      onBookingComplete(data);
      onClose();
    } catch (err) {
      alert(err.message || "Something went wrong during checkout.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Modal
        open={open && !paymentModalOpen}
        onClose={onClose}
        title={`Book Equipment: ${item.name}`}
      >
        <div className="space-y-5 text-xs text-slate-300">
          {/* Item Highlight Header */}
          <div className="flex items-center gap-3.5 rounded-2xl border border-slate-800 bg-dark-900/90 p-4">
            <div className="h-16 w-16 rounded-xl overflow-hidden bg-dark-800 shrink-0 border border-slate-700">
              <img
                src={item.image || "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&q=80"}
                alt={item.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary-400">
                {item.category} • Condition: {item.condition}
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white truncate">
                {item.name}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                In Stock: <strong className="text-emerald-400">{item.availableQuantity}</strong> of {item.totalQuantity} units
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] text-slate-400">Rate</span>
              <div className="text-lg font-black text-primary-400">${rentalRate}</div>
              <span className="text-[10px] text-slate-500">/ 2h session</span>
            </div>
          </div>

          {/* Rental Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar size={13} className="text-primary-400" />
              Rental Date
            </label>
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              {[
                { label: "Today", val: todayISO() },
                { label: "Tomorrow", val: dateAfterDays(1) },
                { label: "In 2 Days", val: dateAfterDays(2) },
              ].map((d) => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => setDate(d.val)}
                  className={`py-1.5 rounded-xl text-xs font-semibold transition ${
                    date === d.val
                      ? "bg-primary-400 text-dark-950 shadow-glow-sm"
                      : "bg-dark-900 border border-slate-700 text-slate-300 hover:text-white"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <input
              type="date"
              min={todayISO()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-xs text-white outline-none focus:border-primary-400"
            />
          </div>

          {/* Quantity & Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Quantity to Rent
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={item.availableQuantity || 1}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.min(item.availableQuantity, Math.max(1, parseInt(e.target.value) || 1)))
                  }
                  className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-xs text-white outline-none focus:border-primary-400 text-center font-bold"
                />
                <span className="text-xs text-slate-500 whitespace-nowrap">
                  max {item.availableQuantity}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Rental Duration
              </label>
              <select
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-xs text-white outline-none focus:border-primary-400 cursor-pointer"
              >
                <option value={1}>1 Hour Session</option>
                <option value={2}>2 Hours (Standard)</option>
                <option value={4}>4 Hours (Half Day)</option>
                <option value={8}>Full Day Pass</option>
              </select>
            </div>
          </div>

          {/* Link to Active Court Booking */}
          {userBookings.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Layers size={13} className="text-primary-400" />
                Link to Your Court Reservation (Optional)
              </label>
              <select
                value={selectedBookingId}
                onChange={(e) => setSelectedBookingId(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-xs text-white outline-none focus:border-primary-400 cursor-pointer"
              >
                <option value="">Independent Play (No court link)</option>
                {userBookings.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.facilityId?.name} ({b.date} • {b.startTime}-{b.endTime}) Ref: {b.bookingReference}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Rental Cost Calculation */}
          <div className="rounded-2xl border border-primary-400/30 bg-primary-400/10 p-4 space-y-1.5">
            <div className="flex justify-between text-slate-300">
              <span>Rental Rate:</span>
              <span>${rentalRate} × {quantity} unit(s)</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Duration:</span>
              <span>{durationHours} Hours</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-white border-t border-primary-400/20 pt-2 mt-1">
              <span>Total Rental Amount:</span>
              <span className="text-primary-300 text-base">${subtotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Action CTA */}
          <button
            type="button"
            disabled={submitting}
            onClick={handleOpenPayment}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary-400 py-3 text-sm font-bold text-dark-950 hover:bg-primary-300 transition shadow-glow-sm"
          >
            <span>Proceed to Payment (${subtotal.toFixed(2)})</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </Modal>

      {/* Embedded Payment Modal */}
      <PaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Payment: Sports Equipment Rental"
        itemTitle={`${quantity}x ${item.name}`}
        itemSubtitle={`${date} • ${durationHours} hrs rental`}
        amount={subtotal}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </>
  );
}

