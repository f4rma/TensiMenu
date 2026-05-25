"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

// ─── Konstanta ────────────────────────────────────────────────────────────────

const FOOD_IMAGES = [
  { src: "/images/food-1.png", alt: "Gado-gado" },
  { src: "/images/food-2.png", alt: "Ayam Kecap" },
  { src: "/images/food-3.png", alt: "Tumis Kangkung" },
  { src: "/images/food-4.png", alt: "Mie Goreng" },
] as const;

const FALLBACK_IMAGE = "/images/food-1.png";
const AUTO_SLIDE_MS = 3000;

// ─── Carousel Logic (Single Responsibility) ──────────────────────────────────

interface SlideStyle {
  translateX: string;
  translateY: string;
  scale: string;
  zIndex: number;
  opacity: string;
  hasTransition: boolean;
}

function getCircularOffset(itemIdx: number, activeIdx: number, total: number): number {
  let diff = itemIdx - activeIdx;
  if (diff > total / 2) diff -= total;
  if (diff < -total / 2) diff += total;
  return diff;
}

function getSlideStyle(offset: number): SlideStyle {
  switch (offset) {
    case 0:
      return { translateX: "0%", translateY: "0px", scale: "1.1", zIndex: 30, opacity: "1", hasTransition: true };
    case -1:
      return { translateX: "-120%", translateY: "30px", scale: "0.8", zIndex: 20, opacity: "1", hasTransition: true };
    case 1:
      return { translateX: "120%", translateY: "30px", scale: "0.8", zIndex: 20, opacity: "1", hasTransition: true };
    case -2:
      return { translateX: "-180%", translateY: "30px", scale: "0.6", zIndex: 10, opacity: "0", hasTransition: true };
    case 2:
      return { translateX: "180%", translateY: "30px", scale: "0.6", zIndex: 10, opacity: "0", hasTransition: true };
    default:
      return {
        translateX: offset < 0 ? "-220%" : "220%",
        translateY: "30px", scale: "0.5", zIndex: 0, opacity: "0", hasTransition: false,
      };
  }
}

// ─── Komponen Utama ───────────────────────────────────────────────────────────

export default function LandingHero() {
  const [activeIndex, setActiveIndex] = useState(0);
  const total = FOOD_IMAGES.length;

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev: number) => (prev + 1) % total);
    }, AUTO_SLIDE_MS);
    return () => clearInterval(interval);
  }, [total]);

  const goTo = useCallback((idx: number) => setActiveIndex(idx), []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image src="/images/bg-food.png" alt="" fill className="object-cover" priority aria-hidden="true" />
        <div className="absolute inset-0 bg-[#1a4d2e]/85" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col items-center px-4 pt-6 pb-10">
        {/* Navbar */}
        <nav className="mb-8 w-full max-w-3xl">
          <div className="h-12 rounded-full border border-white/15 bg-white/5 backdrop-blur-md" />
        </nav>

        {/* Title */}
        <h1 className="mb-3 text-center font-[family-name:var(--font-irish-grover)] text-6xl tracking-wider text-white drop-shadow-2xl md:text-8xl">
          TENSI MENU
        </h1>

        {/* Subtitle */}
        <p className="mb-10 text-center text-sm leading-relaxed text-white/90 md:text-base">
          Jaga Tekanan Darah Anda dengan<br />Pilihan Menu yang Tepat
        </p>

        {/* Carousel + Glass Card */}
        <div className="relative flex w-full flex-col items-center">
          {/* Carousel track */}
          <div className="relative h-[280px] w-full max-w-3xl md:h-[320px] lg:h-[360px]">
            {FOOD_IMAGES.map((food, idx) => {
              const offset = getCircularOffset(idx, activeIndex, total);
              const style = getSlideStyle(offset);

              return (
                <div
                  key={idx}
                  className={`absolute left-1/2 top-0 ${style.hasTransition ? "transition-all duration-700 ease-in-out" : ""}`}
                  style={{
                    transform: `translateX(-50%) translateX(${style.translateX}) translateY(${style.translateY}) scale(${style.scale})`,
                    zIndex: style.zIndex,
                    opacity: style.opacity,
                  }}
                >
                  <div className="relative h-56 w-56 md:h-64 md:w-64 lg:h-72 lg:w-72">
                    <Image
                      src={food.src}
                      alt={food.alt}
                      fill
                      className="object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.4)]"
                      sizes="(max-width: 768px) 224px, 288px"
                      onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Glass card */}
          <div className="-mt-32 flex flex-col items-center rounded-2xl border border-white/20 bg-white/10 px-8 pt-24 pb-6 shadow-2xl backdrop-blur-xl md:-mt-36 md:rounded-3xl md:px-12 md:pt-28 md:pb-8">
            <p className="mb-5 text-center text-base font-bold leading-tight text-white md:text-lg">
              Mulai Perjalanan Sehatmu<br />Bersama TensiMenu
            </p>
            <Link
              href="/register"
              className="group flex items-center gap-3 rounded-full bg-[#1f4d33] px-10 py-3.5 text-sm font-medium text-white shadow-lg transition-all hover:bg-[#19402b] active:scale-95 md:px-12 md:text-base"
            >
              <span>Join With Us!</span>
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* Dots */}
        <div className="mt-6 flex gap-2" role="tablist">
          {FOOD_IMAGES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              role="tab"
              aria-selected={idx === activeIndex}
              aria-label={`Slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === activeIndex ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
