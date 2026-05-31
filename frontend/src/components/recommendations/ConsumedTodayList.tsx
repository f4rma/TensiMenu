"use client";

import { UtensilsCrossed } from "lucide-react";
import FoodImage from "./FoodImage";
import { formatFoodName } from "@/lib/foodNameFormatter";

export interface ConsumedItem {
  food_code: string;
  name: string;
  category: string;
  image_url?: string | null;
  serving_g: number;
  count: number;
}

interface ConsumedTodayListProps {
  items: ConsumedItem[];
  /** Jumlah makanan yang tercatat (untuk header) */
  mealsLogged?: number;
}

/**
 * Daftar "Sudah Dimakan Hari Ini" — menampilkan makanan yang sudah
 * dikonfirmasi user pada hari berjalan, lengkap dengan porsi.
 *
 * Tanggung jawab tunggal: render daftar konsumsi hari ini (read-only).
 * Tidak ada state internal — murni presentational.
 */
export default function ConsumedTodayList({
  items,
  mealsLogged,
}: ConsumedTodayListProps) {
  if (!items || items.length === 0) {
    return null;
  }

  const totalCount = mealsLogged ?? items.reduce((sum, it) => sum + it.count, 0);

  return (
    <section className="mb-6 rounded-3xl bg-white border border-brand-charcoal/5 p-5 shadow-glass-sm">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
          <UtensilsCrossed className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-brand-charcoal">
            Sudah Dimakan Hari Ini
          </h2>
          <p className="text-xs text-brand-charcoal-muted">
            {totalCount} porsi tercatat
          </p>
        </div>
      </div>

      <ul className="flex flex-col gap-2">
        {items.map((item) => {
          const displayName = formatFoodName(item.name);
          return (
            <li
              key={item.food_code}
              className="flex items-center gap-3 rounded-2xl border border-brand-charcoal/5 bg-brand-cream-soft px-3 py-2.5"
            >
              {/* Thumbnail */}
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl">
                <FoodImage
                  imageUrl={item.image_url}
                  name={displayName}
                  category={item.category}
                  sizes="40px"
                  variant="sm"
                />
              </div>

              {/* Nama + kategori */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-brand-charcoal">
                  {displayName}
                </p>
                <p className="truncate text-xs text-brand-charcoal-muted">
                  {item.category}
                </p>
              </div>

              {/* Porsi + jumlah */}
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold tabular-nums text-brand-charcoal-soft">
                  {Math.round(item.serving_g)} g
                </p>
                {item.count > 1 && (
                  <p className="text-[10px] text-brand-charcoal-muted">
                    {item.count}x porsi
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
