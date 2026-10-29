"use client";

import { useEffect, useState } from "react";
import { Sliders, ShieldCheck, Clock, Flame, Save, Info, AlertTriangle, RotateCcw } from "lucide-react";
import Loading from "@/components/Loading";
import { useToast } from "@/contexts/ToastContext";

export default function AdminRulesPage() {
  const [rules, setRules] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  function loadRules() {
    setLoading(true);
    fetch("/api/admin/rules")
      .then((r) => r.json())
      .then((d) => setRules(d.rules || {}))
      .catch(() => showToast("Could not load system rules.", "error"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/admin/rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rules),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Could not save rules.", "error");
        return;
      }
      showToast("Fair allocation policies & operating rules updated!");
      setRules(data.rules);
    } catch {
      showToast("Save failed.", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loading label="Loading configurable fair-use policies..." />;

  return (
    <div className="p-4 sm:p-8 max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary-400">
            System Policy & Fair Allocation Engine
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1">
            Booking Rules & Operating Parameters
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure concurrency rules, anti-monopoly quotas, prime-time hours, and cancellation deadlines.
          </p>
        </div>

        <button
          onClick={loadRules}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-dark-850 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white"
        >
          <RotateCcw size={13} /> Reset to Saved
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Anti-Monopoly Fair-Use Quotas */}
        <div className="rounded-2xl border border-slate-800 bg-dark-850 p-6 space-y-5 shadow-md">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-400/10 text-primary-400">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Anti-Monopolisation Quotas</h2>
              <p className="text-[11px] text-slate-400">
                Limits on concurrent active bookings per player across all sports facilities
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Max Active Bookings Per Player
              </label>
              <input
                type="number"
                min={1}
                max={10}
                required
                value={rules.maxActiveBookingsPerUser ?? 2}
                onChange={(e) =>
                  setRules({ ...rules, maxActiveBookingsPerUser: Number(e.target.value) })
                }
                className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3.5 py-2 text-xs text-white outline-none focus:border-primary-400"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Default: 2 active bookings. Prevents hoarding multiple peak slots simultaneously.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Advance Booking Horizon (Days)
              </label>
              <input
                type="number"
                min={1}
                max={60}
                required
                value={rules.maxAdvanceBookingDays ?? 14}
                onChange={(e) =>
                  setRules({ ...rules, maxAdvanceBookingDays: Number(e.target.value) })
                }
                className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3.5 py-2 text-xs text-white outline-none focus:border-primary-400"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                How many days in advance players can view and reserve open slots.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Max Booking Duration Per Session (Hours)
              </label>
              <input
                type="number"
                min={1}
                max={4}
                required
                value={rules.maxBookingDurationHours ?? 2}
                onChange={(e) =>
                  setRules({ ...rules, maxBookingDurationHours: Number(e.target.value) })
                }
                className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3.5 py-2 text-xs text-white outline-none focus:border-primary-400"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Sessions exceeding this limit are rejected by the booking API.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Default Cancellation Deadline (Hours Prior)
              </label>
              <input
                type="number"
                min={1}
                max={48}
                required
                value={rules.cancellationDeadlineHours ?? 4}
                onChange={(e) =>
                  setRules({ ...rules, cancellationDeadlineHours: Number(e.target.value) })
                }
                className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3.5 py-2 text-xs text-white outline-none focus:border-primary-400"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Players cannot cancel inside this window, preserving venue commitment.
              </span>
            </div>
          </div>
        </div>

        {/* Prime-Time Hours & Rotation Rules */}
        <div className="rounded-2xl border border-slate-800 bg-dark-850 p-6 space-y-5 shadow-md">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
              <Flame size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Prime-Time Evening Window & Rotation</h2>
              <p className="text-[11px] text-slate-400">
                Special fairness caps on high-demand floodlight hours
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Prime Time Start
              </label>
              <input
                type="time"
                required
                value={rules.primeTimeStart || "18:00"}
                onChange={(e) => setRules({ ...rules, primeTimeStart: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3.5 py-2 text-xs text-white outline-none focus:border-primary-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Prime Time End
              </label>
              <input
                type="time"
                required
                value={rules.primeTimeEnd || "21:00"}
                onChange={(e) => setRules({ ...rules, primeTimeEnd: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3.5 py-2 text-xs text-white outline-none focus:border-primary-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Max Prime Slots / Week / Player
              </label>
              <input
                type="number"
                min={1}
                max={7}
                required
                value={rules.maxPrimeTimeBookingsPerWeek ?? 3}
                onChange={(e) =>
                  setRules({ ...rules, maxPrimeTimeBookingsPerWeek: Number(e.target.value) })
                }
                className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3.5 py-2 text-xs text-white outline-none focus:border-primary-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="allowWaitlist"
              checked={rules.allowWaitlist ?? true}
              onChange={(e) => setRules({ ...rules, allowWaitlist: e.target.checked })}
              className="h-4 w-4 rounded border-slate-700 accent-primary-400 cursor-pointer"
            />
            <label htmlFor="allowWaitlist" className="text-xs text-slate-300 font-semibold cursor-pointer">
              Enable Public Waitlist Queue for fully booked slots (Recommended)
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-primary-400 px-8 py-3 text-xs font-bold text-dark-950 hover:bg-primary-300 transition shadow-glow-sm"
          >
            <Save size={15} />
            {saving ? "Saving Policy Changes..." : "Apply & Save System Rules"}
          </button>
        </div>
      </form>
    </div>
  );
}
