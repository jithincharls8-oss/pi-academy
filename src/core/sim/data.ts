/**
 * Time-series access to the synthetic plant, shaped like the PI Data Archive's calls:
 * snapshot, recorded (archived) values, interpolated values, plot values and summaries.
 * Raw scans go through the point's exception settings, then swinging-door compression.
 */
import { applyCompression, applyException, interpolate, type TimedValue } from './compression';
import { digitalStateName, findPoint, rawValue, type SimPoint } from './plant';

/** Upper bound on raw scans generated for one request, to keep the browser responsive. */
const MAX_SCANS = 40_000;

export class UnknownPointError extends Error {
  constructor(tag: string) {
    super(`PI point "${tag}" was not found`);
  }
}

function point(tagOrPoint: string | SimPoint): SimPoint {
  if (typeof tagOrPoint !== 'string') return tagOrPoint;
  const p = findPoint(tagOrPoint);
  if (!p) throw new UnknownPointError(tagOrPoint);
  return p;
}

function quantise(p: SimPoint, v: number): number {
  if (p.pointtype === 'Digital' || p.pointtype === 'Int32') return Math.round(v);
  if (p.pointtype === 'Float32') return Math.round(v * 1000) / 1000;
  return v;
}

/** Raw scans at the point's scan rate (coarsened if the range would need too many). */
export function scans(tag: string | SimPoint, start: number, end: number): TimedValue[] {
  const p = point(tag);
  let stepMs = p.scan * 1000;
  const n = Math.ceil((end - start) / stepMs);
  if (n > MAX_SCANS) stepMs = Math.ceil((end - start) / MAX_SCANS / 1000) * 1000;
  const first = Math.ceil(start / stepMs) * stepMs;
  const out: TimedValue[] = [];
  for (let t = first; t <= end; t += stepMs) out.push({ t, v: quantise(p, rawValue(p, t)) });
  return out;
}

/** Values the interface sends to the snapshot (after exception). */
export function snapshotEvents(tag: string | SimPoint, start: number, end: number): TimedValue[] {
  const p = point(tag);
  return applyException(scans(p, start, end), {
    excDev: p.excdev,
    excMin: p.excmin,
    excMax: p.excmax,
  });
}

const cache = new Map<string, TimedValue[]>();

/** Archived (recorded) values in a range, after exception and compression. */
export function recorded(tag: string | SimPoint, start: number, end: number): TimedValue[] {
  const p = point(tag);
  const key = `${p.tag}|${start}|${end}`;
  const hit = cache.get(key);
  if (hit) return hit;
  // Start a little early so the first archived event is not simply the window start.
  const lead = Math.min(p.compmax * 1000, 2 * 3_600_000);
  const { archived } = applyCompression(snapshotEvents(p, start - lead, end), {
    compressing: p.compressing,
    compDev: p.compdev,
    compMin: p.compmin,
    compMax: p.compmax,
  });
  const inRange = archived.filter((e) => e.t >= start && e.t <= end);
  if (cache.size > 200) cache.clear();
  cache.set(key, inRange);
  return inRange;
}

/** Current value (the snapshot): the latest raw scan at or before `now`. */
export function snapshot(tag: string | SimPoint, now: number): TimedValue {
  const p = point(tag);
  const t = Math.floor(now / (p.scan * 1000)) * p.scan * 1000;
  return { t, v: quantise(p, rawValue(p, t)) };
}

/** Value at a time, interpolated from archived events (step points hold the previous value). */
export function valueAt(tag: string | SimPoint, t: number, now: number): number {
  const p = point(tag);
  if (t >= now) return snapshot(p, now).v;
  const window = recorded(p, t - p.compmax * 1000, Math.min(now, t + p.compmax * 1000));
  return interpolate(window, t, p.step) ?? snapshot(p, t).v;
}

