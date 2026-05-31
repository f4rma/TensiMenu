import { UtensilsCrossed, Gauge, LineChart } from "lucide-react";
import Reveal from "./Reveal";

const FEATURES = [
  {
    icon: UtensilsCrossed,
    title: "Rekomendasi Personal",
    description:
      "Menu harian dari masakan lokal yang disesuaikan dengan kebutuhan nutrisi, kondisi medis, dan pantangan makananmu.",
    visual: "tags" as const,
  },
  {
    icon: Gauge,
    title: "DASH Score",
    description:
      "Skor kepatuhan diet 0–100 yang mudah dibaca, dihitung dari natrium, kalium, kalsium, serat, dan lemak.",
    visual: "progress" as const,
    progressValue: 78,
  },
  {
    icon: LineChart,
    title: "Tracker Progres",
    description:
      "Visualisasi tren tekanan darah dan asupan nutrisi dari waktu ke waktu untuk evaluasi yang objektif.",
    visual: "chart" as const,
  },
] as const;

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {/* Header — left aligned, no cliché underline bar */}
        <div className="max-w-2xl">
          <Reveal>
            <span className="text-sm font-semibold uppercase tracking-widest text-brand-primary">
              Fitur
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-brand-charcoal md:text-4xl">
              Semua yang kamu butuhkan untuk menjaga tekanan darah
            </h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-4 text-base leading-relaxed text-brand-charcoal-soft">
              Tiga pilar TensiMenu bekerja bersama: merekomendasikan, menilai,
              lalu memantau dalam satu alur yang sederhana.
            </p>
          </Reveal>
        </div>

        {/* Cards grid */}
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {FEATURES.map((feature, idx) => (
            <Reveal key={feature.title} delay={idx * 120} as="article">
              <article className="group flex h-full flex-col rounded-3xl border border-brand-charcoal/[0.06] bg-white p-7 shadow-[0_2px_16px_rgba(43,124,97,0.05)] transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-primary/15 hover:shadow-[0_12px_40px_rgba(43,124,97,0.12)] motion-reduce:hover:translate-y-0">
                {/* Icon */}
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-brand-primary group-hover:text-white">
                  <feature.icon className="h-5 w-5" strokeWidth={2.25} />
                </div>

                <h3 className="mt-6 text-lg font-semibold tracking-tight text-brand-charcoal">
                  {feature.title}
                </h3>
                <p className="mt-2.5 flex-1 text-sm leading-relaxed text-brand-charcoal-soft">
                  {feature.description}
                </p>

                {/* Visual indicator */}
                <div className="mt-6 border-t border-brand-charcoal/[0.06] pt-5">
                  {feature.visual === "tags" && (
                    <div className="flex flex-wrap gap-1.5">
                      {["Rendah Garam", "Sesuai Selera", "DASH-friendly"].map(
                        (t) => (
                          <span
                            key={t}
                            className="inline-flex items-center rounded-lg bg-brand-primary/[0.07] px-2.5 py-1 text-[11px] font-medium text-brand-primary"
                          >
                            {t}
                          </span>
                        )
                      )}
                    </div>
                  )}

                  {feature.visual === "progress" && (
                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-brand-charcoal-muted">
                          Skor harian
                        </span>
                        <span className="font-bold tabular-nums text-brand-primary">
                          {feature.progressValue}
                          <span className="text-brand-charcoal-muted">
                            /100
                          </span>
                        </span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-brand-charcoal/[0.06]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-primary-light transition-all duration-700 ease-out group-hover:opacity-90"
                          style={{ width: `${feature.progressValue}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {feature.visual === "chart" && <MiniSparkline />}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function MiniSparkline() {
  const points = [10, 14, 9, 17, 13, 20, 15, 24];
  const max = Math.max(...points);
  const min = Math.min(...points);
  const w = 140;
  const h = 36;
  const stepX = w / (points.length - 1);
  const toY = (p: number) => h - ((p - min) / (max - min || 1)) * (h - 6) - 3;

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${(i * stepX).toFixed(1)} ${toY(p).toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L ${w} ${h} L 0 ${h} Z`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-9 w-full"
      role="img"
      aria-label="Grafik tren progres"
    >
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2B7C61" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#2B7C61" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sparkFill)" />
      <path
        d={linePath}
        fill="none"
        stroke="#2B7C61"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={(points.length - 1) * stepX}
        cy={toY(points[points.length - 1])}
        r="2.5"
        fill="#2B7C61"
      />
    </svg>
  );
}
