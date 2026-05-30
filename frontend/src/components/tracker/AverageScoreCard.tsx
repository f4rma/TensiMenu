import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface AverageScoreCardProps {
  average: number;
  changePercent: number;
}

/**
 * Card "Rata-Rata DASH Score" dengan indikator perubahan vs minggu lalu.
 */
export default function AverageScoreCard({
  average,
  changePercent,
}: AverageScoreCardProps) {
  const TrendIcon =
    changePercent > 0 ? TrendingUp : changePercent < 0 ? TrendingDown : Minus;
  const trendColor =
    changePercent > 0
      ? "text-emerald-600"
      : changePercent < 0
        ? "text-rose-600"
        : "text-brand-charcoal-muted";

  const sign = changePercent > 0 ? "+" : "";

  return (
    <div className="rounded-3xl bg-brand-primary/5 border border-brand-primary/15 p-5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-primary">
        Rata-Rata DASH Score
      </p>
      <p className="mt-1.5 text-4xl font-bold tabular-nums text-brand-charcoal leading-none">
        {average.toFixed(1)}
        <span className="ml-1 text-base font-medium text-brand-charcoal-muted">
          / 100
        </span>
      </p>
      <div className={cn("mt-2.5 inline-flex items-center gap-1 text-xs font-medium", trendColor)}>
        <TrendIcon className="h-3.5 w-3.5" />
        <span>
          {sign}
          {changePercent.toFixed(0)}% dari minggu lalu
        </span>
      </div>
    </div>
  );
}
