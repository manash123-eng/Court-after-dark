"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Download,
  Filter,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Sparkles,
  Calendar,
  Layers,
} from "lucide-react";
import Loading from "@/components/Loading";
import Badge from "@/components/Badge";
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

export default function AdminReportsPage() {
  const [reportsData, setReportsData] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("All");
  const { showToast } = useToast();

  function loadReports() {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/reports").then((r) => r.json()),
      fetch("/api/admin/audit-logs").then((r) => r.json()),
    ])
      .then(([rep, logs]) => {
        setReportsData(rep);
        setAuditLogs(logs.logs || []);
      })
      .catch(() => showToast("Could not load reports and logs.", "error"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function exportCSV() {
    if (!auditLogs.length) return;
    const headers = "Timestamp,Action,PerformedBy,EntityType,EntityId,Details,Severity\n";
    const rows = auditLogs
      .map(
        (l) =>
          `"${new Date(l.createdAt).toISOString()}","${l.action}","${l.performedByName}","${l.entityType}","${l.entityId}","${(l.details || "").replace(/"/g, '""')}","${l.severity}"`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `courts-after-dark-audit-log-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Audit log CSV exported successfully.");
  }

  if (loading || !reportsData) return <Loading label="Compiling analytics & system audit records..." />;

  const m = reportsData.metrics || {};
  const sportCounts = reportsData.sportCounts || {};
  const dayCounts = reportsData.dayCounts || {};
  const maxDayCount = Math.max(1, ...Object.values(dayCounts));

  const filteredLogs = auditLogs.filter(
    (l) => actionFilter === "All" || l.action.includes(actionFilter)
  );

  return (
    <div className="p-4 sm:p-8 max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary-400">
            Business Intelligence & Compliance
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1">
            Reports & Audit Logs
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Review financial throughput, sport demand distributions, and chronological security audit streams.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="flex items-center gap-1.5 rounded-xl bg-primary-400 px-4 py-2.5 text-xs font-bold text-dark-950 hover:bg-primary-300 transition shadow-glow-sm self-start sm:self-auto"
        >
          <Download size={15} /> Export Audit Log (CSV)
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Total Revenue Generated"
          value={`$${(m.totalRevenue || 0).toLocaleString()}`}
          subtext={`${m.totalBookings || 0} total sessions`}
          highlight={true}
        />
        <StatCard
          icon={TrendingUp}
          label="Cancellation Rate"
          value={`${m.cancellationRate || 0}%`}
          subtext={`${m.cancelledCount || 0} cancellations`}
        />
        <StatCard
          icon={ShieldCheck}
          label="Active Player Base"
          value={m.totalPlayers || 0}
          subtext="Under fair-use caps"
        />
        <StatCard
          icon={BarChart3}
          label="Equipment In Circulation"
          value={`${m.gearUtilization || 0}%`}
          subtext={`${m.inUseGear || 0} of ${m.totalGear || 0} units`}
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Day Distribution Chart */}
        <div className="rounded-2xl border border-slate-800 bg-dark-850 p-6 space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar size={16} className="text-primary-400" />
              Day of Week Activity
            </h2>
            <span className="text-[11px] text-slate-400">Total sessions per day</span>
          </div>

          <div className="grid grid-cols-7 gap-2 pt-4 items-end h-44">
            {Object.entries(dayCounts).map(([day, count]) => {
              const heightPercent = Math.max(12, Math.round((count / maxDayCount) * 100));
              return (
                <div key={day} className="flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[10px] text-primary-400 font-bold">{count}</span>
                  <div className="w-full rounded-t-lg bg-dark-750 overflow-hidden flex flex-col justify-end">
                    <div
                      className="w-full bg-gradient-to-t from-emerald-600 to-primary-400 rounded-t-lg transition-all duration-500"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 font-semibold">{day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sport Utilization */}
        <div className="rounded-2xl border border-slate-800 bg-dark-850 p-6 space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers size={16} className="text-primary-400" />
              Breakdown by Sport Category
            </h2>
            <span className="text-[11px] text-slate-400">All recorded bookings</span>
          </div>

          <div className="space-y-3 pt-2">
            {Object.entries(sportCounts).map(([sport, count]) => {
              const pct = m.totalBookings > 0 ? Math.round((count / m.totalBookings) * 100) : 0;
              return (
                <div key={sport} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">{sport}</span>
                    <span className="text-primary-400 font-bold">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-dark-750 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary-400 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck size={18} className="text-primary-400" />
              System Event & Compliance Audit Stream ({filteredLogs.length})
            </h2>
            <p className="text-xs text-slate-400">
              Immutable chronological record of administrative actions, fair-use events, and bookings.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Action:</span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="rounded-xl border border-slate-700 bg-dark-850 px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-primary-400"
            >
              <option value="All">All Event Types</option>
              <option value="BOOKING">Bookings</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="EQUIPMENT">Equipment</option>
              <option value="FACILITY">Facilities</option>
              <option value="RULES">System Rules</option>
              <option value="USER">User Mod</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-dark-850 shadow-md">
          <table className="w-full text-xs">
            <thead className="bg-dark-900 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Timestamp</th>
                <th className="text-left px-4 py-3 font-semibold">Action</th>
                <th className="text-left px-4 py-3 font-semibold">Performed By</th>
                <th className="text-left px-4 py-3 font-semibold">Entity</th>
                <th className="text-left px-4 py-3 font-semibold">Details & Scope</th>
                <th className="text-left px-4 py-3 font-semibold">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    No audit logs matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-dark-800/60 transition">
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[11px] font-bold text-white bg-dark-900 px-2 py-0.5 rounded border border-slate-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-200">
                      {log.performedByName || "System"}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{log.entityType}</td>
                    <td className="px-4 py-3 text-slate-300 max-w-sm truncate">
                      {log.details || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          log.severity === "warning"
                            ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                            : log.severity === "critical"
                            ? "bg-red-500/15 text-red-400 border border-red-500/30"
                            : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {log.severity}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
