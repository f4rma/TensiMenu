import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Reveal from "./Reveal";

export default function CtaSection() {
  return (
    <section id="support" className="px-4 py-20 md:px-6 md:py-28">
      <Reveal>
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] bg-brand-primary px-6 py-14 md:px-16 md:py-20">
          {/* Depth overlays */}
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,247,232,0.18),transparent_60%)]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-brand-primary-light/25 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -top-24 -left-16 h-64 w-64 rounded-full bg-white/[0.07] blur-3xl"
            aria-hidden="true"
          />

          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-white md:text-4xl">
              Mulai kelola tekanan darah hari ini
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/85 md:text-base">
              Buat profil kesehatanmu, dan TensiMenu langsung menyusun
              rekomendasi menu DASH yang dipersonalisasi.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/register"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-cream px-7 py-3.5 text-sm font-semibold text-brand-primary shadow-glass-md transition-all duration-200 hover:bg-white hover:shadow-glass-lg active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary sm:w-auto md:text-base"
              >
                Buat Akun
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-2xl border border-white/25 bg-white/10 px-7 py-3.5 text-sm font-medium text-white backdrop-blur-md transition-all duration-200 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary sm:w-auto md:text-base"
              >
                Sudah punya akun
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
