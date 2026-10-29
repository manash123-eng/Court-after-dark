"use client";

import { useEffect, useState } from "react";
import { Users, Search, Shield, User, Ban, CheckCircle, Trophy } from "lucide-react";
import Loading from "@/components/Loading";
import Badge from "@/components/Badge";
import { useToast } from "@/contexts/ToastContext";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { showToast } = useToast();

  function load() {
    setLoading(true);
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => setUsers(d.users || []))
      .catch(() => showToast("Could not load users.", "error"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleToggleRole(user) {
    const newRole = user.role === "admin" ? "player" : "admin";
    if (
      !confirm(
        `Are you sure you want to change ${user.name}'s role to "${newRole}"?`
      )
    )
      return;

    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Role update failed.", "error");
        return;
      }
      showToast(`User role updated to ${newRole}.`);
      load();
    } catch {
      showToast("Update failed.", "error");
    }
  }

  async function handleToggleStatus(user) {
    const newStatus = user.status === "suspended" ? "active" : "suspended";
    if (
      !confirm(
        `Are you sure you want to mark ${user.name}'s account as "${newStatus}"?`
      )
    )
      return;

    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Status update failed.", "error");
        return;
      }
      showToast(`Account status updated to ${newStatus}.`);
      load();
    } catch {
      showToast("Update failed.", "error");
    }
  }

  if (loading) return <Loading label="Loading registered player accounts..." />;

  const filtered = users.filter(
    (u) =>
      !search.trim() ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary-400">
            Player Directory & Role Administration
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1">User Management</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage player permissions, audit user activity, and toggle administrator privileges.
          </p>
        </div>

        <div className="text-xs text-slate-400 bg-dark-850 border border-slate-800 px-4 py-2 rounded-xl">
          Total Registered Users: <strong className="text-white">{users.length}</strong>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="text-xs text-slate-400">
          Showing <strong className="text-white">{filtered.length}</strong> accounts
        </div>

        <div className="relative sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-xl border border-slate-700 bg-dark-850 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-primary-400"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-dark-850 shadow-md">
        <table className="w-full text-xs">
          <thead className="bg-dark-900 border-b border-slate-800 text-slate-400">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">User Profile</th>
              <th className="text-left px-4 py-3 font-semibold">Email & Phone</th>
              <th className="text-left px-4 py-3 font-semibold">Role</th>
              <th className="text-left px-4 py-3 font-semibold">Activity (Bookings)</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-right px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filtered.map((u) => (
              <tr key={u._id} className="hover:bg-dark-800/60 transition">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-400/20 text-primary-400 text-xs font-bold">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{u.name}</p>
                      <p className="text-[10px] text-slate-500">
                        Joined: {new Date(u.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-300">
                  <p className="font-semibold text-slate-200">{u.email}</p>
                  <p className="text-[10px] text-slate-500">{u.phone || "No phone listed"}</p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                      u.role === "admin"
                        ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                        : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    }`}
                  >
                    {u.role === "admin" ? <Shield size={12} /> : <User size={12} />}
                    {u.role === "admin" ? "Administrator" : "Player"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-bold text-white">{u.bookingCount || 0}</span>
                  <span className="text-[10px] text-slate-500"> reservations</span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                      u.status === "suspended"
                        ? "bg-red-500/15 text-red-400 border-red-500/30"
                        : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    }`}
                  >
                    {u.status === "suspended" ? "Suspended" : "Active"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button
                    onClick={() => handleToggleRole(u)}
                    className="text-xs font-semibold text-primary-400 hover:underline"
                  >
                    {u.role === "admin" ? "Demote to Player" : "Promote to Admin"}
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    onClick={() => handleToggleStatus(u)}
                    className={`text-xs font-semibold hover:underline ${
                      u.status === "suspended" ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {u.status === "suspended" ? "Reactivate" : "Suspend"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
