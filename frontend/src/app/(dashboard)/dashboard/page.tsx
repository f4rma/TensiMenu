import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Plus, Sparkles, Salad } from "lucide-react";

import { authOptions } from "@/lib/auth";
import ReminderBanner from "@/components/dashboard/sections/ReminderBanner";
import DashScoreCard from "@/components/dashboard/sections/DashScoreCard";
import ComplianceStatsCard from "@/components/dashboard/sections/ComplianceStatsCard";
import MealPlanCard from "@/components/dashboard/sections/MealPlanCard";
import BloodPressureCard from "@/components/dashboard/sections/BloodPressureCard";
import TrendChartCard from "@/components/dashboard/sections/TrendChartCard";
import WeeklyTargetCard from "@/components/dashboard/sections/WeeklyTargetCard";

export const metadata: Metadata = {
  title: "Beranda",
  description: "Pantau kesehatan jantung dan progres DASH Diet Anda hari ini.",
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface ProfileData {
  full_name: string;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  daily_targets: {
    sodium_mg: number;
    potassium_mg: number;
    calcium_mg: number;
    fiber_g: number;
    fat_total_g: number;
    energy_kcal: number;
  } | null;
}

interface DailyProgress {
  dash_score: number;
  consumed: {
    sodium_mg: number;
    potassium_mg: number;
  };
  meals_logged: number;
  has_data: boolean;
}

interface ComplianceStats {
  percentage: number;
  days_achieved: number;
  total_days: number;
  week_change: number;
  has_data: boolean;
}

interface TrendPoint {
  date: string;
  dash_score: number | null;
}

interface ProgressOverview {
  trend: TrendPoint[];
  compliance: ComplianceStats;
  weekly: {
    avg_dash_score: number | null;
    days_logged: number;
  };
  trendHasData: boolean;
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

// Fetch konsumsi hari ini dari endpoint /progress/today
async function fetchDailyProgress(accessToken: string): Promise<DailyProgress> {
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
        dash_score: 0,
        consumed: { sodium_mg: 0, potassium_mg: 0 },
        meals_logged: 0,
        has_data: false,
      };
    }

    const data = await res.json();
    return {
      dash_score: Number(data?.dash_score ?? 0),
      consumed: {
        sodium_mg: Number(data?.consumption?.sodium_mg ?? 0),
        potassium_mg: Number(data?.consumption?.potassium_mg ?? 0),
      },
      meals_logged: Number(data?.meals_logged ?? 0),
      has_data: Boolean(data?.has_data),
    };
  } catch {
    return {
      dash_score: 0,
      consumed: { sodium_mg: 0, potassium_mg: 0 },
      meals_logged: 0,
      has_data: false,
    };
  }
}

