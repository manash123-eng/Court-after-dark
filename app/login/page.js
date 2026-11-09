"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Mail,
  Smartphone,
  ArrowRight,
  Sparkles,
  Shield,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  AlertCircle,
  GraduationCap,
  Building2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const { login, loginDemo } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  async function handleLoginSubmit(e) {
    e.preventDefault();
    setErrorMessage("");

    if (!identifier.trim()) {
      setErrorMessage("Please enter your university email or mobile phone number.");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setLoadingAction("login");
    try {
      const loggedUser = await login(identifier.trim(), password);
      showToast(`Welcome back, ${loggedUser.name}!`);
      if (["admin", "super_admin", "sports_admin", "coach", "equipment_manager"].includes(loggedUser.role)) {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setErrorMessage(err.message || "Invalid credentials. Please verify your email/phone and password.");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleDemoLogin(role) {
    setLoadingAction(role);
    setErrorMessage("");
    try {
      const loggedUser = await loginDemo(role);
      showToast(`Signed in as ${loggedUser.name} (${loggedUser.role}).`);
      if (["admin", "super_admin", "sports_admin", "coach", "equipment_manager"].includes(loggedUser.role)) {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setErrorMessage(err.message || "Failed to start demo session.");
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div className="mx-auto flex min-h-[85vh] max-w-md flex-col justify-center px-4 py-12">
      {/* University Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        {/* Header with Official LPU Logo */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex justify-center pb-1">
            <img
              src="/images/lpu-logo.svg"
              alt="Lovely Professional University"
              className="h-11 w-auto object-contain"
            />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#a71d2a]">
              LOVELY PROFESSIONAL UNIVERSITY
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              Sports Portal Sign In
            </h1>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
              Phagwara, Punjab • Student Sports Facility Booking
            </p>
          </div>
        </div>

        {/* 1-Click Instant Demo Accounts */}
        <div className="rounded-lg border border-red-200 bg-red-50/60 p-3 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-[#a71d2a]">
            <span className="flex items-center gap-1.5">
              <Sparkles size={13} />
              <span>Instant Demo Accounts</span>
            </span>
            <span className="text-[10px] uppercase font-semibold text-slate-500">
              1-Click Login
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={loadingAction !== null}
              onClick={() => handleDemoLogin("student")}
              className="flex flex-col items-start rounded-lg border border-red-200 bg-white p-2 text-xs font-bold text-slate-800 hover:border-[#a71d2a] hover:bg-red-50 transition cursor-pointer"
            >
              <div className="flex items-center gap-1 text-[#a71d2a]">
                {loadingAction === "student" ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <User size={12} />
                )}
                <span>Aarav Sharma</span>
              </div>
              <span className="text-[10px] text-slate-500 font-normal">Student (Hosteller EDB)</span>
            </button>

            <button
              type="button"
              disabled={loadingAction !== null}
              onClick={() => handleDemoLogin("sports_admin")}
              className="flex flex-col items-start rounded-lg border border-amber-300 bg-white p-2 text-xs font-bold text-slate-800 hover:border-amber-500 hover:bg-amber-50 transition cursor-pointer"
            >
              <div className="flex items-center gap-1 text-amber-800">
                {loadingAction === "sports_admin" ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Shield size={12} />
                )}
                <span>DSW Admin</span>
              </div>
              <span className="text-[10px] text-slate-500 font-normal">Sports Console</span>
            </button>

            <button
              type="button"
              disabled={loadingAction !== null}
              onClick={() => handleDemoLogin("coach")}
              className="flex flex-col items-start rounded-lg border border-blue-200 bg-white p-2 text-xs font-bold text-slate-800 hover:border-blue-400 hover:bg-blue-50 transition cursor-pointer"
            >
              <div className="flex items-center gap-1 text-blue-700">
                {loadingAction === "coach" ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <GraduationCap size={12} />
                )}
                <span>Coach Sandeep</span>
              </div>
              <span className="text-[10px] text-slate-500 font-normal">Varsity Coach</span>
            </button>

            <button
              type="button"
              disabled={loadingAction !== null}
              onClick={() => handleDemoLogin("equipment_manager")}
              className="flex flex-col items-start rounded-lg border border-emerald-200 bg-white p-2 text-xs font-bold text-slate-800 hover:border-emerald-400 hover:bg-emerald-50 transition cursor-pointer"
            >
              <div className="flex items-center gap-1 text-emerald-700">
                {loadingAction === "equipment_manager" ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Building2 size={12} />
                )}
                <span>Gurpreet Singh</span>
              </div>
              <span className="text-[10px] text-slate-500 font-normal">Equipment Store</span>
            </button>
          </div>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle size={15} className="shrink-0 text-red-600 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Direct Login Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              University Email or Mobile Number
            </label>
            <div className="relative">
              <input
                type="text"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setErrorMessage("");
                }}
                placeholder="aarav@example.com or 7828722557"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-[#a71d2a] focus:ring-1 focus:ring-[#a71d2a] transition"
                autoFocus
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Enter your registered LPU email or 10-digit mobile number.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">Password</label>
              <span className="text-[11px] text-[#a71d2a] hover:underline cursor-pointer">
                Forgot password?
              </span>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage("");
                }}
                placeholder="Enter your account password"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-[#a71d2a] focus:ring-1 focus:ring-[#a71d2a] transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loadingAction !== null}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#a71d2a] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#8b1822] active:scale-[0.99] transition shadow-xs disabled:opacity-60 cursor-pointer"
          >
            {loadingAction === "login" ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In to Sports Portal</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="border-t border-slate-200 pt-4 text-center text-xs text-slate-600">
          <span>New student at Lovely Professional University? </span>
          <Link
            href="/register"
            className="font-bold text-[#a71d2a] hover:underline inline-flex items-center gap-0.5"
          >
            <span>Register Student Account</span>
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}
