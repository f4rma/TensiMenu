/**
 * Types untuk halaman Tracker Progres.
 * Match dengan response backend /api/v1/progress/* (Req. 5).
 */

export type Period = "7d" | "30d" | "90d";

export const PERIOD_OPTIONS: { value: Period; label: string; days: number }[] = [
  { value: "7d", label: "7 Hari", days: 7 },
  { value: "30d", label: "30 Hari", days: 30 },
  { value: "90d", label: "90 Hari", days: 90 },
];

export interface DailyScorePoint {
  date: string; // ISO date
  score: number;
}

export interface ProgressTrend {
  period: Period;
  points: DailyScorePoint[];
  average: number;
  /** Persentase perubahan vs periode sebelumnya (positif = naik) */
  week_change_pct: number;
}

export interface ComplianceStats {
  /** Persentase hari mencapai DASH ≥ 60 (0-100) */
  percentage: number;
  days_achieved: number;
  total_days: number;
}

export interface WeeklySummary {
  avg_dash_score: number;
  total_sodium_mg: number;
  total_potassium_mg: number;
  /** Pesan kontekstual berdasarkan capaian */
  insight_message?: string;
}

export interface NutrientHeatmap {
  /** Daftar 7 nilai harian (Sen-Min) */
  sodium_daily: number[];
  potassium_daily: number[];
  sodium_target: number;
  potassium_target: number;
}

export interface StreakInfo {
  /** Hari berturut-turut user mencatat makan */
  count: number;
  message: string;
}

export interface TrackerData {
  trend: ProgressTrend;
  compliance: ComplianceStats;
  weekly: WeeklySummary;
  heatmap: NutrientHeatmap;
  streak: StreakInfo;
  has_data: boolean;
}
