"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  X,
  AlertTriangle,
  MapPin,
  Tag,
  Check,
  Plus,
  Loader2,
  Flame,
  Droplet,
  Apple,
  Bone,
  Wheat,
  Drumstick,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFoodName } from "@/lib/foodNameFormatter";
import type { FoodSearchResult } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface FoodDetailModalProps {
  food: FoodSearchResult | null;
  onClose: () => void;
}

/**
 * Modal detail makanan setelah klik hasil pencarian.
 *
 * Features:
 * - Tampilkan nutrisi lengkap (per 100g)
 * - DASH score + kategori dengan visual indikator
 * - Tombol "Tambah ke Catatan" — POST ke /recommendations/confirm
 * - ESC / click outside untuk tutup
 *
 * Tanggung jawab tunggal: render detail + handle action konfirmasi konsumsi.
 */
export default function FoodDetailModal({ food, onClose }: FoodDetailModalProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!food) return null;
  const displayName = formatFoodName(food.name);

  const handleAddToConsumption = async () => {
    if (confirmed || confirming) return;

    const accessToken = session?.accessToken;
    if (!accessToken) {
      setError("Sesi tidak valid. Silakan login ulang.");
      return;
    }

    setConfirming(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/v1/recommendations/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          food_codes: [food.food_code],
          servings_g: [100],
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.detail?.error || "Gagal menambahkan ke catatan.");
      }

      setConfirmed(true);
      router.refresh();

      // Auto-close setelah 1.2 detik agar user lihat success state
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setConfirming(false);
    }
  };

  const dashColor = getDashColorClass(food.dash_score);
  const dashBgColor = getDashBgClass(food.dash_score);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Detail ${displayName}`}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-brand-charcoal/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md animate-in fade-in slide-in-from-bottom-3 duration-300 rounded-3xl bg-white shadow-glass-lg overflow-hidden">
        {/* Header dengan DASH score banner */}
        <div className={cn("relative px-5 py-6", dashBgColor)}>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-white/80 transition-colors duration-150 hover:bg-white/15 hover:text-white"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-3">
            {/* DASH score circle */}
            <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md text-white">
              <span className="text-xs font-semibold uppercase tracking-wider opacity-70">
                DASH
              </span>
              <span className="text-base font-bold tabular-nums leading-none">
                {food.dash_score !== null ? food.dash_score.toFixed(1) : "—"}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold tracking-tight text-white">
                {displayName}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-white/85">
                <span className="inline-flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {food.category}
                </span>
                {food.region && food.region.toLowerCase() !== "indonesia" && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {food.region}
                  </span>
                )}
              </div>
              {food.dash_category && (
                <span
                  className={cn(
                    "mt-2 inline-flex items-center rounded-full bg-white/20 backdrop-blur-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white"
                  )}
                >
                  {food.dash_category}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Estimasi warning */}
        {food.is_estimated && (
          <div className="flex items-start gap-2 border-b border-amber-200 bg-amber-50 px-5 py-2.5">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-600" />
            <p className="text-[11px] leading-relaxed text-amber-900">
              Data nutrisi makanan ini adalah <strong>estimasi</strong> dari resep,
              perlu validasi ahli gizi untuk akurasi 100%.
            </p>
          </div>
        )}

        {/* Nutrient grid */}
        <div className="p-5">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-brand-charcoal-muted">
            Nutrisi per 100 gram
          </p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <NutrientBox
              icon={Flame}
              label="Energi"
              value={food.energy_kcal}
              unit="kkal"
              color="amber"
            />
            <NutrientBox
              icon={Droplet}
              label="Natrium"
              value={food.sodium_mg}
              unit="mg"
              color="rose"
            />
            <NutrientBox
              icon={Apple}
              label="Kalium"
              value={food.potassium_mg}
              unit="mg"
              color="emerald"
            />
            <NutrientBox
              icon={Bone}
              label="Lemak Total"
              value={food.fat_total_g}
              unit="g"
              decimals={1}
              color="amber"
            />
            <NutrientBox
              icon={Wheat}
              label="Serat"
              value={food.fiber_g}
              unit="g"
              decimals={1}
              color="emerald"
            />
            <NutrientBox
              icon={Drumstick}
              label="DASH Score"
              value={food.dash_score ?? 0}
              unit="/100"
              decimals={1}
              color="brand"
            />
          </div>

          {/* Error */}
          {error && (
            <p
              role="alert"
              className="mt-3 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700"
            >
              {error}
            </p>
          )}

          {/* Action button */}
          <button
            type="button"
            onClick={handleAddToConsumption}
            disabled={confirmed || confirming}
            className={cn(
              "mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2",
              confirmed
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 cursor-default"
                : "bg-brand-primary text-white shadow-brand-cta hover:bg-brand-primary-dark hover:shadow-brand-cta-hover active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait"
            )}
          >
            {confirming && <Loader2 className="h-4 w-4 animate-spin" />}
            {!confirming && confirmed && <Check className="h-4 w-4" strokeWidth={3} />}
            {!confirming && !confirmed && <Plus className="h-4 w-4" strokeWidth={2.5} />}

            {confirming
              ? "Menambahkan..."
              : confirmed
                ? "Berhasil ditambahkan ke catatan!"
                : "Tambah ke Catatan Konsumsi"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface NutrientBoxProps {
  icon: typeof Flame;
  label: string;
  value: number;
  unit: string;
  decimals?: number;
  color: "amber" | "rose" | "emerald" | "brand";
}

function NutrientBox({ icon: Icon, label, value, unit, decimals = 0, color }: NutrientBoxProps) {
  const iconColor = {
    amber: "text-amber-500",
    rose: "text-rose-500",
    emerald: "text-emerald-500",
    brand: "text-brand-primary",
  }[color];

  return (
    <div className="rounded-2xl border border-brand-charcoal/5 bg-brand-cream-soft p-3">
      <div className="flex items-center gap-1.5">
        <Icon className={cn("h-3 w-3", iconColor)} />
        <span className="text-[9px] font-semibold uppercase tracking-wider text-brand-charcoal-muted">
          {label}
        </span>
      </div>
      <p className="mt-1 text-base font-bold tabular-nums text-brand-charcoal leading-none">
        {decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString("id-ID")}
        <span className="ml-0.5 text-[9px] font-normal text-brand-charcoal-muted">
          {unit}
        </span>
      </p>
    </div>
  );
}

function getDashColorClass(score: number | null): string {
  if (score === null) return "text-brand-charcoal-muted";
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-brand-primary";
  if (score >= 40) return "text-amber-600";
  return "text-rose-600";
}

function getDashBgClass(score: number | null): string {
  if (score === null) return "bg-gradient-to-br from-brand-charcoal to-brand-charcoal-soft";
  if (score >= 80) return "bg-gradient-to-br from-emerald-600 to-emerald-700";
  if (score >= 60) return "bg-gradient-to-br from-brand-primary to-brand-primary-dark";
  if (score >= 40) return "bg-gradient-to-br from-amber-500 to-amber-600";
  return "bg-gradient-to-br from-rose-500 to-rose-600";
}
