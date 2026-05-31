"use client";

import { useState, useMemo } from "react";

import PeriodToggle from "./PeriodToggle";
import TrendChart from "./TrendChart";
import AverageScoreCard from "./AverageScoreCard";
import ComplianceCard from "./ComplianceCard";
import StreakCard from "./StreakCard";
import WeeklySummaryCard from "./WeeklySummaryCard";
import NutrientHeatmap from "./NutrientHeatmap";
import TrackerFooter from "./TrackerFooter";

import type { Period, TrackerData } from "./types";

interface TrackerViewProps {
  /** Data dari semua periode pre-fetched dari server. */
  dataByPeriod: Record<Period, TrackerData>;
  initialPeriod?: Period;
}

/**
 * Orchestrator untuk halaman Tracker.
 * Tanggung jawab: handle period state, switch data berdasarkan periode aktif.
 *
 * Single Responsibility: tidak melakukan fetching atau computation,
 * semua dilakukan di server-side dan diteruskan via props.
 */
export default function TrackerView({
  dataByPeriod,
  initialPeriod = "7d",
}: TrackerViewProps) {
  const [period, setPeriod] = useState<Period>(initialPeriod);

  const data = dataByPeriod[period];

  const subtitle = useMemo(() => {
    const labels: Record<Period, string> = {
      "7d": "minggu ini",
      "30d": "30 hari terakhir",
      "90d": "90 hari terakhir",
    };
    return `Pantau kepatuhan diet DASH Anda untuk ${labels[period]}.`;
  }, [period]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-charcoal md:text-3xl">
            Tracker Progres
          </h1>
          <p className="mt-1 text-sm text-brand-charcoal-soft">{subtitle}</p>
        </div>
        <PeriodToggle value={period} onChange={setPeriod} />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
        {/* LEFT: Trend chart (8 cols) */}
        <section className="lg:col-span-8">
          <div className="rounded-3xl bg-white border border-brand-charcoal/5 p-5 shadow-glass-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-brand-charcoal">
                  Tren DASH Score
                </h2>
                <p className="mt-0.5 text-xs text-brand-charcoal-soft">
                  Skor harian berdasarkan asupan nutrisi DASH
                </p>
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                <Legend color="bg-brand-primary" label="DASH Score" />
                <Legend
                  color="bg-rose-500"
                  label="Batas Baik (60)"
                  dashed
                />
              </div>
            </div>
            <div className="mt-3">
              <TrendChart points={data.trend.points} threshold={60} />
            </div>
          </div>
        </section>

        {/* RIGHT: Stats column (4 cols) */}
        <section className="flex flex-col gap-4 lg:col-span-4">
          <AverageScoreCard
            average={data.trend.average}
            changePercent={data.trend.week_change_pct}
          />
          <ComplianceCard
            percentage={data.compliance.percentage}
            daysAchieved={data.compliance.days_achieved}
            totalDays={data.compliance.total_days}
          />
          <StreakCard
            count={data.streak.count}
            message={data.streak.message}
          />
        </section>

        {/* BOTTOM LEFT: Weekly summary (6 cols) */}
        <section className="lg:col-span-6">
          <WeeklySummaryCard
            avgDashScore={data.weekly.avg_dash_score}
            totalSodium={data.weekly.total_sodium_mg}
            totalPotassium={data.weekly.total_potassium_mg}
            insightMessage={data.weekly.insight_message}
          />
        </section>

        {/* BOTTOM RIGHT: Heatmap (6 cols) */}
        <section className="lg:col-span-6">
          <NutrientHeatmap
            sodiumDaily={data.heatmap.sodium_daily}
            potassiumDaily={data.heatmap.potassium_daily}
            sodiumTarget={data.heatmap.sodium_target}
            potassiumTarget={data.heatmap.potassium_target}
          />
        </section>
      </div>

      {/* Footer CTA */}
      <TrackerFooter />
    </div>
  );
}

function Legend({
  color,
  label,
  dashed,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1 text-brand-charcoal-soft">
      {dashed ? (
        <span className="inline-block h-0.5 w-3 border-t-2 border-dashed border-rose-500" />
      ) : (
        <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
      )}
      {label}
    </span>
  );
}
