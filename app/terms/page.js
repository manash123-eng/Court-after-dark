import { FileText, ShieldAlert, CheckCircle, Scale } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      <div className="border-b border-slate-800 pb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-primary-400">
          User Agreement
        </span>
        <h1 className="text-3xl font-black text-white tracking-tight mt-1">Terms of Service</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Effective October 2026. Rules and guidelines governing court bookings and equipment use.
        </p>
      </div>

      <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-300 space-y-6 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Scale size={16} className="text-primary-400" /> 1. Fair-Use & Anti-Monopolisation Policy
          </h2>
          <p>
            Courts After Dark is dedicated to equitable athletic access. Every player agrees to the following platform rules:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-400">
            <li><strong>Active Booking Cap:</strong> No player may hold more than two (2) concurrent active reservations.</li>
            <li><strong>Prime-Time Limit:</strong> Peak evening sessions (18:00–21:00) are capped at three (3) sessions per user per calendar week.</li>
            <li><strong>No Botting / Scripting:</strong> Reservations must be made directly by legitimate players. Automated scripting or rapid scraping is strictly prohibited and subject to account suspension.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <CheckCircle size={16} className="text-primary-400" /> 2. Venue Entry & Footwear Requirements
          </h2>
          <p>
            To preserve sports court surfaces, all participants must comply with venue equipment rules:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-400">
            <li>Indoor wooden and synthetic courts require clean, non-marking gum rubber athletic shoes.</li>
            <li>Turf football fields permit molded turf shoes or rubber cleats; metal studs are prohibited.</li>
            <li>Players must present their digital game pass or booking reference upon coordinator request.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldAlert size={16} className="text-primary-400" /> 3. Cancellation & No-Show Policies
          </h2>
          <p>
            Free cancellation is permitted up to the facility's cancellation deadline (4 hours prior to session commencement). Repeated no-shows without cancellation may temporarily reduce a player's advance booking window.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileText size={16} className="text-primary-400" /> 4. Equipment Responsibility
          </h2>
          <p>
            Borrowed gear (rackets, balls, mats) must be returned in good condition at the end of the booking period. Users are responsible for reporting broken equipment immediately to the sports complex desk.
          </p>
        </section>
      </div>
    </div>
  );
}
