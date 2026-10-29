"use client";

import Badge from "@/components/Badge";
import { Dumbbell, ShieldCheck, Check, Sparkles, ShoppingBag } from "lucide-react";

export default function EquipmentCard({ item, onCheckout }) {
  const isAvailable = item.status === "Available" && item.availableQuantity > 0;
  const percentAvailable =
    item.totalQuantity > 0 ? (item.availableQuantity / item.totalQuantity) * 100 : 0;
  const rentalPrice = item.rentalPrice || 5;

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800/90 bg-dark-850 hover:border-primary-400/50 hover:bg-dark-800 transition duration-300 shadow-lg card-hover-glow">
      {/* Thumbnail */}
      <div className="relative h-44 w-full overflow-hidden bg-dark-900">
        <img
          src={
            item.image ||
            "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80&auto=format&fit=crop"
          }
          alt={item.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/40 to-transparent" />

        {/* Category Pill */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-dark-900/90 border border-slate-700/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-300 backdrop-blur-md">
            {item.category}
          </span>
          <Badge size="sm">{item.condition}</Badge>
        </div>

        {/* Rental Price Badge */}
        <div className="absolute bottom-3 right-3 rounded-lg bg-dark-950/90 border border-primary-400/40 px-2.5 py-1 backdrop-blur-md">
          <span className="text-[10px] text-slate-400">Rent </span>
          <span className="text-sm font-black text-primary-400">${rentalPrice}</span>
          <span className="text-[10px] text-slate-400"> / session</span>
        </div>
      </div>

      {/* Body Info */}
      <div className="flex flex-1 flex-col p-4 justify-between space-y-3">
        <div>
          <h3 className="font-bold text-white text-base group-hover:text-primary-300 transition line-clamp-1">
            {item.name}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
            {item.description || `Professional grade ${item.category} sports equipment ready for tournament or practice.`}
          </p>
        </div>

        {/* Stock Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px] flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-400" />
              Stock: <strong className="text-white">{item.availableQuantity}</strong> of {item.totalQuantity} units
            </span>
            <span className={`text-[10px] font-bold ${isAvailable ? "text-emerald-400" : "text-red-400"}`}>
              {isAvailable ? "In Stock" : "Out of Stock"}
            </span>
          </div>

          <div className="h-1.5 w-full rounded-full bg-dark-750 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                percentAvailable > 40
                  ? "bg-primary-400"
                  : percentAvailable > 0
                  ? "bg-amber-400"
                  : "bg-red-500"
              }`}
              style={{ width: `${percentAvailable}%` }}
            />
          </div>
        </div>

        {/* Action Button */}
        {onCheckout && (
          <div className="pt-2 border-t border-slate-800/80">
            <button
              type="button"
              disabled={!isAvailable}
              onClick={() => onCheckout(item)}
              className={`w-full flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition shadow-sm ${
                isAvailable
                  ? "bg-primary-400 text-dark-950 hover:bg-primary-300 shadow-glow-sm"
                  : "bg-dark-750 text-slate-500 cursor-not-allowed border border-slate-800"
              }`}
            >
              {isAvailable ? (
                <>
                  <ShoppingBag size={14} /> Book / Rent Gear (${rentalPrice})
                </>
              ) : (
                "Out of Stock"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
