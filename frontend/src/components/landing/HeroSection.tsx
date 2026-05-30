import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
      {/* Decorative blurred gradient orbs untuk warm ambient feel */}
      <div
        className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-brand-primary/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-brand-primary-light/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 md:grid-cols-2 md:gap-12 md:px-6 lg:gap-16">
        {/* Left: copy */}
        <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-brand-charcoal md:text-5xl lg:text-6xl">
            Kontrol Hipertensi dengan{" "}
            <span className="bg-gradient-to-r from-brand-primary to-brand-primary-light bg-clip-text text-transparent">
              Empathy Digital
            </span>
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-brand-charcoal-soft md:text-lg">
            TensiMenu membantu Anda menjalankan DASH Diet dengan rekomendasi
            makanan lokal yang lezat dan pemantauan kesehatan yang cerdas.
          </p>

          <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-2xl bg-brand-primary px-7 py-3.5 text-sm font-semibold text-white shadow-brand-cta transition-all duration-200 hover:bg-brand-primary-dark hover:shadow-brand-cta-hover active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream md:text-base"
            >
              Mulai Sekarang
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>

            <div className="flex items-center gap-2 text-sm text-brand-charcoal-soft">
              <ShieldCheck className="h-4 w-4 text-brand-primary" />
              <span>Clinical Empathy Driven</span>
            </div>
          </div>
        </div>

        {/* Right: hero glass card */}
        <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Outer wrapper with subtle decorative ring */}
          <div className="relative mx-auto aspect-square w-full max-w-md">
            {/* Background card with brand color */}
            <div className="absolute inset-0 overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-primary to-brand-primary-dark shadow-glass-lg ring-1 ring-brand-primary/20">
              {/* Inner soft ring */}
              <div
                className="absolute inset-3 rounded-[1.75rem] border border-white/15"
                aria-hidden="true"
              />

              {/* Mini header inside card */}
              <div className="absolute top-6 left-6 right-6 flex items-center justify-between text-white/90">
                <span className="text-sm font-semibold tracking-tight">
                  TensiMenu
                </span>
                <div className="flex gap-3 text-xs">
                  <span className="opacity-80">Menu</span>
                  <span className="opacity-80">Recipes</span>
                  <span className="opacity-80">Profile</span>
                </div>
              </div>

              {/* Food image */}
              <div className="absolute inset-0 flex items-center justify-center pt-4">
                <Image
                  src="/images/food-1.png"
                  alt="Sajian DASH dengan sayuran dan protein sehat"
                  width={420}
                  height={420}
                  className="object-contain drop-shadow-2xl"
                  priority
                />
              </div>

              {/* Glass caption */}
              <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-xl ring-1 ring-white/20">
                <p className="text-xs leading-relaxed text-white/90">
                  Setiap rekomendasi dipersonalisasi sesuai kondisi kesehatan
                  dan preferensi Anda.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
