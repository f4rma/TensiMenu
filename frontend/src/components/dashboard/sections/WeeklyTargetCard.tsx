import { Utensils } from "lucide-react";

interface WeeklyTargetCardProps {
  message: string;
}

/**
 * Card "Target Mingguan" — pengingat actionable kecil di kolom kanan.
 */
export default function WeeklyTargetCard({ message }: WeeklyTargetCardProps) {
  return (
    <div className="rounded-3xl bg-white border border-brand-charcoal/5 p-4 shadow-glass-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
          <Utensils className="h-4 w-4" strokeWidth={2.25} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-charcoal-muted">
            Target Minggu Ini
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-brand-charcoal">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
