import Link from "next/link";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface BloodPressureCardProps {
  systolic: number | null;
  diastolic: number | null;
  measuredAt?: string;
}

type BPCategory = "Normal" | "Elevated" | "Pre-Hipertensi" | "Hipertensi 1" | "Hipertensi 2" | "Krisis";

function classifyBP(systolic: number, diastolic: number): BPCategory {
  if (systolic >= 180 || diastolic >= 120) return "Krisis";
  if (systolic >= 140 || diastolic >= 90) return "Hipertensi 2";
  if (systolic >= 130 || diastolic >= 80) return "Hipertensi 1";
  if (systolic >= 120) return "Pre-Hipertensi";
  return "Normal";
}

const CATEGORY_STYLE: Record<BPCategory, { dot: string; label: string }> = {
  Normal: { dot: "bg-emerald-500", label: "text-emerald-700" },
  Elevated: { dot: "bg-amber-500", label: "text-amber-700" },
  "Pre-Hipertensi": { dot: "bg-amber-500", label: "text-amber-700" },
  "Hipertensi 1": { dot: "bg-orange-500", label: "text-orange-700" },
  "Hipertensi 2": { dot: "bg-rose-500", label: "text-rose-700" },
  Krisis: { dot: "bg-rose-600 animate-pulse", label: "text-rose-800" },
};

/**
 * Card "Tekanan Darah Terakhir" di kolom kanan Beranda.
 * Menampilkan nilai BP, kategori, dan tombol catat.
 */
export default function BloodPressureCard({
  systolic,
  diastolic,
  measuredAt,
}: BloodPressureCardProps) {
  const hasData = typeof systolic === "number" && typeof diastolic === "number";
  const category = hasData ? classifyBP(systolic!, diastolic!) : null;
  const style = category ? CATEGORY_STYLE[category] : null;

  return (
    <div className="rounded-3xl bg-white border border-brand-charcoal/5 p-5 shadow-glass-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-charcoal-muted">
        Tekanan Darah Terakhir
      </p>

      {hasData ? (
        <>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-brand-charcoal">
            <span>{systolic}</span>
            <span className="mx-0.5 text-brand-charcoal-muted">/</span>
            <span>{diastolic}</span>
            <span className="ml-1.5 text-sm font-medium text-brand-charcoal-soft">mmHg</span>
          </p>

          {category && style && (
            <span className={cn(
              "mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand-charcoal/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
              style.label
            )}>
              <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
              {category}
            </span>
          )}

          {measuredAt && (
            <p className="mt-2 text-[10px] text-brand-charcoal-muted">
              {measuredAt}
            </p>
          )}
        </>
      ) : (
        <div className="mt-2">
          <p className="text-sm text-brand-charcoal-soft italic">
            Belum ada catatan
          </p>
          <p className="mt-1 text-xs text-brand-charcoal-muted">
            Catat tekanan darah Anda untuk personalisasi yang lebih akurat.
          </p>
        </div>
      )}

      <Link
        href="/blood-pressure"
        className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-2xl border border-brand-primary/30 bg-white px-4 py-2.5 text-sm font-semibold text-brand-primary transition-all duration-200 hover:bg-brand-primary hover:text-white hover:border-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
      >
        <Heart className="h-3.5 w-3.5" />
        Catat Tekanan Darah
      </Link>
    </div>
  );
}
