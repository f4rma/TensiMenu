"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LogOut,
  Menu,
  X,
  User,
  Shield,
  ChevronDown,
} from "lucide-react";
import Logo from "@/components/landing/Logo";
import Avatar from "@/components/ui/Avatar";
import GlobalSearch from "@/components/search/GlobalSearch";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/dashboard", label: "Beranda" },
  { href: "/recommendations", label: "Rekomendasi" },
  { href: "/tracker", label: "Tracker" },
  { href: "/blood-pressure", label: "Riwayat TD" },
] as const;

interface DashboardNavbarProps {
  userName: string;
}

export default function DashboardNavbar({ userName }: DashboardNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  };

  // Greeting nama (Pak/Bu) — pisahkan first name
  const firstName = userName.split(/\s+/)[0] || "Sahabat";

  return (
    <header className="sticky top-0 z-40 border-b border-brand-charcoal/5 bg-brand-cream/85 backdrop-blur-xl">
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 md:h-16 md:px-6">
        {/* Logo */}
        <Link
          href="/dashboard"
          className="rounded-lg transition-opacity duration-150 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream"
          aria-label="TensiMenu Dashboard"
        >
          <Logo size="sm" />
        </Link>

        {/* Desktop nav links */}
        <ul className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive =
              pathname === link.href || pathname?.startsWith(link.href + "/");
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "relative rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary",
                    isActive
                      ? "text-brand-primary"
                      : "text-brand-charcoal-soft hover:text-brand-primary hover:bg-brand-primary/5"
                  )}
                >
                  {link.label}
                  {isActive && (
                    <span
                      className="absolute -bottom-1 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-brand-primary"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Desktop user menu */}
        <div className="hidden items-center gap-3 md:flex" ref={profileRef}>
          {/* Global search */}
          <GlobalSearch />

          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2 rounded-2xl px-2 py-1 transition-colors duration-150 hover:bg-brand-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              aria-expanded={profileOpen}
              aria-haspopup="menu"
            >
              <Avatar name={userName} size="sm" variant="character" />
              <span className="text-sm font-medium text-brand-charcoal">
                {firstName}
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-brand-charcoal-soft transition-transform duration-200",
                  profileOpen && "rotate-180"
                )}
              />
            </button>

            {/* Profile dropdown */}
            {profileOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-56 origin-top-right animate-in fade-in slide-in-from-bottom-2 duration-200 rounded-2xl border border-brand-charcoal/5 bg-white shadow-glass-md py-2"
              >
                <div className="px-4 py-2 border-b border-brand-charcoal/5">
                  <p className="text-sm font-semibold text-brand-charcoal truncate">
                    {userName}
                  </p>
                </div>
                <Link
                  href="/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-brand-charcoal transition-colors duration-150 hover:bg-brand-primary/5 hover:text-brand-primary"
                  role="menuitem"
                >
                  <User className="h-4 w-4" />
                  Profil Saya
                </Link>
                <Link
                  href="/privacy"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-brand-charcoal transition-colors duration-150 hover:bg-brand-primary/5 hover:text-brand-primary"
                  role="menuitem"
                >
                  <Shield className="h-4 w-4" />
                  Kebijakan Privasi
                </Link>
                <div className="my-1 border-t border-brand-charcoal/5" />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-rose-600 transition-colors duration-150 hover:bg-rose-50"
                  role="menuitem"
                >
                  <LogOut className="h-4 w-4" />
                  Keluar
                </button>
              </div>
            )}
          </div>
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
          <div className="flex items-center gap-3 px-4 py-3 border-b border-brand-charcoal/5">
            <Avatar name={userName} size="md" variant="character" />
            <div>
              <p className="text-sm font-semibold text-brand-charcoal">
                {userName}
              </p>
              <p className="text-xs text-brand-charcoal-muted">
                Selamat datang kembali
              </p>
            </div>
          </div>
          <ul className="flex flex-col gap-1 px-4 py-3">
            {NAV_LINKS.map((link) => {
              const isActive =
                pathname === link.href || pathname?.startsWith(link.href + "/");
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "block rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                      isActive
                        ? "bg-brand-primary/10 text-brand-primary"
                        : "text-brand-charcoal hover:bg-brand-primary/5 hover:text-brand-primary"
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-brand-charcoal/5 px-4 py-3 flex flex-col gap-1">
            <Link
              href="/profile"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-brand-charcoal transition-colors duration-150 hover:bg-brand-primary/5 hover:text-brand-primary"
            >
              <User className="h-4 w-4" />
              Profil Saya
            </Link>
            <Link
              href="/privacy"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-brand-charcoal transition-colors duration-150 hover:bg-brand-primary/5 hover:text-brand-primary"
            >
              <Shield className="h-4 w-4" />
              Kebijakan Privasi
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 transition-colors duration-150 hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
