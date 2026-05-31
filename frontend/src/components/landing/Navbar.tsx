"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";

const NAV_LINKS = [
  { href: "#features", label: "Fitur" },
  { href: "#dash-diet", label: "DASH Diet" },
  { href: "#support", label: "Kontak" },
] as const;

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-brand-cream/70 backdrop-blur-xl border-b border-brand-charcoal/5"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
        {/* Logo */}
        <Link
          href="/"
          className="transition-opacity duration-150 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream rounded-lg"
          aria-label="TensiMenu beranda"
        >
          <Logo size="sm" />
        </Link>

        {/* Desktop nav links */}
        <ul className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="rounded-xl px-3 py-2 text-sm font-medium text-brand-charcoal-soft transition-colors duration-150 hover:bg-brand-primary/5 hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop CTA buttons */}
        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/login"
            className="rounded-2xl border border-brand-charcoal/10 bg-white/70 backdrop-blur-md px-5 py-2 text-sm font-medium text-brand-charcoal transition-all duration-200 hover:bg-white hover:border-brand-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="rounded-2xl bg-brand-primary px-5 py-2 text-sm font-semibold text-white shadow-brand-cta transition-all duration-200 hover:bg-brand-primary-dark hover:shadow-brand-cta-hover active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream"
          >
            Mulai Sekarang
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-brand-charcoal transition-colors duration-150 hover:bg-brand-primary/5 md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden animate-in fade-in slide-in-from-bottom-2 duration-200 border-t border-brand-charcoal/5 bg-brand-cream/95 backdrop-blur-xl">
          <ul className="flex flex-col gap-1 px-4 py-3">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-xl px-3 py-2.5 text-sm font-medium text-brand-charcoal transition-colors duration-150 hover:bg-brand-primary/5 hover:text-brand-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="mt-2 flex flex-col gap-2 border-t border-brand-charcoal/5 pt-3">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="rounded-2xl border border-brand-charcoal/10 bg-white/70 px-4 py-2.5 text-center text-sm font-medium text-brand-charcoal transition-colors duration-150 hover:bg-white"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="rounded-2xl bg-brand-primary px-4 py-2.5 text-center text-sm font-semibold text-white shadow-brand-cta transition-colors duration-150 hover:bg-brand-primary-dark"
              >
                Mulai Sekarang
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
