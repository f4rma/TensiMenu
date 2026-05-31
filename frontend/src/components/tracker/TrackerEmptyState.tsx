import Link from "next/link";
import { LineChart, ChevronRight } from "lucide-react";

/**
 * Empty state untuk user yang belum punya consumption logs.
 * Tidak ada chart kosong yang menyesatkan (Req. 5.7).
 */
export default function TrackerEmptyState() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-brand-charcoal md:text-3xl">
          Tracker Progres
        </h1>
        <p className="mt-1 text-sm text-brand-charcoal-soft">
          Pantau kepatuhan diet DASH Anda untuk kesehatan jantung yang optimal.
        </p>
      </div>

      <div className="rounded-3xl bg-white border border-brand-charcoal/5 p-10 shadow-glass-sm text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-primary/10 text-brand-primary mb-4">
          <LineChart className="h-7 w-7" strokeWidth={2} />
        </span>

        <h2 className="text-lg font-semibold text-brand-charcoal">
          Belum ada data progres
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-brand-charcoal-soft">
          Tracker akan menampilkan tren DASH Score, kepatuhan target, dan
          ringkasan nutrisi setelah Anda mencatat makan setidaknya 1 hari.
        </p>

        <Link
          href="/recommendations"
          className="mt-6 inline-flex items-center gap-1.5 rounded-2xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white shadow-brand-cta transition-all duration-200 hover:bg-brand-primary-dark hover:shadow-brand-cta-hover active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
        >
          Lihat Rekomendasi
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
