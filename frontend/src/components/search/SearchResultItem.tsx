"use client";

import { AlertTriangle, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFoodName } from "@/lib/foodNameFormatter";
import FoodImage from "@/components/recommendations/FoodImage";
import type { FoodSearchResult } from "./types";

interface SearchResultItemProps {
  food: FoodSearchResult;
  /** Highlight kata kunci di nama */
  query?: string;
  onClick?: (food: FoodSearchResult) => void;
}

/**
 * Single result item — render satu makanan dengan info ringkas.
 * Tidak tahu apa-apa tentang state pencarian (SRP).
 */
export default function SearchResultItem({
  food,
  query,
  onClick,
}: SearchResultItemProps) {
  const dashColor = getDashColor(food.dash_score);

  return (
    <button
      type="button"
      onClick={() => onClick?.(food)}
      className="group flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-150 hover:bg-brand-primary/5 focus-visible:outline-none focus-visible:bg-brand-primary/5"
    >
      {/* Food image thumbnail */}
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl">
        <FoodImage
          imageUrl={food.image_url}
          name={food.name}
          category={food.category}
          variant="sm"
          className="rounded-xl"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-semibold text-brand-charcoal group-hover:text-brand-primary transition-colors duration-150">
            <HighlightedText text={formatFoodName(food.name)} query={query} />
          </p>
          {food.is_estimated && (
            <span title="Data nutrisi adalah estimasi">
              <AlertTriangle className="h-3 w-3 shrink-0 text-amber-500" />
            </span>
          )}
        </div>

        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-brand-charcoal-muted">
          {food.region && food.region.toLowerCase() !== "indonesia" && (
            <span className="inline-flex items-center gap-0.5">
              <MapPin className="h-2.5 w-2.5" />
              {food.region}
            </span>
          )}
          <span>{food.category}</span>
        </div>

        {/* Mini nutrient bar */}
        <div className="mt-1.5 flex items-center gap-3 text-[10px] text-brand-charcoal-soft tabular-nums">
          <span>
            <span className="font-medium text-brand-charcoal">
              {Math.round(food.energy_kcal)}
            </span>{" "}
            kkal
          </span>
          <span>
            Na{" "}
            <span className="font-medium text-brand-charcoal">
              {Math.round(food.sodium_mg)}
            </span>
          </span>
          <span>
            K{" "}
            <span className="font-medium text-brand-charcoal">
              {Math.round(food.potassium_mg)}
            </span>
          </span>
        </div>
      </div>
    </button>
  );
}

function HighlightedText({ text, query }: { text: string; query?: string }) {
  if (!query || query.trim().length === 0) return <>{text}</>;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const idx = lowerText.indexOf(lowerQuery);
  if (idx === -1) return <>{text}</>;

  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-amber-100 text-brand-charcoal rounded px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function getDashColor(score: number | null): string {
  if (score === null) return "text-brand-charcoal-muted";
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-brand-primary";
  if (score >= 40) return "text-amber-600";
  return "text-rose-600";
}
