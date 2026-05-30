import { Info } from "lucide-react";

interface WeeklySummaryCardProps {
  avgDashScore: number;
  totalSodium: number;
  totalPotassium: number;
  insightMessage?: string;
}

/**
 * Card "Ringkasan Mingguan" — 3 stats utama + insight kontekstual.
 */
export default function WeeklySummaryCard({
  avgDashScore,
  totalSodium,
  totalPotassium,
  insightMessage,
}: WeeklySummaryCardProps) {
  return (
    <div className="rounded-3xl bg-white border border-brand-charcoal/5 p-5 shadow-glass-sm">
      <h3 className="text-base font-semibold tracking-tight text-brand-charcoal">
        Ringkasan Mingguan
      </h3>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <Stat
          label="DASH Score"
          value={avgDashScore.toFixed(1)}
          color="emerald"
        />
        <Stat
          label="Total Sodium"
          value={totalSodium.toLocaleString("id-ID")}
          unit="mg"
          color="amber"
        />
        <Stat
          label="Total Potassium"
          value={totalPotassium.toLocaleString("id-ID")}
          unit="mg"
          color="emerald"
        />
      </div>

      {insightMessage && (
        <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-sky-50 border border-sky-200 px-3.5 py-2.5">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-sky-600" />
          <p className="text-xs leading-relaxed text-sky-900">
            {insightMessage}
          </p>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: string;
  unit?: string;
  color: "emerald" | "amber" | "rose";
}) {
  const valueColor = {
    emerald: "text-brand-primary",
    amber: "text-amber-700",
    rose: "text-rose-600",
  }[color];

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-charcoal-muted">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold tabular-nums leading-none ${valueColor}`}>
        {value}
        {unit && (
          <span className="ml-0.5 text-[11px] font-medium text-brand-charcoal-muted">
            {unit}
          </span>
        )}
      </p>
    </div>
  );
}
