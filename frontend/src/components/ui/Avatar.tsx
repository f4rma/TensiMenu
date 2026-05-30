"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface AvatarProps {
  /** Nama lengkap user, dipakai untuk inisial atau seed avatar */
  name: string;
  /** Style avatar — initials (default), atau preset character dari Dicebear */
  variant?: "initials" | "character";
  /** Ukuran avatar */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Override className untuk styling custom */
  className?: string;
  /** Pilihan style character (hanya untuk variant="character") */
  characterStyle?: "avataaars" | "lorelei" | "notionists" | "bottts";
}

const SIZE_CLASS = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-2xl",
} as const;

const COLORS = [
  "bg-emerald-700",
  "bg-emerald-600",
  "bg-teal-700",
  "bg-cyan-700",
  "bg-amber-700",
  "bg-orange-700",
  "bg-rose-700",
  "bg-purple-700",
];

/**
 * Avatar component dengan dua mode:
 * 1. "initials" — inisial dari nama, background brand-primary (default)
 * 2. "character" — generated avatar via Dicebear API (free, deterministic)
 *
 * Best practice: pakai "initials" sebagai default karena lebih ringan dan
 * konsisten dengan brand. "character" untuk Profile page agar user bisa
 * pilih dari beberapa preset.
 */
export default function Avatar({
  name,
  variant = "initials",
  size = "md",
  className,
  characterStyle = "lorelei",
}: AvatarProps) {
  const initials = useMemo(() => getInitials(name), [name]);
  const bgColor = useMemo(() => colorFromName(name), [name]);

  if (variant === "character") {
    // Dicebear free API — deterministic berdasarkan seed (nama user)
    const seed = encodeURIComponent(name);
    const url = `https://api.dicebear.com/9.x/${characterStyle}/svg?seed=${seed}&backgroundColor=ffd5dc,ffdfbf,c0aede,d1d4f9,b6e3f4,c5e8d6&size=128`;

    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ring-white shadow-sm",
          SIZE_CLASS[size],
          className
        )}
        aria-label={`Avatar ${name}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" className="h-full w-full object-cover" />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-white shadow-sm",
        bgColor,
        SIZE_CLASS[size],
        className
      )}
      aria-label={`Avatar ${name}`}
    >
      {initials}
    </span>
  );
}

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Generate background color dari hash nama — deterministic.
 * Pakai brand palette agar konsisten dengan design system.
 */
function colorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % COLORS.length;
  return COLORS[idx];
}
