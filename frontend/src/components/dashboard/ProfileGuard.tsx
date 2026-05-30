"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AlertCircle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface ProfileGuardProps {
  children: React.ReactNode;
}

type GuardState = "checking" | "complete" | "incomplete" | "backend_down";

/**
 * Client-side guard yang memeriksa apakah profil user sudah lengkap.
 *
 * - Jika belum lengkap → redirect ke /profile?onboarding=1
 * - Jika sudah lengkap → tampilkan children
 * - Jika backend down → tampilkan banner warning tapi tetap render children
 *   (agar developer/user tidak blocked saat development)
 *
 * Skip pengecekan kalau user sedang di /profile.
 */
export default function ProfileGuard({ children }: ProfileGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [state, setState] = useState<GuardState>("checking");

  const isProfilePage = pathname?.startsWith("/profile");

  useEffect(() => {
    // Skip check kalau di halaman profile sendiri
    if (isProfilePage) {
      setState("complete");
      return;
    }

    if (status === "loading") return;
    if (!session?.accessToken) {
      // Tidak ada token tapi sudah login → backend bisa lanjut (mungkin Google OAuth)
      // atau session masih loading. Tampilkan loading sebentar lalu render.
      setState("complete");
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    fetch(`${API_URL}/api/v1/profile`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (res) => {
        clearTimeout(timeoutId);
        if (cancelled) return;
        if (res.status === 404) {
          // Profil benar-benar belum dibuat → redirect ke onboarding
          router.replace("/profile?onboarding=1");
          setState("incomplete");
          return;
        }
        if (!res.ok) {
          // Error transien (401/5xx) — jangan paksa redirect, render aja
          setState("complete");
          return;
        }
        const data = await res.json();
        if (data?.is_complete) {
          setState("complete");
        } else {
          // Profil ada tapi belum lengkap → redirect ke wizard untuk menyelesaikan
          router.replace("/profile?onboarding=1");
          setState("incomplete");
        }
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        if (cancelled) return;
        if (err.name === "AbortError") {
          setState("backend_down");
        } else {
          setState("complete"); // tetap render children agar tidak blocked
        }
      });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [session, status, router, isProfilePage]);

  if (state === "checking") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
          <p className="text-sm text-brand-charcoal-soft">Memuat...</p>
        </div>
      </div>
    );
  }

  if (state === "incomplete") {
    // Sedang redirect, tampilkan loading
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-brand-charcoal-soft">
          Mengarahkan ke halaman profil...
        </p>
      </div>
    );
  }

  return (
    <>
      {state === "backend_down" && (
        <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Backend tidak terhubung</p>
            <p className="text-xs mt-0.5">
              Beberapa fitur mungkin tidak berfungsi. Pastikan server backend
              sedang berjalan di <code className="font-mono">{API_URL}</code>.
            </p>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
