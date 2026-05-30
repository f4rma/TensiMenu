import DashScoreGauge from "../DashScoreGauge";

interface DashScoreCardProps {
  score: number;
  category: string;
  description: string;
  nutrients: {
    sodium: { current: number; target: number };
    potassium: { current: number; target: number };
  };
}

/**
 * Card untuk menampilkan DASH Score harian + progress nutrisi utama.
 * Posisi: kolom kiri di Beranda dashboard.
 */
export default function DashScoreCard({
  score,
  category,
  description,
  nutrients,
}: DashScoreCardProps) {
  return (
    <div className="rounded-3xl bg-white border border-brand-charcoal/5 p-5 shadow-glass-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-charcoal-muted text-center">
        {category}
      </p>

      {/* Gauge */}
      <div className="mt-3 flex justify-center">
        <DashScoreGauge score={score} size="md" />
      </div>

      <p className="mt-3 text-center text-xs leading-relaxed text-brand-charcoal-soft px-2">
        {description}
      </p>

      {/* Nutrient progress bars */}
      <div className="mt-5 flex flex-col gap-3 border-t border-brand-charcoal/5 pt-4">
        <NutrientBar
          label="Natrium"
          current={nutrients.sodium.current}
          target={nutrients.sodium.target}
          unit="mg"
          color="brand"
        />
        <NutrientBar
          label="Kalium"
          current={nutrients.potassium.current}
          target={nutrients.potassium.target}
          unit="mg"
          color="brand"
        />
      </div>
    </div>
  );
}

interface NutrientBarProps {
  label: string;
  current: number;
  target: number;
  unit: string;
  color: "brand" | "amber" | "rose";
}

function NutrientBar({ label, current, target, unit, color }: NutrientBarProps) {
  const percent = Math.min(100, (current / target) * 100);
  const colorClass = {
    brand: "from-brand-primary to-brand-primary-light",
    amber: "from-amber-500 to-amber-400",
    rose: "from-rose-500 to-rose-400",
  }[color];

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-brand-charcoal">{label}</span>
        <span className="tabular-nums text-brand-charcoal-soft">
          <span className="font-semibold text-brand-charcoal">
            {current.toLocaleString("id-ID")}
          </span>
          <span className="text-brand-charcoal-muted">
            {" / "}
            {target.toLocaleString("id-ID")}
            {unit}
          </span>
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-charcoal/5">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${colorClass} transition-all duration-700 ease-out`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
