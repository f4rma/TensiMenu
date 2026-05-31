import type { ReactNode } from "react";
import Link from "next/link";
import Logo from "@/components/landing/Logo";

interface AuthLayoutProps {
  /** Konten panel kiri (dark teal side) */
  sidePanel: ReactNode;
  /** Konten kanan — biasanya form */
  children: ReactNode;
}

/**
 * Layout split-screen untuk Login/Register/Forgot Password.
 * - Mobile: stacked (side panel di atas, form di bawah)
 * - Desktop: side panel kiri 50%, form kanan 50%
 *
 * Diapit oleh navbar minimal di atas dan footer compact di bawah.
 */
export default function AuthLayout({ sidePanel, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-brand-cream">
      {/* Top bar minimal — hanya logo + link kembali */}
      <header className="border-b border-brand-charcoal/5 bg-white/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <Link
            href="/"
            className="rounded-lg transition-opacity duration-150 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
            aria-label="Kembali ke beranda"
          >
            <Logo size="sm" />
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-brand-charcoal-soft transition-colors duration-150 hover:text-brand-primary"
          >
            ← Beranda
          </Link>
        </div>
      </header>

      {/* Main: split layout */}
      <main className="flex flex-1 items-center justify-center px-4 py-8 md:px-6 md:py-12">
        <div className="w-full max-w-5xl">
          <div className="grid grid-cols-1 overflow-hidden rounded-3xl bg-white shadow-glass-lg ring-1 ring-brand-charcoal/5 md:grid-cols-2">
            {/* Side panel — dark teal */}
            <aside className="relative hidden flex-col justify-between bg-gradient-to-br from-brand-primary via-brand-primary to-brand-primary-dark p-8 md:flex md:p-10">
              {/* Decorative glow */}
              <div
                className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-brand-primary-light/30 blur-3xl"
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute -top-20 -right-10 h-48 w-48 rounded-full bg-white/5 blur-3xl"
                aria-hidden="true"
              />
              <div className="relative">{sidePanel}</div>
            </aside>

            {/* Form panel */}
            <section className="flex flex-col justify-center p-6 sm:p-8 md:p-10 lg:p-12">
              {children}
            </section>
          </div>
        </div>
      </main>

      {/* Compact footer */}
      <footer className="border-t border-brand-charcoal/5 bg-white/40 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 md:flex-row md:px-6">
          <p className="text-xs text-brand-charcoal-muted">
            © 2026 TensiMenu Health. Committed to clinical empathy.
          </p>
          <ul className="flex gap-4 text-xs text-brand-charcoal-muted">
            <li>
              <Link
                href="/privacy"
                className="transition-colors duration-150 hover:text-brand-primary"
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                href="/terms"
                className="transition-colors duration-150 hover:text-brand-primary"
              >
                Terms of Service
              </Link>
            </li>
            <li>
              <a
                href="mailto:hello@tensimenu.id"
                className="transition-colors duration-150 hover:text-brand-primary"
              >
                Contact
              </a>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  );
}
