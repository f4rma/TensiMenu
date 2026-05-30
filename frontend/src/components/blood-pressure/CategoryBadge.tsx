import { cn } from "@/lib/utils";
import { CATEGORY_STYLES, type BPCategory } from "./types";

interface CategoryBadgeProps {
  category: BPCategory;
  size?: "sm" | "md";
}

/**
 * Badge berwarna untuk klasifikasi tekanan darah.
 * Konsisten dipakai di tabel riwayat, dashboard card, modal warning.
 */
export default function CategoryBadge({
  category,
  size = "sm",
}: CategoryBadgeProps) {
  const style = CATEGORY_STYLES[category];

  const sizeClass =
    size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-semibold uppercase tracking-wider",
        sizeClass,
        style.chipBg,
        style.chipText
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", style.dotBg)} />
      {style.label}
    </span>
  );
}
