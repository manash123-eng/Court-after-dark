"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2, MessageSquare } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

export default function ContactPage() {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "Booking Inquiry",
    facility: "All Facilities",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
    showToast("Message sent! A sports facility coordinator will reach out shortly.");
    setForm({ name: "", email: "", subject: "Booking Inquiry", facility: "All Facilities", message: "" });
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-primary-400">
          Support & Venue Assistance
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Contact Courts After Dark
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
          Need help with court access, special event ground bookings, equipment issues, or referee scheduling? Reach out below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Info Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-dark-850 p-6 space-y-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <MapPin size={18} className="text-primary-400" /> Complex Information
            </h2>

            <div className="space-y-4 text-xs text-slate-300">
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-primary-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Central Sports Complex</p>
                  <p className="text-slate-400">Block A-C Athletics Pavilion, Campus Way, Downtown</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock size={16} className="text-primary-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Coordinator Operating Hours</p>
                  <p className="text-slate-400">Monday – Sunday: 06:00 AM – 11:30 PM (Daily)</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone size={16} className="text-primary-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Desk Hotline</p>
                  <p className="text-slate-400">+1 (555) 268-7872 / Ext 4</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail size={16} className="text-primary-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Direct Email</p>
                  <p className="text-slate-400">desk@courtsafterdark.com</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-primary-400/20 bg-primary-400/10 p-5 text-xs text-slate-300 space-y-1">
            <p className="font-bold text-primary-300 flex items-center gap-1.5">
              <CheckCircle2 size={14} /> Immediate Check-In Assistance
            </p>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              If floodlights or net equipment require attention during play, visit the central duty desk in Block A for immediate technician dispatch.
            </p>
          </div>
        </div>

        {/* Form Column (7 cols) */}
        <div className="lg:col-span-7">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-800 bg-dark-850 p-6 sm:p-8 space-y-4 shadow-xl"
          >
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <MessageSquare size={18} className="text-primary-400" /> Send an Inquiry
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Alex Morgan"
                  className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3.5 py-2.5 text-xs text-white outline-none focus:border-primary-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="alex@example.com"
                  className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3.5 py-2.5 text-xs text-white outline-none focus:border-primary-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Subject</label>
                <select
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2.5 text-xs text-white outline-none focus:border-primary-400"
                >
                  <option>Booking Inquiry</option>
                  <option>Tournament & League Reservation</option>
                  <option>Equipment Damage / Replacement</option>
                  <option>Maintenance Report</option>
                  <option>Fair-Use Dispute</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Relevant Venue</label>
                <input
                  type="text"
                  value={form.facility}
                  onChange={(e) => setForm({ ...form, facility: e.target.value })}
                  placeholder="e.g. Apex Arena Badminton 1"
                  className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3 py-2.5 text-xs text-white outline-none focus:border-primary-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Your Message</label>
              <textarea
                required
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Describe your inquiry or question in detail..."
                className="w-full rounded-xl border border-slate-700 bg-dark-900 px-3.5 py-2.5 text-xs text-white outline-none focus:border-primary-400"
              />
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-primary-400 px-6 py-2.5 text-xs font-bold text-dark-950 hover:bg-primary-300 transition shadow-glow-sm"
            >
              <Send size={14} /> Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
