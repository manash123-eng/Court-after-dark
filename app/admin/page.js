"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Wrench,
  Dumbbell,
  Users,
  DollarSign,
  TrendingUp,
  Plus,
  ArrowRight,
  ShieldAlert,
  Clock,
  Sparkles,
} from "lucide-react";
import Loading from "@/components/Loading";
import Badge from "@/components/Badge";
import { formatSlotLabel } from "@/lib/bookingRules";

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

export default function AdminOverviewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/facilities").then((r) => r.json()),
      fetch("/api/bookings?all=true").then((r) => r.json()),
      fetch("/api/equipment").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
      fetch("/api/maintenance").then((r) => r.json()),
      fetch("/api/admin/reports").then((r) => r.json()),
    ])
      .then(([facilities, bookings, equipment, users, maintenance, reports]) => {
        setData({
          facilities: facilities.facilities || [],
          bookings: bookings.bookings || [],
          equipment: equipment.equipment || [],
          users: users.users || [],
          maintenance: maintenance.blocks || [],
          reports: reports.metrics || {},
          sportCounts: reports.sportCounts || {},
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) return <Loading label="Calculating administrative KPIs..." />;

  const today = new Date().toISOString().split("T")[0];
  const todaysBookings = data.bookings.filter((b) => b.date === today);
  const availableCount = data.facilities.filter((f) => f.status === "Available").length;
  const maintenanceCount = data.facilities.filter((f) => f.status === "Maintenance").length;

  const totalRevenue = data.reports.totalRevenue || 0;
  const activePlayers = data.users.filter((u) => u.role === "player").length;

  // Sport distribution max for chart calculation
  const sportEntries = Object.entries(data.sportCounts || {});
  const maxSportCount = Math.max(1, ...sportEntries.map(([_, count]) => count));

  return (
    <div className="p-4 sm:p-8 max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
            <Sparkles size={14} /> Control Center & Key Performance Indicators
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Admin Overview</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time platform operations, live slot utilization, and facility status.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/facilities"
            className="flex items-center gap-1.5 rounded-xl bg-primary-400 px-3.5 py-2 text-xs font-bold text-dark-950 hover:bg-primary-300 transition"
          >
            <Plus size={14} /> Add Venue
          </Link>
          <Link
            href="/admin/maintenance"
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-dark-850 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:text-white"
          >
            <Wrench size={14} /> Schedule Block
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Total Revenue Generated"
          value={`$${totalRevenue.toLocaleString()}`}
          subtext="Confirmed + Completed"
          highlight={true}
        />
        <StatCard
          icon={CalendarDays}
          label="Today's Active Bookings"
          value={todaysBookings.length}
          subtext={`Date: ${today}`}
        />
        <StatCard
          icon={Building2}
          label="Operational Venues"
          value={`${availableCount} / ${data.facilities.length}`}
          subtext={`${maintenanceCount} currently in maintenance`}
        />
        <StatCard
          icon={Users}
          label="Active Player Community"
          value={activePlayers}
          subtext="Fair allocation capped"
        />
      </div>

      {/* Live Schedule & Utilisation Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Today's Schedule Table (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock size={16} className="text-primary-400" />
              Today's Court Sessions ({todaysBookings.length})
            </h2>
            <Link
              href="/admin/bookings"
              className="text-xs font-semibold text-primary-400 hover:underline"
            >
              All Bookings ({data.bookings.length}) →
            </Link>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-dark-850 shadow-md">
            <table className="w-full text-xs">
              <thead className="bg-dark-900 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Ref & Facility</th>
                  <th className="text-left px-4 py-3 font-semibold">Player</th>
                  <th className="text-left px-4 py-3 font-semibold">Time</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {todaysBookings.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                      No court reservations scheduled for today.
                    </td>
                  </tr>
                ) : (
                  todaysBookings.map((b) => (
                    <tr key={b._id} className="hover:bg-dark-800/60 transition">
                      <td className="px-4 py-3">
                        <p className="font-bold text-white">{b.facilityId?.name || "Court"}</p>
                        <p className="font-mono text-[10px] text-primary-400">
                          {b.bookingReference || "CAD-REF"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-200">{b.userId?.name}</p>
                        <p className="text-[10px] text-slate-500">{b.userId?.email}</p>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-300">
                        {formatSlotLabel(`${b.startTime}-${b.endTime}`)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge size="xs">{b.status}</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sport Utilization Chart (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp size={16} className="text-primary-400" />
              Booking Demand by Sport
            </h2>
            <Link
              href="/admin/reports"
              className="text-xs font-semibold text-primary-400 hover:underline"
            >
              Detailed Analytics →
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-dark-850 p-5 space-y-4 shadow-md">
            {sportEntries.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No booking data recorded yet.</p>
            ) : (
              sportEntries.map(([sportName, count]) => {
                const percent = Math.round((count / maxSportCount) * 100);
                return (
                  <div key={sportName} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-300">{sportName}</span>
                      <span className="text-primary-400 font-bold">{count} bookings</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-dark-750 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-primary-400 transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
