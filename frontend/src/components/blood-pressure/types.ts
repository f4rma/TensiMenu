/**
 * Types untuk halaman Riwayat Tekanan Darah.
 * Match dengan response backend /api/v1/blood-pressure/* (Req. 6).
 */

export type Period = "7d" | "30d" | "90d";

export const PERIOD_OPTIONS: { value: Period; label: string; days: number }[] = [
  { value: "7d", label: "7 Hari", days: 7 },
  { value: "30d", label: "30 Hari", days: 30 },
  { value: "90d", label: "90 Hari", days: 90 },
];

export type BPCategory =
  | "Normal"
  | "Elevated"
  | "Hipertensi Stage 1"
  | "Hipertensi Stage 2"
  | "Krisis Hipertensi";

export interface BPRecord {
  id: string;
  systolic_mmhg: number;
  diastolic_mmhg: number;
  measured_at: string;
  notes?: string | null;
  category: BPCategory;
  is_critical: boolean;
}

/**
 * Klasifikasi BP berdasarkan panduan JNC 8 / AHA 2017.
 * Dipakai konsisten di seluruh aplikasi (Req. 6.4).
 */
export function classifyBP(systolic: number, diastolic: number): BPCategory {
  if (systolic >= 180 || diastolic >= 120) return "Krisis Hipertensi";
  if (systolic >= 140 || diastolic >= 90) return "Hipertensi Stage 2";
  if (systolic >= 130 || diastolic >= 80) return "Hipertensi Stage 1";
  if (systolic >= 120) return "Elevated";
  return "Normal";
}

export const CATEGORY_STYLES: Record<
  BPCategory,
  { dotBg: string; chipBg: string; chipText: string; label: string }
> = {
  Normal: {
    dotBg: "bg-emerald-500",
    chipBg: "bg-emerald-50 border-emerald-200",
    chipText: "text-emerald-700",
    label: "NORMAL",
  },
  Elevated: {
    dotBg: "bg-amber-500",
    chipBg: "bg-amber-50 border-amber-200",
    chipText: "text-amber-700",
    label: "ELEVATED",
  },
  "Hipertensi Stage 1": {
    dotBg: "bg-orange-500",
    chipBg: "bg-orange-50 border-orange-200",
    chipText: "text-orange-700",
    label: "HIPERTENSI STAGE 1",
  },
  "Hipertensi Stage 2": {
    dotBg: "bg-rose-500",
    chipBg: "bg-rose-50 border-rose-200",
    chipText: "text-rose-700",
    label: "HIPERTENSI STAGE 2",
  },
  "Krisis Hipertensi": {
    dotBg: "bg-rose-600 animate-pulse",
    chipBg: "bg-rose-100 border-rose-300",
    chipText: "text-rose-900",
    label: "KRISIS",
  },
};
