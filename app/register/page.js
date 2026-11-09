"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Mail,
  Smartphone,
  Lock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Shield,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  GraduationCap,
  Building2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { isValidEmail, isValidName, evaluatePasswordStrength } from "@/lib/validators";

const LPU_STUDENT_CATEGORIES = [
  "Hosteller with EDB",
  "Hosteller without EDB",
  "Day Scholar",
  "Outstanding Sportsperson",
  "Faculty / Staff",
];

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [studentCategory, setStudentCategory] = useState("Hosteller with EDB");
  const [regNo, setRegNo] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToRules, setAgreedToRules] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { register, loginDemo } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  function handlePhoneChange(e) {
    let digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(digits);
    setErrorMessage("");
  }

  async function handleRegisterSubmit(e) {
    e.preventDefault();
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("Please enter your full student name.");
      return;
    }
    if (!isValidName(name)) {
      setErrorMessage("Name must be between 2 and 50 characters.");
      return;
    }
    if (!email.trim() || !isValidEmail(email)) {
      setErrorMessage("Please enter a valid university email address.");
      return;
    }

    if (!phone || phone.length !== 10) {
      setErrorMessage("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setErrorMessage("Indian mobile numbers must start with 6, 7, 8, or 9.");
      return;
    }

    if (!password) {
      setErrorMessage("Password is required.");
      return;
    }
    const pwdStrength = evaluatePasswordStrength(password);
    if (!pwdStrength.passed) {
      setErrorMessage(pwdStrength.requirements[0] || "Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter.");
      return;
    }
    if (!agreedToRules) {
      setErrorMessage("Please accept the LPU Sports Complex guidelines and code of conduct.");
      return;
    }

    setLoading(true);

    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: `+91${phone}`,
        password,
        studentCategory,
        regNo: regNo.trim(),
      });

      showToast("Account created successfully! Welcome to LPU Sports Portal.");
      router.push("/dashboard");
    } catch (err) {
      setErrorMessage(err.message || "Registration failed. Please check your details and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleInstantDemo() {
    setLoading(true);
    try {
      const logged = await loginDemo("student");
      showToast(`Welcome! Signed in as Demo Student (${logged.name}).`);
      router.push("/dashboard");
    } catch {
      showToast("Demo sign-in failed.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[85vh] max-w-lg flex-col justify-center px-4 py-10">
      {/* Registration Card */}
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
              Create Student Sports Account
            </h1>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Phagwara, Punjab • Direct Student Registration (Instant Access)
            </p>
          </div>
        </div>

        {/* 1-Click Demo Shortcut */}
        <div className="rounded-lg border border-red-200 bg-red-50/60 p-3 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-[#a71d2a] flex items-center gap-1.5">
              <Sparkles size={13} />
              <span>Want to explore immediately?</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Skip form filling and launch as verified LPU student.
            </p>
          </div>
          <button
            type="button"
            onClick={handleInstantDemo}
            disabled={loading}
            className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-bold text-[#a71d2a] hover:bg-red-50 hover:border-[#a71d2a] transition shrink-0 cursor-pointer"
          >
            1-Click Demo
          </button>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle size={15} className="shrink-0 text-red-600 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Full Student Name <span className="text-[#a71d2a]">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrorMessage("");
                }}
                placeholder="Aarav Sharma"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-[#a71d2a] focus:ring-1 focus:ring-[#a71d2a] transition"
                autoFocus
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                University Email <span className="text-[#a71d2a]">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMessage("");
                }}
                placeholder="student@lpu.in"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-[#a71d2a] focus:ring-1 focus:ring-[#a71d2a] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mobile Number <span className="text-[#a71d2a]">*</span>
              </label>
              <div className="relative flex rounded-lg border border-slate-300 bg-slate-50 overflow-hidden focus-within:border-[#a71d2a] focus-within:bg-white transition">
                <div className="flex items-center gap-1 px-2.5 bg-slate-100 border-r border-slate-300 text-xs font-bold text-slate-700">
                  <span>🇮🇳</span>
                  <span>+91</span>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="7828722557"
                  maxLength={10}
                  className="w-full bg-transparent px-3 py-2 text-sm text-slate-900 placeholder-slate-400 font-mono outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Student Category <span className="text-[#a71d2a]">*</span>
              </label>
              <select
                value={studentCategory}
                onChange={(e) => setStudentCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#a71d2a] focus:ring-1 focus:ring-[#a71d2a] transition"
              >
                {LPU_STUDENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Registration No. (Optional)
              </label>
              <input
                type="text"
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                placeholder="e.g. 12104822"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-[#a71d2a] focus:ring-1 focus:ring-[#a71d2a] transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password <span className="text-[#a71d2a]">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage("");
                  }}
                  placeholder="Min 6 characters"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-9 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-[#a71d2a] focus:ring-1 focus:ring-[#a71d2a] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Confirm Password <span className="text-[#a71d2a]">*</span>
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrorMessage("");
                }}
                placeholder="Repeat password"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-[#a71d2a] focus:ring-1 focus:ring-[#a71d2a] transition"
              />
            </div>
          </div>

          {/* Rules Checkbox */}
          <div className="flex items-start gap-2 pt-1">
            <input
              type="checkbox"
              id="rulesCheckbox"
              checked={agreedToRules}
              onChange={(e) => setAgreedToRules(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#a71d2a] focus:ring-[#a71d2a] cursor-pointer"
            />
            <label htmlFor="rulesCheckbox" className="text-xs text-slate-600 leading-relaxed cursor-pointer">
              I agree to abide by LPU Sports Complex rules, non-marking shoe requirements, and student code of conduct.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#a71d2a] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#8b1822] active:scale-[0.99] transition shadow-xs disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Student Account</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="border-t border-slate-200 pt-4 text-center text-xs text-slate-600">
          <span>Already registered with LPU Sports? </span>
          <Link
            href="/login"
            className="font-bold text-[#a71d2a] hover:underline inline-flex items-center gap-0.5"
          >
            <span>Sign In to Account</span>
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}
