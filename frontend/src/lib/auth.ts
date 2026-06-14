/**
 * Konfigurasi NextAuth.js untuk TensiMenu
 * - Google Provider: OAuth 2.0 login via akun Google (Req. 1.7)
 * - Credentials Provider: login email/password via FastAPI backend
 * - JWT strategy dengan auto-refresh access token Supabase saat akan expired.
 *
 * Catatan tentang masa berlaku token:
 * - Supabase access_token default: ~1 jam.
 * - Refresh token Supabase: long-lived (bisa berhari-hari), diputar otomatis.
 * - Sesi NextAuth: 30 hari rolling, tapi accessToken di dalamnya selalu di-refresh
 *   sebelum dipakai untuk request ke backend FastAPI.
 */

import { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Refresh token saat tersisa <= 60 detik dari masa berlaku.
const REFRESH_THRESHOLD_SECONDS = 60;

/**
 * Panggil endpoint /auth/refresh di FastAPI menggunakan refresh_token Supabase.
 * Mengembalikan JWT NextAuth yang sudah diperbarui.
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  if (!token.refreshToken) {
    return { ...token, error: "NoRefreshToken" };
  }

  try {
    const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: token.refreshToken }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.access_token) {
      return { ...token, error: "RefreshAccessTokenError" };
    }

    return {
      ...token,
      accessToken: data.access_token as string,
      refreshToken: (data.refresh_token as string | undefined) ?? token.refreshToken,
      expiresAt: (data.expires_at as number | undefined) ?? token.expiresAt,
      error: undefined,
    };
  } catch {
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth 2.0
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // Email / Password via FastAPI
    CredentialsProvider({
      name: "Email & Kata Sandi",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "nama@email.com",
        },
        password: {
          label: "Kata Sandi",
          type: "password",
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const response = await fetch(`${API_URL}/api/v1/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            return null;
          }

          const data = await response.json();

          // FastAPI mengembalikan { user_id, email, name, access_token, refresh_token, expires_at }
          return {
            id: data.user_id,
            email: data.email,
            name: data.name ?? null,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt: data.expires_at,
          };
        } catch {
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
    // Sesi NextAuth bertahan 30 hari (rolling). Access token di dalamnya
    // di-refresh otomatis tiap kali mendekati expired.
    maxAge: 60 * 60 * 24 * 30,
  },

  jwt: {
    maxAge: 60 * 60 * 24 * 30,
  },

  callbacks: {
    // Dipanggil saat JWT dibuat atau diperbarui.
    // - Login pertama: simpan access/refresh token + waktu expired.
    // - Request berikutnya: refresh token Supabase kalau sudah/akan expired.
    // - updateSession() dari client: perbarui nama user di JWT.
    async jwt({ token, user, account, trigger, session: sessionUpdate }): Promise<JWT> {
      // Client memanggil updateSession({ name: "..." }) setelah update profil
      if (trigger === "update" && sessionUpdate?.name) {
        token.name = sessionUpdate.name as string;
        return token;
      }

      // Login awal via Credentials provider
      if (user && "accessToken" in user) {
        return {
          ...token,
          userId: user.id,
          accessToken: user.accessToken as string | undefined,
          refreshToken: (user as { refreshToken?: string }).refreshToken,
          expiresAt: (user as { expiresAt?: number }).expiresAt,
          error: undefined,
        };
      }

      // Login awal via Google OAuth
      if (account?.provider === "google" && account.id_token) {
        return {
          ...token,
          userId: user?.id ?? token.userId,
          accessToken: account.id_token,
          // Google tidak memberi refresh token Supabase, jadi sesi Google
          // akan berakhir saat id_token Google expired (~1 jam). User perlu
          // login ulang. Tidak ideal — TODO: tukar id_token Google ke sesi
          // Supabase di backend agar mendapatkan refresh_token.
          refreshToken: undefined,
          expiresAt:
            typeof account.expires_at === "number"
              ? account.expires_at
              : token.expiresAt,
          error: undefined,
        };
      }

      // Token belum punya expiresAt — biarkan apa adanya.
      if (!token.expiresAt) {
        return token;
      }

      const nowSec = Math.floor(Date.now() / 1000);
      const stillValid = token.expiresAt - nowSec > REFRESH_THRESHOLD_SECONDS;

      if (stillValid) {
        return token;
      }

      // Token sudah/akan expired — coba refresh.
      return refreshAccessToken(token);
    },

    // Dipanggil saat sesi dibaca di client.
    async session({ session, token }) {
      if (token) {
        session.user.id = (token.userId as string) ?? session.user.id;
        session.user.name = (token.name as string | null | undefined) ?? session.user.name;
        session.accessToken = token.accessToken as string | undefined;
        session.error = token.error as string | undefined;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

// Augmentasi tipe NextAuth
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    accessToken?: string;
    error?: string;
  }

  interface User {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    error?: string;
  }
}
