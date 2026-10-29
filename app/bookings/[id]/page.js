"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ChevronLeft,
  Dumbbell,
  Printer,
  ShieldCheck,
  AlertTriangle,
  QrCode,
  Tag,
  CheckCircle,
  CreditCard,
  Smartphone,
  Download,
  Share2,
} from "lucide-react";
import Badge from "@/components/Badge";
import Loading from "@/components/Loading";
import Modal from "@/components/Modal";
import { formatSlotLabel } from "@/lib/bookingRules";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";

export default function BookingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancellingLoading, setCancellingLoading] = useState(false);

  function loadBooking() {
    setLoading(true);
    fetch(`/api/bookings/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.booking) setBooking(data.booking);
      })
      .catch(() => showToast("Could not load booking details.", "error"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadBooking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleConfirmCancel() {
    setCancellingLoading(true);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Cancelled",
          reason: cancelReason || "Cancelled by player",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Could not cancel booking.", "error");
        return;
      }
      showToast("Booking cancelled successfully.");
      setCancelModalOpen(false);
      loadBooking();
    } catch {
      showToast("Cancellation failed. Please try again.", "error");
    } finally {
      setCancellingLoading(false);
    }
  }

  if (loading) return <Loading label="Retrieving digital game pass & payment invoice..." />;
  if (!booking) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center space-y-4">
        <h1 className="text-xl font-bold text-white">Booking Not Found</h1>
        <p className="text-xs text-slate-400">
          This booking may have been removed or you may not have authorization to view it.
        </p>
        <Link
          href="/bookings"
          className="inline-block rounded-xl bg-primary-400 px-5 py-2 text-xs font-bold text-dark-950"
        >
          Return to My Bookings
        </Link>
      </div>
    );
  }

  const facility = booking.facilityId || {};
  const isConfirmed = booking.status === "Confirmed";
  const isCancelled = booking.status === "Cancelled";
  const isPaid = booking.paymentStatus === "Paid";
  const paymentMethod = booking.paymentMethod || "Card";
  const paymentDetails = booking.paymentDetails || {};
  const hasEquipment = booking.equipmentAddons && booking.equipmentAddons.length > 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/bookings")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ChevronLeft size={16} /> Back to My Bookings
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-dark-850 px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-dark-800 transition"
          >
            <Printer size={14} /> Print Pass
          </button>
        </div>
      </div>

      {/* Digital Stadium Ticket Pass */}
      <div className="overflow-hidden rounded-3xl border border-slate-800 bg-dark-850 shadow-2xl">
        {/* Pass Top Banner */}
        <div className="relative bg-gradient-to-r from-dark-900 via-dark-800 to-dark-900 p-6 sm:p-8 border-b border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold tracking-widest text-primary-400 uppercase">
                  {booking.bookingReference || "CAD-SESSION"}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs font-bold uppercase text-slate-400">
                  {facility.type || "Sports Court"}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
                {facility.name}
              </h1>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                <MapPin size={13} className="text-primary-400" />
                {facility.location} • {facility.city || "Downtown"}
              </p>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
              <Badge size="md">{booking.status}</Badge>
              <span className="text-[11px] text-slate-400">
                Booked: {new Date(booking.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Pass Body Content */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Key Session Details 4-box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-dark-900/90 p-5 rounded-2xl border border-slate-800">
            <div>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Calendar size={13} className="text-primary-400" /> Match Date
              </span>
              <p className="text-sm font-bold text-white mt-1">{booking.date}</p>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock size={13} className="text-primary-400" /> Slot Time
              </span>
              <p className="text-sm font-bold text-white mt-1">
                {formatSlotLabel(`${booking.startTime}-${booking.endTime}`)}
              </p>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Tag size={13} className="text-primary-400" /> Total Fee
              </span>
              <p className="text-sm font-bold text-primary-400 mt-1">
                ${booking.totalPrice || booking.pricePerHour || 40}
              </p>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <CheckCircle size={13} className="text-primary-400" /> Payment
              </span>
              <div className="mt-1 flex items-center gap-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  isPaid ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" : "bg-amber-500/15 text-amber-300"
                }`}>
                  {isPaid ? "✓ PAID" : booking.paymentStatus || "Pay at Venue"}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method & Verified Invoice Box */}
          <div className="rounded-2xl border border-slate-800 bg-dark-900/80 p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                {paymentMethod === "Razorpay" ? (
                  <Smartphone size={14} className="text-cyan-400" />
                ) : (
                  <CreditCard size={14} className="text-primary-400" />
                )}
                <span>Payment & Transaction Receipt</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">
                {paymentDetails.razorpayPaymentId || paymentDetails.paymentId || `REF-${booking.bookingReference}`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Gateway:</span>
                  <strong className="text-white">
                    {paymentMethod === "Razorpay" ? "Razorpay (UPI / NetBanking)" : paymentMethod === "Card" ? "Credit / Debit Card (256-Bit SSL)" : "Pay at Venue Desk"}
                  </strong>
                </div>
                {paymentDetails.cardLast4 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Card ending in:</span>
                    <strong className="text-white">•••• {paymentDetails.cardLast4} ({paymentDetails.cardBrand || "VISA"})</strong>
                  </div>
                )}
                {paymentDetails.razorpayPaymentId && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Razorpay Pay ID:</span>
                    <strong className="text-cyan-300 font-mono">{paymentDetails.razorpayPaymentId}</strong>
                  </div>
                )}
                {paymentDetails.upiId && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">VPA / UPI ID:</span>
                    <strong className="text-cyan-300">{paymentDetails.upiId}</strong>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Court Slot Fee:</span>
                  <span>${booking.pricePerHour || 40}</span>
                </div>
                {booking.equipmentTotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Equipment Add-ons:</span>
                    <span>+${booking.equipmentTotal}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-white border-t border-slate-800 pt-1.5">
                  <span>Grand Total Paid:</span>
                  <span className="text-primary-400 text-sm">${booking.totalPrice}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Equipment Addons List if present */}
          {hasEquipment && (
            <div className="rounded-2xl border border-slate-800 bg-dark-900/60 p-4 space-y-2">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Dumbbell size={14} className="text-primary-400" />
                <span>Reserved Sports Equipment ({booking.equipmentAddons.length})</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {booking.equipmentAddons.map((eq, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-dark-850 border border-slate-800">
                    <span className="text-slate-200">{eq.name} × {eq.quantity}</span>
                    <span className="text-primary-300 font-bold">${eq.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Player & Gate Check-In Rules */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div className="space-y-2">
              <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                Athlete Details
              </h3>
              <div className="rounded-xl border border-slate-800 bg-dark-900/60 p-3.5 space-y-1.5 text-slate-300">
                <p>
                  Name: <strong className="text-white">{booking.userId?.name || user?.name}</strong>
                </p>
                <p>
                  Email: <span className="text-slate-400">{booking.userId?.email || user?.email}</span>
                </p>
                {booking.notes && (
                  <p className="pt-1 text-slate-400 italic">
                    Note: "{booking.notes}"
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                Session Check-In Rules
              </h3>
              <div className="rounded-xl border border-slate-800 bg-dark-900/60 p-3.5 space-y-1.5 text-slate-400">
                <p>• Show this digital pass or reference ID to the court coordinator.</p>
                <p>• Arrive 10 minutes prior for warmup and footwear check.</p>
                <p>• Non-marking athletic gum-rubber footwear mandatory.</p>
              </div>
            </div>
          </div>

          {/* Cancellation Notice if already cancelled */}
          {isCancelled && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-xs text-red-300 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle size={15} /> Booking Cancelled
              </p>
              <p className="text-[11px] text-red-400">
                Reason: {booking.cancellationReason || "Player requested cancellation"}. This slot has been freed.
              </p>
            </div>
          )}

          {/* Bottom Action Footer */}
          {isConfirmed && (
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] text-slate-400">
                Free cancellation allowed up to {facility.cancellationHours || 4} hours prior to start.
              </span>
              <button
                type="button"
                onClick={() => setCancelModalOpen(true)}
                className="w-full sm:w-auto rounded-xl border border-red-500/40 text-red-400 px-4 py-2 text-xs font-bold hover:bg-red-500/10 transition"
              >
                Cancel This Reservation
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cancellation Confirmation Modal */}
      <Modal
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Confirm Cancellation"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <button
              onClick={() => setCancelModalOpen(false)}
              className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300"
            >
              Keep Pass
            </button>
            <button
              onClick={handleConfirmCancel}
              disabled={cancellingLoading}
              className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-500"
            >
              {cancellingLoading ? "Cancelling..." : "Confirm Cancellation"}
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-xs text-slate-300">
          <p>
            You are cancelling booking <strong className="text-white">{booking.bookingReference}</strong> for{" "}
            <strong className="text-white">{facility.name}</strong> on{" "}
            <strong className="text-white">{booking.date}</strong> ({booking.startTime}–{booking.endTime}).
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Cancellation Reason
            </label>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Schedule clash, team unavailability..."
              className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-xs text-white outline-none focus:border-primary-400"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
