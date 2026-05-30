"use client";

import { useState } from "react";
import Image from "next/image";

interface FoodImageProps {
  /** URL gambar dari backend (boleh null) */
  imageUrl?: string | null;
  /** Nama makanan untuk alt + initials fallback */
  name: string;
  /** Kategori untuk pilih warna gradient + emoji fallback */
  category?: string | null;
  /** Sizes untuk Next.js Image optimization */
  sizes?: string;
  /** Tampilan: aspect-[4/3] default, atau custom className */
  className?: string;
  /** Ukuran visual fallback. "sm" cocok untuk thumbnail <=64px, "md" default. */
  variant?: "sm" | "md";
}

/**
 * Komponen image makanan dengan smart fallback chain:
 *
 * 1. Kalau ada `imageUrl` → load Next.js Image (optimized, lazy by default)
 * 2. Kalau image gagal load → fallback ke generated visual
 * 3. Kalau tidak ada `imageUrl` → langsung generated visual
 *
 * Generated visual = gradient color + emoji kategori + inisial nama.
 *
 * Ringan karena:
 * - Next.js Image lazy load + auto WebP/AVIF
 * - Generated visual pure CSS (0 KB asset)
 * - Tidak ada library tambahan
 */
export default function FoodImage({
  imageUrl,
  name,
  category,
  sizes = "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw",
  className = "",
  variant = "md",
}: FoodImageProps) {
  const [loadFailed, setLoadFailed] = useState(false);
  const showRealImage = imageUrl && !loadFailed;

  if (showRealImage) {
    return (
      <div className={`relative h-full w-full ${className}`}>
        <Image
          src={imageUrl}
          alt={name}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          onError={() => setLoadFailed(true)}
        />
      </div>
    );
  }

  return (
    <GeneratedVisual
      name={name}
      category={category}
      className={className}
      variant={variant}
    />
  );
}

/**
 * Generated visual: gradient + emoji + initials.
 * Konsisten brand, tidak butuh asset.
 */
function GeneratedVisual({
  name,
  category,
  className = "",
  variant = "md",
}: {
  name: string;
  category?: string | null;
  className?: string;
  variant?: "sm" | "md";
}) {
  const meta = getCategoryMeta(category);
  const initials = getInitials(name);
  const isSmall = variant === "sm";

  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br ${meta.gradient} ${className}`}
    >
      {/* Subtle texture pattern via blur orbs — disembunyikan di varian kecil */}
      {!isSmall && (
        <>
          <div
            className="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/15 blur-2xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-white/10 blur-3xl"
            aria-hidden="true"
          />
        </>
      )}

      {/* Center content */}
      {isSmall ? (
        <span className="relative z-10 text-xl drop-shadow-md" aria-hidden="true">
          {meta.emoji}
        </span>
      ) : (
        <div className="relative z-10 flex flex-col items-center">
          <span className="text-5xl drop-shadow-lg" aria-hidden="true">
            {meta.emoji}
          </span>
          <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/85">
            {initials}
          </span>
        </div>
      )}
    </div>
  );
}

interface CategoryMeta {
  gradient: string;
  emoji: string;
}

/**
 * Mapping kategori TKPI → warna gradient + emoji.
 * Konsisten dengan brand: hijau emerald base, variasi via secondary colors.
 */
function getCategoryMeta(category?: string | null): CategoryMeta {
  if (!category) return DEFAULT_META;

  const c = category.toLowerCase();

  if (c.includes("sayuran")) {
    return { gradient: "from-emerald-600 to-emerald-800", emoji: "🥬" };
  }
  if (c.includes("buah")) {
    return { gradient: "from-rose-500 to-pink-700", emoji: "🍎" };
  }
  if (c.includes("daging") || c.includes("unggas")) {
    return { gradient: "from-amber-700 to-orange-800", emoji: "🍗" };
  }
  if (c.includes("ikan") || c.includes("kerang") || c.includes("udang")) {
    return { gradient: "from-sky-600 to-blue-800", emoji: "🐟" };
  }
  if (c.includes("kacang") || c.includes("biji")) {
    return { gradient: "from-amber-600 to-yellow-800", emoji: "🥜" };
  }
  if (c.includes("serealia")) {
    return { gradient: "from-yellow-600 to-amber-800", emoji: "🌾" };
  }
  if (c.includes("umbi")) {
    return { gradient: "from-orange-700 to-red-800", emoji: "🥔" };
  }
  if (c.includes("susu")) {
    return { gradient: "from-slate-400 to-slate-600", emoji: "🥛" };
  }
  if (c.includes("telur")) {
    return { gradient: "from-yellow-500 to-amber-600", emoji: "🥚" };
  }

  return DEFAULT_META;
}

const DEFAULT_META: CategoryMeta = {
  gradient: "from-brand-primary to-brand-primary-dark",
  emoji: "🍽️",
};

function getInitials(name: string): string {
  if (!name) return "—";

  // Hilangkan koma + apa yang setelahnya untuk inisial yang clean
  const cleaned = name.split(",")[0].trim();
  const words = cleaned.split(/\s+/).filter(Boolean);

  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
