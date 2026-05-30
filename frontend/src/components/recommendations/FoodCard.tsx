"use client";

import { useState } from "react";
import { Check, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFoodName } from "@/lib/foodNameFormatter";
import FoodImage from "./FoodImage";
import type { FoodRecommendation } from "./types";

interface FoodCardProps {
  food: FoodRecommendation;
  /** Apakah user perlu warning karena nutrisi tertentu (mis. natrium tinggi) */
  warningNutrient?: "sodium" | "fat" | null;
  /** Callback ketika user konfirmasi konsumsi */
  onConfirm?: (foodCode: string) => Promise<void> | void;
  /** Sudah pernah dikonsumsi hari ini */
  consumed?: boolean;
  /** Animation delay untuk staggered entry */
  animationDelay?: number;
  /** Tampilkan fosfor sebagai nutrisi ke-4 (relevan untuk CKD) */
  showPhosphorus?: boolean;
}

/**
 * Card rekomendasi makanan individual.
 *
 * Layout:
 * - Image dengan DASH score badge floating di pojok kiri atas
 * - Nama + tag info (Rendah Garam, dll)
 * - Deskripsi singkat
 * - 3-column nutrient stats (Kalori, Natrium, Kalium)
 * - Tombol konfirmasi konsumsi
 */
export default function FoodCard({
  food,
  warningNutrient = null,
  onConfirm,
  consumed = false,
  animationDelay = 0,
  showPhosphorus = false,
}: FoodCardProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConsumed, setIsConsumed] = useState(consumed);

  const handleConfirm = async () => {
    if (isConsumed || isConfirming) return;
    setIsConfirming(true);
    try {
      await onConfirm?.(food.food_code);
      setIsConsumed(true);
    } catch (err) {
      // Error sudah ditampilkan oleh parent (setConfirmError di RecommendationsView).
      // Log untuk debugging — pastikan tombol kembali aktif lewat finally.
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.error("[FoodCard] Konfirmasi konsumsi gagal:", err);
      }
    } finally {
      setIsConfirming(false);
    }
  };

  // Tag dari food.tags atau fallback berdasarkan nutrisi
  const displayTag = food.tags?.[0] ?? deriveTag(food);
  const displayName = formatFoodName(food.name);

  return (
    <article
      className="group flex flex-col rounded-3xl bg-white border border-brand-charcoal/5 shadow-glass-sm overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glass-md motion-reduce:hover:translate-y-0 animate-in fade-in slide-in-from-bottom-3 duration-300"
      style={{ animationDelay: `${animationDelay}ms`, animationFillMode: "backwards" }}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <FoodImage
          imageUrl={food.image_url}
          name={displayName}
          category={food.category}
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* Gradient overlay untuk legibility badge */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />

        {/* DASH Score badge — floating */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-black/55 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white ring-1 ring-white/15">
            DASH SCORE
            <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white text-[11px] tabular-nums text-brand-charcoal-soft px-1.5">
              {food.dash_score.toFixed(1)}
            </span>
          </span>
        </div>

        {/* Estimasi label kalau ada */}
        {food.is_estimated && (
          <div className="absolute top-3 right-3">
            <span
              className="inline-flex items-center gap-1 rounded-full bg-amber-500/90 backdrop-blur-md px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white ring-1 ring-white/15"
              title="Data nutrisi adalah estimasi dari resep, perlu validasi ahli gizi"
            >
              <AlertTriangle className="h-2.5 w-2.5" />
              Estimasi
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Header: name + tag */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold leading-tight tracking-tight text-brand-charcoal flex-1">
            {displayName}
          </h3>
          {displayTag && (
            <span
              className={cn(
                "shrink-0 inline-flex items-center rounded-lg px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
                getTagColorClass(displayTag, warningNutrient)
              )}
            >
              {displayTag}
            </span>
          )}
        </div>

        {/* Description */}
        {food.description && (
          <p className="mt-1.5 text-xs leading-relaxed text-brand-charcoal-soft line-clamp-2">
            {food.description}
          </p>
        )}

        {/* Nutrient stats — 3 atau 4 columns tergantung profil */}
        <div
          className={cn(
            "mt-4 grid gap-2 border-t border-brand-charcoal/5 pt-3",
            showPhosphorus ? "grid-cols-4" : "grid-cols-3"
          )}
        >
          <NutrientStat label="Kalori" value={Math.round(food.energy_kcal)} unit="kkal" />
          <NutrientStat
            label="Natrium"
            value={Math.round(food.sodium_mg)}
            unit="mg"
            highlight={warningNutrient === "sodium"}
          />
          <NutrientStat
            label="Kalium"
            value={Math.round(food.potassium_mg)}
            unit="mg"
          />
          {showPhosphorus && (
            <NutrientStat
              label="Fosfor"
              value={Math.round(food.phosphorus_mg ?? 0)}
              unit="mg"
              highlight={(food.phosphorus_mg ?? 0) > 200}
            />
          )}
        </div>

        {/* Porsi standar */}
        {food.default_serving_g && food.default_serving_g !== 100 && (
          <p className="mt-2 text-[10px] text-brand-charcoal-muted">
            Nutrisi per 100 g · porsi standar{" "}
            <span className="font-semibold text-brand-charcoal-soft tabular-nums">
              {Math.round(food.default_serving_g)} g
            </span>
          </p>
        )}

        {/* Action button */}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isConsumed || isConfirming}
          className={cn(
            "mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed",
            isConsumed
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
              : "bg-brand-primary text-white shadow-brand-cta hover:bg-brand-primary-dark hover:shadow-brand-cta-hover active:scale-[0.98] disabled:opacity-70"
          )}
        >
          {isConfirming ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : isConsumed ? (
            <>
              <Check className="h-4 w-4" strokeWidth={3} />
              Sudah Dikonsumsi
            </>
          ) : (
            <>
              <Check className="h-4 w-4" strokeWidth={2.5} />
              Konfirmasi Dikonsumsi
            </>
          )}
        </button>
      </div>
    </article>
  );
}

function NutrientStat({
  label,
  value,
  unit,
  highlight = false,
}: {
  label: string;
  value: number;
  unit: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="text-[9px] font-semibold uppercase tracking-wider text-brand-charcoal-muted">
        {label}
      </span>
      <span
        className={cn(
          "mt-0.5 text-sm font-bold tabular-nums",
          highlight ? "text-rose-600" : "text-brand-charcoal"
        )}
      >
        {value.toLocaleString("id-ID")}{" "}
        <span className="text-[10px] font-normal text-brand-charcoal-muted">
          {unit}
        </span>
      </span>
    </div>
  );
}

function deriveTag(food: FoodRecommendation): string | null {
  if (food.sodium_mg < 150) return "Rendah Garam";
  if (food.fiber_g >= 5) return "Serat Tinggi";
  if (food.sodium_mg < 350) return "Moderasi Garam";
  return null;
}

function getTagColorClass(tag: string, warning: "sodium" | "fat" | null): string {
  const tagLower = tag.toLowerCase();
  if (warning === "sodium" || tagLower.includes("perhatian")) {
    return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
  }
  if (tagLower.includes("rendah") || tagLower.includes("tinggi")) {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  }
  return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
}
