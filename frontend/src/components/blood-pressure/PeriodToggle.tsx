"use client";

import { cn } from "@/lib/utils";
import { PERIOD_OPTIONS, type Period } from "./types";

interface PeriodToggleProps {
  value: Period;
  onChange: (period: Period) => void;
}

/**
 * Segmented toggle untuk filter periode 7/30/90 hari.
 * Identik pattern dengan Tracker untuk konsistensi UX.
 */
export default function PeriodToggle({ value, onChange }: PeriodToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Pilih periode"
      className="inline-flex items-center gap-0.5 rounded-2xl border border-brand-charcoal/10 bg-white p-1 shadow-glass-sm"
    >
      {PERIOD_OPTIONS.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-xl px-4 py-1.5 text-xs font-semibold transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary",
              isActive
                ? "bg-brand-primary text-white shadow-brand-cta"
                : "text-brand-charcoal-soft hover:text-brand-primary"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
