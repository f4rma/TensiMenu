"use client";

import { useMemo } from "react";
import { Sparkles, Salad, Apple, Bone, Wheat, Drumstick } from "lucide-react";

import Avatar from "@/components/ui/Avatar";
import { calculatePersonalTargets } from "./nutrition";
import type { ProfileFormData, AvatarStyle } from "./types";
import { cn } from "@/lib/utils";

interface Step4Props {
  data: ProfileFormData;
  onChange: <K extends keyof ProfileFormData>(
    key: K,
    value: ProfileFormData[K]
  ) => void;
}

const AVATAR_STYLES: { value: AvatarStyle; label: string }[] = [
  { value: "lorelei", label: "Lorelei" },
  { value: "avataaars", label: "Avataaars" },
  { value: "notionists", label: "Notionists" },
  { value: "bottts", label: "Bottts" },
];

const NUTRIENT_ICONS = {
  energy_kcal: Sparkles,
  sodium_mg: Salad,
  potassium_mg: Apple,
  calcium_mg: Bone,
  fiber_g: Wheat,
  fat_total_g: Drumstick,
} as const;

const NUTRIENT_LABELS = {
  energy_kcal: { label: "Energi", unit: "kkal" },
  sodium_mg: { label: "Natrium", unit: "mg" },
  potassium_mg: { label: "Kalium", unit: "mg" },
  calcium_mg: { label: "Kalsium", unit: "mg" },
  fiber_g: { label: "Serat", unit: "g" },
  fat_total_g: { label: "Lemak Total", unit: "g" },
} as const;

/**
 * Step 4: Konfirmasi & Avatar
 * - Pilihan avatar style (4 preset Dicebear)
 * - Preview target nutrisi personal yang akan dihitung
 */
export default function Step4Confirm({ data, onChange }: Step4Props) {
  const targets = useMemo(() => calculatePersonalTargets(data), [data]);

  const displayName = data.full_name || "User";

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-brand-charcoal md:text-2xl">
          Sentuhan akhir
        </h2>
        <p className="mt-1 text-sm text-brand-charcoal-soft">
          Pilih avatar Anda dan tinjau target nutrisi yang sudah kami siapkan.
        </p>
      </div>

      {/* Avatar Selection */}
      <div className="rounded-3xl bg-white border border-brand-charcoal/5 p-5 shadow-glass-sm">
        <p className="mb-3 text-sm font-medium text-brand-charcoal">
          Pilih Gaya Avatar
        </p>

        {/* Big preview avatar */}
        <div className="flex flex-col items-center gap-3 mb-5">
          <Avatar
            name={displayName}
            variant="character"
            characterStyle={data.avatar_style}
            size="xl"
          />
          <p className="text-xs text-brand-charcoal-muted">
            Pratinjau untuk{" "}
            <span className="font-medium text-brand-charcoal">{displayName}</span>
          </p>
        </div>

        {/* Style options */}
        <div className="grid grid-cols-4 gap-2">
          {AVATAR_STYLES.map((style) => (
            <button
              key={style.value}
              type="button"
              onClick={() => onChange("avatar_style", style.value)}
              className={cn(
                "group flex flex-col items-center gap-1.5 rounded-2xl p-2 transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary",
                data.avatar_style === style.value
                  ? "bg-brand-primary/10 ring-2 ring-brand-primary"
                  : "hover:bg-brand-primary/5"
              )}
              aria-label={`Pilih gaya ${style.label}`}
              aria-pressed={data.avatar_style === style.value}
            >
              <Avatar
                name={displayName}
                variant="character"
                characterStyle={style.value}
                size="md"
              />
              <span
                className={cn(
                  "text-[10px] font-medium",
                  data.avatar_style === style.value
                    ? "text-brand-primary"
                    : "text-brand-charcoal-soft"
                )}
              >
                {style.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Target nutrisi preview */}
      {targets ? (
        <div className="rounded-3xl bg-gradient-to-br from-brand-primary to-brand-primary-dark p-5 shadow-glass-md">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-white" />
            <p className="text-xs font-semibold uppercase tracking-wider text-white/85">
              Target Nutrisi Harian Anda
            </p>
          </div>
          <p className="text-sm text-white/80 leading-relaxed mb-4">
            Berdasarkan profil Anda, kami menghitung kebutuhan harian berikut
            mengacu pada panduan DASH Diet & rumus Mifflin-St Jeor.
          </p>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {(Object.keys(NUTRIENT_LABELS) as Array<keyof typeof NUTRIENT_LABELS>).map(
              (key) => {
                const Icon = NUTRIENT_ICONS[key];
                const meta = NUTRIENT_LABELS[key];
                const value = targets[key];
                return (
                  <div
                    key={key}
                    className="rounded-2xl bg-white/10 backdrop-blur-md ring-1 ring-white/15 p-3"
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon className="h-3.5 w-3.5 text-white/70" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/75">
                        {meta.label}
                      </span>
                    </div>
                    <p className="mt-1 text-base font-bold tabular-nums text-white">
                      {Number(value).toLocaleString("id-ID")}
                      <span className="ml-1 text-[10px] font-normal text-white/65">
                        {meta.unit}
                      </span>
                    </p>
                  </div>
                );
              }
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-3xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
          Lengkapi data fisik (usia, jenis kelamin, BB, TB) di langkah sebelumnya
          untuk melihat target nutrisi.
        </div>
      )}

      <p className="text-xs text-brand-charcoal-muted text-center px-4">
        Dengan mengklik &ldquo;Simpan & Mulai&rdquo;, Anda setuju data ini akan
        digunakan untuk personalisasi rekomendasi DASH Diet sesuai{" "}
        <a
          href="/privacy"
          target="_blank"
          rel="noopener"
          className="text-brand-primary hover:underline underline-offset-4"
        >
          Kebijakan Privasi
        </a>{" "}
        kami.
      </p>
    </div>
  );
}
