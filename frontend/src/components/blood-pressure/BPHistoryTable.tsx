import { Inbox } from "lucide-react";
import CategoryBadge from "./CategoryBadge";
import type { BPRecord } from "./types";

interface BPHistoryTableProps {
  records: BPRecord[];
}

/**
 * Tabel riwayat catatan tekanan darah.
 * - Sortable secara default by measured_at descending (terbaru di atas)
 * - Empty state untuk user baru
 * - Responsive: card-style di mobile, table di desktop
 */
export default function BPHistoryTable({ records }: BPHistoryTableProps) {
  if (records.length === 0) {
    return <EmptyState />;
  }

  // Sort terbaru di atas
  const sorted = [...records].sort(
    (a, b) =>
      new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime()
  );

  return (
    <>
      {/* Desktop: table view */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-brand-charcoal/5">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-brand-cream-soft text-[10px] font-semibold uppercase tracking-wider text-brand-charcoal-muted">
              <th className="px-4 py-3 text-left">Tanggal</th>
              <th className="px-4 py-3 text-left">Waktu</th>
              <th className="px-4 py-3 text-left">Sistolik</th>
              <th className="px-4 py-3 text-left">Diastolik</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Catatan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-charcoal/5 bg-white">
            {sorted.map((r) => {
              const date = new Date(r.measured_at);
              return (
                <tr
                  key={r.id}
                  className="transition-colors duration-150 hover:bg-brand-cream-soft/50"
                >
                  <td className="px-4 py-3 align-top">
                    <span className="text-xs leading-tight text-brand-charcoal whitespace-pre-line">
                      {formatDateMultiline(date)}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top text-xs text-brand-charcoal-soft tabular-nums">
                    {formatTime(date)}
                  </td>
                  <td className="px-4 py-3 align-top text-sm font-bold tabular-nums text-brand-charcoal">
                    {r.systolic_mmhg}
                  </td>
                  <td className="px-4 py-3 align-top text-sm font-bold tabular-nums text-brand-charcoal">
                    {r.diastolic_mmhg}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <CategoryBadge category={r.category} />
                  </td>
                  <td className="px-4 py-3 align-top text-xs text-brand-charcoal-soft max-w-xs">
                    {r.notes || (
                      <span className="italic text-brand-charcoal-muted">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: card list */}
      <div className="md:hidden flex flex-col gap-2.5">
        {sorted.map((r) => {
          const date = new Date(r.measured_at);
          return (
            <div
              key={r.id}
              className="rounded-2xl border border-brand-charcoal/5 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-brand-charcoal-soft">
                    {formatDateInline(date)} · {formatTime(date)}
                  </p>
                  <p className="mt-1 text-lg font-bold tabular-nums text-brand-charcoal">
                    {r.systolic_mmhg}
                    <span className="mx-1 text-brand-charcoal-muted">/</span>
                    {r.diastolic_mmhg}
                    <span className="ml-1 text-xs font-normal text-brand-charcoal-soft">
                      mmHg
                    </span>
                  </p>
                </div>
                <CategoryBadge category={r.category} />
              </div>
              {r.notes && (
                <p className="mt-2 text-xs text-brand-charcoal-soft border-t border-brand-charcoal/5 pt-2">
                  {r.notes}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function formatDateMultiline(d: Date): string {
  const day = d.getDate();
  const months = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
  ];
  // 2 baris: "24\nMei 2026"
  return `${day}\n${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatDateInline(d: Date): string {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-brand-charcoal/15 bg-brand-cream-soft px-6 py-10 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary mb-3">
        <Inbox className="h-5 w-5" strokeWidth={2} />
      </span>
      <p className="text-sm font-semibold text-brand-charcoal">
        Belum ada catatan
      </p>
      <p className="mt-1 text-xs text-brand-charcoal-soft">
        Catat tekanan darah pertama Anda untuk mulai melihat tren.
      </p>
    </div>
  );
}
