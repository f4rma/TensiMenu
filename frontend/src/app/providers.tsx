"use client";

// Providers wrapper untuk Client Components
// Membungkus SessionProvider dari NextAuth.js agar dapat digunakan di seluruh aplikasi tanpa menjadikan layout.tsx sebagai Client Component.

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

import { SessionRefreshGuard } from "./session-refresh-guard";

interface ProvidersProps {
  children: React.ReactNode;
  session?: Session | null;
}

export function Providers({ children, session }: ProvidersProps) {
  return (
    <SessionProvider
      session={session}
      // Refetch session setiap 5 menit untuk memicu callback jwt() di server.
      // Callback tersebut akan auto-refresh access_token Supabase saat
      // mendekati waktu expired (~1 jam dari Supabase).
      refetchInterval={5 * 60}
      // Refetch saat tab kembali aktif — pastikan token segar setelah idle.
      refetchOnWindowFocus
    >
      <SessionRefreshGuard />
      {children}
    </SessionProvider>
  );
}
