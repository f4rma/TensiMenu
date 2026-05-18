/**
 * Konfigurasi NextAuth.js untuk TensiMenu
 * - Google Provider: OAuth 2.0 login via akun Google (Req. 1.7)
 * - Credentials Provider: login email/password via FastAPI backend
 * - JWT strategy dengan maxAge 30 menit (Req. 1.6)
 */

import { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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
            // Kembalikan null agar NextAuth menampilkan pesan error generik
            return null;
          }

          const data = await response.json();

          // FastAPI mengembalikan { user_id, email, name, access_token }
          return {
            id: data.user_id,
            email: data.email,
            name: data.name ?? null,
            accessToken: data.access_token,
          };
        } catch {
          // Gagal koneksi ke backend — kembalikan null
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
    // Sesi kedaluwarsa setelah 30 menit tidak aktif (Req. 1.6)
    maxAge: 1800, // 30 menit dalam detik
  },

  jwt: {
    maxAge: 1800, // Sinkron dengan maxAge sesi
  },

  callbacks: {
     // Dipanggil saat JWT dibuat atau diperbarui.
     // Menyimpan accessToken dari FastAPI ke dalam JWT NextAuth.
    async jwt({ token, user, account }): Promise<JWT> {
      // Login pertama kali: user dan account tersedia
      if (user) {
        token.userId = user.id;
        // Credentials provider: accessToken sudah ada di user object
        if ("accessToken" in user) {
          token.accessToken = user.accessToken as string;
        }
      }

      // Google OAuth: gunakan id_token Supabase sebagai accessToken
      if (account?.provider === "google" && account.id_token) {
        token.accessToken = account.id_token;
      }

      return token;
    },

    // Dipanggil saat sesi dibaca di client.
    // Meneruskan accessToken ke sesi agar dapat digunakan di komponen.
    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string;
        session.accessToken = token.accessToken as string | undefined;
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
// Diperlukan agar TypeScript mengenali field tambahan di session dan JWT

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    accessToken?: string;
  }

  interface User {
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    accessToken?: string;
  }
}
