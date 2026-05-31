// Halaman root — splash hero untuk visitor, redirect ke dashboard untuk user login.

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SplashHero from "@/components/landing/SplashHero";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  // User sudah login → langsung ke dashboard
  if (session) {
    redirect("/dashboard");
  }

  // Visitor (belum login) → tampilkan splash hero
  return <SplashHero />;
}
