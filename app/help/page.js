"use client";

import { useState } from "react";
import Link from "next/link";
import {
  HelpCircle,
  ShieldCheck,
  CalendarCheck,
  Dumbbell,
  Clock,
  Sparkles,
  ChevronDown,
  MessageSquare,
  Search,
} from "lucide-react";

const FAQS = [
  {
    category: "Fair Slot Allocation",
    question: "How does Courts After Dark prevent prime-time monopolisation?",
    answer:
      "Courts After Dark implements an automated anti-monopoly fair-use engine on the server. Each player is capped at a maximum of 2 active reservations across all venues simultaneously. Furthermore, prime-time evening slots (18:00–21:00) enforce weekly quotas (maximum 3 peak sessions per week) to prevent power users from bulk-booking high-demand slots.",
  },
  {
    category: "Concurrency & Double-Booking",
    question: "How does the platform guarantee zero double-booking under concurrent load?",
    answer:
      "All booking requests execute inside atomic database operations (using MongoDB transactions). When two players click 'Confirm' simultaneously for the same slot, the server rechecks existing confirmed bookings inside the transaction lock. Only the first commit succeeds with HTTP 201; the conflicting attempt is instantly rejected with HTTP 409 Conflict, offering the second user an immediate waitlist position.",
  },
  {
    category: "Maintenance Override",
    question: "How do maintenance schedules interact with court availability?",
    answer:
      "Maintenance blocks take precedence over all casual bookings. When a facility coordinator schedules a maintenance window, the availability calculation engine automatically marks all overlapping slots as 'Maintenance' (orange badge) and prevents any player from booking. If an emergency block is scheduled over an existing booking, coordinators are notified to reschedule the slot.",
  },
  {
    category: "Priority Waitlist",
    question: "How does the waitlist queue work when a slot is already booked?",
    answer:
      "If your preferred evening slot is taken, click 'Waitlist' on the availability calendar. Your request is queued in strict first-come, first-served order. If the booked player cancels their reservation, the system automatically marks the earliest waitlisted player as 'Notified' with a priority window to claim the court.",
  },
  {
    category: "Equipment Checkout",
    question: "How does sports equipment inventory integration work?",
    answer:
      "The equipment catalog is linked to our sports facility inventory. Players can check out balls, rackets, and mats from the Equipment module before or during their session. Checking out gear automatically decrements live stock; returning gear via the dashboard immediately restores available stock and allows recording the equipment's condition (New, Good, Fair, Worn).",
  },
  {
    category: "Cancellations & Deadlines",
    question: "What is the cancellation policy?",
    answer:
      "Players can cancel reservations freely through 'My Bookings' up to the facility's cancellation deadline (typically 4 hours prior to the session start time). Late cancellations within 4 hours are locked to prevent leaving prime courts empty at the last minute.",
  },
];

export default function HelpPage() {
  const [search, setSearch] = useState("");
  const [openIndex, setOpenIndex] = useState(0);

  const filtered = FAQS.filter(
    (f) =>
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase()) ||
      f.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary-400/30 bg-primary-400/10 px-3.5 py-1 text-xs font-semibold text-primary-300">
          <HelpCircle size={14} className="text-primary-400" /> Help Center & Fair-Play Guide
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          How Courts After Dark Works
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Understand our fair slot allocation engine, anti-monopoly rules, digital passes, and equipment checkout lifecycle.
        </p>

        {/* Search */}
        <div className="pt-4 max-w-md mx-auto relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions (e.g. fair rules, double-booking, cancel)..."
            className="w-full rounded-2xl border border-slate-700 bg-dark-850 pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 outline-none focus:border-primary-400 shadow-lg"
          />
        </div>
      </div>

      {/* Rules Highlights (3 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="fair-rules">
        <div className="rounded-2xl border border-slate-800 bg-dark-850 p-5 space-y-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-400/10 text-primary-400">
            <ShieldCheck size={18} />
          </div>
          <h3 className="text-sm font-bold text-white">Active Booking Cap</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Maximum 2 active confirmed sessions per user at any time. Prevents court hoarders from locking up an entire week of evening slots.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-dark-850 p-5 space-y-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-400/10 text-primary-400">
            <Clock size={18} />
          </div>
          <h3 className="text-sm font-bold text-white">Prime-Time Rotation</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Evening hours (18:00–21:00) enforce weekly quotas so casual evening players always have equal access to floodlit play.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-dark-850 p-5 space-y-2" id="cancellations">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-400/10 text-primary-400">
            <CalendarCheck size={18} />
          </div>
          <h3 className="text-sm font-bold text-white">Release & Waitlist</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Free cancellation up to 4 hours prior. Once cancelled, slots automatically open for waitlisted players or the public grid.
          </p>
        </div>
      </div>

      {/* Accordion FAQ */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-tight">Frequently Answered Questions</h2>
        <div className="divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-dark-850 overflow-hidden">
          {filtered.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={item.question} className="transition">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                  className="flex w-full items-center justify-between p-5 text-left text-sm font-bold text-white hover:text-primary-300"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-[10px] font-mono text-primary-400 font-bold uppercase tracking-wider">
                      [{item.category}]
                    </span>
                    <span>{item.question}</span>
                  </span>
                  <ChevronDown
                    size={16}
                    className={`shrink-0 text-slate-400 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-primary-400" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-slate-300 leading-relaxed border-t border-slate-800/40">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Still need help? */}
      <div className="rounded-2xl border border-slate-800 bg-dark-850 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-center sm:text-left">
        <div>
          <h3 className="text-sm font-bold text-white">Have a specific venue query or dispute?</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Our sports complex coordinators are on duty every evening from 06:00 to 23:00.
          </p>
        </div>
        <Link
          href="/contact"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary-400 px-5 py-2.5 text-xs font-bold text-dark-950 hover:bg-primary-300 transition"
        >
          <MessageSquare size={14} /> Contact Coordinators
        </Link>
      </div>
    </div>
  );
}
