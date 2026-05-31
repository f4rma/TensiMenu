import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

interface LegalSection {
  heading: string;
  body: ReactNode;
}

interface LegalPageProps {
  title: string;
  /** Tanggal terakhir diperbarui, mis. "30 Mei 2026" */
  lastUpdated: string;
  /** Kalimat pembuka ringkas */
  intro: string;
  sections: LegalSection[];
}

/**
 * Layout halaman legal (Privacy Policy, Terms of Service).
 *
 * Konsisten dengan brand: cream background, kartu putih, tipografi Inter,
 * lebar baca nyaman (max-w-3xl). Read-only, server component friendly.
 */
export default function LegalPage({
  title,
  lastUpdated,
  intro,
  sections,
}: LegalPageProps) {
  return (
    <main className="min-h-screen bg-brand-cream">
      {/* Top bar */}
      <div className="border-b border-brand-charcoal/5 bg-brand-cream/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 md:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-charcoal-soft transition-colors duration-150 hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded-lg"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </Link>
          <span className="text-sm font-semibold tracking-tight text-brand-charcoal">
            TensiMenu
          </span>
        </div>
      </div>

      {/* Content */}
      <article className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-brand-charcoal md:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-brand-charcoal-muted">
            Terakhir diperbarui: {lastUpdated}
          </p>
          <p className="mt-5 text-base leading-relaxed text-brand-charcoal-soft">
            {intro}
          </p>
        </header>

        <div className="mt-10 flex flex-col gap-8">
          {sections.map((section, idx) => (
            <section key={section.heading}>
              <h2 className="text-lg font-semibold tracking-tight text-brand-charcoal">
                {idx + 1}. {section.heading}
              </h2>
              <div className="mt-2.5 space-y-3 text-sm leading-relaxed text-brand-charcoal-soft [&_a]:font-medium [&_a]:text-brand-primary [&_a]:underline-offset-2 hover:[&_a]:underline [&_li]:ml-4 [&_ul]:list-disc [&_ul]:space-y-1.5">
                {section.body}
              </div>
            </section>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-12 rounded-2xl bg-brand-cream-soft p-5 ring-1 ring-brand-charcoal/5">
          <p className="text-xs leading-relaxed text-brand-charcoal-muted">
            TensiMenu adalah proyek capstone edukatif berbasis riset DASH Diet.
            Aplikasi ini bukan pengganti nasihat, diagnosis, atau perawatan
            medis profesional. Selalu konsultasikan kondisi kesehatanmu dengan
            dokter atau ahli gizi.
          </p>
        </div>
      </article>
    </main>
  );
}
