import Link from "next/link";
import { Share2, Mail } from "lucide-react";
import Logo from "./Logo";

const FOOTER_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/accessibility", label: "Accessibility" },
  { href: "#support", label: "Contact" },
] as const;

export default function Footer() {
  return (
    <footer className="bg-brand-charcoal py-10 text-white/80">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          {/* Brand */}
          <div>
            <div className="text-white">
              <Logo size="sm" />
            </div>
            <p className="mt-3 text-xs text-white/55">
              © 2026 TensiMenu Health. Committed to clinical empathy.
            </p>
          </div>

          {/* Links */}
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-white/70 underline-offset-4 transition-colors duration-150 hover:text-white hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Social icons */}
          <div className="flex items-center gap-2">
            <Link
              href="#"
              aria-label="Bagikan"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-white/70 backdrop-blur-md ring-1 ring-white/10 transition-all duration-150 hover:bg-white/10 hover:text-white"
            >
              <Share2 className="h-4 w-4" />
            </Link>
            <Link
              href="mailto:hello@tensimenu.id"
              aria-label="Kontak email"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-white/70 backdrop-blur-md ring-1 ring-white/10 transition-all duration-150 hover:bg-white/10 hover:text-white"
            >
              <Mail className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
