"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectableCardProps {
  selected: boolean;
  onToggle: () => void;
  label: string;
  description?: string;
  icon?: ReactNode;
  /** Single-select (radio) atau multi-select (checkbox) — affects ARIA role */
  mode?: "radio" | "checkbox";
  disabled?: boolean;
}

/**
 * Reusable card untuk pilihan radio/checkbox di wizard.
 * Glassmorphism style dengan animasi smooth saat toggle.
 */
export default function SelectableCard({
  selected,
  onToggle,
  label,
  description,
  icon,
  mode = "checkbox",
  disabled = false,
}: SelectableCardProps) {
  return (
    <button
      type="button"
      role={mode}
      aria-checked={selected}
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "group relative w-full rounded-2xl border p-4 text-left transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream",
        "disabled:cursor-not-allowed disabled:opacity-50",
        selected
          ? "border-brand-primary bg-brand-primary/5 shadow-glass-sm"
          : "border-brand-charcoal/10 bg-white hover:border-brand-primary/40 hover:bg-brand-primary/5"
      )}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors duration-200",
              selected
                ? "bg-brand-primary text-white"
                : "bg-brand-charcoal/5 text-brand-charcoal-soft group-hover:bg-brand-primary/10 group-hover:text-brand-primary"
            )}
          >
            {icon}
          </span>
        )}

        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm font-semibold transition-colors duration-200",
              selected ? "text-brand-primary" : "text-brand-charcoal"
            )}
          >
            {label}
          </p>
          {description && (
            <p className="mt-0.5 text-xs leading-relaxed text-brand-charcoal-soft">
              {description}
            </p>
          )}
        </div>

        {/* Indicator */}
        <span
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center transition-all duration-200",
            mode === "radio" ? "rounded-full" : "rounded-md",
            selected
              ? "bg-brand-primary border-2 border-brand-primary"
              : "border-2 border-brand-charcoal/20 bg-white"
          )}
          aria-hidden="true"
        >
          {selected && (
            <Check
              className="h-3 w-3 text-white animate-in fade-in duration-200"
              strokeWidth={3}
            />
          )}
        </span>
      </div>
    </button>
  );
}
