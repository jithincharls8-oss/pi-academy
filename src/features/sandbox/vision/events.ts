/**
 * Event detection for the Event table symbol: periods during which a digital attribute was in
 * a given state (for example pump trips: Status = Tripped), found from recorded values.
 */
import type { TimedValue } from '@/core/sim/compression';

export interface StatePeriod {
  start: number;
  /** null while the event is still in progress at the end of the search range */
  end: number | null;
}

/**
 * Walk recorded values in time order and return each period in which `match` holds.
 * `initial` is the value at `start` (recorded values seldom fall exactly on the range start);
 * a period already open at `start` is reported from `start`.
 */
export function findPeriods(
  events: TimedValue[],
  initial: number | null,
  start: number,
  end: number,
  match: (v: number) => boolean,
): StatePeriod[] {
  const out: StatePeriod[] = [];
  let open: number | null = initial !== null && match(initial) ? start : null;
  const sorted = [...events].filter((e) => e.t > start && e.t <= end).sort((a, b) => a.t - b.t);
  for (const e of sorted) {
    const m = match(e.v);
    if (m && open === null) open = e.t;
    else if (!m && open !== null) {
      out.push({ start: open, end: e.t });
      open = null;
    }
  }
  if (open !== null) out.push({ start: open, end: null });
  return out;
}

export function formatDuration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m) return `${m}m ${String(sec).padStart(2, '0')}s`;
  return `${sec}s`;
}

/** Time range to show an event with some context either side (Apply Time Range). */
export function eventWindow(p: StatePeriod, now: number): { start: number; end: number } {
  const end = p.end ?? now;
  const pad = Math.max(15 * 60_000, (end - p.start) * 0.5);
  return { start: p.start - pad, end: Math.min(now, end + pad) };
}
