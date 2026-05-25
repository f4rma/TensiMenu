/**
 * Root page — tampilkan landing page atau redirect ke dashboard
 */

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LandingHero from "@/components/landing/LandingHero";

export default async function RootPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  // User belum login → tampilkan landing page
  return <LandingHero />;
}
