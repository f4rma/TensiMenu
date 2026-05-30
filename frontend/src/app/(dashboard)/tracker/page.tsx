import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import TrackerView from "@/components/tracker/TrackerView";
import TrackerEmptyState from "@/components/tracker/TrackerEmptyState";
import type { Period, TrackerData } from "@/components/tracker/types";

export const metadata: Metadata = {
  title: "Tracker Progres",
  description:
    "Pantau tren DASH Score, kepatuhan target, dan progres kesehatan Anda.",
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface BackendProgressResponse {
  trend: {
    period: string;
    points: { date: string; score: number }[];
    average: number;
    week_change_pct?: number;
  };
  compliance?: {
    percentage: number;
    days_achieved: number;
    total_days: number;
  };
  weekly?: {
    avg_dash_score: number;
    total_sodium_mg: number;
    total_potassium_mg: number;
    insight_message?: string;
  };
  heatmap?: {
    sodium_daily: number[];
    potassium_daily: number[];
    sodium_target: number;
    potassium_target: number;
  };
  streak?: {
    count: number;
    message: string;
  };
  has_data?: boolean;
}

async function fetchProgressByPeriod(
  accessToken: string,
  period: Period
): Promise<TrackerData | null> {
  try {
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(
      `${API_URL}/api/v1/progress?period=${days}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data: BackendProgressResponse = await res.json();
    if (!data?.trend?.points?.length) return null;

    return normalizeProgress(data, period);
  } catch {
    return null;
  }
}

function normalizeProgress(
  backend: BackendProgressResponse,
  period: Period
): TrackerData {
  const sodiumTarget = backend.heatmap?.sodium_target ?? 2300;
  const potassiumTarget = backend.heatmap?.potassium_target ?? 4000;

  return {
    trend: {
      period,
      points: backend.trend.points.map((p) => ({
        date: p.date,
        score: Number(p.score) || 0,
      })),
      average: Number(backend.trend.average) || 0,
      week_change_pct: Number(backend.trend.week_change_pct ?? 0),
    },
    compliance: {
      percentage: backend.compliance?.percentage ?? 0,
      days_achieved: backend.compliance?.days_achieved ?? 0,
      total_days: backend.compliance?.total_days ?? 0,
    },
    weekly: {
      avg_dash_score: backend.weekly?.avg_dash_score ?? 0,
      total_sodium_mg: backend.weekly?.total_sodium_mg ?? 0,
      total_potassium_mg: backend.weekly?.total_potassium_mg ?? 0,
      insight_message: backend.weekly?.insight_message,
    },
    heatmap: {
      sodium_daily: backend.heatmap?.sodium_daily ?? [],
      potassium_daily: backend.heatmap?.potassium_daily ?? [],
      sodium_target: sodiumTarget,
      potassium_target: potassiumTarget,
    },
    streak: {
      count: backend.streak?.count ?? 0,
      message: backend.streak?.message ?? "Terus catat makan harianmu",
    },
    has_data: true,
  };
}

export default async function TrackerPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (!session.accessToken) return <TrackerEmptyState />;

  // Fetch data untuk 3 periode secara paralel
  const [d7, d30, d90] = await Promise.all([
    fetchProgressByPeriod(session.accessToken, "7d"),
    fetchProgressByPeriod(session.accessToken, "30d"),
    fetchProgressByPeriod(session.accessToken, "90d"),
  ]);

  // Kalau semua periode tidak punya data → tampilkan empty state
  if (!d7 && !d30 && !d90) {
    return <TrackerEmptyState />;
  }

  // Build map; kalau salah satu period gagal, fallback ke yang berhasil
  const fallback = (d7 ?? d30 ?? d90)!;
  const dataByPeriod: Record<Period, TrackerData> = {
    "7d": d7 ?? fallback,
    "30d": d30 ?? fallback,
    "90d": d90 ?? fallback,
  };

  return <TrackerView dataByPeriod={dataByPeriod} initialPeriod="7d" />;
}
