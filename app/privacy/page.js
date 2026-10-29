import { Shield, Lock, Eye, Server } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      <div className="border-b border-slate-800 pb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-primary-400">
          Legal & Compliance
        </span>
        <h1 className="text-3xl font-black text-white tracking-tight mt-1">Privacy Policy</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Last updated: October 2026. How Courts After Dark protects your athlete profile and credentials.
        </p>
      </div>

      <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-300 space-y-6 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Lock size={16} className="text-primary-400" /> 1. Authentication & Cookie Security
          </h2>
          <p>
            Courts After Dark employs strict industry-standard security measures. Passwords are never stored in plain text and are salted and hashed using <strong>bcrypt</strong> with 10 salt rounds prior to storage in the database.
          </p>
          <p>
            Upon login, signed JSON Web Tokens (JWT) are stored in secure, <code>httpOnly</code>, <code>SameSite=Lax</code> browser cookies named <code>cad_token</code>. Client-side JavaScript cannot access or tamper with these tokens, protecting against Cross-Site Scripting (XSS) attacks.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Eye size={16} className="text-primary-400" /> 2. Data We Collect
          </h2>
          <p>We collect only the minimum necessary information to facilitate fair facility access:</p>
          <ul className="list-disc pl-5 space-y-1 text-slate-400">
            <li>Account Information: Name, email address, optional contact phone, bio.</li>
            <li>Booking History: Court dates, start/end slots, booking references, and cancellation records.</li>
            <li>Equipment Usage: Checked out items, timestamps, and return condition records.</li>
            <li>System Preferences: Saved favorite venues and preferred sports disciplines.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Server size={16} className="text-primary-400" /> 3. Fair-Allocation Audit Logging
          </h2>
          <p>
            To prevent system abuse, monopolisation, or unauthorized administrative modifications, key actions (such as booking creations, cancellations, maintenance scheduling, and rule modifications) are recorded in an internal <strong>Audit Log</strong> with timestamps and actor identifiers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Shield size={16} className="text-primary-400" /> 4. Data Sharing & Third Parties
          </h2>
          <p>
            Your information is used solely for operating the Courts After Dark facility platform. We do not sell, rent, or trade user data to third-party advertisers.
          </p>
        </section>
      </div>
    </div>
  );
}
