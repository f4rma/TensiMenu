interface TrendChartCardProps {
  /** 7 nilai DASH score dari hari paling lama ke paling baru */
  scores: number[];
  /** Label tanggal untuk hari pertama dan terakhir */
  startLabel: string;
  endLabel: string;
}

/**
 * Mini bar chart untuk tren DASH Score 7 hari.
 * Hari terakhir di-highlight dengan warna brand.
 */
export default function TrendChartCard({
  scores,
  startLabel,
  endLabel,
}: TrendChartCardProps) {
  const max = Math.max(...scores, 100);
  const lastIndex = scores.length - 1;
  const lastScore = scores[lastIndex];

  return (
    <div className="rounded-3xl bg-white border border-brand-charcoal/5 p-5 shadow-glass-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-charcoal-muted">
        Tren DASH Score (7 Hari)
      </p>

      {/* Chart */}
      <div className="mt-3 flex items-end justify-between gap-1.5 h-20">
        {scores.map((score, idx) => {
          const heightPct = (score / max) * 100;
          const isLast = idx === lastIndex;
          return (
            <div
              key={idx}
              className="relative flex-1 flex flex-col items-center gap-1"
              title={`Hari ${idx + 1}: ${score}`}
            >
              {isLast && (
                <span className="absolute -top-4 text-[10px] font-bold text-brand-primary">
                  {score}
                </span>
              )}
              <div className="flex w-full items-end h-full">
                <div
                  className={`w-full rounded-md transition-all duration-700 ease-out ${
                    isLast
                      ? "bg-gradient-to-t from-brand-primary to-brand-primary-light"
                      : "bg-brand-charcoal/10"
                  }`}
                  style={{ height: `${heightPct}%`, minHeight: "4px" }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Date range label */}
      <div className="mt-2 flex items-center justify-between text-[10px] text-brand-charcoal-muted">
        <span>{startLabel}</span>
        <span className="font-medium text-brand-primary">{endLabel}</span>
      </div>
    </div>
  );
}
