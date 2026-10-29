"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search, Building2, MapPin, Tag } from "lucide-react";
import Modal from "@/components/Modal";
import Badge from "@/components/Badge";
import Loading from "@/components/Loading";
import { useToast } from "@/contexts/ToastContext";

const TYPES = [
  "Badminton Court",
  "Basketball Court",
  "Football Ground",
  "Cricket Ground",
  "Tennis Court",
  "Volleyball Court",
  "Gym",
  "Table Tennis",
];

const CITIES = ["Downtown", "Midtown", "Eastside", "West End", "South Bay"];

const EMPTY_FORM = {
  name: "",
  type: TYPES[0],
  location: "",
  city: "Downtown",
  description: "",
  capacity: 4,
  openingTime: "06:00",
  closingTime: "22:00",
  pricePerHour: 40,
  indoorOutdoor: "Indoor",
  surfaceType: "Synthetic Tournament Mat",
  amenities: "Floodlights, Locker Rooms, Showers",
  rules: "Non-marking footwear required",
  equipmentAvailable: "Badminton Racket, Shuttlecock",
  image: "",
  status: "Available",
};

export default function AdminFacilitiesPage() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const { showToast } = useToast();

  function load() {
    fetch("/api/facilities?limit=100")
      .then((r) => r.json())
      .then((d) => setFacilities(d.facilities || []))
      .catch(() => showToast("Could not load facilities.", "error"))
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

  function openEdit(facility) {
    setEditing(facility);
    setForm({
      ...facility,
      amenities: (facility.amenities || []).join(", "),
      rules: (facility.rules || []).join(", "),
      equipmentAvailable: (facility.equipmentAvailable || []).join(", "),
    });
    setModalOpen(true);
  }

  async function handleSave(ev) {
    ev.preventDefault();
    const payload = {
      ...form,
      capacity: Number(form.capacity),
      pricePerHour: Number(form.pricePerHour) || 40,
      amenities:
        typeof form.amenities === "string"
          ? form.amenities.split(",").map((s) => s.trim()).filter(Boolean)
          : form.amenities || [],
      rules:
        typeof form.rules === "string"
          ? form.rules.split(",").map((s) => s.trim()).filter(Boolean)
          : form.rules || [],
      equipmentAvailable:
        typeof form.equipmentAvailable === "string"
          ? form.equipmentAvailable.split(",").map((s) => s.trim()).filter(Boolean)
          : form.equipmentAvailable || [],
    };

    const url = editing ? `/api/facilities/${editing._id}` : "/api/facilities";
    const method = editing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || "Could not save facility.", "error");
      return;
    }

    showToast(editing ? "Facility updated successfully." : "Facility created successfully.");
    setModalOpen(false);
    load();
  }

  async function handleDelete(id, name) {
    if (!confirm(`Are you sure you want to permanently delete "${name}"?`)) return;
    const res = await fetch(`/api/facilities/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || "Could not delete facility.", "error");
      return;
    }
    showToast("Facility deleted.");
    load();
  }

  if (loading) return <Loading label="Loading facility inventory..." />;

  const filtered = facilities.filter(
    (f) =>
      !search.trim() ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.type.toLowerCase().includes(search.toLowerCase()) ||
      f.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary-400">
            Administrative Management
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1">
            Facility Inventory
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage courts, grounds, gym spaces, hourly pricing, and surface specifications.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-xl bg-primary-400 px-4 py-2.5 text-xs font-bold text-dark-950 hover:bg-primary-300 transition shadow-glow-sm self-start sm:self-auto"
        >
          <Plus size={16} /> Add New Facility
        </button>
      </div>

      {/* Search and count bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="text-xs text-slate-400">
          Showing <strong className="text-white">{filtered.length}</strong> of{" "}
          <strong className="text-primary-400">{facilities.length}</strong> facilities
        </div>

        <div className="relative sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search venue or sport..."
            className="w-full rounded-xl border border-slate-700 bg-dark-850 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-primary-400"
          />
        </div>
      </div>

      {/* Facilities Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-dark-850 shadow-md">
        <table className="w-full text-xs">
          <thead className="bg-dark-900 border-b border-slate-800 text-slate-400">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Name & Type</th>
              <th className="text-left px-4 py-3 font-semibold">Location & Zone</th>
              <th className="text-left px-4 py-3 font-semibold">Rate & Setting</th>
              <th className="text-left px-4 py-3 font-semibold">Hours</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-right px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filtered.map((f) => (
              <tr key={f._id} className="hover:bg-dark-800/60 transition">
                <td className="px-4 py-3">
                  <p className="font-bold text-white text-sm">{f.name}</p>
                  <p className="text-[11px] text-primary-400 font-semibold">{f.type}</p>
                </td>
                <td className="px-4 py-3 text-slate-300">
                  <p className="font-medium text-slate-200">{f.location}</p>
                  <p className="text-[10px] text-slate-500">{f.city || "Downtown"}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-bold text-primary-400">${f.pricePerHour || 40} / hr</p>
                  <span className="text-[10px] text-slate-400">{f.indoorOutdoor || "Indoor"}</span>
                </td>
                <td className="px-4 py-3 text-slate-300 font-medium">
                  {f.openingTime} – {f.closingTime}
                </td>
                <td className="px-4 py-3">
                  <Badge size="xs">{f.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  <button
                    onClick={() => openEdit(f)}
                    className="text-primary-400 hover:text-primary-300 font-semibold inline-flex items-center gap-1"
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(f._id, f.name)}
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

      {/* Modal Form for Create / Edit */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit: ${editing.name}` : "Add New Sports Facility"}
        maxWidth="max-w-2xl"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <button
              onClick={() => setModalOpen(false)}
              className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300"
            >
              Cancel
            </button>
            <button
              form="facility-form"
              type="submit"
              className="rounded-xl bg-primary-400 px-5 py-2 text-xs font-bold text-dark-950 hover:bg-primary-300"
            >
              Save Facility
            </button>
          </div>
        }
      >
        <form id="facility-form" onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Facility Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Apex Arena Badminton 3"
                className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-xs text-white outline-none focus:border-primary-400"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Sport Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-xs text-white outline-none focus:border-primary-400"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Specific Location</label>
              <input
                required
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Sports Pavilion Block B"
                className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-xs text-white outline-none focus:border-primary-400"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">City / Zone</label>
              <select
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-xs text-white outline-none focus:border-primary-400"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Setting</label>
              <select
                value={form.indoorOutdoor}
                onChange={(e) => setForm({ ...form, indoorOutdoor: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-xs text-white outline-none focus:border-primary-400"
              >
                <option value="Indoor">Indoor</option>
                <option value="Outdoor">Outdoor</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Price / Hour ($)</label>
              <input
                type="number"
                min={0}
                required
                value={form.pricePerHour}
                onChange={(e) => setForm({ ...form, pricePerHour: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-xs text-white outline-none focus:border-primary-400"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Max Capacity</label>
              <input
                type="number"
                min={1}
                required
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-xs text-white outline-none focus:border-primary-400"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Opening Time</label>
              <input
                type="time"
                required
                value={form.openingTime}
                onChange={(e) => setForm({ ...form, openingTime: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-xs text-white outline-none focus:border-primary-400"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Closing Time</label>
              <input
                type="time"
                required
                value={form.closingTime}
                onChange={(e) => setForm({ ...form, closingTime: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-xs text-white outline-none focus:border-primary-400"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Surface Type</label>
            <input
              value={form.surfaceType}
              onChange={(e) => setForm({ ...form, surfaceType: e.target.value })}
              placeholder="e.g. Synthetic Taraflex, FIFA 4G Turf, Maple Hardwood"
              className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-xs text-white outline-none focus:border-primary-400"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Facility features and night lighting notes..."
              className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-xs text-white outline-none focus:border-primary-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Amenities (comma-separated)
              </label>
              <input
                value={form.amenities}
                onChange={(e) => setForm({ ...form, amenities: e.target.value })}
                placeholder="Floodlights, Locker Rooms, Showers, Parking"
                className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-xs text-white outline-none focus:border-primary-400"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Equipment Available on Site
              </label>
              <input
                value={form.equipmentAvailable}
                onChange={(e) => setForm({ ...form, equipmentAvailable: e.target.value })}
                placeholder="Badminton Racket, Shuttlecock"
                className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-xs text-white outline-none focus:border-primary-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Image URL</label>
              <input
                type="url"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-xs text-white outline-none focus:border-primary-400"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Operational Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2 text-xs text-white outline-none focus:border-primary-400"
              >
                <option value="Available">Available (Open for booking)</option>
                <option value="Maintenance">Maintenance (Temporarily closed)</option>
                <option value="Closed">Closed (Offline)</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
