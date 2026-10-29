import Link from "next/link";
import { Trophy, Moon, Shield, Heart, CreditCard, Smartphone, CheckCircle, Search, Dumbbell } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-dark-950 text-slate-400 text-xs">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand & mission */}
          <div className="space-y-3 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-400/15 border border-primary-400/30 text-primary-400">
                <Trophy size={17} />
              </div>
              <span className="font-extrabold text-sm tracking-tight text-white">
                COURTS <span className="text-primary-400">AFTER DARK</span>
              </span>
            </Link>
            <p className="text-slate-400 text-xs leading-relaxed">
              Prime-time floodlit court reservations, fair-quota allocation, sports gear rentals, and secure digital checkout via Card & Razorpay.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-primary-400 font-semibold">
              <Moon size={13} /> Night floodlight sessions active 18:00 – 23:00
            </div>
          </div>

          {/* Col 2: Grounds & Courts */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Grounds & Courts</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/search?tab=grounds" className="hover:text-primary-300 transition flex items-center gap-1">
                  <Search size={11} className="text-primary-400" /> Search All Grounds
                </Link>
              </li>
              <li>
                <Link href="/facilities?type=Badminton+Court" className="hover:text-primary-300 transition">
                  Badminton Courts
                </Link>
              </li>
              <li>
                <Link href="/facilities?type=Basketball+Court" className="hover:text-primary-300 transition">
                  Basketball Courts
                </Link>
              </li>
              <li>
                <Link href="/facilities?type=Football+Ground" className="hover:text-primary-300 transition">
                  Football & 7v7 Turfs
                </Link>
              </li>
              <li>
                <Link href="/facilities?type=Cricket+Ground" className="hover:text-primary-300 transition">
                  Cricket Ovals & Nets
                </Link>
              </li>
              <li>
                <Link href="/facilities?type=Tennis+Court" className="hover:text-primary-300 transition">
                  Tennis Plexipave Courts
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Sports Gear & Fair Play */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Equipment & Fair Play</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/equipment" className="hover:text-primary-300 transition flex items-center gap-1">
                  <Dumbbell size={11} className="text-primary-400" /> Rent Sports Gear
                </Link>
              </li>
              <li>
                <Link href="/search?tab=equipment" className="hover:text-primary-300 transition">
                  Search Available Items
                </Link>
              </li>
              <li>
                <Link href="/help#fair-rules" className="hover:text-primary-300 transition">
                  Anti-Hoarding Slot Rules
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-primary-300 transition">
                  Platform FAQ & Viva Explanations
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary-300 transition">
                  Venue Support Desk
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Payments & Security */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Accepted Payments</h4>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 text-[11px]">
                <span className="rounded-lg bg-dark-900 border border-slate-800 px-2.5 py-1 text-slate-300 font-bold flex items-center gap-1">
                  <CreditCard size={12} className="text-primary-400" /> Credit / Debit
                </span>
                <span className="rounded-lg bg-dark-900 border border-cyan-500/30 px-2.5 py-1 text-cyan-300 font-bold flex items-center gap-1">
                  <Smartphone size={12} /> Razorpay UPI
                </span>
                <span className="rounded-lg bg-dark-900 border border-slate-800 px-2.5 py-1 text-slate-300 font-bold">
                  Visa / MC / RuPay
                </span>
                <span className="rounded-lg bg-dark-900 border border-amber-500/30 px-2.5 py-1 text-amber-300 font-bold">
                  Pay at Venue
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                256-bit SSL encrypted transactions. Instant digital ticket and invoice delivered on confirmation.
              </p>
              <div className="pt-1">
                <Link href="/admin" className="text-slate-500 hover:text-amber-400 transition flex items-center gap-1">
                  <Shield size={12} /> Admin Management Portal
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
          <p>© {new Date().getFullYear()} Courts After Dark. Night Sports Arena Booking Platform.</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-slate-400">Terms</Link>
            <Link href="/privacy" className="hover:text-slate-400">Privacy</Link>
            <Link href="/help" className="hover:text-slate-400">Fair Use</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