async function fetchProgressOverview(accessToken: string): Promise<ProgressOverview> {
  const empty: ProgressOverview = {
    trend: [],
    compliance: {
      percentage: 0,
      days_achieved: 0,
      total_days: 0,
      week_change: 0,
      has_data: false,
    },
    weekly: { avg_dash_score: null, days_logged: 0 },
    trendHasData: false,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${API_URL}/api/v1/progress`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) return empty;

    const data = await res.json();
    const trend: TrendPoint[] = Array.isArray(data?.trend) ? data.trend : [];
    const c = data?.compliance ?? {};
    const w = data?.weekly_summary ?? {};

    const totalDays = Number(c.total_days_logged ?? 0);
    const daysCompliant = Number(c.days_compliant ?? 0);
    const percentage = Number(c.compliance_percentage ?? 0);
    const trendHasData = trend.some((p) => p.dash_score !== null);

    return {
      trend,
      compliance: {
        percentage,
        days_achieved: daysCompliant,
        total_days: totalDays,
        week_change: 0, // perubahan mingguan belum dihitung backend
        has_data: totalDays > 0,
      },
      weekly: {
        avg_dash_score:
          w.avg_dash_score !== undefined && w.avg_dash_score !== null
            ? Number(w.avg_dash_score)
            : null,
        days_logged: Number(w.days_logged ?? 0),
      },
      trendHasData,
    };
  } catch {
    return empty;
  }
}

function formatTodayDateID(): string {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  const now = new Date();
  return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

function formatShortDateID(iso: string): string {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
  ];
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

/**
 * Pesan target mingguan dinamis berdasarkan jumlah hari tercatat & rata-rata skor.
 */
function buildWeeklyMessage(
  daysLogged: number,
  avgScore: number | null
): string {
  if (daysLogged === 0) {
    return "Mulai catat makan harian Anda untuk melihat target mingguan personal.";
  }
  if (avgScore === null) {
    return `Anda sudah mencatat ${daysLogged} hari minggu ini. Lanjutkan!`;
  }
  if (avgScore >= 60) {
    return `Bagus! Rata-rata skor DASH minggu ini ${avgScore} dari ${daysLogged} hari tercatat. Pertahankan.`;
  }
  return `Rata-rata skor DASH minggu ini ${avgScore} dari ${daysLogged} hari. Coba tingkatkan dengan menu rendah garam.`;
}

function getGreeting(name: string): string {
  const firstName = name.split(/\s+/)[0] || "Sahabat";
  const hour = new Date().getHours();
  if (hour < 11) return `Selamat pagi, ${firstName}!`;
  if (hour < 15) return `Selamat siang, ${firstName}!`;
  if (hour < 19) return `Selamat sore, ${firstName}!`;
  return `Selamat malam, ${firstName}!`;
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const profile = session.accessToken
    ? await fetchProfile(session.accessToken)
    : null;
  const todayProgress = session.accessToken
    ? await fetchDailyProgress(session.accessToken)
    : { dash_score: 0, consumed: { sodium_mg: 0, potassium_mg: 0 }, meals_logged: 0, has_data: false };
  const progress = session.accessToken
    ? await fetchProgressOverview(session.accessToken)
    : await fetchProgressOverview("");
  const compliance = progress.compliance;

  const userName = profile?.full_name ?? session.user.name ?? "Sahabat";
  const sodiumTarget = profile?.daily_targets?.sodium_mg ?? 2300;
  const potassiumTarget = profile?.daily_targets?.potassium_mg ?? 4000;

  // Siapkan data tren 7 hari untuk chart (isi 0 untuk hari tanpa catatan)
  const trendScores = progress.trend.map((p) => Math.round(p.dash_score ?? 0));
  const trendStart = progress.trend[0]?.date
    ? formatShortDateID(progress.trend[0].date)
    : "";
  const trendEnd = progress.trend[progress.trend.length - 1]?.date
    ? formatShortDateID(progress.trend[progress.trend.length - 1].date)
    : "Hari ini";

  // Pesan target mingguan dinamis berdasarkan data
  const weeklyMessage = buildWeeklyMessage(
    progress.weekly.days_logged,
    progress.weekly.avg_dash_score
  );

  // Apakah user benar-benar baru (belum ada data progress sama sekali)?
  const isNewUser = !todayProgress.has_data && !compliance.has_data;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Welcome banner untuk user baru */}
      {isNewUser && <NewUserWelcomeBanner userName={userName} />}

      {/* Reminder banner — hanya jika user sudah pernah catat tapi tidak aktif */}
      {!isNewUser && (
        <ReminderBanner daysSinceLastLog={0} />
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-charcoal md:text-3xl">
            {getGreeting(userName)}
          </h1>
          <p className="mt-1 text-sm text-brand-charcoal-soft">
            {formatTodayDateID()} • Semangat menjaga kesehatan jantung Anda hari
            ini.
          </p>
        </div>

        <Link
          href="/recommendations"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white shadow-brand-cta transition-all duration-200 hover:bg-brand-primary-dark hover:shadow-brand-cta-hover active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream"
        >
          <Plus className="h-4 w-4" />
          {isNewUser ? "Mulai Catat Makan" : "Catat Makan"}
        </Link>
      </div>

      {/* 3-column grid layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
        {/* Left column */}
        <div className="flex flex-col gap-4 lg:col-span-3">
          {todayProgress.has_data ? (
            <DashScoreCard
              score={todayProgress.dash_score}
              category="DASH Score Hari Ini"
              description={getDashDescription(todayProgress.dash_score)}
              nutrients={{
                sodium: {
                  current: todayProgress.consumed.sodium_mg,
                  target: sodiumTarget,
                },
                potassium: {
                  current: todayProgress.consumed.potassium_mg,
                  target: potassiumTarget,
                },
              }}
            />
          ) : (
            <EmptyDashScoreCard
              sodiumTarget={sodiumTarget}
              potassiumTarget={potassiumTarget}
            />
          )}

          {compliance.has_data ? (
            <ComplianceStatsCard
              percentage={compliance.percentage}
              daysAchieved={compliance.days_achieved}
              totalDays={compliance.total_days}
            />
          ) : (
            <EmptyComplianceCard />
          )}
        </div>

        {/* Center column */}
        <div className="lg:col-span-6">
          <EmptyMealPlanCard />
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4 lg:col-span-3">
          <BloodPressureCard
            systolic={profile?.systolic_bp ?? null}
            diastolic={profile?.diastolic_bp ?? null}
          />

          {progress.trendHasData ? (
            <TrendChartCard
              scores={trendScores}
              startLabel={trendStart}
              endLabel={trendEnd}
            />
          ) : (
            <EmptyTrendCard />
          )}

          <WeeklyTargetCard message={weeklyMessage} />
        </div>
      </div>
    </div>
  );
}

function getDashDescription(score: number): string {
  if (score >= 80) return "Skor Anda sangat baik. Pertahankan pola makan ini!";
  if (score >= 60) return "Skor Anda berada dalam kategori aman untuk tekanan darah.";
  if (score >= 40) return "Cukup, namun masih bisa ditingkatkan dengan pilihan makanan yang lebih sehat.";
  return "Perlu perhatian. Mari pilih makanan yang lebih sesuai DASH Diet.";
}

// ─── Empty State Components ──────────────────────────────────────────────────

function NewUserWelcomeBanner({ userName }: { userName: string }) {
  return (
    <div className="mb-5 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-primary to-brand-primary-dark p-5 text-white animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="text-base font-bold tracking-tight">
            Selamat datang, {userName.split(/\s+/)[0]}!
          </p>
          <p className="mt-1 text-sm leading-relaxed text-white/90">
            Profil Anda sudah aktif. Mulai catat makanan pertama Anda untuk
            melihat skor DASH harian, tren progres, dan rekomendasi yang
            dipersonalisasi.
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyDashScoreCard({
  sodiumTarget,
  potassiumTarget,
}: {
  sodiumTarget: number;
  potassiumTarget: number;
}) {
  return (
    <div className="rounded-3xl bg-white border border-brand-charcoal/5 p-5 shadow-glass-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-charcoal-muted text-center">
        DASH Score Hari Ini
      </p>

      <div className="mt-4 flex flex-col items-center justify-center py-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
          <Salad className="h-6 w-6" strokeWidth={2.25} />
        </span>
        <p className="mt-3 text-sm font-semibold text-brand-charcoal text-center">
          Belum ada catatan
        </p>
        <p className="mt-1 text-xs leading-relaxed text-brand-charcoal-soft text-center px-2">
          Catat makanan hari ini untuk melihat skor DASH Anda.
        </p>
      </div>

      <div className="border-t border-brand-charcoal/5 pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-charcoal-muted mb-2">
          Target Harian Anda
        </p>
        <div className="flex flex-col gap-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-brand-charcoal-soft">Natrium</span>
            <span className="font-semibold tabular-nums text-brand-charcoal">
              {sodiumTarget.toLocaleString("id-ID")} mg
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-brand-charcoal-soft">Kalium</span>
            <span className="font-semibold tabular-nums text-brand-charcoal">
              {potassiumTarget.toLocaleString("id-ID")} mg
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyComplianceCard() {
  return (
    <div className="rounded-3xl bg-brand-cream-soft border border-dashed border-brand-charcoal/15 p-5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-charcoal-muted">
        Statistik Kepatuhan
      </p>
      <p className="mt-3 text-sm leading-relaxed text-brand-charcoal-soft">
        Statistik akan muncul setelah Anda mencatat makan selama 7 hari.
      </p>
    </div>
  );
}

function EmptyMealPlanCard() {
  return (
    <div className="rounded-3xl bg-white border border-brand-charcoal/5 p-7 shadow-glass-sm">
      <h2 className="text-base font-semibold tracking-tight text-brand-charcoal">
        Rencana Makan Hari Ini
      </h2>

      <div className="mt-5 flex flex-col items-center text-center py-8">
        <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-primary/10 text-brand-primary mb-4">
          <Salad className="h-7 w-7" strokeWidth={2} />
        </span>
        <p className="text-base font-semibold text-brand-charcoal">
          Mulai perjalanan DASH Anda
        </p>
        <p className="mt-1.5 max-w-md text-sm leading-relaxed text-brand-charcoal-soft">
          Belum ada rencana makan untuk hari ini. Buka halaman Rekomendasi untuk
          mendapatkan menu personal sesuai profil Anda.
        </p>
        <Link
          href="/recommendations"
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white shadow-brand-cta transition-all duration-200 hover:bg-brand-primary-dark hover:shadow-brand-cta-hover active:scale-[0.98]"
        >
          Lihat Rekomendasi
        </Link>
      </div>
    </div>
  );
}

function EmptyTrendCard() {
  return (
    <div className="rounded-3xl bg-brand-cream-soft border border-dashed border-brand-charcoal/15 p-5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-charcoal-muted">
        Tren DASH Score (7 Hari)
      </p>
      <p className="mt-3 text-xs leading-relaxed text-brand-charcoal-soft">
        Tren akan muncul setelah Anda mencatat makan selama beberapa hari.
      </p>
    </div>
  );
}
