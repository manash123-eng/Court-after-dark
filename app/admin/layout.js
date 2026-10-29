"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Sidebar, { ADMIN_LINKS } from "@/components/Sidebar";
import Loading from "@/components/Loading";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== "admin") {
    return <Loading label="Verifying administrator privileges..." />;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-61px)]">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Admin Navigation Bar */}
      <div className="md:hidden border-b border-slate-800 bg-dark-900 px-4 py-2 flex gap-1.5 overflow-x-auto">
        {ADMIN_LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                active
                  ? "bg-primary-400 text-dark-950 font-bold"
                  : "bg-dark-800 text-slate-400 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* Main Admin Content */}
      <div className="flex-1 min-w-0 bg-dark-900/60">{children}</div>
    </div>
  );
}
