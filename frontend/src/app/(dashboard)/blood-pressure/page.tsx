import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import BloodPressureView from "@/components/blood-pressure/BloodPressureView";
import { classifyBP, type BPRecord } from "@/components/blood-pressure/types";

export const metadata: Metadata = {
  title: "Riwayat Tekanan Darah",
  description: "Pantau dan catat riwayat tekanan darah Anda secara berkala.",
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface BackendBPRecord {
  id: string;
  systolic_mmhg: number;
  diastolic_mmhg: number;
  measured_at: string;
  notes?: string | null;
}

async function fetchBPRecords(accessToken: string): Promise<BPRecord[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(
      `${API_URL}/api/v1/blood-pressure?period=90`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (!res.ok) return [];
    const data = await res.json();
    // Backend return shape: { items: [...], total: N }
    const items: BackendBPRecord[] = Array.isArray(data)
      ? data
      : (data?.items ?? data?.records ?? []);

    return items.map((r) => ({
      id: r.id,
      systolic_mmhg: r.systolic_mmhg,
      diastolic_mmhg: r.diastolic_mmhg,
      measured_at: r.measured_at,
      notes: r.notes ?? null,
      category: classifyBP(r.systolic_mmhg, r.diastolic_mmhg),
      is_critical: r.systolic_mmhg >= 180 || r.diastolic_mmhg >= 120,
    }));
  } catch {
    return [];
  }
}

export default async function BloodPressurePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const records = session.accessToken
    ? await fetchBPRecords(session.accessToken)
    : [];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-brand-charcoal md:text-3xl">
          Riwayat Tekanan Darah
        </h1>
        <p className="mt-1 text-sm text-brand-charcoal-soft">
          Catat dan pantau tekanan darah Anda secara berkala untuk evaluasi
          progres terapi.
        </p>
      </div>

      <BloodPressureView
        initialRecords={records}
        accessToken={session.accessToken}
      />
    </div>
  );
}
