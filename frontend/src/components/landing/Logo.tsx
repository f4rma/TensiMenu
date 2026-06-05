import Image from "next/image";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
}

const SIZES = {
  sm: { size: 36, text: "text-base" },
  md: { size: 40, text: "text-lg" },
  lg: { size: 48, text: "text-xl" },
} as const;

/**
 * Logo TensiMenu — menggunakan logo official dari public/images/logo.png
 * yang merepresentasikan pemantauan tekanan darah dan makanan sehat.
 */
export default function Logo({
  size = "sm",
  showWordmark = true,
  className = "",
}: LogoProps) {
  const s = SIZES[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Image
        src="/images/logo.png"
        alt="TensiMenu Logo"
        width={s.size}
        height={s.size}
        className="h-auto w-auto"
        priority
      />

      {showWordmark && (
        <span
          className={`${s.text} font-semibold tracking-tight text-brand-charcoal`}
        >
          TensiMenu
        </span>
      )}
    </div>
  );
}
