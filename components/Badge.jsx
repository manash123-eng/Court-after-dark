const STYLES = {
  Available: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Confirmed: "bg-primary-400/15 text-primary-400 border-primary-400/30",
  Booked: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Maintenance: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  Closed: "bg-slate-600/20 text-slate-400 border-slate-600/30",
  Cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
  Completed: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  Rejected: "bg-red-500/15 text-red-400 border-red-500/30",
  Unavailable: "bg-red-500/15 text-red-400 border-red-500/30",
  "Checked Out": "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Returned: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Scheduled: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  Waiting: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  Notified: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  Paid: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "Pay at Venue": "bg-slate-500/15 text-slate-300 border-slate-500/30",
  Refunded: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  Indoor: "bg-sky-500/10 text-sky-300 border-sky-500/20",
  Outdoor: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  "Prime Time": "bg-primary-400/20 text-primary-300 border-primary-400/40",
};

export default function Badge({ children, dot = true, size = "sm" }) {
  const style = STYLES[children] || "bg-slate-800 text-slate-300 border-slate-700";
  const sizeClasses = size === "xs" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold tracking-wide backdrop-blur-sm ${sizeClasses} ${style}`}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 rounded-full bg-current opacity-80"
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
