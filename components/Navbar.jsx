"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Trophy,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  Shield,
  Calendar,
  Dumbbell,
  Compass,
  HelpCircle,
  Sparkles,
  ChevronDown,
  Loader2,
  Search,
  CreditCard,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);
  const [demoLoading, setDemoLoading] = useState(null); // 'player' | 'admin'
  const demoRef = useRef(null);

  const { user, logout, loading, loginDemo } = useAuth();
  const { showToast } = useToast();
  const pathname = usePathname();

  // Close demo menu on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (demoRef.current && !demoRef.current.contains(e.target)) {
        setDemoMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleInstantDemo(role) {
    setDemoLoading(role);
    setDemoMenuOpen(false);
    setOpen(false);
    try {
      const loggedUser = await loginDemo(role);
      showToast(`Welcome! Logged in as Demo ${role === "admin" ? "Admin" : "Player"} (${loggedUser.name}).`);
      if (loggedUser.role === "admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      showToast(err.message || "Failed to start demo session.", "error");
      setDemoLoading(null);
    }
  }

  const navLinks = [
    { href: "/search", label: "Search & Book", icon: Search },
    { href: "/facilities", label: "Courts & Grounds", icon: Compass },
    { href: "/equipment", label: "Sports Gear", icon: Dumbbell },
    { href: "/help", label: "Rules & FAQ", icon: HelpCircle },
  ];

  if (user) {
    navLinks.splice(3, 0, { href: "/bookings", label: "My Bookings", icon: Calendar });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-dark-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-400/15 border border-primary-400/40 text-primary-400 transition group-hover:scale-105 group-hover:bg-primary-400/25 group-hover:border-primary-400/60 shadow-glow-sm">
            <Trophy size={19} className="text-primary-400" />
          </div>
          <div>
            <span className="font-extrabold tracking-tight text-white text-base sm:text-lg flex items-center gap-1">
              COURTS <span className="text-primary-400 font-black">AFTER DARK</span>
            </span>
            <span className="hidden sm:block text-[10px] text-slate-400 tracking-wider font-semibold uppercase -mt-1">
              Courts, Grounds & Sports Gear
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
                  active
                    ? "bg-primary-400/15 text-primary-300 border border-primary-400/30 shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-dark-850"
                }`}
              >
                <Icon size={15} className={active ? "text-primary-400" : "text-slate-400"} />
                {link.label}
              </Link>
            );
          })}

          {user?.role === "admin" && (
            <Link
              href="/admin"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
                pathname.startsWith("/admin")
                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                  : "text-amber-400 hover:bg-amber-500/10"
              }`}
            >
              <Shield size={15} />
              Admin Suite
            </Link>
          )}
        </nav>

        {/* Desktop Auth Controls */}
        <div className="hidden md:flex items-center gap-2.5">
          {!loading && !user && (
            <>
              {/* Instant Demo Dropdown */}
              <div className="relative" ref={demoRef}>
                <button
                  type="button"
                  onClick={() => setDemoMenuOpen(!demoMenuOpen)}
                  disabled={demoLoading !== null}
                  className="flex items-center gap-1.5 rounded-xl border border-primary-400/40 bg-primary-400/10 px-3 py-1.5 text-xs font-bold text-primary-300 hover:bg-primary-400/20 hover:border-primary-400 transition"
                  title="Try without creating an account"
                >
                  {demoLoading ? (
                    <Loader2 size={13} className="animate-spin text-primary-400" />
                  ) : (
                    <Sparkles size={13} className="text-primary-400 animate-pulse" />
                  )}
                  <span>{demoLoading ? "Logging in..." : "Demo Mode"}</span>
                  <ChevronDown size={12} className={`transition-transform ${demoMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {demoMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-700/80 bg-dark-850 p-2 shadow-2xl backdrop-blur-xl z-50 space-y-1">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                      1-Click Instant Demo
                    </div>
                    <button
                      type="button"
                      onClick={() => handleInstantDemo("player")}
                      className="flex items-center justify-between w-full px-2.5 py-2 text-left rounded-xl hover:bg-dark-800 transition group"
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-primary-400/15 border border-primary-400/30 flex items-center justify-center text-primary-400">
                          <UserIcon size={14} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-primary-400 transition-colors">
                            Demo Player
                          </div>
                          <div className="text-[10px] text-slate-400">Aarav (Book & Gear)</div>
                        </div>
                      </div>
                      <span className="text-[10px] text-primary-400 font-semibold">1-Click</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInstantDemo("admin")}
                      className="flex items-center justify-between w-full px-2.5 py-2 text-left rounded-xl hover:bg-dark-800 transition group"
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                          <Shield size={14} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                            Demo Admin
                          </div>
                          <div className="text-[10px] text-slate-400">Full Control Suite</div>
                        </div>
                      </div>
                      <span className="text-[10px] text-amber-400 font-semibold">1-Click</span>
                    </button>

                    <div className="border-t border-slate-800 pt-1 mt-1">
                      <Link
                        href="/search"
                        onClick={() => setDemoMenuOpen(false)}
                        className="flex items-center gap-1.5 w-full px-2.5 py-1.5 text-[11px] font-medium text-slate-400 hover:text-white rounded-lg hover:bg-dark-800"
                      >
                        <Search size={12} className="text-primary-400" />
                        <span>Search Courts & Gear (No Login)</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <Link
                href="/login"
                className="text-xs sm:text-sm font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-xl hover:bg-dark-850 transition"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-1.5 rounded-xl bg-primary-400 px-4 py-2 text-xs sm:text-sm font-bold text-dark-950 hover:bg-primary-300 transition shadow-glow-sm"
              >
                <Sparkles size={14} />
                Sign Up
              </Link>
            </>
          )}

          {!loading && user && (
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-dark-850 px-3 py-1.5 text-xs sm:text-sm text-slate-200 hover:border-primary-400/40 hover:bg-dark-800 transition"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-400/20 text-primary-400 text-xs font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold text-xs sm:text-sm">{user.name.split(" ")[0]}</span>
                {user.role === "admin" && (
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
                    Admin
                  </span>
                )}
              </Link>
              <Link
                href="/profile"
                title="Account Settings"
                className="p-2 rounded-xl border border-slate-700/60 text-slate-400 hover:text-white hover:bg-dark-800 transition"
              >
                <UserIcon size={16} />
              </Link>
              <button
                onClick={logout}
                title="Log Out"
                className="flex items-center gap-1 rounded-xl border border-slate-700/60 px-2.5 py-1.5 text-xs text-slate-400 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Mobile Toggle Button */}
        <button
          className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-dark-850"
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div className="md:hidden border-t border-slate-800 bg-dark-950/98 backdrop-blur-xl px-4 py-4 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold ${
                  active ? "bg-primary-400/15 text-primary-300 border border-primary-400/30" : "text-slate-300"
                }`}
              >
                <Icon size={16} className={active ? "text-primary-400" : "text-slate-400"} />
                {link.label}
              </Link>
            );
          })}

          {user?.role === "admin" && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20"
            >
              <Shield size={16} />
              Admin Suite
            </Link>
          )}

          <div className="border-t border-slate-800 pt-3 mt-2">
            {!user ? (
              <div className="space-y-2.5">
                {/* Mobile Instant Demo Buttons */}
                <div className="rounded-xl border border-primary-400/30 bg-primary-400/5 p-2.5 space-y-2">
                  <div className="text-[11px] font-bold text-primary-400 flex items-center gap-1">
                    <Sparkles size={12} /> 1-Click Demo Accounts:
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={demoLoading !== null}
                      onClick={() => handleInstantDemo("player")}
                      className="rounded-lg border border-primary-400/30 bg-primary-400/15 py-1.5 text-center text-xs font-bold text-primary-300 hover:bg-primary-400/25"
                    >
                      {demoLoading === "player" ? "Loading..." : "⚡ Demo Player"}
                    </button>
                    <button
                      type="button"
                      disabled={demoLoading !== null}
                      onClick={() => handleInstantDemo("admin")}
                      className="rounded-lg border border-amber-500/30 bg-amber-500/15 py-1.5 text-center text-xs font-bold text-amber-300 hover:bg-amber-500/25"
                    >
                      {demoLoading === "admin" ? "Loading..." : "🛡️ Demo Admin"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="rounded-xl border border-slate-700 px-3 py-2 text-center text-xs font-semibold text-slate-200"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setOpen(false)}
                    className="rounded-xl bg-primary-400 px-3 py-2 text-center text-xs font-bold text-dark-950"
                  >
                    Sign Up
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 text-sm text-slate-200 font-semibold"
                >
                  Dashboard ({user.name})
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Profile & Settings
                </Link>
                <button
                  onClick={logout}
                  className="w-full text-left px-3 py-2 text-sm text-red-400 hover:underline"
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
