import type { Metadata } from "next";
import { Inter, Irish_Grover } from "next/font/google";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const irishGrover = Irish_Grover({
  variable: "--font-irish-grover",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "TensiMenu | Rekomendasi Makanan DASH untuk Hipertensi",
    template: "%s | TensiMenu",
  },
  description:
    "Sistem rekomendasi makanan lokal Indonesia berbasis DASH Diet untuk penderita hipertensi. Dapatkan rencana makan harian yang dipersonalisasi sesuai kondisi kesehatan Anda.",
  keywords: [
    "hipertensi",
    "DASH diet",
    "rekomendasi makanan",
    "makanan lokal Indonesia",
    "tekanan darah",
  ],
  authors: [{ name: "Tim TensiMenu" }],
  creator: "TensiMenu",
  metadataBase: new URL(
    process.env.NEXTAUTH_URL ?? "http://localhost:3000"
  ),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    title: "TensiMenu | Rekomendasi Makanan DASH untuk Hipertensi",
    description:
      "Sistem rekomendasi makanan lokal Indonesia berbasis DASH Diet untuk penderita hipertensi.",
    siteName: "TensiMenu",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TensiMenu | Rekomendasi Makanan DASH",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TensiMenu | Rekomendasi Makanan DASH untuk Hipertensi",
    description:
      "Sistem rekomendasi makanan lokal Indonesia berbasis DASH Diet untuk penderita hipertensi.",
    images: ["/og-image.png"],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ambil sesi server-side untuk diteruskan ke SessionProvider
  // agar tidak ada flash saat hydration
  const session = await getServerSession(authOptions);

  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${irishGrover.variable} font-[family-name:var(--font-inter)] antialiased min-h-screen bg-background`}
      >
        <Providers session={session}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
