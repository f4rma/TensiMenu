"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Lightbulb, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFoodName } from "@/lib/foodNameFormatter";
import FoodImage from "@/components/recommendations/FoodImage";

interface MealItem {
  id: string;
  meal_type: "SARAPAN" | "MAKAN SIANG" | "MAKAN MALAM" | "CAMILAN";
  name: string;
  tags: string[];
  dash_score: number;
  image_url?: string | null;
  consumed?: boolean;
}

interface MealPlanCardProps {
  meals: MealItem[];
  /** Tip edukasi untuk hari ini */
  daily_tip?: string;
  /** Callback saat user klik konfirmasi */
  onConfirm?: (mealId: string) => void;
}

const MEAL_COLOR: Record<MealItem["meal_type"], string> = {
  SARAPAN: "text-amber-600",
  "MAKAN SIANG": "text-orange-600",
  "MAKAN MALAM": "text-rose-600",
  CAMILAN: "text-purple-600",
};

/**
 * Card "Rencana Makan Hari Ini" — kolom tengah Beranda.
 * Menampilkan daftar makanan per waktu dengan checkbox konfirmasi.
 */
export default function MealPlanCard({
  meals,
  daily_tip,
  onConfirm,
}: MealPlanCardProps) {
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(
    new Set(meals.filter((m) => m.consumed).map((m) => m.id))
  );

  const handleToggle = (id: string) => {
    setConfirmedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    onConfirm?.(id);
  };

  return (
    <div className="rounded-3xl bg-white border border-brand-charcoal/5 p-5 shadow-glass-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <h2 className="text-base font-semibold tracking-tight text-brand-charcoal">
          Rencana Makan Hari Ini
        </h2>
        <Link
          href="/recommendations"
          className="inline-flex items-center gap-1 text-xs font-medium text-brand-primary transition-colors duration-150 hover:text-brand-primary-dark"
        >
          Lihat Rencana Lengkap
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Meal list */}
      <ul className="flex flex-col gap-2.5">
        {meals.map((meal, idx) => {
          const consumed = confirmedIds.has(meal.id);
          return (
            <li
              key={meal.id}
              className="animate-in fade-in slide-in-from-bottom-3 duration-300"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <MealRow
                meal={meal}
                consumed={consumed}
                onToggle={() => handleToggle(meal.id)}
              />
            </li>
          );
        })}
      </ul>

      {/* Daily tip card */}
      {daily_tip && (
        <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-brand-cream-soft border border-brand-charcoal/5 px-4 py-3">
          <Lightbulb className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
          <p className="text-xs leading-relaxed text-brand-charcoal-soft italic">
            &ldquo;{daily_tip}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}

function MealRow({
  meal,
  consumed,
  onToggle,
}: {
  meal: MealItem;
  consumed: boolean;
  onToggle: () => void;
}) {
  const displayName = formatFoodName(meal.name);
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border p-3 transition-all duration-200",
        consumed
          ? "border-brand-primary/20 bg-brand-primary/5"
          : "border-brand-charcoal/5 bg-brand-cream-soft hover:bg-white"
      )}
    >
      {/* Image thumbnail */}
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
        <FoodImage
          imageUrl={meal.image_url}
          name={displayName}
          sizes="48px"
          variant="sm"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn("text-[10px] font-bold uppercase tracking-wider", MEAL_COLOR[meal.meal_type])}>
          {meal.meal_type}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-brand-charcoal truncate">
          {displayName}
        </p>
        <p className="text-xs text-brand-charcoal-muted truncate">
          {meal.tags.join(" • ")}
        </p>
      </div>

      {/* DASH score badge */}
      <span className="shrink-0 inline-flex items-center rounded-lg bg-brand-charcoal/5 px-2 py-0.5 text-[10px] font-semibold text-brand-charcoal-soft">
        Skor {meal.dash_score}
      </span>

      {/* Confirm checkbox */}
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={consumed}
        aria-label={`Konfirmasi ${displayName}`}
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2",
          consumed
            ? "bg-brand-primary text-white"
            : "border-2 border-brand-charcoal/15 bg-white hover:border-brand-primary"
        )}
      >
        {consumed && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </button>
    </div>
  );
}
