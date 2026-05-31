"use client";

import { TrendingUp } from "lucide-react";

interface ComplianceStatsCardProps {
  /** Persentase hari di mana DASH score >= 60, range 0-100 */
  percentage: number;
  /** Hari berhasil mencapai target dari total hari */
  daysAchieved: number;
  totalDays: number;
}

/**
 * Card statistik kepatuhan dengan ring chart style mockup.
 * Background: dark teal gradient.
 */
export default function ComplianceStatsCard({
  percentage,
  daysAchieved,
  totalDays,
}: ComplianceStatsCardProps) {
  // Label kualitatif berdasarkan tingkat kepatuhan
  const label =
    percentage >= 80
      ? "Sangat konsisten"
      : percentage >= 50
        ? "Cukup konsisten"
        : "Perlu ditingkatkan";

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-primary to-brand-primary-dark p-5 shadow-glass-md text-white">
      {/* Decorative orb */}
      <div
        className="pointer-events-none absolute -bottom-12 -right-12 h-40 w-40 rounded-full bg-white/5 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative">
        <div className="flex items-center gap-1.5 mb-3">
          <TrendingUp className="h-3 w-3 text-white/70" />
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
            Statistik Kepatuhan
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Ring chart */}
          <div className="relative">
            <PercentageRing value={percentage} />
          </div>

          <div className="flex-1">
            <p className="text-sm font-semibold text-white">{label}</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-white/60">
              tingkat kepatuhan DASH
            </p>
          </div>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-white/85">
          {daysAchieved} dari {totalDays} hari tercatat, Anda berhasil mencapai
          target skor DASH ≥ 60.
        </p>
      </div>
    </div>
  );
}

function PercentageRing({ value }: { value: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative h-16 w-16">
      <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="4"
        />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="rgb(255 255 255)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.7s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-base font-bold tabular-nums text-white">
          {Math.round(value)}%
        </span>
      </div>
    </div>
  );
}
