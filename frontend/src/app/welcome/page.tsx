/**
 * Welcome splash page — hero entry point
 * Optional decorative landing untuk first-time visitors
 */

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LandingHero from "@/components/landing/LandingHero";

export default async function WelcomePage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return <LandingHero />;
}
