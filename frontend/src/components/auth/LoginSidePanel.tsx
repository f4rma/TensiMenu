import { Droplets, Activity } from "lucide-react";

/**
 * Side panel kiri pada halaman login — wordmark + preview kemampuan aplikasi.
 *
 * Catatan: tidak memakai klaim jumlah pengguna atau testimonial fiktif.
 * Kartu menampilkan contoh data yang merepresentasikan fitur nyata aplikasi.
 */
export default function LoginSidePanel() {
  return (
    <div className="flex h-full flex-col justify-between gap-10">
      <div>
        <span className="text-sm font-semibold tracking-tight text-white">
          TensiMenu
        </span>

        <h2 className="mt-12 text-3xl font-bold leading-tight tracking-tight text-white md:text-4xl">
          Nutrisi cerdas untuk
          <br />
          jantung yang lebih kuat.
        </h2>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-white/85 md:text-base">
          Lanjutkan memantau tekanan darah dan asupan nutrisimu, serta dapatkan
          rekomendasi menu DASH dari masakan lokal yang kamu sukai.
        </p>
      </div>

      {/* Glass preview card — contoh ringkasan harian (representasi fitur) */}
      <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-xl ring-1 ring-white/15">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
          Contoh ringkasan harian
        </p>

        <div className="mt-3 flex flex-col gap-3.5">
          {/* Natrium — dibatasi */}
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
              <Droplets className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/80">Natrium</span>
                <span className="font-semibold tabular-nums text-white">
                  1.180 / 1.500 mg
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                <div className="h-full w-[79%] rounded-full bg-white/85" />
              </div>
            </div>
          </div>

          {/* DASH Score */}
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
              <Activity className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/80">DASH Score</span>
                <span className="font-semibold tabular-nums text-white">
                  82 / 100
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                <div className="h-full w-[82%] rounded-full bg-white/85" />
              </div>
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-white/70">
          Asupan natrium masih dalam batas aman dan kualitas dietmu tergolong
          sangat baik.
        </p>
      </div>
    </div>
  );
}
