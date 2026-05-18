"use client";

// Providers wrapper untuk Client Components
// Membungkus SessionProvider dari NextAuth.js agar dapat digunakan di seluruh aplikasi tanpa menjadikan layout.tsx sebagai Client Component.

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

interface ProvidersProps {
  children: React.ReactNode;
  session?: Session | null;
}

export function Providers({ children, session }: ProvidersProps) {
  return (
    <SessionProvider session={session} refetchInterval={0}>
      {children}
    </SessionProvider>
  );
}
