import { cn } from "@/lib/utils";

interface NutrientHeatmapProps {
  sodiumDaily: number[];
  potassiumDaily: number[];
  sodiumTarget: number;
  potassiumTarget: number;
}

const DAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

/**
 * Card "Tren Nutrisi Mikro" dengan heatmap mingguan.
 *
 * Sodium (lower is better):
 * - Hijau: ≤ 50% target (aman)
 * - Hijau gelap: 51-100% target (oke)
 * - Coklat/rose: > target (warning)
 *
 * Potassium (higher is better):
 * - Hijau muda: < 50% target (kurang)
 * - Hijau: 50-100% target (mendekati)
 * - Hijau gelap: ≥ 100% target (tercapai)
 */
export default function NutrientHeatmap({
  sodiumDaily,
  potassiumDaily,
  sodiumTarget,
  potassiumTarget,
}: NutrientHeatmapProps) {
  return (
    <div className="rounded-3xl bg-white border border-brand-charcoal/5 p-5 shadow-glass-sm">
      <h3 className="text-base font-semibold tracking-tight text-brand-charcoal">
        Tren Nutrisi Mikro
      </h3>

      <div className="mt-4 flex flex-col gap-4">
        <Row
          label="Daily Sodium (mg)"
          target={`<${sodiumTarget.toLocaleString("id-ID")}`}
          values={sodiumDaily}
          colorFn={(v) => sodiumColor(v, sodiumTarget)}
        />
        <Row
          label="Daily Potassium (mg)"
          target={`>${potassiumTarget.toLocaleString("id-ID")}`}
          values={potassiumDaily}
          colorFn={(v) => potassiumColor(v, potassiumTarget)}
        />
      </div>
    </div>
  );
}

function Row({
  label,
  target,
  values,
  colorFn,
}: {
  label: string;
  target: string;
  values: number[];
  colorFn: (v: number) => string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-medium text-brand-charcoal">{label}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-charcoal-muted">
          Target: {target}
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {values.map((v, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-1"
            title={`${DAYS[i]}: ${v.toLocaleString("id-ID")}`}
          >
            <div
              className={cn(
                "h-9 w-full rounded-xl transition-colors duration-300",
                colorFn(v)
              )}
            />
            <span className="text-[9px] font-medium text-brand-charcoal-muted">
              {DAYS[i]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function sodiumColor(value: number, target: number): string {
  const ratio = value / target;
  if (ratio <= 0.5) return "bg-emerald-500/80";
  if (ratio <= 0.85) return "bg-brand-primary";
  if (ratio <= 1.0) return "bg-brand-primary-dark";
  return "bg-amber-700"; // melebihi target
}

function potassiumColor(value: number, target: number): string {
  const ratio = value / target;
  if (ratio < 0.4) return "bg-brand-primary/30";
  if (ratio < 0.7) return "bg-brand-primary/60";
  if (ratio < 1.0) return "bg-brand-primary";
  return "bg-brand-primary-dark";
}
