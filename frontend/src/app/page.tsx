<<<<<<< Updated upstream
// Halaman root — redirect ke dashboard atau login
// Middleware akan menangani redirect berdasarkan status sesi.
=======
/**
 * Landing page utama TensiMenu
 *
 * Struktur:
 * - Navbar (sticky, transparent → solid on scroll)
 * - Hero: value proposition + CTA
 * - DASH Diet: penjelasan metodologi klinis
 * - Features: 3 fitur utama (rekomendasi, DASH score, tracker)
 * - CTA: ajakan bergabung
 * - Footer
 *
 * User yang sudah login akan di-redirect ke /dashboard.
 */
>>>>>>> Stashed changes

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import DashDietSection from "@/components/landing/DashDietSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import CtaSection from "@/components/landing/CtaSection";
import Footer from "@/components/landing/Footer";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
<<<<<<< Updated upstream
=======

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <DashDietSection />
      <FeaturesSection />
      <CtaSection />
      <Footer />
    </main>
  );
>>>>>>> Stashed changes
}