/** Evenly spaced interpolated values. */
export function interpolated(
  tag: string | SimPoint,
  start: number,
  end: number,
  intervalMs: number,
  now: number,
): TimedValue[] {
  const p = point(tag);
  const rec = recorded(p, start - p.compmax * 1000, Math.min(end, now));
  const out: TimedValue[] = [];
  const step = Math.max(1000, intervalMs);
  for (let t = start; t <= end && out.length < 10_000; t += step) {
    const v = t >= now ? snapshot(p, now).v : interpolate(rec, t, p.step);
    if (v !== null) out.push({ t, v });
  }
  return out;
}

/**
 * Plot values: for each of `intervals` buckets keep the first, last, min and max archived
 * events, which is how PI clients draw long ranges without losing spikes.
 */
export function plotValues(
  tag: string | SimPoint,
  start: number,
  end: number,
  intervals: number,
): TimedValue[] {
  const rec = recorded(tag, start, end);
  if (rec.length <= intervals * 4) return rec;
  const width = (end - start) / intervals;
  const out: TimedValue[] = [];
  let i = 0;
  for (let b = 0; b < intervals; b++) {
    const bEnd = start + (b + 1) * width;
    const bucket: TimedValue[] = [];
    while (i < rec.length && (rec[i] as TimedValue).t <= bEnd) bucket.push(rec[i++] as TimedValue);
    if (!bucket.length) continue;
    const picks = new Set<TimedValue>([
      bucket[0] as TimedValue,
      bucket[bucket.length - 1] as TimedValue,
    ]);
    let mn = bucket[0] as TimedValue;
    let mx = bucket[0] as TimedValue;
    for (const e of bucket) {
      if (e.v < mn.v) mn = e;
      if (e.v > mx.v) mx = e;
    }
    picks.add(mn).add(mx);
    out.push(...[...picks].sort((a, c) => a.t - c.t));
  }
  return out;
}

export const SUMMARY_TYPES = [
  'Average',
  'Minimum',
  'Maximum',
  'Range',
  'Total',
  'Count',
  'StdDev',
  'PercentGood',
] as const;
export type SummaryType = (typeof SUMMARY_TYPES)[number];

/**
 * Summary over a range, time-weighted from archived values (as the Data Archive does by
 * default). Total integrates the value assuming a per-day rate, matching PI's convention.
 */
export function summary(
  tag: string | SimPoint,
  start: number,
  end: number,
  type: SummaryType,
  now: number,
): number {
  const p = point(tag);
  const stop = Math.min(end, now);
  const rec = recorded(p, start, stop);
  const startV = valueAt(p, start, now);
  const endV = valueAt(p, stop, now);
  const pts: TimedValue[] = [
    { t: start, v: startV },
    ...rec.filter((e) => e.t > start && e.t < stop),
    { t: stop, v: endV },
  ];
  switch (type) {
    case 'Count':
      return rec.length;
    case 'PercentGood':
      return 100;
    case 'Minimum':
      return Math.min(...pts.map((e) => e.v));
    case 'Maximum':
      return Math.max(...pts.map((e) => e.v));
    case 'Range':
      return Math.max(...pts.map((e) => e.v)) - Math.min(...pts.map((e) => e.v));
    default:
      break;
  }
  let area = 0;
  let area2 = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1] as TimedValue;
    const b = pts[i] as TimedValue;
    const dt = b.t - a.t;
    const mean = p.step ? a.v : (a.v + b.v) / 2;
    area += mean * dt;
    area2 += (p.step ? a.v * a.v : (a.v * a.v + a.v * b.v + b.v * b.v) / 3) * dt;
  }
  const span = stop - start;
  if (span <= 0) return startV;
  const avg = area / span;
  if (type === 'Average') return avg;
  if (type === 'Total') return area / 86_400_000;
  return Math.sqrt(Math.max(0, area2 / span - avg * avg));
}

/** Text for a value, using the digital set for digital points. */
export function formatValue(tag: string | SimPoint, v: number): string {
  const p = point(tag);
  if (p.pointtype === 'Digital') return digitalStateName(p.digitalset, v);
  if (p.pointtype === 'Int32') return String(Math.round(v));
  const decimals = p.span >= 1000 ? 0 : p.span >= 100 ? 1 : 2;
  return v.toFixed(decimals);
}

export function clearDataCache(): void {
  cache.clear();
}
