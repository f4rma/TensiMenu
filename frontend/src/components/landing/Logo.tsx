import { Activity } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
}

const SIZES = {
  sm: { circle: "h-9 w-9", icon: "h-[18px] w-[18px]", text: "text-base" },
  md: { circle: "h-10 w-10", icon: "h-5 w-5", text: "text-lg" },
  lg: { circle: "h-12 w-12", icon: "h-6 w-6", text: "text-xl" },
} as const;

/**
 * Logo TensiMenu — mark bulat dengan ikon pulse (Activity) yang merepresentasikan
 * pemantauan tekanan darah. Bersih dan modern, konsisten dengan brand emerald.
 */
export default function Logo({
  size = "sm",
  showWordmark = true,
  className = "",
}: LogoProps) {
  const s = SIZES[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className={`${s.circle} flex items-center justify-center rounded-full bg-brand-primary text-white shadow-[0_2px_8px_rgba(43,124,97,0.25)]`}
      >
        <Activity className={s.icon} strokeWidth={2.5} />
      </div>

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
