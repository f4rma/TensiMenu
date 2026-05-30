import Link from "next/link";

export default function CtaSection() {
  return (
    <section className="relative overflow-hidden bg-brand-primary py-16 md:py-20">
      {/* Decorative radial overlay untuk depth */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,247,232,0.15),transparent_70%)]"
        aria-hidden="true"
      />
      {/* Subtle texture orbs */}
      <div
        className="pointer-events-none absolute -top-20 left-1/4 h-64 w-64 rounded-full bg-brand-cream/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-20 right-1/4 h-72 w-72 rounded-full bg-brand-primary-light/20 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-3xl px-4 text-center md:px-6">
        <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl lg:text-4xl">
          Siap Menurunkan Tekanan Darah Anda?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/85 md:text-base">
          Bergabunglah dengan ribuan orang lainnya yang telah berhasil
          mengontrol hipertensi melalui DASH Diet bersama TensiMenu.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Link
            href="/register"
            className="rounded-2xl bg-brand-cream px-7 py-3.5 text-sm font-semibold text-brand-primary shadow-glass-md transition-all duration-200 hover:bg-white hover:shadow-glass-lg active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary md:text-base"
          >
            Coba Gratis Sekarang
          </Link>
          <Link
            href="#features"
            className="rounded-2xl border border-white/30 bg-white/10 px-7 py-3.5 text-sm font-medium text-white backdrop-blur-md transition-all duration-200 hover:bg-white/20 hover:border-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary md:text-base"
          >
            Pelajari Demo
          </Link>
        </div>
      </div>
    </section>
  );
}
