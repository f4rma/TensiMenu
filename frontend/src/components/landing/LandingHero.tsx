import Navbar from "./Navbar";
import HeroSection from "./HeroSection";
import FeaturesSection from "./FeaturesSection";
import DashDietSection from "./DashDietSection";
import CtaSection from "./CtaSection";
import Footer from "./Footer";

/**
 * Landing page lengkap (route /welcome).
 * Komposisi section marketing: navbar, hero, fitur, DASH diet, CTA, footer.
 */
export default function LandingHero() {
  return (
    <main className="min-h-screen bg-brand-cream">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <DashDietSection />
      <CtaSection />
      <Footer />
    </main>
  );
}
