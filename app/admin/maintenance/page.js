"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Wrench, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import Modal from "@/components/Modal";
import Badge from "@/components/Badge";
import Loading from "@/components/Loading";
import { useToast } from "@/contexts/ToastContext";
import { formatSlotLabel } from "@/lib/bookingRules";

const EMPTY_FORM = {
  facilityId: "",
  date: "",
  startTime: "08:00",
  endTime: "11:00",
  reason: "Court resurfacing and lighting inspection",
};

export default function AdminMaintenancePage() {
  const [blocks, setBlocks] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  function load() {
    setLoading(true);
    Promise.all([
      fetch("/api/maintenance").then((r) => r.json()),
      fetch("/api/facilities").then((r) => r.json()),
    ])
      .then(([m, f]) => {
        setBlocks(m.blocks || []);
        const facs = f.facilities || [];
        setFacilities(facs);
        if (facs.length > 0 && !form.facilityId) {
          setForm((prev) => ({ ...prev, facilityId: facs[0]._id }));
        }
      })
      .catch(() => showToast("Could not load maintenance data.", "error"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    const today = new Date().toISOString().split("T")[0];
    setForm({
      ...EMPTY_FORM,
      facilityId: facilities[0]?._id || "",
      date: today,
    });
    setModalOpen(true);
  }

  async function handleSave(ev) {
    ev.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Could not create maintenance block.", "error");
        return;
      }

      if (data.affectedBookingsCount > 0) {
        showToast(
          `Block scheduled! Note: ${data.affectedBookingsCount} existing booking(s) fall inside this window.`,
          "warning"
        );
      } else {
        showToast("Maintenance block scheduled. The slot is now locked from casual booking.");
      }

      setModalOpen(false);
      load();
    } catch {
      showToast("Scheduling failed.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Remove this maintenance block and restore court availability?")) return;
    try {
      const res = await fetch(`/api/maintenance/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Could not remove block.", "error");
        return;
      }
      showToast("Maintenance block removed. Availability restored.");
      load();
    } catch {
      showToast("Removal failed.", "error");
    }
  }

  if (loading) return <Loading label="Loading maintenance schedules..." />;

  return (
    <div className="p-4 sm:p-8 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
            Resource Health & Safety
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1">
            Maintenance Schedules
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Schedule surface resurfacing, hoop/net repairs, and lighting maintenance to automatically block slot booking.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-xl bg-primary-400 px-4 py-2.5 text-xs font-bold text-dark-950 hover:bg-primary-300 transition shadow-glow-sm self-start sm:self-auto"
        >
          <Plus size={16} /> Schedule Maintenance Block
        </button>
      </div>

      {/* Info notice */}
      <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4 text-xs text-orange-300 flex items-start gap-3">
        <AlertTriangle size={18} className="shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Automatic Overlap Calculation:</strong> Any scheduled maintenance block instantly flags overlapping slots on the public discovery calendar as "Maintenance" and prevents player reservations.
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-dark-850 shadow-md">
        <table className="w-full text-xs">
          <thead className="bg-dark-900 border-b border-slate-800 text-slate-400">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Facility</th>
              <th className="text-left px-4 py-3 font-semibold">Date</th>
              <th className="text-left px-4 py-3 font-semibold">Time Window</th>
              <th className="text-left px-4 py-3 font-semibold">Maintenance Reason</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-right px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {blocks.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  No active maintenance blocks. All venues operating at full availability.
                </td>
              </tr>
            ) : (
              blocks.map((b) => (
                <tr key={b._id} className="hover:bg-dark-800/60 transition">
                  <td className="px-4 py-3">
                    <p className="font-bold text-white text-sm">{b.facilityId?.name}</p>
                    <p className="text-[10px] text-slate-500">{b.facilityId?.type}</p>
                  </td>
                  <td className="px-4 py-3 font-bold text-white">{b.date}</td>
                  <td className="px-4 py-3 font-medium text-slate-300">
                    {formatSlotLabel(`${b.startTime}-${b.endTime}`)}
                  </td>
                  <td className="px-4 py-3 text-slate-300 max-w-xs truncate">
                    {b.reason || "General Inspection"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge size="xs">{b.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(b._id)}
                      className="text-red-400 hover:text-red-300 font-semibold inline-flex items-center gap-1"
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Schedule Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Schedule Venue Maintenance Block"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <button
              onClick={() => setModalOpen(false)}
              className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300"
            >
              Cancel
            </button>
            <button
              form="maintenance-form"
              type="submit"
              disabled={saving}
              className="rounded-xl bg-primary-400 px-5 py-2 text-xs font-bold text-dark-950 hover:bg-primary-300"
            >
              {saving ? "Scheduling..." : "Schedule Block"}
            </button>
          </div>
        }
      >
        <form id="maintenance-form" onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Target Facility</label>
            <select
              required
              value={form.facilityId}
              onChange={(e) => setForm({ ...form, facilityId: e.target.value })}
              className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-xs text-white outline-none focus:border-primary-400"
            >
              {facilities.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.name} ({f.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Date of Work</label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-xs text-white outline-none focus:border-primary-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Start Time</label>
              <input
                type="time"
                required
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-xs text-white outline-none focus:border-primary-400"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">End Time</label>
              <input
                type="time"
                required
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-xs text-white outline-none focus:border-primary-400"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Maintenance Scope / Reason
            </label>
            <textarea
              rows={3}
              required
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="e.g. Floodlight ballast replacement, net restringing, court deep clean..."
              className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-xs text-white outline-none focus:border-primary-400"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
