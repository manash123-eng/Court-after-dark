"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  Shield,
  User,
  Eye,
  EyeOff,
  Compass,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loadingAction, setLoadingAction] = useState(null); // 'form' | 'demo-player' | 'demo-admin'
  const { login, loginDemo } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  function validate() {
    const e = {};
    if (!form.email.trim()) e.email = "Email address is required.";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Please enter a valid email address.";
    if (!form.password) e.password = "Password is required.";
    return e;
  }

  function fillDemo(email, password) {
    setForm({ email, password });
    setErrors({});
    showToast(`Credentials filled for ${email}. Click Sign In to continue.`);
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
      const loggedUser = await login(form.email, form.password);
      showToast(`Welcome back, ${loggedUser.name}!`);
      if (loggedUser.role === "admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      showToast(err.message || "Invalid email or password.", "error");
      setErrors({ form: err.message || "Invalid email or password." });
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
          <h1 className="text-2xl font-black text-white tracking-tight">Sign In</h1>
          <p className="text-xs text-slate-400">
            Access your fair-booking allocations, digital passes, and court schedules.
          </p>
        </div>

        {/* 1-Click Instant Demo Access Box */}
        <div className="rounded-2xl border border-primary-400/30 bg-gradient-to-b from-primary-400/10 via-dark-900/90 to-dark-900/90 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-primary-400">
              <Sparkles size={14} className="animate-pulse" />
              <span>Instant Demo Accounts</span>
            </div>
            <span className="rounded-full bg-primary-400/20 px-2 py-0.5 text-[10px] font-bold text-primary-300">
              Zero typing needed
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Want to test without creating an account? Click below to instantly log in:
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={loadingAction !== null}
              onClick={() => handleDemoLogin("player")}
              className="flex flex-col items-center justify-center gap-1 rounded-xl border border-primary-400/40 bg-primary-400/15 p-2.5 text-xs font-bold text-primary-300 hover:bg-primary-400/25 hover:border-primary-400 disabled:opacity-60 transition shadow-sm group"
            >
              <div className="flex items-center gap-1.5">
                {loadingAction === "demo-player" ? (
                  <Loader2 size={14} className="animate-spin text-primary-400" />
                ) : (
                  <User size={14} className="text-primary-400 group-hover:scale-110 transition-transform" />
                )}
                <span>{loadingAction === "demo-player" ? "Signing In..." : "Demo Player"}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-normal">Aarav (Bookings & Gear)</span>
            </button>

            <button
              type="button"
              disabled={loadingAction !== null}
              onClick={() => handleDemoLogin("admin")}
              className="flex flex-col items-center justify-center gap-1 rounded-xl border border-amber-500/40 bg-amber-500/15 p-2.5 text-xs font-bold text-amber-300 hover:bg-amber-500/25 hover:border-amber-500 disabled:opacity-60 transition shadow-sm group"
            >
              <div className="flex items-center gap-1.5">
                {loadingAction === "demo-admin" ? (
                  <Loader2 size={14} className="animate-spin text-amber-400" />
                ) : (
                  <Shield size={14} className="text-amber-400 group-hover:scale-110 transition-transform" />
                )}
                <span>{loadingAction === "demo-admin" ? "Signing In..." : "Demo Admin"}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-normal">Full Admin Suite</span>
            </button>
          </div>

          {/* Quick Explore as Guest Button */}
          <div className="pt-1 border-t border-slate-800/80">
            <Link
              href="/facilities"
              className="flex items-center justify-center gap-1.5 w-full rounded-xl border border-slate-700/80 bg-dark-800/80 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-dark-700/80 hover:border-slate-600 transition"
            >
              <Compass size={13} className="text-primary-400" />
              <span>Explore Facilities as Guest (No Login Required)</span>
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-slate-800"></div>
          <span className="absolute bg-dark-850 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            or sign in with credentials
          </span>
        </div>

        {/* Error alert banner */}
        {errors.form && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            {errors.form}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
              <input
                type="email"
                value={form.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: null });
                }}
                className={`w-full rounded-xl border bg-dark-900 pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition focus:border-primary-400 ${
                  errors.email ? "border-red-500" : "border-slate-700"
                }`}
                placeholder="you@example.com"
              />
            </div>
            {errors.email && <p className="mt-1 text-[11px] text-red-400">{errors.email}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-300">
                Password
              </label>
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
                className={`w-full rounded-xl border bg-dark-900 pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition focus:border-primary-400 ${
                  errors.password ? "border-red-500" : "border-slate-700"
                }`}
                placeholder="••••••••"
              />
            </div>
            {errors.password && <p className="mt-1 text-[11px] text-red-400">{errors.password}</p>}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span className="text-slate-500">Need demo fill?</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fillDemo("aarav@example.com", "player123")}
                className="text-primary-400 hover:underline"
              >
                Fill Player
              </button>
              <span className="text-slate-700">•</span>
              <button
                type="button"
                onClick={() => fillDemo("admin@courtsafterdark.com", "admin123")}
                className="text-amber-400 hover:underline"
              >
                Fill Admin
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loadingAction !== null}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary-400 py-3 text-xs font-bold text-dark-950 hover:bg-primary-300 disabled:opacity-60 transition shadow-glow-sm"
          >
            {loadingAction === "form" ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In to Courts After Dark</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* Footer links */}
        <div className="pt-2 border-t border-slate-800 text-center space-y-2 text-xs">
          <p className="text-slate-400">
            Don't have an athlete account?{" "}
            <Link href="/register" className="text-primary-400 font-bold hover:underline">
              Register for free
            </Link>
          </p>
          <p className="text-[11px] text-slate-500">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="hover:text-slate-300 underline">
              Fair Allocation Rules & Terms
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
