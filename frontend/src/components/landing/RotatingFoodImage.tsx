"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface RotatingFoodImageProps {
  images: { src: string; alt: string }[];
  /** Interval ganti gambar (ms) */
  intervalMs?: number;
  /** Sizes untuk Next.js Image */
  sizes?: string;
  /** Prioritas load gambar pertama */
  priority?: boolean;
  /** Tampilkan dot indicator (default true) */
  showDots?: boolean;
}

/**
 * Gambar makanan yang berganti otomatis dengan crossfade halus.
 *
 * Dipakai di hero landing — meniru carousel di splash page, tapi lebih
 * tenang (crossfade, bukan slide). Semua gambar di-render bertumpuk;
 * hanya opacity yang dianimasikan (GPU-friendly).
 *
 * Menghormati prefers-reduced-motion: kalau aktif, tidak auto-rotate.
 */
export default function RotatingFoodImage({
  images,
  intervalMs = 3500,
  sizes = "(max-width: 1024px) 100vw, 45vw",
  priority = false,
  showDots = true,
}: RotatingFoodImageProps) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % images.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [images.length, intervalMs]);

  return (
    <>
      {images.map((img, i) => (
        <Image
          key={img.src}
          src={img.src}
          alt={img.alt}
          fill
          priority={priority && i === 0}
          sizes={sizes}
          className="object-cover transition-opacity duration-1000 ease-in-out motion-reduce:transition-none"
          style={{ opacity: i === active ? 1 : 0 }}
        />
      ))}

      {/* Dot indicators */}
      {showDots && images.length > 1 && (
        <div
          className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5"
          aria-hidden="true"
        >
          {images.map((img, i) => (
            <span
              key={img.src}
              className={`h-1.5 rounded-full bg-white transition-all duration-300 ${
                i === active ? "w-5 opacity-90" : "w-1.5 opacity-50"
              }`}
            />
          ))}
        </div>
      )}
    </>
  );
}
