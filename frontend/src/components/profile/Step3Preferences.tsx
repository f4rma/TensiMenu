"use client";

import type { ProfileFormData, FoodRestriction, RegionalPref } from "./types";
import {
  FOOD_RESTRICTION_LABELS,
  REGIONAL_LABELS,
} from "./types";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step3Props {
  data: ProfileFormData;
  onChange: <K extends keyof ProfileFormData>(
    key: K,
    value: ProfileFormData[K]
  ) => void;
}

const RESTRICTIONS: FoodRestriction[] = [
  "alergi_kacang",
  "alergi_seafood",
  "alergi_susu",
  "alergi_telur",
  "tidak_makan_babi",
  "vegetarian",
  "vegan",
];

const REGIONS: { value: RegionalPref; emoji: string }[] = [
  { value: "padang", emoji: "🍛" },    // Rendang/curry
  { value: "jawa", emoji: "🍢" },      // Sate
  { value: "sunda", emoji: "🥬" },     // Lalapan/sayur segar
  { value: "betawi", emoji: "🍲" },    // Soto Betawi/Soto kuah
  { value: "batak", emoji: "🥘" },     // Saksang/masakan berbumbu kaya
  { value: "bugis", emoji: "🍤" },     // Coto/seafood
  { value: "papua", emoji: "🐟" },     // Papeda ikan
  { value: "manado", emoji: "🌶️" },    // Bumbu pedas khas
];

/**
 * Step 3: Preferensi Makanan
 * Pantangan (chip multi-select) + Wilayah cita rasa (chip multi-select).
 */
export default function Step3Preferences({ data, onChange }: Step3Props) {
  const toggleRestriction = (value: FoodRestriction) => {
    const next = data.food_restrictions.includes(value)
      ? data.food_restrictions.filter((r) => r !== value)
      : [...data.food_restrictions, value];
    onChange("food_restrictions", next);
  };

  const toggleRegion = (value: RegionalPref) => {
    const next = data.regional_prefs.includes(value)
      ? data.regional_prefs.filter((r) => r !== value)
      : [...data.regional_prefs, value];
    onChange("regional_prefs", next);
  };

  return (
    <div className="flex flex-col gap-7 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-brand-charcoal md:text-2xl">
          Preferensi makanan Anda
        </h2>
        <p className="mt-1 text-sm text-brand-charcoal-soft">
          Pilihan opsional yang membuat rekomendasi lebih sesuai dengan selera
          dan kebutuhan Anda.
        </p>
      </div>

      {/* Pantangan */}
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-brand-charcoal">
          Pantangan / Alergi
        </legend>
        <p className="mb-3 text-xs text-brand-charcoal-soft">
          Kami tidak akan merekomendasikan makanan dengan bahan ini.
        </p>
        <div className="flex flex-wrap gap-2">
          {RESTRICTIONS.map((value) => (
            <Chip
              key={value}
              selected={data.food_restrictions.includes(value)}
              onClick={() => toggleRestriction(value)}
              label={FOOD_RESTRICTION_LABELS[value]}
            />
          ))}
        </div>
      </fieldset>

      {/* Wilayah / Cita Rasa */}
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-brand-charcoal">
          Wilayah & Cita Rasa Favorit
        </legend>
        <p className="mb-3 text-xs text-brand-charcoal-soft">
          Pilih masakan daerah yang Anda sukai untuk variasi rekomendasi.
        </p>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {REGIONS.map(({ value, emoji }) => (
            <RegionChip
              key={value}
              selected={data.regional_prefs.includes(value)}
              onClick={() => toggleRegion(value)}
              label={REGIONAL_LABELS[value]}
              emoji={emoji}
            />
          ))}
        </div>
      </fieldset>

      {data.food_restrictions.length === 0 && data.regional_prefs.length === 0 && (
        <p className="text-xs text-brand-charcoal-muted text-center italic">
          Tidak ada preferensi? Tidak masalah, lanjutkan saja ke langkah berikutnya.
        </p>
      )}
    </div>
  );
}

function Chip({
  selected,
  onClick,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="checkbox"
      aria-checked={selected}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream",
        selected
          ? "bg-brand-primary text-white shadow-brand-cta"
          : "bg-white text-brand-charcoal-soft border border-brand-charcoal/10 hover:border-brand-primary/40 hover:text-brand-primary"
      )}
    >
      {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      {label}
    </button>
  );
}

function RegionChip({
  selected,
  onClick,
  label,
  emoji,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  emoji: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="checkbox"
      aria-checked={selected}
      className={cn(
        "flex flex-col items-center gap-1 rounded-2xl px-3 py-3.5 text-sm font-medium transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream",
        selected
          ? "bg-brand-primary/5 border-2 border-brand-primary text-brand-primary shadow-glass-sm"
          : "bg-white border-2 border-brand-charcoal/10 text-brand-charcoal hover:border-brand-primary/40"
      )}
    >
      <span className="text-2xl" aria-hidden="true">
        {emoji}
      </span>
      <span className="text-xs">{label}</span>
    </button>
  );
}
