import { Inbox } from "lucide-react";

export default function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3.5 rounded-2xl border border-dashed border-slate-800 bg-dark-850/50 py-16 px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-dark-800 border border-slate-700/80 text-primary-400">
        <Icon size={24} />
      </div>
      <h3 className="text-base font-bold text-white">{title}</h3>
      {description && <p className="max-w-md text-xs sm:text-sm text-slate-400">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
