import type { ReactNode } from "react";
import Link from "next/link";
import Logo from "@/components/landing/Logo";

interface CenteredAuthLayoutProps {
  children: ReactNode;
}

/**
 * Layout single-card centered untuk halaman seperti Reset Password
 * (ketika user datang dari email link, tidak butuh side panel marketing).
 */
export default function CenteredAuthLayout({
  children,
}: CenteredAuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-brand-cream">
      {/* Top bar */}
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
            href="/login"
            className="rounded-2xl bg-brand-primary px-4 py-1.5 text-sm font-semibold text-white shadow-brand-cta transition-all duration-200 hover:bg-brand-primary-dark hover:shadow-brand-cta-hover"
          >
            Log In
          </Link>
        </div>
      </header>

      {/* Centered card */}
      <main className="flex flex-1 items-center justify-center px-4 py-10 md:px-6 md:py-16">
        <div className="w-full max-w-md">
          <div className="rounded-3xl bg-white/80 p-8 shadow-glass-lg ring-1 ring-brand-charcoal/5 backdrop-blur-md md:p-10">
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-brand-charcoal/5 bg-white/40 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 md:flex-row md:px-6">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <p className="hidden text-xs text-brand-charcoal-muted md:inline">
              · © 2026 TensiMenu. Clinical precision in every meal.
            </p>
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-charcoal-muted">
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
                Contact Support
              </a>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  );
}
