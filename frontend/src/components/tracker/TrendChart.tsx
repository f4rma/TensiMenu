import type { DailyScorePoint } from "./types";

interface TrendChartProps {
  points: DailyScorePoint[];
  /** Nilai threshold yang ditampilkan sebagai garis putus-putus */
  threshold?: number;
}

const VIEW_W = 600;
const VIEW_H = 200;
const PAD = { top: 20, right: 20, bottom: 28, left: 36 };

/**
 * SVG line chart untuk tren DASH Score harian.
 *
 * Design:
 * - Smooth curve via cubic Bezier (catmull-rom interpolation)
 * - Horizontal threshold line di nilai 60 ("Batas Baik")
 * - Markers untuk setiap data point
 * - Axis label minimalis di kiri (skor) dan bawah (label hari)
 *
 * Alasan tidak pakai Recharts: lebih ringan dan punya kontrol penuh atas
 * styling agar konsisten dengan brand (rounded corners, glass shadows).
 */
export default function TrendChart({ points, threshold = 60 }: TrendChartProps) {
  if (points.length === 0) {
    return <EmptyState />;
  }

  const innerW = VIEW_W - PAD.left - PAD.right;
  const innerH = VIEW_H - PAD.top - PAD.bottom;

  // Y axis: 0-100 fixed range (DASH score)
  const yMax = 100;
  const yMin = 0;

  const xStep = points.length > 1 ? innerW / (points.length - 1) : 0;
  const scaleX = (i: number) => PAD.left + i * xStep;
  const scaleY = (val: number) =>
    PAD.top + innerH - ((val - yMin) / (yMax - yMin)) * innerH;

  // Build smooth curve with Catmull-Rom → Bezier conversion
  const pathD = buildSmoothPath(points.map((p, i) => [scaleX(i), scaleY(p.score)]));
  const areaPath =
    pathD +
    ` L ${scaleX(points.length - 1)} ${scaleY(yMin)}` +
    ` L ${scaleX(0)} ${scaleY(yMin)} Z`;

  // Day labels — tampilkan hanya beberapa kalau periode panjang
  const labelStride = points.length <= 7 ? 1 : Math.ceil(points.length / 7);

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className="h-48 w-full"
      role="img"
      aria-label={`Grafik tren DASH Score, ${points.length} data poin`}
    >
      {/* Y-axis grid lines */}
      {[0, 25, 50, 75, 100].map((y) => (
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

      {/* Threshold line ("Batas Baik" 60) */}
      <line
        x1={PAD.left}
        x2={VIEW_W - PAD.right}
        y1={scaleY(threshold)}
        y2={scaleY(threshold)}
        stroke="#E11D48"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        opacity="0.5"
      />
      <text
        x={VIEW_W - PAD.right - 4}
        y={scaleY(threshold) - 6}
        textAnchor="end"
        className="fill-rose-600 text-[10px] font-medium"
      >
        Batas Baik ({threshold})
      </text>

      {/* Area fill (gradient) */}
      <defs>
        <linearGradient id="trendArea" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2B7C61" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#2B7C61" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#trendArea)" />

      {/* Main line */}
      <path
        d={pathD}
        fill="none"
        stroke="#2B7C61"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Data points */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={scaleX(i)}
          cy={scaleY(p.score)}
          r="3"
          fill="#FFFFFF"
          stroke="#2B7C61"
          strokeWidth="2"
        />
      ))}

      {/* X-axis labels */}
      {points.map((p, i) => {
        if (i % labelStride !== 0 && i !== points.length - 1) return null;
        return (
          <text
            key={i}
            x={scaleX(i)}
            y={VIEW_H - 6}
            textAnchor="middle"
            className="fill-brand-charcoal-muted text-[10px]"
          >
            {formatDayLabel(p.date)}
          </text>
        );
      })}
    </svg>
  );
}

/**
 * Convert series of (x, y) ke smooth SVG path pakai Catmull-Rom → Bezier.
 * Formula standar untuk smooth chart tanpa overshoot.
 */
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

function formatDayLabel(iso: string): string {
  const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return days[d.getDay()];
}

function EmptyState() {
  return (
    <div className="flex h-48 items-center justify-center rounded-2xl bg-brand-cream-soft">
      <p className="text-sm text-brand-charcoal-muted">
        Belum ada data untuk periode ini
      </p>
    </div>
  );
}
