"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import Loading from "@/components/Loading";
import {
  User,
  Mail,
  Shield,
  Phone,
  Calendar,
  Lock,
  Save,
  CheckCircle,
  Activity,
  Heart,
} from "lucide-react";
import Badge from "@/components/Badge";

const SPORT_OPTIONS = [
  "Badminton Court",
  "Basketball Court",
  "Football Ground",
  "Cricket Ground",
  "Tennis Court",
  "Volleyball Court",
  "Gym",
  "Table Tennis",
];

export default function ProfilePage() {
  const { user, refreshUser, loading } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState("profile"); // "profile" | "security"

  // Profile Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [preferredSports, setPreferredSports] = useState([]);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setBio(user.bio || "");
      setPreferredSports(user.preferredSports || []);
    }
  }, [user]);

  function toggleSport(sport) {
    if (preferredSports.includes(sport)) {
      setPreferredSports(preferredSports.filter((s) => s !== sport));
    } else {
      setPreferredSports([...preferredSports, sport]);
    }
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSavingProfile(true);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, bio, preferredSports }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Could not update profile.", "error");
        return;
      }

      await refreshUser();
      showToast("Profile details updated successfully.");
    } catch {
      showToast("Profile update failed.", "error");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match.", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast("New password must be at least 6 characters.", "error");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Password change failed.", "error");
        return;
      }

      showToast("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      showToast("Could not update password.", "error");
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) return <Loading label="Loading account settings..." />;
  if (!user) {
    return <p className="text-center text-slate-400 py-20">Please log in to view account settings.</p>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-primary-400">
          Account Settings
        </span>
        <h1 className="text-3xl font-black text-white tracking-tight mt-1">Profile & Preferences</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Manage your athlete profile, contact info, preferred sports, and security credentials.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === "profile"
              ? "bg-primary-400 text-dark-950 shadow-glow-sm"
              : "border border-slate-800 bg-dark-850 text-slate-400 hover:text-white"
          }`}
        >
          <User size={14} /> Profile & Preferences
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === "security"
              ? "bg-primary-400 text-dark-950 shadow-glow-sm"
              : "border border-slate-800 bg-dark-850 text-slate-400 hover:text-white"
          }`}
        >
          <Lock size={14} /> Password & Security
        </button>
      </div>

      {/* Tab 1: Profile & Preferences */}
      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-dark-850 p-6 space-y-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <User size={16} className="text-primary-400" /> Basic Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3.5 py-2.5 text-xs text-white outline-none focus:border-primary-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full rounded-xl border border-slate-800 bg-dark-950 px-3.5 py-2.5 text-xs text-slate-500 cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Email is your unique login credential.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3.5 py-2.5 text-xs text-white outline-none focus:border-primary-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Account Role</label>
                <div className="pt-1">
                  <Badge size="md">{user.role === "admin" ? "Administrator" : "Player"}</Badge>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Player Bio / Schedule Notes
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="e.g. Regular badminton doubles player, plays Tuesday and Thursday nights..."
                className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3.5 py-2.5 text-xs text-white outline-none focus:border-primary-400"
              />
            </div>
          </div>

          {/* Preferred Sports */}
          <div className="rounded-2xl border border-slate-800 bg-dark-850 p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Activity size={16} className="text-primary-400" /> Preferred Sports & Disciplines
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Select your favorite court types for personalized recommendations:
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {SPORT_OPTIONS.map((sport) => {
                const isSelected = preferredSports.includes(sport);
                return (
                  <button
                    key={sport}
                    type="button"
                    onClick={() => toggleSport(sport)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold border transition ${
                      isSelected
                        ? "bg-primary-400/20 text-primary-300 border-primary-400/50 shadow-sm"
                        : "border-slate-800 bg-dark-900 text-slate-400 hover:text-white"
                    }`}
                  >
                    {isSelected ? "✓ " : "+ "}
                    {sport}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="flex items-center gap-2 rounded-xl bg-primary-400 px-6 py-2.5 text-xs font-bold text-dark-950 hover:bg-primary-300 transition shadow-glow-sm"
            >
              <Save size={15} />
              {savingProfile ? "Saving..." : "Save Profile Details"}
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Security & Password */}
      {activeTab === "security" && (
        <form onSubmit={handleChangePassword} className="space-y-6 max-w-xl">
          <div className="rounded-2xl border border-slate-800 bg-dark-850 p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Lock size={16} className="text-primary-400" /> Update Password
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3.5 py-2.5 text-xs text-white outline-none focus:border-primary-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                New Password (minimum 6 characters)
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3.5 py-2.5 text-xs text-white outline-none focus:border-primary-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3.5 py-2.5 text-xs text-white outline-none focus:border-primary-400"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingPassword}
              className="flex items-center gap-2 rounded-xl bg-primary-400 px-6 py-2.5 text-xs font-bold text-dark-950 hover:bg-primary-300 transition shadow-glow-sm"
            >
              <Lock size={15} />
              {savingPassword ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
