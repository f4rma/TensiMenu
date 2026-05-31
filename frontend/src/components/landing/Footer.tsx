import Link from "next/link";
import { Mail, Activity } from "lucide-react";
import Logo from "./Logo";

const LINK_GROUPS = [
  {
    title: "Produk",
    links: [
      { href: "#features", label: "Fitur" },
      { href: "#dash-diet", label: "DASH Diet" },
      { href: "/register", label: "Mulai Gratis" },
    ],
  },
  {
    title: "Perusahaan",
    links: [
      { href: "#support", label: "Kontak" },
      { href: "/privacy", label: "Kebijakan Privasi" },
      { href: "/terms", label: "Ketentuan Layanan" },
    ],
  },
] as const;

export default function Footer() {
  return (
    <footer className="bg-brand-charcoal text-white/80">
      <div className="mx-auto max-w-7xl px-4 py-14 md:px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          {/* Brand column */}
          <div className="max-w-sm">
            <div className="[&_span]:text-white [&_div]:border-white/80">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-brand-primary-light bg-white/5">
                  <Activity className="h-4 w-4 text-brand-primary-light" strokeWidth={2.5} />
                </div>
                <span className="text-base font-semibold tracking-tight text-white">
                  TensiMenu
                </span>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/55">
              Pendamping diet DASH untuk mengelola hipertensi lewat makanan
              lokal yang lezat dan pemantauan yang cerdas.
            </p>
          </div>

          {/* Link groups */}
          {LINK_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold tracking-tight text-white">
                {group.title}
              </h3>
              <ul className="mt-4 flex flex-col gap-2.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 transition-colors duration-150 hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-white/45">
            © 2026 TensiMenu. Proyek capstone berbasis riset DASH Diet.
          </p>
          <Link
            href="mailto:hello@tensimenu.id"
            className="inline-flex items-center gap-2 text-xs text-white/60 transition-colors duration-150 hover:text-white"
          >
            <Mail className="h-3.5 w-3.5" />
            hello@tensimenu.id
          </Link>
        </div>
      </div>
    </footer>
  );
}
