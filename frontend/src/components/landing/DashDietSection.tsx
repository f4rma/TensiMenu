import Image from "next/image";
import { Globe2, Database } from "lucide-react";

const POINTS = [
  {
    icon: Globe2,
    title: "Adaptasi Lokal",
    description:
      "Kami mengadaptasi prinsip DASH global ke dalam menu makanan sehat khas masyarakat Indonesia, dari Gado-Gado hingga Papeda Ikan.",
  },
  {
    icon: Database,
    title: "Berbasis Data",
    description:
      "Setiap rekomendasi dihitung berdasarkan kebutuhan natrium, kalium, dan magnesium harian Anda untuk hasil yang optimal.",
  },
] as const;

export default function DashDietSection() {
  return (
    <section
      id="dash-diet"
      className="relative bg-brand-cream-soft py-16 md:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full bg-brand-primary/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-primary ring-1 ring-brand-primary/15">
            Metodologi Klinis
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-brand-charcoal md:text-4xl">
            Apa itu DASH Diet?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-brand-charcoal-soft">
            <span className="font-medium text-brand-charcoal">
              Dietary Approaches to Stop Hypertension
            </span>{" "}
            (DASH) adalah pola makan berbasis sains yang terbukti menurunkan
            tekanan darah tanpa obat-obatan berat.
          </p>
        </div>

        {/* Image + points */}
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10 md:items-center">
          {/* Image card */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-glass-md ring-1 ring-brand-charcoal/5">
            <Image
              src="/images/food-2.png"
              alt="Sayuran hijau segar dengan alat ukur tekanan darah"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          {/* Points list */}
          <ul className="flex flex-col gap-4">
            {POINTS.map((point, idx) => (
              <li
                key={point.title}
                className="group flex gap-4 rounded-3xl bg-white/70 backdrop-blur-md p-5 ring-1 ring-brand-charcoal/5 shadow-glass-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-glass-md motion-reduce:hover:translate-y-0"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-brand-cta transition-transform duration-200 group-hover:scale-105">
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
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
