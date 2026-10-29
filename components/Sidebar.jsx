"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  Dumbbell,
  Wrench,
  Users,
  Sliders,
  BarChart3,
  Shield,
} from "lucide-react";

export const ADMIN_LINKS = [
  { href: "/admin", label: "Overview & KPIs", icon: LayoutDashboard },
  { href: "/admin/facilities", label: "Facility Inventory", icon: Building2 },
  { href: "/admin/bookings", label: "Booking Manager", icon: CalendarDays },
  { href: "/admin/equipment", label: "Equipment Stock", icon: Dumbbell },
  { href: "/admin/maintenance", label: "Maintenance Blocks", icon: Wrench },
  { href: "/admin/users", label: "User Accounts", icon: Users },
  { href: "/admin/rules", label: "Booking Rules & Hours", icon: Sliders },
  { href: "/admin/reports", label: "Reports & Audit Logs", icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-slate-800/80 bg-dark-900/95 min-h-[calc(100vh-61px)] p-4 space-y-6">
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold">
        <Shield size={16} />
        <span>Administrator Console</span>
      </div>

      <nav className="space-y-1">
        {ADMIN_LINKS.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold transition ${
                active
                  ? "bg-primary-400/15 text-primary-400 border border-primary-400/30 shadow-glow-sm"
                  : "text-slate-400 hover:bg-dark-800 hover:text-white"
              }`}
            >
              <Icon size={16} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-slate-800 pt-4 px-3 text-[11px] text-slate-500 space-y-1">
        <p className="font-semibold text-slate-400">Courts After Dark Core</p>
        <p>MongoDB Atomic Engine</p>
      </div>
    </aside>
  );
}
