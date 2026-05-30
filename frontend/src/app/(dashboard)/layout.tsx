/**
 * Layout untuk semua halaman dashboard yang memerlukan auth.
 *
 * Server component:
 * - Validasi session (redirect ke /login jika tidak ada)
 *
 * Profile completion check dilakukan di client side via ProfileGuard
 * agar tidak block server rendering kalau backend down.
 */

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import ProfileGuard from "@/components/dashboard/ProfileGuard";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userName =
    session.user.name ?? session.user.email?.split("@")[0] ?? "User";

  return (
    <div className="min-h-screen bg-brand-cream">
      <DashboardNavbar userName={userName} />
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <ProfileGuard>{children}</ProfileGuard>
      </main>
    </div>
  );
}
