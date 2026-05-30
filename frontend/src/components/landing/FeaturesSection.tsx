import { ChefHat, Gauge, LineChart } from "lucide-react";

const FEATURES = [
  {
    icon: ChefHat,
    title: "Rekomendasi Personal",
    description:
      "Menu harian yang disesuaikan dengan kebutuhan nutrisi dan selera lokal Anda. Tidak ada lagi kebingungan memilih makanan sehat.",
    visual: "tag" as const,
    visualLabel: "Real Log Terintegrasi",
  },
  {
    icon: Gauge,
    title: "DASH Score",
    description:
      "Pantau kualitas asupan Anda dengan skor kepatuhan diet yang mudah dimengerti. Visual jelas dari sangat baik hingga perlu perhatian.",
    visual: "progress" as const,
    progressValue: 78,
  },
  {
    icon: LineChart,
    title: "Tracker Progres",
    description:
      "Visualisasi tren tekanan darah dan riwayat mikronutrien real-time. Sajikan laporan kesehatan Anda dengan dokter secara langsung.",
    visual: "chart" as const,
  },
] as const;

export default function FeaturesSection() {
  return (
    <section id="features" className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-brand-charcoal md:text-4xl">
            Fitur Utama
          </h2>
          <div
            className="mx-auto mt-3 h-1 w-12 rounded-full bg-brand-primary"
            aria-hidden="true"
          />
        </div>

        {/* Cards grid */}
        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
          {FEATURES.map((feature, idx) => (
            <article
              key={feature.title}
              className="group flex flex-col rounded-3xl bg-white/80 backdrop-blur-md p-6 ring-1 ring-brand-charcoal/5 shadow-glass-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-glass-md motion-reduce:hover:translate-y-0"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              {/* Icon */}
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary transition-colors duration-200 group-hover:bg-brand-primary group-hover:text-white">
                <feature.icon className="h-5 w-5" strokeWidth={2.25} />
              </div>

              {/* Title + desc */}
              <h3 className="mt-5 text-lg font-semibold tracking-tight text-brand-charcoal">
                {feature.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-brand-charcoal-soft">
                {feature.description}
              </p>

              {/* Visual indicator at bottom */}
              <div className="mt-5">
                {feature.visual === "tag" && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-brand-primary/10 px-3 py-1.5 text-xs font-medium text-brand-primary ring-1 ring-brand-primary/15">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-primary" />
                    {feature.visualLabel}
                  </span>
                )}

                {feature.visual === "progress" && (
                  <div>
                    <div className="flex items-center justify-between text-xs text-brand-charcoal-muted">
                      <span>Skor</span>
                      <span className="font-semibold tabular-nums text-brand-primary">
                        {feature.progressValue}/100
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-brand-charcoal/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-primary-light transition-all duration-700 ease-out"
                        style={{ width: `${feature.progressValue}%` }}
                      />
                    </div>
                  </div>
                )}

                {feature.visual === "chart" && <MiniSparkline />}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function MiniSparkline() {
  // Trend grafik kecil — naik turun lembut, mengkomunikasikan progres
  const points = [4, 12, 8, 18, 14, 22, 16, 28];
  const max = Math.max(...points);
  const w = 120;
  const h = 32;
  const stepX = w / (points.length - 1);
  const path = points
    .map((p, i) => {
      const x = i * stepX;
      const y = h - (p / max) * h;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-8 w-full text-brand-primary"
      role="img"
      aria-label="Grafik tren progres"
    >
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
