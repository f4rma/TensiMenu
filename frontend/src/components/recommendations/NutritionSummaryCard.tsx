import { Flame, Droplet, Apple, Wheat, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type NutrientKind = "energy" | "sodium" | "potassium" | "fiber";
type Status = "low" | "on-track" | "achieved" | "warning" | "over";

interface NutritionSummaryCardProps {
  kind: NutrientKind;
  current: number;
  target: number;
  unit: string;
}

interface KindMeta {
  label: string;
  icon: LucideIcon;
  /**
   * "limit" — sodium-like: target adalah batas atas. Aman kalau ≤ target.
   * "goal" — kalium/serat-like: target adalah minimum. Aman kalau ≥ target,
   *          tapi waspada kalau > 150% (mis. kalium berlebihan untuk CKD).
   * "range" — energi-like: aman dalam window 90-110% target.
   */
  type: "limit" | "goal" | "range";
}

const KIND_META: Record<NutrientKind, KindMeta> = {
  energy: { label: "Energi", icon: Flame, type: "range" },
  sodium: { label: "Natrium (Garam)", icon: Droplet, type: "limit" },
  potassium: { label: "Kalium", icon: Apple, type: "goal" },
  fiber: { label: "Serat", icon: Wheat, type: "goal" },
};

/**
 * Card progress nutrisi mini di header halaman Rekomendasi.
 *
 * Status logic:
 * - "limit" (Natrium): hijau ≤75%, amber 75-100%, ROSE > 100%
 * - "goal" (Kalium, Serat): amber <50%, hijau 50-100%, hijau-tua 100-150%, ROSE >150%
 * - "range" (Energi): amber jika <90% atau >110%, hijau dalam window 90-110%
 */
export default function NutritionSummaryCard({
  kind,
  current,
  target,
  unit,
}: NutritionSummaryCardProps) {
  const meta = KIND_META[kind];
  const ratio = target > 0 ? current / target : 0;
  const status = computeStatus(meta.type, ratio);

  // Visual: bar bisa lewat 100% tapi capped di 120% biar tidak overflow card
  const barWidth = Math.min(120, ratio * 100);

  return (
    <div className="rounded-2xl bg-white border border-brand-charcoal/5 p-4 shadow-glass-sm">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-charcoal-muted">
          {meta.label}
        </span>
        <StatusIcon status={status} fallback={meta.icon} />
      </div>

      <p className="text-xl font-bold tabular-nums text-brand-charcoal leading-none">
        {current.toLocaleString("id-ID")}
        <span className="ml-1 text-xs font-normal text-brand-charcoal-muted">
          / {target.toLocaleString("id-ID")} {unit}
        </span>
      </p>

      {/* Progress bar dengan track yang bisa "overflow" visual */}
      <div className="mt-2.5 relative h-1.5 w-full rounded-full bg-brand-charcoal/5 overflow-hidden">
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r transition-all duration-700 ease-out",
            barColorFromStatus(status)
          )}
          style={{ width: `${barWidth}%` }}
        />
      </div>

      {/* Status helper text */}
      <p className="mt-1.5 text-[10px] font-medium leading-tight">
        <span className={statusTextColor(status)}>
          {statusMessage(status, meta.type)}
        </span>
      </p>
    </div>
  );
}

function computeStatus(type: KindMeta["type"], ratio: number): Status {
  if (type === "limit") {
    // Lower is better
    if (ratio > 1.0) return "over";
    if (ratio > 0.75) return "warning";
    return "on-track";
  }

  if (type === "goal") {
    // Higher is better, tapi terlalu tinggi juga berbahaya (kalium berlebih)
    if (ratio > 1.5) return "over";
    if (ratio >= 1.0) return "achieved";
    if (ratio >= 0.5) return "on-track";
    return "low";
  }

  // type === "range" (energi)
  if (ratio > 1.1) return "over";
  if (ratio < 0.9) return "low";
  return "achieved";
}

function StatusIcon({
  status,
  fallback: FallbackIcon,
}: {
  status: Status;
  fallback: LucideIcon;
}) {
  if (status === "over") {
    return <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />;
  }
  if (status === "warning") {
    return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
  }
  if (status === "achieved") {
    return <CheckCircle2 className="h-3.5 w-3.5 text-brand-primary" />;
  }
  return <FallbackIcon className="h-3.5 w-3.5 text-brand-charcoal-muted" />;
}

function barColorFromStatus(status: Status): string {
  switch (status) {
    case "over":
      return "from-rose-500 to-rose-400";
    case "warning":
      return "from-amber-500 to-amber-400";
    case "achieved":
      return "from-brand-primary to-brand-primary-light";
    case "on-track":
      return "from-brand-primary to-brand-primary-light";
    case "low":
      return "from-brand-charcoal/30 to-brand-charcoal/20";
  }
}

function statusTextColor(status: Status): string {
  switch (status) {
    case "over":
      return "text-rose-600";
    case "warning":
      return "text-amber-600";
    case "achieved":
      return "text-brand-primary";
    case "on-track":
      return "text-brand-charcoal-soft";
    case "low":
      return "text-brand-charcoal-muted";
  }
}

function statusMessage(status: Status, type: KindMeta["type"]): string {
  if (status === "over") {
    if (type === "limit") return "Melebihi batas — perhatian!";
    if (type === "goal") return "Melebihi batas";
    return "Di atas kebutuhan";
  }
  if (status === "warning") {
    if (type === "limit") return "Mendekati batas";
    return "Mendekati kebutuhan";
  }
  if (status === "achieved") {
    if (type === "limit") return "Aman";
    return "Target tercapai";
  }
  if (status === "on-track") {
    if (type === "limit") return "Aman";
    return "Dalam progres";
  }
  // low
  return "Belum cukup";
}
