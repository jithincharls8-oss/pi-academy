/** Statistics for the XY plot: least-squares regression and the correlation coefficient. */

export interface Regression {
  slope: number;
  intercept: number;
  /** Pearson correlation coefficient, -1..1 */
  r: number;
}

export function regression(points: { x: number; y: number }[]): Regression | null {
  const n = points.length;
  if (n < 2) return null;
  let sx = 0;
  let sy = 0;
  for (const p of points) {
    sx += p.x;
    sy += p.y;
  }
  const mx = sx / n;
  const my = sy / n;
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (const p of points) {
    const dx = p.x - mx;
    const dy = p.y - my;
    sxx += dx * dx;
    syy += dy * dy;
    sxy += dx * dy;
  }
  if (sxx === 0) return null;
  const slope = sxy / sxx;
  const r = syy === 0 ? 0 : sxy / Math.sqrt(sxx * syy);
  return { slope, intercept: my - slope * mx, r };
}

/** Pair two series by timestamp (both sampled on the same interpolation grid). */
export function pairByTime(
  xs: { t: number; v: number }[],
  ys: { t: number; v: number }[],
): { x: number; y: number; t: number }[] {
  const yMap = new Map(ys.map((p) => [p.t, p.v]));
  const out: { x: number; y: number; t: number }[] = [];
  for (const p of xs) {
    const y = yMap.get(p.t);
    if (y !== undefined) out.push({ x: p.v, y, t: p.t });
  }
  return out;
}

/** Merge several series into rows keyed by timestamp for a Recharts line chart. */
export function mergeSeries(
  series: { key: string; points: { t: number; v: number }[] }[],
): Record<string, number>[] {
  const rows = new Map<number, Record<string, number>>();
  for (const s of series) {
    for (const p of s.points) {
      const row = rows.get(p.t) ?? { t: p.t };
      row[s.key] = p.v;
      rows.set(p.t, row);
    }
  }
  return [...rows.values()].sort((a, b) => (a['t'] ?? 0) - (b['t'] ?? 0));
}
