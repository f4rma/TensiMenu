import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import ProfileWizard from "@/components/profile/ProfileWizard";
import ProfileView from "@/components/profile/ProfileView";
import type { ProfileFormData, DailyTargets } from "@/components/profile/types";

export const metadata: Metadata = {
  title: "Profil Saya",
  description:
    "Lengkapi profil kesehatan Anda untuk personalisasi rekomendasi DASH Diet.",
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface ExistingProfile {
  full_name: string;
  age: number;
  gender: "laki-laki" | "perempuan";
  weight_kg: number;
  height_cm: number;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  activity_level?: "sedentary" | "light" | "moderate" | "active" | "very_active";
  comorbidities: string[];
  food_restrictions: string[];
  regional_prefs: string[];
  avatar_style: string | null;
  is_complete: boolean;
  daily_targets: DailyTargets | null;
}

/**
 * Hasil fetch profil dengan informasi tambahan tentang sumber kegagalan.
 * Kita perlu bedakan "profil belum dibuat" (404) vs error transien
 * (timeout/401/5xx) supaya tidak paksa user kembali ke wizard kalau
 * data sebenarnya sudah ada — hanya backend yang lambat.
 */
type ProfileFetchResult =
  | { status: "ok"; profile: ExistingProfile }
  | { status: "not_found" }
  | { status: "transient_error" };

async function fetchProfile(accessToken: string): Promise<ProfileFetchResult> {
  try {
    const controller = new AbortController();
    // 8 detik — lebih toleran untuk cold-start backend & round-trip Supabase
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${API_URL}/api/v1/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.status === 404) return { status: "not_found" };
    if (!res.ok) return { status: "transient_error" };
    const profile = (await res.json()) as ExistingProfile;
    return { status: "ok", profile };
  } catch {
    return { status: "transient_error" };
  }
}

interface PageProps {
  searchParams: Promise<{ onboarding?: string; edit?: string }>;
}

function ProfileFallback() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="rounded-3xl bg-white/80 backdrop-blur-md border border-brand-charcoal/5 p-7 shadow-glass-md">
        <div className="space-y-4 animate-pulse">
          <div className="h-6 w-48 rounded bg-brand-charcoal/5" />
          <div className="h-11 w-full rounded-xl bg-brand-charcoal/5" />
          <div className="h-11 w-full rounded-xl bg-brand-charcoal/5" />
        </div>
      </div>
    </div>
  );
}

export default async function ProfilePage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const params = await searchParams;
  const isOnboarding = params.onboarding === "1";

  // Coba fetch profil yang ada
  const result = session.accessToken
    ? await fetchProfile(session.accessToken)
    : ({ status: "transient_error" } as const);

  // Kalau backend transient error → tampilkan layar retry, JANGAN paksa wizard.
  // Ini mencegah user yang sudah punya profil "dipulangkan" ke onboarding hanya
  // karena fetch gagal/timeout sesaat.
  if (result.status === "transient_error" && !isOnboarding) {
    return <ProfileLoadError />;
  }

  const existing = result.status === "ok" ? result.profile : null;

  // Mode wizard: kalau onboarding (forced) atau profil benar-benar tidak ada
  // atau profil ada tapi belum lengkap.
  const showWizard =
    isOnboarding ||
    result.status === "not_found" ||
    (existing !== null && !existing.is_complete);

  if (showWizard) {
    return (
      <Suspense fallback={<ProfileFallback />}>
        <ProfileWizard
          mode={existing ? "edit" : "onboarding"}
          initialData={existing ? toFormData(existing) : undefined}
        />
      </Suspense>
    );
  }

  // Mode view: tampilkan ringkasan
  return (
    <Suspense fallback={<ProfileFallback />}>
      <ProfileView
        data={toFormData(existing!)}
        dailyTargets={existing!.daily_targets}
      />
    </Suspense>
  );
}

/**
 * Tampilan ketika fetch profil gagal sementara (timeout/5xx/network).
 * Tidak memaksa user kembali ke wizard — cukup tawarkan reload.
 */
function ProfileLoadError() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="rounded-3xl bg-white border border-brand-charcoal/5 p-8 shadow-glass-sm text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 ring-1 ring-amber-200">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-amber-600"
          >
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
          </svg>
        </div>
        <h1 className="mt-4 text-lg font-semibold tracking-tight text-brand-charcoal">
          Tidak dapat memuat profil
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-brand-charcoal-soft">
          Server backend tidak merespons. Pastikan server berjalan, lalu muat
          ulang halaman.
        </p>
        <a
          href="/profile"
          className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white shadow-brand-cta transition-all duration-200 hover:bg-brand-primary-dark hover:shadow-brand-cta-hover active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
        >
          Muat Ulang
        </a>
      </div>
    </div>
  );
}

function toFormData(existing: ExistingProfile): ProfileFormData {
  return {
    full_name: existing.full_name,
    age: existing.age,
    gender: existing.gender,
    weight_kg: existing.weight_kg,
    height_cm: existing.height_cm,
    activity_level: existing.activity_level ?? "light",
    systolic_bp: existing.systolic_bp ?? "",
    diastolic_bp: existing.diastolic_bp ?? "",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    comorbidities: existing.comorbidities as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    food_restrictions: existing.food_restrictions as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    regional_prefs: existing.regional_prefs as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    avatar_style: (existing.avatar_style as any) || "lorelei",
  };
}
