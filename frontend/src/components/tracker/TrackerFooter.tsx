import Link from "next/link";
import { ChefHat, Plus } from "lucide-react";

const QUOTE = `"Kesehatan jantung adalah investasi jangka panjang. Satu langkah kecil setiap hari membawa perubahan besar."`;

/**
 * Footer Tracker — quote motivasional + CTA rekomendasi & catat makan.
 */
export default function TrackerFooter() {
  return (
    <div className="mt-5 grid grid-cols-1 items-center gap-4 rounded-3xl bg-white border border-brand-charcoal/5 p-5 shadow-glass-sm md:grid-cols-3">
      {/* Inspirasi DASH */}
      <Link
        href="/recommendations"
        className="group flex items-center gap-3 rounded-2xl border border-brand-charcoal/5 bg-brand-cream-soft p-3 transition-all duration-200 hover:border-brand-primary/30 hover:bg-white"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary transition-colors duration-200 group-hover:bg-brand-primary group-hover:text-white">
          <ChefHat className="h-5 w-5" strokeWidth={2.25} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-brand-charcoal">
            Butuh inspirasi DASH?
          </p>
          <p className="text-xs text-brand-primary group-hover:underline">
            Lihat Rekomendasi Menu →
          </p>
        </div>
      </Link>

      {/* Quote */}
      <div className="text-center text-xs leading-relaxed italic text-brand-charcoal-soft px-2">
        {QUOTE}
      </div>

      {/* Catat makan CTA */}
      <Link
        href="/recommendations"
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-primary px-5 py-3 text-sm font-semibold text-white shadow-brand-cta transition-all duration-200 hover:bg-brand-primary-dark hover:shadow-brand-cta-hover active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
      >
        <Plus className="h-4 w-4" />
        Catat Makan Hari Ini
      </Link>
    </div>
  );
}
