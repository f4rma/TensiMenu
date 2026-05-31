import type { BPRecord } from "./types";

interface BPChartProps {
  records: BPRecord[];
  /** Garis ambang hipertensi: 130/80 mmHg (JNC 8) */
  hypertensionThreshold?: { systolic: number; diastolic: number };
}

const VIEW_W = 600;
const VIEW_H = 220;
const PAD = { top: 24, right: 24, bottom: 32, left: 36 };

const COLOR_SYSTOLIC = "#E11D48"; // rose-600
const COLOR_DIASTOLIC = "#2B7C61"; // brand-primary

/**
 * Dual-line chart untuk tren tekanan darah:
 * - Garis merah = sistolik
 * - Garis hijau brand = diastolik
 * - Garis putus-putus untuk threshold hipertensi (Req. 6.4)
 *
 * SVG vanilla biar ringan dan styling konsisten brand.
 */
export default function BPChart({
  records,
  hypertensionThreshold = { systolic: 130, diastolic: 80 },
}: BPChartProps) {
  if (records.length === 0) {
    return <EmptyChart />;
  }

  // Sort dari paling lama ke paling baru
  const sorted = [...records].sort(
    (a, b) =>
      new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime()
  );

  // Y axis: range 40-200 fixed (mencakup semua kategori normal-krisis)
  const yMin = 40;
  const yMax = 200;
  const innerW = VIEW_W - PAD.left - PAD.right;
  const innerH = VIEW_H - PAD.top - PAD.bottom;

  const xStep = sorted.length > 1 ? innerW / (sorted.length - 1) : 0;
  const scaleX = (i: number) => PAD.left + i * xStep;
  const scaleY = (val: number) =>
    PAD.top + innerH - ((val - yMin) / (yMax - yMin)) * innerH;

  // Build smooth paths
  const systolicPath = buildSmoothPath(
    sorted.map((r, i) => [scaleX(i), scaleY(r.systolic_mmhg)])
  );
  const diastolicPath = buildSmoothPath(
    sorted.map((r, i) => [scaleX(i), scaleY(r.diastolic_mmhg)])
  );

  // Y-axis labels (visual reference points)
  const yTicks = [60, 80, 100, 120, 140, 160, 180];

  // X-axis labels stride
  const labelStride = sorted.length <= 7 ? 1 : Math.ceil(sorted.length / 7);

  // Deteksi apakah ada >1 reading di hari yang sama → kalau ya, tampilkan
  // jam juga di label agar tidak muncul tanggal kembar yang membingungkan.
  const dayKeys = sorted.map((r) => new Date(r.measured_at).toDateString());
  const hasSameDayReadings = new Set(dayKeys).size < dayKeys.length;

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className="h-56 w-full"
      role="img"
      aria-label={`Grafik tekanan darah, ${sorted.length} catatan`}
    >
      {/* Y-axis grid + labels */}
      {yTicks.map((y) => (
        <g key={y}>
          <line
            x1={PAD.left}
            x2={VIEW_W - PAD.right}
            y1={scaleY(y)}
            y2={scaleY(y)}
            stroke="rgba(61, 61, 61, 0.05)"
            strokeWidth="1"
          />
          <text
            x={PAD.left - 6}
            y={scaleY(y)}
            textAnchor="end"
            dominantBaseline="middle"
            className="fill-brand-charcoal-muted text-[10px]"
          >
            {y}
          </text>
        </g>
      ))}

      {/* Threshold lines (hipertensi 130/80) */}
      <line
        x1={PAD.left}
        x2={VIEW_W - PAD.right}
        y1={scaleY(hypertensionThreshold.systolic)}
        y2={scaleY(hypertensionThreshold.systolic)}
        stroke={COLOR_SYSTOLIC}
        strokeWidth="1"
        strokeDasharray="4 4"
        opacity="0.4"
      />
      <line
        x1={PAD.left}
        x2={VIEW_W - PAD.right}
        y1={scaleY(hypertensionThreshold.diastolic)}
        y2={scaleY(hypertensionThreshold.diastolic)}
        stroke={COLOR_DIASTOLIC}
        strokeWidth="1"
        strokeDasharray="4 4"
        opacity="0.4"
      />

      {/* Diastolic (drawn first, behind systolic) */}
      <path
        d={diastolicPath}
        fill="none"
        stroke={COLOR_DIASTOLIC}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {sorted.map((r, i) => (
        <circle
          key={`d-${i}`}
          cx={scaleX(i)}
          cy={scaleY(r.diastolic_mmhg)}
          r="3"
          fill="#FFFFFF"
          stroke={COLOR_DIASTOLIC}
          strokeWidth="2"
        />
      ))}

      {/* Systolic */}
      <path
        d={systolicPath}
        fill="none"
        stroke={COLOR_SYSTOLIC}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {sorted.map((r, i) => (
        <circle
          key={`s-${i}`}
          cx={scaleX(i)}
          cy={scaleY(r.systolic_mmhg)}
          r="3"
          fill="#FFFFFF"
          stroke={COLOR_SYSTOLIC}
          strokeWidth="2"
        />
      ))}

      {/* X-axis labels */}
      {sorted.map((r, i) => {
        if (i % labelStride !== 0 && i !== sorted.length - 1) return null;
        return (
          <text
            key={i}
            x={scaleX(i)}
            y={VIEW_H - 8}
            textAnchor="middle"
            className="fill-brand-charcoal-muted text-[10px]"
          >
            {formatDayLabel(r.measured_at, hasSameDayReadings)}
          </text>
        );
      })}
    </svg>
  );
}

function buildSmoothPath(coords: [number, number][]): string {
  if (coords.length === 0) return "";
  if (coords.length === 1) {
    const [x, y] = coords[0];
    return `M ${x} ${y}`;
  }

  let d = `M ${coords[0][0]} ${coords[0][1]}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i - 1] ?? coords[i];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[i + 2] ?? p2;

    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;

    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

function formatDayLabel(iso: string, withTime = false): string {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
  ];
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const dayLabel = `${d.getDate()} ${months[d.getMonth()]}`;
  if (!withTime) return dayLabel;
  // Sertakan jam:menit kalau ada beberapa reading di hari yang sama
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${dayLabel} ${hh}:${mm}`;
}

function EmptyChart() {
  return (
    <div className="flex h-56 items-center justify-center rounded-2xl bg-brand-cream-soft">
      <p className="text-sm text-brand-charcoal-muted">
        Belum ada catatan tekanan darah untuk periode ini
      </p>
    </div>
  );
}
