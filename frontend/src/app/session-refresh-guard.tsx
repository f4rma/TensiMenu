"use client";

// Memantau session.error dari NextAuth.
// Kalau refresh access token Supabase gagal, sign out user dan kembalikan
// ke /login dengan callbackUrl ke halaman saat ini.

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

export function SessionRefreshGuard() {
  const { data: session } = useSession();
  const pathname = usePathname();

  useEffect(() => {
    if (session?.error === "RefreshAccessTokenError") {
      const callbackUrl = pathname && pathname !== "/login" ? pathname : "/";
      void signOut({ callbackUrl: `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` });
    }
  }, [session?.error, pathname]);

  return null;
}
