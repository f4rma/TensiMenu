"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  /** Delay animasi dalam ms (untuk staggered reveal) */
  delay?: number;
  /** Arah masuk: dari bawah (default), kiri, atau kanan */
  from?: "bottom" | "left" | "right";
  /** Override className container */
  className?: string;
  /** Render sebagai elemen lain (default div) */
  as?: "div" | "section" | "li" | "article";
}

/**
 * Scroll-reveal wrapper ringan berbasis IntersectionObserver.
 *
 * Prinsip:
 * - Hanya animate `transform` + `opacity` (GPU-friendly, tidak reflow).
 * - Trigger sekali saat elemen masuk viewport, lalu unobserve.
 * - Menghormati prefers-reduced-motion: langsung tampil tanpa animasi.
 *
 * Dipakai untuk memberi kesan halus & profesional pada landing page
 * tanpa library animasi berat.
 */
export default function Reveal({
  children,
  delay = 0,
  from = "bottom",
  className = "",
  as = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  // Cast ke tipe komponen generik agar dynamic tag + ref kompatibel
  // tanpa @ts-expect-error.
  const Tag = as as React.ElementType;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Hormati preferensi reduced motion — langsung tampil.
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const hiddenTransform =
    from === "left"
      ? "translateX(-24px)"
      : from === "right"
        ? "translateX(24px)"
        : "translateY(24px)";

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : hiddenTransform,
        transition:
          "opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1), transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
        transitionDelay: `${delay}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </Tag>
  );
}
