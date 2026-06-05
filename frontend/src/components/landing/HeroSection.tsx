import Link from "next/link";
import { ArrowRight, Activity } from "lucide-react";
import Reveal from "./Reveal";
import RotatingFoodImage from "./RotatingFoodImage";

// Foto makanan yang dipakai bergiliran di hero — sama dengan splash page.
const HERO_IMAGES = [
  { src: "/images/food-1.png", alt: "Gado-gado, sajian DASH khas Indonesia" },
  { src: "/images/food-2.png", alt: "Tumis kangkung rendah garam" },
  { src: "/images/food-3.png", alt: "Ayam kecap dengan porsi terukur" },
  { src: "/images/food-4.png", alt: "Hidangan sehat khas Indonesia" },
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
      {/* Ambient gradient orbs */}
      <div
        className="pointer-events-none absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-brand-primary/[0.07] blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-20 -right-40 h-[32rem] w-[32rem] rounded-full bg-brand-primary-light/[0.08] blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 md:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
        {/* Left: copy */}
        <div>
          <Reveal delay={80}>
            <h1 className="mt-6 text-[2.5rem] font-bold leading-[1.08] tracking-tight text-brand-charcoal sm:text-5xl lg:text-[3.5rem]">
              Kelola hipertensi lewat{" "}
              <span className="relative whitespace-nowrap">
                <span className="relative z-10 bg-gradient-to-r from-brand-primary to-brand-primary-light bg-clip-text text-transparent">
                  makanan sehari-hari
                </span>
                <svg
                  className="absolute -bottom-1.5 left-0 z-0 h-[0.5em] w-full text-brand-primary/25"
                  viewBox="0 0 100 12"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M1 8 Q 25 2, 50 6 T 99 5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-brand-charcoal-soft md:text-lg">
              TensiMenu menyusun rekomendasi menu DASH dari masakan lokal yang
              kamu kenal, lalu memantau tekanan darah dan asupan nutrisimu dalam
              satu tempat.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <Link
                href="/register"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-primary px-7 py-3.5 text-sm font-semibold text-white shadow-brand-cta transition-all duration-200 hover:bg-brand-primary-dark hover:shadow-brand-cta-hover active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream sm:w-auto md:text-base"
              >
                Mulai Sekarang
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <Link
                href="#dash-diet"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-brand-charcoal/10 bg-white/60 px-7 py-3.5 text-sm font-medium text-brand-charcoal backdrop-blur-md transition-all duration-200 hover:bg-white hover:border-brand-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream sm:w-auto md:text-base"
              >
                Pelajari DASH Diet
              </Link>
            </div>
          </Reveal>

          {/* Trust stats */}
          <Reveal delay={320}>
            <dl className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-brand-charcoal/[0.06] pt-6">
              {[
                { value: "800+", label: "Menu lokal terkurasi" },
                { value: "5 nutrisi", label: "Indikator DASH dipantau" },
                { value: "Real-time", label: "Tren tekanan darah" },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="text-xl font-bold tracking-tight text-brand-charcoal md:text-2xl">
                    {stat.value}
                  </dt>
                  <dd className="mt-0.5 text-xs text-brand-charcoal-muted">
                    {stat.label}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        {/* Right: product preview — gambar makanan berbentuk lingkaran */}
        <Reveal delay={200} from="right">
          <div className="relative mx-auto flex w-full max-w-md items-center justify-center lg:max-w-none">
            {/* Soft ambient glow di belakang */}
            <div
              className="pointer-events-none absolute inset-0 -z-10 mx-auto my-auto h-[85%] w-[85%] rounded-full bg-gradient-to-br from-brand-primary/15 to-brand-primary-light/10 blur-3xl"
              aria-hidden="true"
            />

            {/* Lingkaran gambar makanan */}
            <div className="relative aspect-square w-full max-w-[26rem]">
              {/* Circular rotating food image */}
              <div className="relative h-full w-full overflow-hidden rounded-full bg-white shadow-glass-lg ring-1 ring-brand-charcoal/5">
                <RotatingFoodImage
                  images={HERO_IMAGES}
                  priority
                  showDots={false}
                  sizes="(max-width: 1024px) 90vw, 40vw"
                />
              </div>

              {/* Floating DASH score card — bottom left */}
              <div className="absolute -bottom-2 -left-2 w-40 rounded-2xl bg-white/90 p-3.5 shadow-glass-md ring-1 ring-brand-charcoal/5 backdrop-blur-xl sm:-left-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-charcoal-muted">
                    DASH Score
                  </span>
                  <span className="text-sm font-bold tabular-nums text-brand-primary">
                    82
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-brand-charcoal/5">
                  <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-brand-primary to-brand-primary-light" />
                </div>
                <p className="mt-2 text-[10px] leading-tight text-brand-charcoal-soft">
                  Asupan hari ini{" "}
                  <span className="font-semibold text-brand-primary">
                    Sangat Baik
                  </span>
                </p>
              </div>

              {/* Floating BP card — top right */}
              <div className="absolute -right-1 top-4 w-36 rounded-2xl bg-white/90 p-3.5 shadow-glass-md ring-1 ring-brand-charcoal/5 backdrop-blur-xl sm:-right-3">
                <div className="flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-brand-primary" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-charcoal-muted">
                    Tekanan Darah
                  </span>
                </div>
                <p className="mt-1.5 text-lg font-bold tabular-nums leading-none text-brand-charcoal">
                  118<span className="text-brand-charcoal-muted">/</span>76
                </p>
                <p className="mt-1 text-[10px] text-brand-primary">Normal</p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
