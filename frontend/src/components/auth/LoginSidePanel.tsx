import { Heart } from "lucide-react";

/**
 * Side panel kiri pada halaman login — wordmark + visual nutrient progress.
 */
export default function LoginSidePanel() {
  return (
    <div className="flex h-full flex-col justify-between gap-10">
      <div>
        <span className="text-sm font-semibold tracking-tight text-white">
          TensiMenu
        </span>

        <h2 className="mt-12 text-3xl font-bold leading-tight tracking-tight text-white md:text-4xl">
          Nutrisi Cerdas untuk
          <br />
          Jantung yang Lebih Kuat.
        </h2>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-white/85 md:text-base">
          Bergabunglah dengan ribuan pengguna yang telah berhasil mengelola
          tekanan darah mereka melalui pendekatan diet DASH yang dipersonalisasi.
        </p>
      </div>

      {/* Glass nutrient card */}
      <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-xl ring-1 ring-white/15">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-300/90 text-amber-900">
            <Heart className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <div className="flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
              Target Hari Ini
            </p>
            <p className="mt-0.5 text-lg font-bold tabular-nums text-white">
              1.500mg Natrium
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-400 transition-all duration-700 ease-out"
              style={{ width: "75%" }}
            />
          </div>
        </div>

        <p className="mt-3 text-xs italic text-white/75">
          &ldquo;Anda berada di jalur yang benar! 75% target tercapai.&rdquo;
        </p>
      </div>
    </div>
  );
}
