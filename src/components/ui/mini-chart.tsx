import { cn } from "@/lib/utils";

type Point = { date: string; value: number };

/**
 * Dependency-free SVG area/line chart for a daily time series. Server-rendered,
 * no client JS. `format` labels the peak value in the corner.
 */
export function TrendChart({
  data,
  className,
  height = 120,
  format = (n) => String(n),
}: {
  data: Point[];
  className?: string;
  height?: number;
  format?: (n: number) => string;
}) {
  const W = 600;
  const H = height;
  const pad = 6;
  const max = Math.max(1, ...data.map((d) => d.value));
  const n = data.length;
  const x = (i: number) => pad + (i * (W - 2 * pad)) / Math.max(1, n - 1);
  const y = (v: number) => H - pad - (v / max) * (H - 2 * pad);

  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");
  const area = `${line} L${x(n - 1).toFixed(1)},${H - pad} L${x(0).toFixed(1)},${H - pad} Z`;
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className={cn("w-full", className)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" role="img" aria-label="Trend chart">
        <path d={area} className="fill-primary/10" />
        <path d={line} className="fill-none stroke-primary" strokeWidth={2} vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
        <span>{data[0]?.date.slice(5)}</span>
        <span>peak {format(max)} · total {format(total)}</span>
        <span>{data[n - 1]?.date.slice(5)}</span>
      </div>
    </div>
  );
}

/** Horizontal bar list — for "top N" / breakdown views. */
export function BarList({
  rows,
  format = (n) => String(n),
}: {
  rows: { label: string; value: number }[];
  format?: (n: number) => string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.length === 0) return <p className="py-4 text-center text-sm text-muted-foreground">No data yet.</p>;
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.label} className="text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate">{r.label}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">{format(r.value)}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
