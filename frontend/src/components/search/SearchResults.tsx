"use client";

import { Search, AlertCircle, Inbox } from "lucide-react";
import SearchResultItem from "./SearchResultItem";
import type { FoodSearchResult, SearchStatus } from "./types";

interface SearchResultsProps {
  results: FoodSearchResult[];
  status: SearchStatus;
  query: string;
  error?: string | null;
  onSelectFood?: (food: FoodSearchResult) => void;
}

/**
 * Render hasil pencarian dengan handling semua state:
 * idle, loading, success, empty, error.
 *
 * Tidak melakukan fetching — pure presentation.
 */
export default function SearchResults({
  results,
  status,
  query,
  error,
  onSelectFood,
}: SearchResultsProps) {
  if (status === "idle") {
    return (
      <EmptyMessage
        icon={Search}
        title="Cari makanan apa saja"
        description="Ketik nama makanan untuk melihat info nutrisi DASH lengkap dari database kami."
      />
    );
  }

  if (status === "loading") {
    return (
      <ul className="flex flex-col gap-1" aria-live="polite" aria-busy="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <li
            key={i}
            className="flex items-start gap-3 rounded-xl px-3 py-2.5 animate-pulse"
          >
            <div className="h-10 w-10 shrink-0 rounded-xl bg-brand-charcoal/5" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-3/4 rounded bg-brand-charcoal/5" />
              <div className="h-2.5 w-1/2 rounded bg-brand-charcoal/5" />
              <div className="h-2.5 w-2/3 rounded bg-brand-charcoal/5" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (status === "error") {
    return (
      <EmptyMessage
        icon={AlertCircle}
        title="Pencarian gagal"
        description={error ?? "Coba lagi dalam beberapa saat."}
        tone="error"
      />
    );
  }

  if (status === "empty") {
    return (
      <EmptyMessage
        icon={Inbox}
        title="Tidak ada hasil"
        description={`Tidak ditemukan makanan untuk "${query}". Coba kata kunci lain.`}
      />
    );
  }

  // status === "success"
  return (
    <ul
      className="flex flex-col gap-0.5"
      aria-live="polite"
      aria-busy="false"
    >
      {results.map((food) => (
        <li key={food.food_code}>
          <SearchResultItem
            food={food}
            query={query}
            onClick={onSelectFood}
          />
        </li>
      ))}
    </ul>
  );
}

function EmptyMessage({
  icon: Icon,
  title,
  description,
  tone = "neutral",
}: {
  icon: typeof Search;
  title: string;
  description: string;
  tone?: "neutral" | "error";
}) {
  const iconColor = tone === "error" ? "text-rose-500" : "text-brand-charcoal-muted";
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <Icon className={`h-8 w-8 mb-3 ${iconColor}`} strokeWidth={1.75} />
      <p className="text-sm font-semibold text-brand-charcoal">{title}</p>
      <p className="mt-1 max-w-xs text-xs leading-relaxed text-brand-charcoal-soft">
        {description}
      </p>
    </div>
  );
}
