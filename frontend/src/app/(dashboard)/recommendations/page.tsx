import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import NutritionSummaryCard from "@/components/recommendations/NutritionSummaryCard";
import RecommendationsView from "@/components/recommendations/RecommendationsView";
import type { FoodRecommendation } from "@/components/recommendations/types";

export const metadata: Metadata = {
  title: "Rekomendasi",
  description: "Rekomendasi menu DASH yang dipersonalisasi sesuai profil kesehatan Anda.",
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface ProfileData {
  daily_targets: {
    sodium_mg: number;
    potassium_mg: number;
    fiber_g: number;
    energy_kcal: number;
  } | null;
  comorbidities?: string[];
}

interface DailyConsumption {
  energy_kcal: number;
  sodium_mg: number;
  potassium_mg: number;
  fiber_g: number;
}

async function fetchProfile(accessToken: string): Promise<ProfileData | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${API_URL}/api/v1/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchRecommendations(
  accessToken: string
): Promise<{ data: FoodRecommendation[]; backendOk: boolean }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${API_URL}/api/v1/recommendations?top_k=15`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) return { data: [], backendOk: res.status !== 0 };
    const json = await res.json();

    // Normalisasi field — backend bisa return dalam shape berbeda.
    const items: FoodRecommendation[] = (json?.recommendations ?? json ?? []).map(
      (r: Record<string, unknown>) => ({
        food_code: String(r.food_code ?? r.id ?? ""),
        name: String(r.name ?? "Tanpa nama"),
        category: String(r.category ?? ""),
        region: (r.region as string | null) ?? null,
        description: (r.description as string | null) ?? null,
        image_url: (r.image_url as string | null) ?? null,
        energy_kcal: Number(r.energy_kcal ?? 0),
        sodium_mg: Number(r.sodium_mg ?? 0),
        potassium_mg: Number(r.potassium_mg ?? 0),
        fiber_g: Number(r.fiber_g ?? 0),
        fat_total_g: Number(r.fat_total_g ?? 0),
        phosphorus_mg: Number(r.phosphorus_mg ?? 0),
        default_serving_g: Number(r.default_serving_g ?? 100),
        dash_score: Number(r.dash_score ?? 0),
        dash_category: String(r.dash_category ?? ""),
        tags: (r.tags as string[]) ?? undefined,
        is_estimated: Boolean(r.is_estimated ?? false),
      })
    );

    return { data: items, backendOk: true };
  } catch {
    return { data: [], backendOk: false };
  }
}

async function fetchTodayConsumption(
  accessToken: string
): Promise<DailyConsumption> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${API_URL}/api/v1/progress/today`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return {
        energy_kcal: 0,
        sodium_mg: 0,
        potassium_mg: 0,
        fiber_g: 0,
      };
    }

    const data = await res.json();
    const c = data?.consumption ?? {};
    return {
      energy_kcal: Number(c.energy_kcal ?? 0),
      sodium_mg: Number(c.sodium_mg ?? 0),
      potassium_mg: Number(c.potassium_mg ?? 0),
      fiber_g: Number(c.fiber_g ?? 0),
    };
  } catch {
    return {
      energy_kcal: 0,
      sodium_mg: 0,
      potassium_mg: 0,
      fiber_g: 0,
    };
  }
}

export default async function RecommendationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const accessToken = session.accessToken;
  if (!accessToken) {
    return <UnauthorizedNotice />;
  }

  // Parallel fetch
  const [profile, recsResult, consumption] = await Promise.all([
    fetchProfile(accessToken),
    fetchRecommendations(accessToken),
    fetchTodayConsumption(accessToken),
  ]);

  const targets = profile?.daily_targets ?? {
    sodium_mg: 2300,
    potassium_mg: 4000,
    fiber_g: 30,
    energy_kcal: 2000,
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Title untuk SR — visually replaced oleh deskripsi di RecommendationsView */}
      <h1 className="sr-only">Rekomendasi Menu DASH</h1>

      {/* 4 Nutrition Summary Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <NutritionSummaryCard
          kind="energy"
          current={consumption.energy_kcal}
          target={Math.round(targets.energy_kcal)}
          unit="kkal"
        />
        <NutritionSummaryCard
          kind="sodium"
          current={consumption.sodium_mg}
          target={Math.round(targets.sodium_mg)}
          unit="mg"
        />
        <NutritionSummaryCard
          kind="potassium"
          current={consumption.potassium_mg}
          target={Math.round(targets.potassium_mg)}
          unit="mg"
        />
        <NutritionSummaryCard
          kind="fiber"
          current={consumption.fiber_g}
          target={Math.round(targets.fiber_g)}
          unit="g"
        />
      </div>

      {/* View interaktif */}
      <RecommendationsView
        initialRecommendations={recsResult.data}
        backendAvailable={recsResult.backendOk}
        isCkd={(profile?.comorbidities ?? []).includes("ckd")}
      />
    </div>
  );
}

function UnauthorizedNotice() {
  return (
    <div className="rounded-3xl bg-rose-50 border border-rose-200 p-6 text-center">
      <p className="font-semibold text-rose-800">Sesi tidak valid</p>
      <p className="mt-1 text-sm text-rose-700">
        Silakan login ulang untuk mengakses rekomendasi.
      </p>
    </div>
  );
}
