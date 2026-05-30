import { CheckCircle2, LineChart, UtensilsCrossed } from "lucide-react";

const FEATURES = [
  {
    icon: CheckCircle2,
    label: "Rekomendasi Makanan Rendah Natrium",
  },
  {
    icon: LineChart,
    label: "Pantau Tekanan Darah Real-time",
  },
  {
    icon: UtensilsCrossed,
    label: "Resep DASH-Compliant Terverifikasi",
  },
] as const;

/**
 * Side panel kiri pada halaman register — value proposition + testimonial.
 */
export default function RegisterSidePanel() {
  return (
    <div className="flex h-full flex-col justify-between gap-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
          Mulai Perjalanan DASH Anda
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-white/85 md:text-base">
          Bergabunglah dengan ribuan pengguna yang mengelola hipertensi melalui
          nutrisi yang terukur dan lezat.
        </p>

        <ul className="mt-8 flex flex-col gap-3.5">
          {FEATURES.map((feature) => (
            <li key={feature.label} className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/15">
                <feature.icon className="h-4 w-4" strokeWidth={2.25} />
              </span>
              <span className="text-sm text-white/90">{feature.label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Testimonial card — glass */}
      <figure className="rounded-2xl bg-white/10 p-4 backdrop-blur-xl ring-1 ring-white/15">
        <blockquote className="text-xs leading-relaxed text-white/85 md:text-sm">
          &ldquo;TensiMenu membantu saya menjaga tekanan darah tetap stabil
          tanpa harus kehilangan rasa nikmat pada makanan.&rdquo;
        </blockquote>
        <figcaption className="mt-3 flex items-center gap-2.5">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-amber-900"
            aria-hidden="true"
          >
            BP
          </span>
          <span className="text-xs font-medium text-white/90">
            Budi Pratama, Pengguna Aktif
          </span>
        </figcaption>
      </figure>
    </div>
  );
}
