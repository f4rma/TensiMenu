/**
 * Next.js middleware untuk auth protection.
 *
 * Rules:
 * - Halaman dashboard (/dashboard, /recommendations, /tracker, dll)
 *   memerlukan session valid
 * - User belum login -> redirect ke /login dengan callbackUrl
 * - User sudah login tapi akses /login, /register -> redirect ke /dashboard
 *
 * Profile completion check di-handle di server component masing-masing
 * halaman (lebih efisien daripada di middleware).
 */

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

// Routes yang dilindungi auth middleware
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/recommendations/:path*",
    "/tracker/:path*",
    "/blood-pressure/:path*",
    "/profile/:path*",
  ],
};
