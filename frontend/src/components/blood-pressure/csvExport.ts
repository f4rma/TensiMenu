import type { BPRecord } from "./types";

/**
 * Export BP records ke file CSV (Req. 6.7).
 * Header: id, systolic_mmhg, diastolic_mmhg, measured_at, notes
 *
 * Diimplement client-side dengan Blob API agar tidak perlu round-trip
 * ke backend untuk dataset kecil (< 1000 records).
 */
export function exportBPRecordsToCSV(records: BPRecord[]): void {
  if (records.length === 0) {
    alert("Tidak ada data untuk diekspor.");
    return;
  }

  const header = ["id", "systolic_mmhg", "diastolic_mmhg", "measured_at", "category", "notes"];
  const rows = records.map((r) => [
    r.id,
    String(r.systolic_mmhg),
    String(r.diastolic_mmhg),
    r.measured_at,
    r.category,
    escapeCsvField(r.notes ?? ""),
  ]);

  const csv = [header.join(","), ...rows.map((row) => row.join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });

  // Download via temporary anchor
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const today = new Date().toISOString().split("T")[0];
  link.href = url;
  link.download = `tekanan-darah-${today}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Escape field CSV: wrap dengan quotes kalau ada koma/quote/newline,
 * dan double-up internal quotes.
 */
function escapeCsvField(value: string): string {
  if (value === "") return "";
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
