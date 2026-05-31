import { CheckCircle2, LineChart, UtensilsCrossed, ShieldCheck } from "lucide-react";

const FEATURES = [
  {
    icon: UtensilsCrossed,
    label: "Rekomendasi menu DASH dari masakan lokal",
  },
  {
    icon: LineChart,
    label: "Pantau tren tekanan darah dari waktu ke waktu",
  },
  {
    icon: CheckCircle2,
    label: "Skor kepatuhan diet yang mudah dipahami",
  },
  {
    icon: ShieldCheck,
    label: "Target nutrisi menyesuaikan kondisi medismu",
  },
] as const;

/**
 * Side panel kiri pada halaman register — value proposition fitur nyata.
 *
 * Catatan: tidak memakai klaim jumlah pengguna atau testimonial fiktif.
 */
export default function RegisterSidePanel() {
  return (
    <div className="flex h-full flex-col justify-between gap-10">
      <div>
        <span className="text-sm font-semibold tracking-tight text-white">
          TensiMenu
        </span>

        <h2 className="mt-12 text-3xl font-bold tracking-tight text-white md:text-4xl">
          Mulai perjalanan
          <br />
          DASH-mu hari ini.
        </h2>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-white/85 md:text-base">
          Buat profil kesehatanmu, dan TensiMenu langsung menyusun rekomendasi
          makanan yang dipersonalisasi untuk membantu menjaga tekanan darah.
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

      {/* Info card — berbasis riset, bukan testimonial fiktif */}
      <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-xl ring-1 ring-white/15">
        <p className="text-sm leading-relaxed text-white/90">
          DASH Diet adalah salah satu pola makan yang paling direkomendasikan
          ahli untuk membantu mengelola tekanan darah.
        </p>
        <p className="mt-3 text-xs text-white/60">
          Berdasarkan riset DASH Diet & data Tabel Komposisi Pangan Indonesia
        </p>
      </div>
    </div>
  );
}
