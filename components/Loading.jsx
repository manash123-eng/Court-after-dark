export default function Loading({ label = "Loading data...", type = "spinner" }) {
  if (type === "skeleton") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-800 bg-dark-850 p-4 space-y-3 animate-pulse"
          >
            <div className="h-44 w-full rounded-xl bg-dark-750" />
            <div className="h-4 w-1/3 rounded bg-dark-750" />
            <div className="h-6 w-3/4 rounded bg-dark-750" />
            <div className="h-4 w-1/2 rounded bg-dark-750" />
            <div className="flex justify-between pt-2">
              <div className="h-4 w-1/4 rounded bg-dark-750" />
              <div className="h-4 w-1/4 rounded bg-dark-750" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
      <div className="relative flex h-10 w-10 items-center justify-center">
        <div className="absolute h-full w-full rounded-full border-2 border-primary-400/20" />
        <div className="h-full w-full animate-spin rounded-full border-2 border-primary-400 border-t-transparent" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
    </div>
  );
}
