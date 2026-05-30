import { Flame } from "lucide-react";

interface StreakCardProps {
  count: number;
  message: string;
}

/**
 * Card streak — pengingat motivasional konsistensi catat makan.
 */
export default function StreakCard({ count, message }: StreakCardProps) {
  return (
    <div className="rounded-3xl bg-amber-50 border border-amber-200 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-[0_4px_12px_rgba(217,119,6,0.25)]">
          <Flame className="h-5 w-5" strokeWidth={2.25} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold tracking-tight text-amber-900">
            {count} Hari Beruntun!
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-amber-800">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
