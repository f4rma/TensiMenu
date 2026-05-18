// Halaman root — redirect ke dashboard atau login
// Middleware akan menangani redirect berdasarkan status sesi.

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function RootPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
