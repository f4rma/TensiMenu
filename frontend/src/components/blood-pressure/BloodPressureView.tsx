"use client";

import { useState, useMemo } from "react";
import { LineChart as ChartIcon, Plus, Download, Table2 } from "lucide-react";

import TipsSidebar from "./TipsSidebar";
import PeriodToggle from "./PeriodToggle";
import BPChart from "./BPChart";
import BPHistoryTable from "./BPHistoryTable";
import BPInputModal from "./BPInputModal";
import { exportBPRecordsToCSV } from "./csvExport";
import { classifyBP, type BPRecord, type Period } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface BloodPressureViewProps {
  initialRecords: BPRecord[];
  accessToken?: string;
}

/**
 * Orchestrator halaman Riwayat Tekanan Darah.
 * - Handle period filter
 * - Manage modal open/close state
 * - Optimistic update saat user submit catatan baru
 * - Trigger CSV export
 */
export default function BloodPressureView({
  initialRecords,
  accessToken,
}: BloodPressureViewProps) {
  const [records, setRecords] = useState<BPRecord[]>(initialRecords);
  const [period, setPeriod] = useState<Period>("30d");
  const [modalOpen, setModalOpen] = useState(false);

  const filteredRecords = useMemo(() => {
    const now = new Date();
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - days);
    return records.filter((r) => new Date(r.measured_at) >= cutoff);
  }, [records, period]);

  const handleSubmitBP = async (payload: {
    systolic_mmhg: number;
    diastolic_mmhg: number;
    measured_at: string;
    notes?: string;
  }) => {
    if (!accessToken) {
      throw new Error("Sesi tidak valid. Silakan login ulang.");
    }

    const response = await fetch(`${API_URL}/api/v1/blood-pressure`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const errMsg =
        body?.detail?.error ||
        (typeof body?.detail === "string" ? body.detail : null) ||
        "Gagal menyimpan catatan.";
      throw new Error(errMsg);
    }

    const created = await response.json();

    // Optimistic update — tambah ke list lokal, sort otomatis di table/chart
    const newRecord: BPRecord = {
      id: created.id ?? `tmp-${Date.now()}`,
      systolic_mmhg: payload.systolic_mmhg,
      diastolic_mmhg: payload.diastolic_mmhg,
      measured_at: payload.measured_at,
      notes: payload.notes ?? null,
      category: classifyBP(payload.systolic_mmhg, payload.diastolic_mmhg),
      is_critical:
        payload.systolic_mmhg >= 180 || payload.diastolic_mmhg >= 120,
    };
    setRecords((prev) => [newRecord, ...prev]);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* LEFT sidebar: Tips + CTA Input */}
        <aside className="flex flex-col gap-4 lg:col-span-3">
          <TipsSidebar />

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-2xl border-2 border-brand-charcoal/10 bg-white px-5 py-3.5 text-sm font-semibold text-brand-charcoal transition-all duration-200 hover:border-brand-primary hover:bg-brand-primary hover:text-white hover:shadow-brand-cta active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            Input Tekanan Darah
          </button>
        </aside>

        {/* RIGHT main: Chart + Table */}
        <main className="flex flex-col gap-5 lg:col-span-9">
          {/* Chart card */}
          <section className="rounded-3xl bg-white border border-brand-charcoal/5 p-5 shadow-glass-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <ChartIcon className="h-4 w-4 text-brand-primary" />
                <h2 className="text-base font-semibold tracking-tight text-brand-charcoal">
                  Grafik Tren Tekanan Darah
                </h2>
              </div>
              <PeriodToggle value={period} onChange={setPeriod} />
            </div>

            <div className="mt-4">
              <BPChart records={filteredRecords} />
            </div>

            {/* Legend */}
            <div className="mt-2 flex items-center justify-center gap-4 text-[11px]">
              <Legend color="bg-rose-500" label="Sistolik" />
              <Legend color="bg-brand-primary" label="Diastolik" />
            </div>
          </section>

          {/* Table card */}
          <section className="rounded-3xl bg-white border border-brand-charcoal/5 p-5 shadow-glass-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Table2 className="h-4 w-4 text-brand-primary" />
                <h2 className="text-base font-semibold tracking-tight text-brand-charcoal">
                  Tabel Riwayat
                </h2>
              </div>

              <button
                type="button"
                onClick={() => exportBPRecordsToCSV(records)}
                disabled={records.length === 0}
                className="inline-flex items-center gap-1.5 rounded-xl border border-brand-charcoal/10 bg-white px-3.5 py-1.5 text-xs font-semibold text-brand-charcoal transition-all duration-200 hover:border-brand-primary hover:text-brand-primary disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              >
                <Download className="h-3.5 w-3.5" />
                Ekspor CSV
              </button>
            </div>

            <BPHistoryTable records={filteredRecords} />
          </section>
        </main>
      </div>

      {/* Modal */}
      <BPInputModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmitBP}
      />
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-brand-charcoal-soft">
      <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}
