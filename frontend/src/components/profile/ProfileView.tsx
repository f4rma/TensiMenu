"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Pencil,
  User,
  Calendar,
  Weight,
  Ruler,
  Heart,
  Stethoscope,
  Utensils,
  MapPin,
  Sparkles,
  Salad,
  Apple,
  Bone,
  Wheat,
  Drumstick,
} from "lucide-react";

import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import ProfileWizard from "./ProfileWizard";
import {
  COMORBIDITY_LABELS,
  FOOD_RESTRICTION_LABELS,
  REGIONAL_LABELS,
} from "./types";
import type {
  ProfileFormData,
  Comorbidity,
  FoodRestriction,
  RegionalPref,
  AvatarStyle,
  DailyTargets,
} from "./types";

interface ProfileViewProps {
  data: ProfileFormData;
  dailyTargets: DailyTargets | null;
}

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
 * View read-only untuk profil yang sudah lengkap.
 * User bisa klik "Edit Profil" untuk masuk ke wizard edit.
 */
export default function ProfileView({ data, dailyTargets }: ProfileViewProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-charcoal-soft transition-colors duration-150 hover:text-brand-primary"
        >
          ← Kembali ke ringkasan
        </button>
        <ProfileWizard
          mode="edit"
          initialData={data}
        />
      </div>
    );
  }

  const genderLabel = data.gender === "laki-laki" ? "Laki-laki" : "Perempuan";
  const hasBP =
    typeof data.systolic_bp === "number" && typeof data.diastolic_bp === "number";

  return (
    <div className="mx-auto w-full max-w-3xl animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header card dengan avatar besar */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-primary to-brand-primary-dark p-6 md:p-8 shadow-glass-md">
        {/* Decorative orbs */}
        <div
          className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-brand-primary-light/20 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-white/5 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar
              name={data.full_name}
              variant="character"
              characterStyle={data.avatar_style as AvatarStyle}
              size="xl"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                Profil Anda
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">
                {data.full_name}
              </h1>
              <p className="mt-1 text-sm text-white/80">
                {genderLabel} • {data.age} tahun
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={() => setEditing(true)}
            className="bg-white/15 backdrop-blur-md border-white/20 text-white hover:bg-white/25"
          >
            <Pencil className="h-4 w-4" />
            Edit Profil
          </Button>
        </div>
      </div>

      {/* Grid info cards */}
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Data Fisik */}
        <Section icon={User} title="Data Fisik">
          <InfoRow icon={Calendar} label="Usia" value={`${data.age} tahun`} />
          <InfoRow icon={User} label="Jenis Kelamin" value={genderLabel} />
          <InfoRow
            icon={Weight}
            label="Berat Badan"
            value={`${data.weight_kg} kg`}
          />
          <InfoRow
            icon={Ruler}
            label="Tinggi Badan"
            value={`${data.height_cm} cm`}
          />
        </Section>

        {/* Kondisi Medis */}
        <Section icon={Stethoscope} title="Kondisi Medis">
          <InfoRow
            icon={Heart}
            label="Tekanan Darah"
            value={
              hasBP
                ? `${data.systolic_bp}/${data.diastolic_bp} mmHg`
                : "Belum dicatat"
            }
            muted={!hasBP}
          />
          <InfoRow
            icon={Stethoscope}
            label="Komorbid"
            value={
              data.comorbidities.length > 0
                ? data.comorbidities
                    .map((c) => COMORBIDITY_LABELS[c as Comorbidity] ?? c)
                    .join(", ")
                : "Tidak ada"
            }
            multiline
          />
        </Section>

        {/* Preferensi Makanan */}
        <Section icon={Utensils} title="Preferensi Makanan">
          <InfoRow
            icon={Utensils}
            label="Pantangan / Alergi"
            value={
              data.food_restrictions.length > 0
                ? data.food_restrictions
                    .map(
                      (r) => FOOD_RESTRICTION_LABELS[r as FoodRestriction] ?? r
                    )
                    .join(", ")
                : "Tidak ada"
            }
            multiline
            muted={data.food_restrictions.length === 0}
          />
          <InfoRow
            icon={MapPin}
            label="Wilayah Favorit"
            value={
              data.regional_prefs.length > 0
                ? data.regional_prefs
                    .map((r) => REGIONAL_LABELS[r as RegionalPref] ?? r)
                    .join(", ")
                : "Tidak ada preferensi khusus"
            }
            multiline
            muted={data.regional_prefs.length === 0}
          />
        </Section>

        {/* Quick stats */}
        <Section icon={Sparkles} title="Status Akun">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 px-3.5 py-2.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-emerald-700">
                Profil lengkap & aktif
              </span>
            </div>
            <p className="text-xs leading-relaxed text-brand-charcoal-soft">
              Data Anda dilindungi enkripsi standar medis. Anda dapat mengubah
              atau menghapus data kapan saja.
            </p>
            <button
              type="button"
              onClick={() => router.push("/privacy")}
              className="text-left text-xs font-medium text-brand-primary underline-offset-4 hover:underline"
            >
              Pelajari Kebijakan Privasi →
            </button>
          </div>
        </Section>
      </div>

      {/* Target nutrisi card */}
      {dailyTargets && (
        <div className="mt-5 rounded-3xl bg-gradient-to-br from-brand-primary to-brand-primary-dark p-5 md:p-6 shadow-glass-md">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-white" />
            <p className="text-xs font-semibold uppercase tracking-wider text-white/85">
              Target Nutrisi Harian Anda
            </p>
          </div>
          <p className="text-sm text-white/80 leading-relaxed mb-4">
            Dihitung berdasarkan profil Anda mengacu panduan DASH Diet & rumus
            Mifflin-St Jeor.
          </p>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {(Object.keys(NUTRIENT_LABELS) as Array<keyof typeof NUTRIENT_LABELS>).map(
              (key) => {
                const Icon = NUTRIENT_ICONS[key];
                const meta = NUTRIENT_LABELS[key];
                const value = dailyTargets[key];
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
      )}
    </div>
  );
}

interface SectionProps {
  icon: typeof User;
  title: string;
  children: React.ReactNode;
}

function Section({ icon: Icon, title, children }: SectionProps) {
  return (
    <div className="rounded-3xl bg-white border border-brand-charcoal/5 p-5 shadow-glass-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
          <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
        </span>
        <h2 className="text-sm font-semibold tracking-tight text-brand-charcoal">
          {title}
        </h2>
      </div>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

interface InfoRowProps {
  icon: typeof User;
  label: string;
  value: string;
  multiline?: boolean;
  muted?: boolean;
}

function InfoRow({ icon: Icon, label, value, multiline, muted }: InfoRowProps) {
  return (
    <div
      className={`flex ${multiline ? "flex-col" : "items-center justify-between"} gap-1`}
    >
      <span className="flex items-center gap-1.5 text-xs text-brand-charcoal-muted">
        <Icon className="h-3 w-3" />
        {label}
      </span>
      <span
        className={`text-sm ${multiline ? "" : "text-right"} ${
          muted ? "text-brand-charcoal-muted italic" : "font-medium text-brand-charcoal"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
