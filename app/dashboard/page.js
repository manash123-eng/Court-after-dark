"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  Building2,
  Dumbbell,
  ShieldCheck,
  Bell,
  Heart,
  Plus,
  ArrowRight,
  Clock,
  Sparkles,
} from "lucide-react";
import Loading from "@/components/Loading";
import BookingCard from "@/components/BookingCard";
import FacilityCard from "@/components/FacilityCard";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

function StatCard({ icon: Icon, label, value, subtext, highlight = false }) {
  return (
    <div
      className={`rounded-2xl border p-5 flex items-center gap-4 transition ${
        highlight
          ? "border-primary-400/40 bg-primary-400/10 shadow-glow-sm"
          : "border-slate-800 bg-dark-850"
      }`}
    >
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${
          highlight
            ? "bg-primary-400 text-dark-950 font-bold"
            : "bg-dark-800 text-primary-400 border border-slate-700/80"
        }`}
      >
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-black text-white">{value}</p>
        <p className="text-xs text-slate-400 mt-0.5">{label}</p>
        {subtext && <p className="text-[10px] text-primary-400 font-semibold">{subtext}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading: userLoading } = useAuth();
  const { showToast } = useToast();

  const [bookings, setBookings] = useState([]);
  const [checkouts, setCheckouts] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  function loadDashboardData() {
    setLoading(true);
    Promise.all([
      fetch("/api/bookings").then((r) => r.json()),
      fetch("/api/equipment/checkout").then((r) => r.json()),
      fetch("/api/waitlist").then((r) => r.json()),
      fetch("/api/users/favorites").then((r) => r.json()),
    ])
      .then(([bData, cData, wData, fData]) => {
        setBookings(bData.bookings || []);
        setCheckouts(cData.checkouts || []);
        setWaitlist(wData.waitlist || []);
        setFavorites(fData.favorites || []);
      })
      .catch(() => showToast("Could not load dashboard data.", "error"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!userLoading) {
      loadDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoading]);

  async function handleCancelBooking(id) {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Cancelled", reason: "Cancelled from dashboard" }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Could not cancel.", "error");
        return;
      }
      showToast("Booking cancelled.");
      loadDashboardData();
    } catch {
      showToast("Cancellation failed.", "error");
    }
  }

  async function handleLeaveWaitlist(id) {
    try {
      const res = await fetch(`/api/waitlist?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Removed from waitlist.");
        loadDashboardData();
      }
    } catch {
      showToast("Could not remove from waitlist.", "error");
    }
  }

  if (userLoading || loading) return <Loading label="Loading player dashboard..." />;

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center space-y-4">
        <h1 className="text-2xl font-bold text-white">Sign In to View Dashboard</h1>
        <p className="text-xs text-slate-400">
          Track upcoming court games, gear checkouts, and priority waitlist updates.
        </p>
        <Link
          href="/login"
          className="inline-block rounded-xl bg-primary-400 px-6 py-2.5 text-xs font-bold text-dark-950 hover:bg-primary-300"
        >
          Log In
        </Link>
      </div>
    );
  }

  const upcoming = bookings.filter((b) => b.status === "Confirmed");
  const completed = bookings.filter((b) => b.status === "Completed");
  const cancelled = bookings.filter((b) => b.status === "Cancelled");
  const activeCheckouts = checkouts.filter((c) => c.status === "Checked Out");
  const maxActive = 2;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
      {/* Header Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary-400 mb-1">
            <Sparkles size={14} /> Player Portal
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Welcome back, {user.name.split(" ")[0]}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Review your active sessions, gear status, and fair-use quotas.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/facilities"
            className="flex items-center gap-1.5 rounded-xl bg-primary-400 px-4 py-2.5 text-xs font-bold text-dark-950 hover:bg-primary-300 transition shadow-glow-sm"
          >
            <Plus size={15} /> Book Court
          </Link>
          <Link
            href="/equipment"
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-dark-850 px-3.5 py-2.5 text-xs font-semibold text-slate-200 hover:text-white hover:bg-dark-800"
          >
            <Dumbbell size={15} /> Rent Gear
          </Link>
        </div>
      </div>

      {/* Stats KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={CalendarDays}
          label="Active Reservations"
          value={upcoming.length}
          subtext={`${upcoming.length} of ${maxActive} fair cap used`}
          highlight={upcoming.length > 0}
        />
        <StatCard icon={Building2} label="Completed Games" value={completed.length} />
        <StatCard
          icon={Dumbbell}
          label="Equipment In Use"
          value={activeCheckouts.length}
          subtext={activeCheckouts.length > 0 ? "Return after play" : "None active"}
        />
        <StatCard icon={XCircle} label="Cancelled Sessions" value={cancelled.length} />
      </div>

      {/* Waitlist Notifications (if any) */}
      {waitlist.length > 0 && (
        <section className="rounded-3xl border border-indigo-500/30 bg-indigo-500/10 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Bell size={16} className="text-indigo-400" />
              Active Priority Waitlists ({waitlist.length})
            </h2>
            <span className="text-[11px] text-indigo-300">
              Auto-monitored slot queue
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {waitlist.map((w) => (
              <div
                key={w._id}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-dark-900/90 p-4"
              >
                <div>
                  <h4 className="text-xs font-bold text-white">{w.facilityId?.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {w.date} • {w.startTime}-{w.endTime}
                  </p>
                  <span
                    className={`inline-block mt-1 text-[10px] font-semibold ${
                      w.status === "Notified"
                        ? "text-cyan-400 font-bold"
                        : "text-indigo-400"
                    }`}
                  >
                    Status: {w.status === "Notified" ? "Slot Released! Ready to book" : "Waiting in queue"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {w.status === "Notified" ? (
                    <Link
                      href={`/facilities/${w.facilityId?._id}`}
                      className="rounded-lg bg-primary-400 px-3 py-1.5 text-[11px] font-bold text-dark-950"
                    >
                      Book Now
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleLeaveWaitlist(w._id)}
                      className="text-xs text-slate-500 hover:text-red-400"
                    >
                      Leave
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Bookings Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Upcoming Bookings</h2>
            <p className="text-xs text-slate-400">Your scheduled court reservations</p>
          </div>
          <Link
            href="/bookings"
            className="text-xs font-semibold text-primary-400 hover:underline flex items-center gap-1"
          >
            All Bookings ({bookings.length}) <ArrowRight size={13} />
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <EmptyState
            title="No upcoming reservations"
            description="You don't have any sessions booked right now. Browse our night courts and reserve your next game."
            action={
              <Link
                href="/facilities"
                className="rounded-xl bg-primary-400 px-5 py-2 text-xs font-bold text-dark-950 hover:bg-primary-300"
              >
                Browse Facilities
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {upcoming.map((b) => (
              <BookingCard key={b._id} booking={b} onCancel={handleCancelBooking} />
            ))}
          </div>
        )}
      </section>

      {/* Saved Favorites Section */}
      {favorites.length > 0 && (
        <section className="space-y-4 border-t border-slate-800 pt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Heart size={18} className="text-red-400" />
              Saved Favorite Venues ({favorites.length})
            </h2>
            <Link
              href="/facilities"
              className="text-xs font-semibold text-primary-400 hover:underline"
            >
              Explore More →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {favorites.slice(0, 3).map((f) => (
              <FacilityCard key={f._id} facility={f} isFavorited={true} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
