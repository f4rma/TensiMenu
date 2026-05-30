import { ShieldCheck, RotateCcw } from "lucide-react";

/**
 * Side panel kiri pada halaman lupa kata sandi — reassurance & security.
 */
export default function ForgotPasswordSidePanel() {
  return (
    <div className="flex h-full flex-col gap-8">
      {/* Icon badge */}
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/15">
        <RotateCcw className="h-5 w-5" strokeWidth={2.25} />
      </span>

      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
          Kami Siap Membantu.
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-white/85 md:text-base">
          Keamanan akun Anda adalah prioritas kami. Ikuti langkah sederhana ini
          untuk kembali memantau kesehatan jantung dan diet DASH Anda.
        </p>
      </div>

      {/* Security card — glass */}
      <div className="mt-auto rounded-2xl bg-white/10 p-4 backdrop-blur-xl ring-1 ring-white/15">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
            <ShieldCheck className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold tracking-tight text-white">
              Keamanan Klinis
            </p>
            <p className="mt-1 text-xs leading-relaxed text-white/75">
              Data kesehatan Anda dilindungi dengan enkripsi standar medis
              tercanggih.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
