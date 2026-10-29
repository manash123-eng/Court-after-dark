"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  User,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  CheckCircle,
  Eye,
  EyeOff,
  Compass,
  Shield,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loadingAction, setLoadingAction] = useState(null); // 'form' | 'demo-player' | 'demo-admin'
  const { register, loginDemo } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Full name is required.";
    if (!form.email.trim()) {
      e.email = "Email address is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      e.email = "Please enter a valid email address.";
    }
    if (!form.password) {
      e.password = "Password is required.";
    } else if (form.password.length < 6) {
      e.password = "Password must be at least 6 characters.";
    }
    if (form.password && form.password !== form.confirmPassword) {
      e.confirmPassword = "Passwords do not match.";
    }
    return e;
  }

  async function handleDemoLogin(role) {
    const actionKey = role === "admin" ? "demo-admin" : "demo-player";
    setLoadingAction(actionKey);
    try {
      const loggedUser = await loginDemo(role);
      showToast(`Welcome! Signed in as Demo ${role === "admin" ? "Admin" : "Player"} (${loggedUser.name}).`);
      if (loggedUser.role === "admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      showToast(err.message || "Failed to sign in as demo user.", "error");
      setLoadingAction(null);
    }
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length) return;

    setLoadingAction("form");
    try {
      const loggedUser = await register(form.name.trim(), form.email.trim().toLowerCase(), form.password);
      showToast(`Account created successfully! Welcome, ${loggedUser.name}!`);
      window.location.href = "/dashboard";
    } catch (err) {
      showToast(err.message || "Registration failed. Try again.", "error");
      setErrors({ form: err.message || "Registration failed. Try again." });
      setLoadingAction(null);
    }
  }

  return (
    <div className="mx-auto flex min-h-[85vh] max-w-md flex-col justify-center px-4 py-10">
      <div className="rounded-3xl border border-slate-800 bg-dark-850 p-6 sm:p-8 shadow-2xl space-y-6 backdrop-blur-xl">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-400/10 border border-primary-400/30 text-primary-400 shadow-glow-sm">
            <Trophy size={24} />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Create Player Account</h1>
          <p className="text-xs text-slate-400">
            Join the community and claim your guaranteed fair court allocation.
          </p>
        </div>

        {/* Demo & Explore Fast Access Box */}
        <div className="rounded-2xl border border-primary-400/30 bg-gradient-to-b from-primary-400/10 via-dark-900/90 to-dark-900/90 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-primary-400">
              <Sparkles size={14} className="animate-pulse" />
              <span>Just Exploring? Skip Sign Up</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Instant Test</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={loadingAction !== null}
              onClick={() => handleDemoLogin("player")}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-primary-400/40 bg-primary-400/15 py-2 text-xs font-bold text-primary-300 hover:bg-primary-400/25 disabled:opacity-60 transition shadow-sm"
            >
              {loadingAction === "demo-player" ? (
                <Loader2 size={13} className="animate-spin text-primary-400" />
              ) : (
                <User size={13} className="text-primary-400" />
              )}
              <span>{loadingAction === "demo-player" ? "Signing In..." : "Demo Player"}</span>
            </button>

            <button
              type="button"
              disabled={loadingAction !== null}
              onClick={() => handleDemoLogin("admin")}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/25 disabled:opacity-60 transition shadow-sm"
            >
              {loadingAction === "demo-admin" ? (
                <Loader2 size={13} className="animate-spin text-amber-400" />
              ) : (
                <Shield size={13} className="text-amber-400" />
              )}
              <span>{loadingAction === "demo-admin" ? "Signing In..." : "Demo Admin"}</span>
            </button>
          </div>

          <Link
            href="/facilities"
            className="flex items-center justify-center gap-1.5 w-full rounded-xl border border-slate-700/80 bg-dark-800/80 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-dark-700/80 transition"
          >
            <Compass size={13} className="text-primary-400" />
            <span>Explore Facilities as Guest (No Account)</span>
          </Link>
        </div>

        {/* Benefits list */}
        <div className="rounded-2xl border border-slate-800/80 bg-dark-900/60 p-3 space-y-1.5 text-[11px] text-slate-300">
          <p className="flex items-center gap-1.5 text-slate-300">
            <CheckCircle size={13} className="text-primary-400 shrink-0" /> Fair 2-slot active booking cap per player
          </p>
          <p className="flex items-center gap-1.5 text-slate-300">
            <CheckCircle size={13} className="text-primary-400 shrink-0" /> Free sports equipment checkout at venue
          </p>
          <p className="flex items-center gap-1.5 text-slate-300">
            <CheckCircle size={13} className="text-primary-400 shrink-0" /> Priority notifications when booked slots open
          </p>
        </div>

        {/* Error alert banner */}
        {errors.form && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            {errors.form}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
              <input
                type="text"
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: null });
                }}
                className={`w-full rounded-xl border bg-dark-900 pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition focus:border-primary-400 ${
                  errors.name ? "border-red-500" : "border-slate-700"
                }`}
                placeholder="Alex Morgan"
              />
            </div>
            {errors.name && <p className="mt-1 text-[11px] text-red-400">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
              <input
                type="email"
                value={form.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: null });
                }}
                className={`w-full rounded-xl border bg-dark-900 pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition focus:border-primary-400 ${
                  errors.email ? "border-red-500" : "border-slate-700"
                }`}
                placeholder="alex@example.com"
              />
            </div>
            {errors.email && <p className="mt-1 text-[11px] text-red-400">{errors.email}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-300">Create Password</label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                <span>{showPassword ? "Hide" : "Show"}</span>
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => {
                  setForm({ ...form, password: e.target.value });
                  if (errors.password) setErrors({ ...errors, password: null });
                }}
                className={`w-full rounded-xl border bg-dark-900 pl-10 pr-10 py-2 text-xs text-white placeholder-slate-500 outline-none transition focus:border-primary-400 ${
                  errors.password ? "border-red-500" : "border-slate-700"
                }`}
                placeholder="At least 6 characters"
              />
            </div>
            {errors.password && <p className="mt-1 text-[11px] text-red-400">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
              <input
                type={showPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(e) => {
                  setForm({ ...form, confirmPassword: e.target.value });
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
                }}
                className={`w-full rounded-xl border bg-dark-900 pl-10 pr-10 py-2 text-xs text-white placeholder-slate-500 outline-none transition focus:border-primary-400 ${
                  errors.confirmPassword ? "border-red-500" : "border-slate-700"
                }`}
                placeholder="Repeat password"
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-[11px] text-red-400">{errors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loadingAction !== null}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary-400 py-3 text-xs font-bold text-dark-950 hover:bg-primary-300 disabled:opacity-60 transition shadow-glow-sm"
          >
            {loadingAction === "form" ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Free Player Account</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          Already registered?{" "}
          <Link href="/login" className="text-primary-400 font-bold hover:underline">
            Log in to existing account
          </Link>
        </p>
      </div>
    </div>
  );
}
