"use client";

import { useEffect, useState } from "react";
import { Search, CalendarDays, Check, X, Tag, Trash2, Eye } from "lucide-react";
import Loading from "@/components/Loading";
import Badge from "@/components/Badge";
import { useToast } from "@/contexts/ToastContext";
import { formatSlotLabel } from "@/lib/bookingRules";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const { showToast } = useToast();

  function load() {
    setLoading(true);
    fetch("/api/bookings?all=true")
      .then((r) => r.json())
      .then((d) => setBookings(d.bookings || []))
      .catch(() => showToast("Could not load bookings.", "error"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updateStatus(id, status) {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reason: `Admin marked as ${status}` }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Could not update status.", "error");
        return;
      }
      showToast(`Booking marked as ${status}.`);
      load();
    } catch {
      showToast("Update failed.", "error");
    }
  }

  async function updatePaymentStatus(id, paymentStatus) {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Could not update payment.", "error");
        return;
      }
      showToast(`Payment status updated to ${paymentStatus}.`);
      load();
    } catch {
      showToast("Payment status update failed.", "error");
    }
  }

  async function handleDelete(id, ref) {
    if (!confirm(`Permanently delete booking ${ref}?`)) return;
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Booking record removed.");
        load();
      }
    } catch {
      showToast("Delete failed.", "error");
    }
  }

  if (loading) return <Loading label="Loading all booking records..." />;

  const filtered = bookings.filter((b) => {
    const matchesFilter = filter === "All" || b.status === filter;
    const matchesSearch =
      !search.trim() ||
      b.bookingReference?.toLowerCase().includes(search.toLowerCase()) ||
      b.facilityId?.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.userId?.email?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-8 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary-400">
            Booking & Allocation Control
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1">Manage Bookings</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Review live reservations, audit cancellations, and oversee payment reconciliation.
          </p>
        </div>

        <div className="text-xs text-slate-400 bg-dark-850 border border-slate-800 px-4 py-2 rounded-xl">
          Total Bookings Recorded: <strong className="text-white">{bookings.length}</strong>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {["All", "Confirmed", "Completed", "Cancelled", "Rejected"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition whitespace-nowrap ${
                filter === tab
                  ? "bg-primary-400 text-dark-950 shadow-glow-sm"
                  : "border border-slate-800 bg-dark-850 text-slate-400 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ref, player, or court..."
            className="w-full rounded-xl border border-slate-700 bg-dark-850 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-primary-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-dark-850 shadow-md">
        <table className="w-full text-xs">
          <thead className="bg-dark-900 border-b border-slate-800 text-slate-400">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Reference & Court</th>
              <th className="text-left px-4 py-3 font-semibold">Player</th>
              <th className="text-left px-4 py-3 font-semibold">Date & Time</th>
              <th className="text-left px-4 py-3 font-semibold">Pricing & Payment</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-right px-4 py-3 font-semibold">Status Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  No booking records matching criteria.
                </td>
              </tr>
            ) : (
              filtered.map((b) => (
                <tr key={b._id} className="hover:bg-dark-800/60 transition">
                  <td className="px-4 py-3">
                    <p className="font-bold text-white text-sm">{b.facilityId?.name || "Facility"}</p>
                    <p className="font-mono text-[10px] text-primary-400 font-semibold">
                      {b.bookingReference || "CAD-REF"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-200">{b.userId?.name}</p>
                    <p className="text-[10px] text-slate-500">{b.userId?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    <p className="font-bold text-white">{b.date}</p>
                    <p className="text-[10px] text-slate-400">
                      {formatSlotLabel(`${b.startTime}-${b.endTime}`)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-primary-400">
                      ${b.totalPrice || b.pricePerHour || 40}
                    </p>
                    <button
                      onClick={() =>
                        updatePaymentStatus(
                          b._id,
                          b.paymentStatus === "Paid" ? "Pay at Venue" : "Paid"
                        )
                      }
                      title="Click to toggle payment status"
                      className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      {b.paymentStatus || "Pay at Venue"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <Badge size="xs">{b.status}</Badge>
                    {b.cancellationReason && (
                      <p className="text-[10px] text-red-400 mt-0.5 truncate max-w-[120px]">
                        {b.cancellationReason}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {b.status === "Confirmed" && (
                      <>
                        <button
                          onClick={() => updateStatus(b._id, "Completed")}
                          className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2 py-1 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/25"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => updateStatus(b._id, "Cancelled")}
                          className="rounded-lg bg-red-500/15 border border-red-500/30 px-2 py-1 text-[11px] font-bold text-red-400 hover:bg-red-500/25"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {b.status === "Cancelled" && (
                      <button
                        onClick={() => updateStatus(b._id, "Confirmed")}
                        className="text-[11px] text-primary-400 hover:underline"
                      >
                        Re-confirm
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(b._id, b.bookingReference)}
                      title="Delete record"
                      className="text-slate-500 hover:text-red-400 ml-2"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
