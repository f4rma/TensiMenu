import { Globe2, Database, HeartPulse, Droplets, Flame, Salad, Ban, CheckCircle2 } from "lucide-react";
import Reveal from "./Reveal";

const POINTS = [
  {
    icon: Globe2,
    title: "Adaptasi Lokal",
    description:
      "Prinsip DASH global diterjemahkan ke menu khas Indonesia, dari Gado-Gado, Pepes Ikan, hingga Tumis Kangkung.",
  },
  {
    icon: Database,
    title: "Berbasis Data",
    description:
      "Setiap rekomendasi dihitung dari kebutuhan natrium, kalium, kalsium, serat, dan lemak harianmu.",
  },
  {
    icon: HeartPulse,
    title: "Menyesuaikan Kondisi",
    description:
      "Target nutrisi otomatis mengetat saat tekanan darahmu tinggi, dan aman untuk komorbid seperti CKD.",
  },
] as const;

// Prinsip utama DASH yang langsung bisa diterapkan sehari-hari.
const DASH_PRINCIPLES = [
  {
    icon: Droplets,
    title: "Batasi asupan garam",
    detail: "Jaga natrium 1.500 sampai 2.300 mg per hari",
    tone: "rose" as const,
  },
  {
    icon: Flame,
    title: "Kendalikan kalori",
    detail: "Sesuaikan energi dengan kebutuhan tubuhmu",
    tone: "amber" as const,
  },
  {
    icon: Salad,
    title: "Perbanyak sayur & buah",
    detail: "Sumber kalium, serat, dan mineral penjaga tekanan darah",
    tone: "emerald" as const,
  },
  {
    icon: Ban,
    title: "Kurangi lemak jenuh",
    detail: "Pilih protein tanpa lemak dan susu rendah lemak",
    tone: "sky" as const,
  },
] as const;

const TONE_CLASS: Record<string, string> = {
  rose: "bg-rose-500/10 text-rose-500",
  amber: "bg-amber-500/10 text-amber-600",
  emerald: "bg-brand-primary/10 text-brand-primary",
  sky: "bg-sky-500/10 text-sky-500",
};

export default function DashDietSection() {
  return (
    <section id="dash-diet" className="relative bg-brand-cream-soft py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:items-center">
          {/* Left: DASH principles explainer card */}
          <Reveal from="left">
            <div className="relative">
              {/* Accent block behind */}
              <div
                className="absolute -left-4 -top-4 h-full w-full rounded-[2.25rem] bg-brand-primary/10"
                aria-hidden="true"
              />

              {/* Main explainer card */}
              <div className="relative overflow-hidden rounded-[2.25rem] bg-white p-7 shadow-glass-lg ring-1 ring-brand-charcoal/5 md:p-9">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold tracking-tight text-brand-charcoal">
                      Prinsip Pola Makan DASH
                    </h3>
                    <p className="mt-0.5 text-xs text-brand-charcoal-muted">
                      Kebiasaan sederhana untuk menurunkan tekanan darah
                    </p>
                  </div>
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
                    <HeartPulse className="h-5 w-5" strokeWidth={2.25} />
                  </span>
                </div>

                {/* Principles list */}
                <ul className="mt-7 flex flex-col gap-3">
                  {DASH_PRINCIPLES.map((item) => (
                    <li
                      key={item.title}
                      className="flex items-center gap-3.5 rounded-2xl bg-brand-cream-soft px-4 py-3.5 ring-1 ring-brand-charcoal/[0.05]"
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${TONE_CLASS[item.tone]}`}
                      >
                        <item.icon className="h-[18px] w-[18px]" strokeWidth={2} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-brand-charcoal">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-brand-charcoal-soft">
                          {item.detail}
                        </p>
                      </div>
                      <CheckCircle2
                        className="h-5 w-5 shrink-0 text-brand-primary/70"
                        strokeWidth={2}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>

          {/* Right: copy + points */}
          <div>
            <Reveal>
              <span className="text-sm font-semibold uppercase tracking-widest text-brand-primary">
                Metodologi Klinis
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-brand-charcoal md:text-4xl">
                Apa itu DASH Diet?
              </h2>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-4 text-base leading-relaxed text-brand-charcoal-soft">
                <span className="font-medium text-brand-charcoal">
                  Dietary Approaches to Stop Hypertension
                </span>{" "}
                adalah pola makan berbasis sains yang terbukti menurunkan
                tekanan darah, dengan memperbanyak sayur, buah, dan biji-bijian
                serta membatasi garam.
              </p>
            </Reveal>

            <ul className="mt-8 flex flex-col gap-3">
              {POINTS.map((point, idx) => (
                <Reveal key={point.title} delay={240 + idx * 100} as="li">
                  <li className="group flex gap-4 rounded-2xl bg-white/70 p-5 ring-1 ring-brand-charcoal/[0.06] backdrop-blur-md transition-all duration-300 hover:bg-white hover:shadow-glass-sm">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-primary text-white shadow-brand-cta transition-transform duration-300 group-hover:scale-110">
                      <point.icon className="h-5 w-5" strokeWidth={2.25} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold tracking-tight text-brand-charcoal">
                        {point.title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-brand-charcoal-soft">
                        {point.description}
                      </p>
                    </div>
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
