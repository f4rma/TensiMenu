interface ComplianceCardProps {
  percentage: number;
  daysAchieved: number;
  totalDays: number;
}

/**
 * Card "Kepatuhan Target" dengan ring progress kecil.
 * Menampilkan rasio hari mencapai DASH score ≥ 60.
 */
export default function ComplianceCard({
  percentage,
  daysAchieved,
  totalDays,
}: ComplianceCardProps) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="rounded-3xl bg-white border border-brand-charcoal/5 p-5 shadow-glass-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-charcoal-muted">
        Kepatuhan Target
      </p>

      <div className="mt-3 flex items-center gap-3">
        {/* Ring chart */}
        <div className="relative h-14 w-14 shrink-0">
          <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke="rgba(43, 124, 97, 0.1)"
              strokeWidth="4"
            />
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke="#2B7C61"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 0.7s ease-out" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold tabular-nums text-brand-primary">
              {Math.round(percentage)}%
            </span>
          </div>
        </div>

        {/* Stats text */}
        <div className="flex-1">
          <p className="text-base font-bold tabular-nums text-brand-charcoal leading-tight">
            {daysAchieved} dari {totalDays} hari
          </p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-brand-charcoal-soft">
            mencapai DASH Score ≥ 60
          </p>
        </div>
      </div>
    </div>
  );
}
