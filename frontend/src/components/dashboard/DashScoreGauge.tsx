"use client";

import { useEffect, useState } from "react";

interface DashScoreGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

const SIZE_MAP = {
  sm: { container: "h-32 w-32", value: "text-2xl", label: "text-[10px]" },
  md: { container: "h-40 w-40", value: "text-3xl", label: "text-xs" },
  lg: { container: "h-48 w-48", value: "text-4xl", label: "text-sm" },
} as const;

/**
 * Half-circle gauge chart untuk DASH Score (0-100).
 *
 * - SVG-based, no chart library needed (lebih ringan)
 * - Smooth animation dari 0 ke target score saat mount
 * - Color berubah berdasarkan kategori
 */
export default function DashScoreGauge({ score, size = "md" }: DashScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const sizes = SIZE_MAP[size];

  useEffect(() => {
    // Animate dari 0 ke score selama 700ms
    const duration = 700;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Easing: ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(eased * score);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const clamped = Math.max(0, Math.min(100, animatedScore));
  const color = getColorForScore(clamped);

  // Half circle arc params
  const radius = 80;
  const circumference = Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className={`relative inline-flex flex-col items-center ${sizes.container}`}>
      <svg
        viewBox="0 0 200 120"
        className="w-full"
        role="img"
        aria-label={`DASH Score ${score} dari 100`}
      >
        {/* Background arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="rgba(43, 124, 97, 0.08)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* Filled arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke 0.3s ease" }}
        />
      </svg>

      {/* Score label centered */}
      <div className="absolute inset-x-0 bottom-1 flex flex-col items-center">
        <span className={`${sizes.value} font-bold tabular-nums text-brand-charcoal leading-none`}>
          {Math.round(clamped)}
        </span>
        <span className={`${sizes.label} mt-0.5 text-brand-charcoal-muted`}>
          / 100
        </span>
      </div>
    </div>
  );
}

function getColorForScore(score: number): string {
  if (score >= 80) return "#059669";  // emerald-600
  if (score >= 60) return "#2B7C61";  // brand-primary
  if (score >= 40) return "#D97706";  // amber-600
  return "#E11D48";                   // rose-600
}
