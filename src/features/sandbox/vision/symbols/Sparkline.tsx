import type { TimedValue } from '@/core/sim/compression';

/** Tiny inline trend for table rows. */
export function Sparkline({
  points,
  start,
  end,
  width = 90,
  height = 22,
  step = false,
}: {
  points: TimedValue[];
  start: number;
  end: number;
  width?: number;
  height?: number;
  step?: boolean;
}) {
  if (points.length < 2 || end <= start) return <span className="text-fg-muted">–</span>;
  const vs = points.map((p) => p.v);
  const min = Math.min(...vs);
  const max = Math.max(...vs);
  const span = max - min || 1;
  const x = (t: number): number => ((t - start) / (end - start)) * width;
  const y = (v: number): number => height - 2 - ((v - min) / span) * (height - 4);
  let d = '';
  points.forEach((p, i) => {
    const px = x(p.t).toFixed(1);
    const py = y(p.v).toFixed(1);
    if (i === 0) d += `M${px},${py}`;
    else if (step) d += `H${px}V${py}`;
    else d += `L${px},${py}`;
  });
  return (
    <svg width={width} height={height} aria-hidden className="block">
      <path d={d} fill="none" stroke="var(--chart-1)" strokeWidth={1.2} />
    </svg>
  );
}
