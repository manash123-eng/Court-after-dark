"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Dumbbell, Search, RotateCcw, ShieldCheck } from "lucide-react";
import Modal from "@/components/Modal";
import Badge from "@/components/Badge";
import Loading from "@/components/Loading";
import { useToast } from "@/contexts/ToastContext";

const EMPTY_FORM = {
  name: "",
  category: "Badminton",
  totalQuantity: 10,
  availableQuantity: 10,
  condition: "Good",
  status: "Available",
};

export default function AdminEquipmentPage() {
  const [equipment, setEquipment] = useState([]);
  const [checkouts, setCheckouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const { showToast } = useToast();

  function load() {
    setLoading(true);
    Promise.all([
      fetch("/api/equipment").then((r) => r.json()),
      fetch("/api/equipment/checkout?all=true").then((r) => r.json()),
    ])
      .then(([eq, co]) => {
        setEquipment(eq.equipment || []);
        setCheckouts(co.checkouts || []);
      })
      .catch(() => showToast("Could not load equipment.", "error"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm(item);
    setModalOpen(true);
  }

  async function handleSave(ev) {
    ev.preventDefault();
    const payload = {
      ...form,
      totalQuantity: Number(form.totalQuantity),
      availableQuantity: Number(form.availableQuantity),
    };

    const url = editing ? `/api/equipment/${editing._id}` : "/api/equipment";
    const method = editing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || "Could not save equipment.", "error");
      return;
    }

    showToast(editing ? "Equipment updated." : "Equipment added to inventory.");
    setModalOpen(false);
    load();
  }

  async function handleDelete(id, name) {
    if (!confirm(`Delete equipment "${name}"?`)) return;
    const res = await fetch(`/api/equipment/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || "Could not delete.", "error");
      return;
    }
    showToast("Equipment deleted.");
    load();
  }

  if (loading) return <Loading label="Loading equipment inventory..." />;

  const filtered = equipment.filter(
    (e) =>
      !search.trim() ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase())
  );

  const activeCheckouts = checkouts.filter((c) => c.status === "Checked Out");

  return (
    <div className="p-4 sm:p-8 max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary-400">
            Inventory & Asset Management
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1">
            Equipment Stock & Checkouts
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Maintain stock quantities, update condition status, and monitor checked-out gear.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-xl bg-primary-400 px-4 py-2.5 text-xs font-bold text-dark-950 hover:bg-primary-300 transition shadow-glow-sm self-start sm:self-auto"
        >
          <Plus size={16} /> Add Equipment Item
        </button>
      </div>

      {/* Currently Checked Out Gear Monitor */}
      <div className="rounded-2xl border border-slate-800 bg-dark-850 p-5 space-y-4 shadow-md">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Dumbbell size={16} className="text-primary-400" />
            Currently Borrowed Gear ({activeCheckouts.length})
          </h2>
          <span className="text-[11px] text-slate-400">
            Gear in player hands
          </span>
        </div>

        {activeCheckouts.length === 0 ? (
          <p className="text-xs text-slate-500 py-2">All equipment items are currently returned and in storage.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {activeCheckouts.map((co) => (
              <div
                key={co._id}
                className="rounded-xl border border-slate-800 bg-dark-900 p-3 text-xs space-y-1"
              >
                <div className="flex justify-between items-start">
                  <span className="font-bold text-white">
                    {co.equipmentId?.name} × {co.quantity}
                  </span>
                  <Badge size="xs">{co.status}</Badge>
                </div>
                <p className="text-slate-400">
                  Player: <strong className="text-slate-200">{co.userId?.name}</strong> ({co.userId?.email})
                </p>
                <p className="text-[10px] text-slate-500">
                  Checked out: {new Date(co.checkoutTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  {co.bookingId?.bookingReference ? ` • Ref: ${co.bookingId.bookingReference}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Equipment Catalog Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-white">All Stock Items ({filtered.length})</h2>

          <div className="relative sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search gear..."
              className="w-full rounded-xl border border-slate-700 bg-dark-850 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-primary-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-dark-850 shadow-md">
          <table className="w-full text-xs">
            <thead className="bg-dark-900 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Equipment Name</th>
                <th className="text-left px-4 py-3 font-semibold">Category</th>
                <th className="text-left px-4 py-3 font-semibold">Stock (Avail / Total)</th>
                <th className="text-left px-4 py-3 font-semibold">Condition</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-right px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((item) => (
                <tr key={item._id} className="hover:bg-dark-800/60 transition">
                  <td className="px-4 py-3 font-bold text-white text-sm">{item.name}</td>
                  <td className="px-4 py-3 text-primary-400 font-semibold">{item.category}</td>
                  <td className="px-4 py-3 text-slate-200 font-bold">
                    <span className="text-primary-300">{item.availableQuantity}</span> / {item.totalQuantity} units
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    <span className="rounded bg-dark-800 border border-slate-700 px-2 py-0.5 text-[11px]">
                      {item.condition}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge size="xs">{item.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button
                      onClick={() => openEdit(item)}
                      className="text-primary-400 hover:text-primary-300 font-semibold inline-flex items-center gap-1"
                    >
                      <Pencil size={13} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item._id, item.name)}
                      className="text-red-400 hover:text-red-300 font-semibold inline-flex items-center gap-1"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit/Create Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit: ${editing.name}` : "Add Equipment Item"}
        footer={
          <div className="flex justify-end gap-2 w-full">
            <button
              onClick={() => setModalOpen(false)}
              className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300"
            >
              Cancel
            </button>
            <button
              form="equipment-form"
              type="submit"
              className="rounded-xl bg-primary-400 px-5 py-2 text-xs font-bold text-dark-950 hover:bg-primary-300"
            >
              Save Equipment
            </button>
          </div>
        }
      >
        <form id="equipment-form" onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Equipment Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Yonex Nanoflare 800 Badminton Racket"
              className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-xs text-white outline-none focus:border-primary-400"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Sport Category</label>
            <input
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="e.g. Badminton, Football, Cricket, Tennis"
              className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-xs text-white outline-none focus:border-primary-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Total Stock</label>
              <input
                required
                type="number"
                min={0}
                value={form.totalQuantity}
                onChange={(e) => setForm({ ...form, totalQuantity: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-xs text-white outline-none focus:border-primary-400"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Available Quantity</label>
              <input
                required
                type="number"
                min={0}
                value={form.availableQuantity}
                onChange={(e) => setForm({ ...form, availableQuantity: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-xs text-white outline-none focus:border-primary-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Condition</label>
              <select
                value={form.condition}
                onChange={(e) => setForm({ ...form, condition: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-xs text-white outline-none focus:border-primary-400"
              >
                <option value="New">New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Worn">Worn</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-xs text-white outline-none focus:border-primary-400"
              >
                <option value="Available">Available</option>
                <option value="Unavailable">Unavailable</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
