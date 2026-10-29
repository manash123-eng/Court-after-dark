"use client";

import { formatSlotLabel } from "@/lib/bookingRules";
import { Check, Flame, Users, Bell } from "lucide-react";

export default function AvailabilityGrid({
  slots,
  selectedSlot,
  onSelect,
  onJoinWaitlist,
}) {
  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pb-1">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500/30 border border-emerald-500/50" />
          Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-primary-400 border border-primary-400" />
          Selected
        </span>
        <span className="flex items-center gap-1.5">
          <Flame size={12} className="text-primary-400" />
          Prime Time (Peak)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-slate-800 border border-slate-700" />
          Booked (Waitlistable)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-orange-500/20 border border-orange-500/40" />
          Maintenance
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {slots.map(({ slot, status, isPrime, waitlistCount, isUserWaitlisted }) => {
          const isSelected = selectedSlot === slot;
          const isAvailable = status === "Available";
          const isBooked = status === "Booked";
          const isMaintenance = status === "Maintenance";
          const isClosed = status === "Closed";

          if (isAvailable) {
            return (
              <button
                key={slot}
                type="button"
                onClick={() => onSelect(slot)}
                className={`relative flex flex-col justify-between rounded-xl border p-2.5 text-left transition ${
                  isSelected
                    ? "border-primary-400 bg-primary-400/20 text-white ring-2 ring-primary-400 shadow-glow-sm"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:border-emerald-400 hover:bg-emerald-500/20"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold">{formatSlotLabel(slot)}</span>
                  {isSelected ? (
                    <Check size={14} className="text-primary-400 shrink-0" />
                  ) : isPrime ? (
                    <span title="Prime Time Slot">
                      <Flame size={13} className="text-primary-400 shrink-0" />
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center justify-between mt-1 text-[10px]">
                  <span className={isSelected ? "text-primary-300 font-semibold" : "text-emerald-400"}>
                    {isSelected ? "Selected" : "Open Slot"}
                  </span>
                  {isPrime && (
                    <span className="text-[9px] uppercase font-bold tracking-wider text-primary-400">
                      Peak
                    </span>
                  )}
                </div>
              </button>
            );
          }

          if (isBooked) {
            return (
              <div
                key={slot}
                className="flex flex-col justify-between rounded-xl border border-slate-800 bg-dark-900/80 p-2.5 text-left text-slate-500"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium line-through opacity-80">
                    {formatSlotLabel(slot)}
                  </span>
                  {isPrime && <Flame size={12} className="text-slate-600 shrink-0" />}
                </div>
                <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-800/60">
                  <span className="text-[10px] text-amber-500/80 font-medium">Booked</span>
                  {onJoinWaitlist && (
                    <button
                      type="button"
                      disabled={isUserWaitlisted}
                      onClick={() => onJoinWaitlist(slot)}
                      className={`text-[10px] font-semibold flex items-center gap-1 transition ${
                        isUserWaitlisted
                          ? "text-primary-400 cursor-default"
                          : "text-slate-400 hover:text-primary-300 hover:underline"
                      }`}
                    >
                      <Bell size={10} />
                      {isUserWaitlisted ? "Waitlisted" : "Waitlist"}
                    </button>
                  )}
                </div>
              </div>
            );
          }

          if (isMaintenance) {
            return (
              <div
                key={slot}
                className="flex flex-col justify-between rounded-xl border border-orange-500/30 bg-orange-500/10 p-2.5 text-left text-orange-400/80"
              >
                <span className="text-xs font-medium">{formatSlotLabel(slot)}</span>
                <span className="text-[10px] text-orange-400 font-semibold mt-1">Maintenance</span>
              </div>
            );
          }

          // Closed
          return (
            <div
              key={slot}
              className="flex flex-col justify-between rounded-xl border border-slate-850 bg-dark-950 p-2.5 text-left text-slate-600"
            >
              <span className="text-xs font-medium opacity-60">{formatSlotLabel(slot)}</span>
              <span className="text-[10px] opacity-60 mt-1">Closed</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
