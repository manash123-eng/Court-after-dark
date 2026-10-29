"use client";

import Link from "next/link";
import { Calendar, Clock, MapPin, Tag, ChevronRight, AlertTriangle, CreditCard, Smartphone, Dumbbell } from "lucide-react";
import Badge from "@/components/Badge";
import { formatSlotLabel } from "@/lib/bookingRules";

export default function BookingCard({ booking, onCancel }) {
  const facility = booking.facilityId || {};
  const isPaid = booking.paymentStatus === "Paid";
  const hasEquipment = booking.equipmentAddons && booking.equipmentAddons.length > 0;

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800/80 bg-dark-850 p-5 hover:border-primary-400/40 hover:bg-dark-800 transition duration-200 shadow-md">
      <div>
        {/* Header: Ref, Sport & Status */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold tracking-wider text-primary-400">
                {booking.bookingReference || "CAD-BOOKING"}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs uppercase font-semibold text-slate-400">
                {facility.type || "Sports Court"}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-primary-300 transition mt-0.5">
              {facility.name || "Sports Facility"}
            </h3>
          </div>
          <Badge>{booking.status}</Badge>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 py-3 border-y border-slate-800/80">
          <span className="flex items-center gap-1.5 text-slate-200">
            <Calendar size={13} className="text-primary-400 shrink-0" /> {booking.date}
          </span>
          <span className="flex items-center gap-1.5 text-slate-200">
            <Clock size={13} className="text-primary-400 shrink-0" />{" "}
            {formatSlotLabel(`${booking.startTime}-${booking.endTime}`)}
          </span>
          <span className="flex items-center gap-1.5 text-slate-400 truncate">
            <MapPin size={13} className="text-slate-500 shrink-0" /> {facility.location || "Venue"}
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <Tag size={13} className="text-slate-500 shrink-0" />
            <strong className="text-primary-400">${booking.totalPrice || booking.pricePerHour || 40}</strong>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              isPaid ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"
            }`}>
              {booking.paymentMethod === "Razorpay" ? "⚡ Razorpay" : booking.paymentMethod === "Card" ? "💳 Card" : "Venue"}: {booking.paymentStatus || "Pay at Venue"}
            </span>
          </span>
        </div>

        {/* Equipment Addons Badge if any */}
        {hasEquipment && (
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-400 bg-dark-900 px-2.5 py-1 rounded-lg border border-slate-800">
            <Dumbbell size={12} className="text-primary-400" />
            <span>Includes {booking.equipmentAddons.length} Gear Add-on(s): {booking.equipmentAddons.map((e) => e.name).join(", ")}</span>
          </div>
        )}

        {/* Cancellation Notice if cancelled */}
        {booking.status === "Cancelled" && (
          <div className="mt-2.5 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-[11px] text-red-300 flex items-center gap-1.5">
            <AlertTriangle size={13} className="shrink-0" />
            <span>Cancelled: {booking.cancellationReason || "Released slot"}</span>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-3 mt-1 border-t border-slate-800/60">
        <Link
          href={`/bookings/${booking._id}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-primary-400 hover:text-primary-300 hover:underline"
        >
          <span>Digital Game Pass & Invoice</span>
          <ChevronRight size={13} />
        </Link>

        {booking.status === "Confirmed" && onCancel && (
          <button
            type="button"
            onClick={() => onCancel(booking._id)}
            className="text-xs font-semibold text-red-400 hover:text-red-300 hover:underline"
          >
            Cancel Reservation
          </button>
        )}
      </div>
    </div>
  );
}
