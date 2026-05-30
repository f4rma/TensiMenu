import { Heart, Utensils } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
}

const SIZES = {
  sm: { circle: "h-8 w-8", icon: "h-4 w-4", text: "text-base" },
  md: { circle: "h-10 w-10", icon: "h-5 w-5", text: "text-lg" },
  lg: { circle: "h-12 w-12", icon: "h-6 w-6", text: "text-xl" },
} as const;

/**
 * Logo TensiMenu — piring + jantung dengan wordmark
 *
 * Inspired by brand logo: plate icon dengan heart inside, fork & spoon di samping
 * Untuk versi inline kita pakai Heart icon dalam bulatan hijau brand sebagai simplifikasi
 */
export default function Logo({
  size = "sm",
  showWordmark = true,
  className = "",
}: LogoProps) {
  const s = SIZES[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Mark */}
      <div className="relative flex items-center">
        {/* Fork */}
        <Utensils
          className={`${s.icon} text-brand-primary -mr-0.5 opacity-60`}
          strokeWidth={2}
          aria-hidden="true"
        />
        {/* Plate with heart */}
        <div
          className={`${s.circle} flex items-center justify-center rounded-full border-2 border-brand-primary bg-brand-cream-soft shadow-sm`}
        >
          <Heart
            className={`${s.icon} text-brand-primary fill-brand-primary/10`}
            strokeWidth={2.5}
          />
        </div>
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
