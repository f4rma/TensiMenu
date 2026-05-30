"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type RegionValue =
  | "all"
  | "padang"
  | "jawa"
  | "sunda"
  | "betawi"
  | "batak"
  | "bugis"
  | "papua"
  | "manado";

interface RegionFilterProps {
  value: RegionValue;
  onChange: (value: RegionValue) => void;
}

const REGIONS: { value: RegionValue; label: string }[] = [
  { value: "all", label: "Semua Wilayah" },
  { value: "padang", label: "Padang (Minang)" },
  { value: "jawa", label: "Jawa" },
  { value: "sunda", label: "Sunda (Jawa Barat)" },
  { value: "betawi", label: "Betawi (Jakarta)" },
  { value: "batak", label: "Batak (Sumatera Utara)" },
  { value: "bugis", label: "Bugis (Sulawesi Selatan)" },
  { value: "papua", label: "Papua" },
  { value: "manado", label: "Manado" },
];

/**
 * Dropdown filter untuk wilayah/cita rasa.
 * Custom-built dengan animation halus (bukan native select).
 */
export default function RegionFilter({ value, onChange }: RegionFilterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = REGIONS.find((r) => r.value === value) ?? REGIONS[0];

  return (
    <div ref={ref} className="relative">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-brand-charcoal-muted">
        Wilayah / Cita Rasa
      </p>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex w-56 items-center justify-between gap-2 rounded-xl border bg-white px-3.5 py-2.5 text-sm font-medium transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary",
          open
            ? "border-brand-primary text-brand-charcoal"
            : "border-brand-charcoal/15 text-brand-charcoal hover:border-brand-primary/40"
        )}
      >
        <span>{selected.label}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-brand-charcoal-soft transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full z-30 mt-1.5 w-56 max-h-72 overflow-y-auto origin-top-right animate-in fade-in slide-in-from-bottom-2 duration-200 rounded-2xl border border-brand-charcoal/5 bg-white shadow-glass-md py-1.5"
        >
          {REGIONS.map((region) => {
            const isSelected = region.value === value;
            return (
              <button
                key={region.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(region.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-2 px-3.5 py-2 text-sm transition-colors duration-150",
                  isSelected
                    ? "bg-brand-primary/5 text-brand-primary font-semibold"
                    : "text-brand-charcoal hover:bg-brand-primary/5 hover:text-brand-primary"
                )}
              >
                <span>{region.label}</span>
                {isSelected && <Check className="h-4 w-4" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
