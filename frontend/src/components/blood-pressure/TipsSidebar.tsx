import Link from "next/link";
import { Utensils, ArrowRight } from "lucide-react";

/**
 * Sidebar tips DASH Diet — info edukatif.
 * Decorative & helpful, tidak interaktif.
 */
export default function TipsSidebar() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-primary to-brand-primary-dark p-5 text-white shadow-glass-md">
      {/* Decorative orb */}
      <div
        className="pointer-events-none absolute -top-12 -right-8 h-40 w-40 rounded-full bg-brand-primary-light/30 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-24 w-24 rounded-full bg-amber-300/15 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative">
        {/* Icon hint */}
        <Utensils
          className="absolute -bottom-1 -right-1 h-12 w-12 text-white/10"
          aria-hidden="true"
        />

        <p className="text-sm font-bold tracking-tight">Tips DASH Diet</p>
        <p className="mt-2 text-xs leading-relaxed text-white/85">
          Kurangi asupan natrium harian Anda hingga di bawah 2.300 mg untuk
          membantu menurunkan tekanan darah.
        </p>

        <Link
          href="/recommendations"
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-white underline-offset-4 transition-colors duration-150 hover:underline"
        >
          Pelajari Selengkapnya
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
