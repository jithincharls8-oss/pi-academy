/**
 * Exception and swinging-door compression as taught in the PI System documentation and
 * training material:
 * - Exception (interface side): send a value when it differs from the last *sent* value by more
 *   than ExcDev, or when ExcMax seconds have passed; never sooner than ExcMin. When a value
 *   passes, the previous (held) value is sent too, so the change is drawn in the right place.
 * - Compression (Data Archive side): keep the events needed to redraw the signal as straight
 *   lines that stay within CompDev of every dropped value; archive regardless after CompMax;
 *   never sooner than CompMin. Identical repeated values are dropped even with CompDev = 0.
 *
 * This is a teaching implementation of the published behaviour. AVEVA's exact algorithm (for
 * example how slopes are seeded and rounded) is not public, so archived counts can differ
 * slightly from a real server.
 */

export interface TimedValue {
  /** epoch milliseconds */
  t: number;
  v: number;
}

export interface ExceptionSettings {
  excDev: number;
  /** seconds */
  excMin: number;
  /** seconds */
  excMax: number;
}

export interface CompressionSettings {
  compressing: boolean;
  compDev: number;
  /** seconds */
  compMin: number;
  /** seconds */
  compMax: number;
}

/** Interface-side exception test. Returns the values that would be sent to the snapshot. */
export function applyException(samples: readonly TimedValue[], s: ExceptionSettings): TimedValue[] {
  if (samples.length === 0) return [];
  const disabled = s.excDev <= 0 && s.excMin <= 0 && s.excMax <= 0;
  if (disabled) return [...samples];
  const first = samples[0] as TimedValue;
  const out: TimedValue[] = [first];
  let lastSent = first;
  let held: TimedValue | null = null;
  for (let i = 1; i < samples.length; i++) {
    const cur = samples[i] as TimedValue;
    const dt = (cur.t - lastSent.t) / 1000;
    const tooSoon = s.excMin > 0 && dt < s.excMin;
    const passes =
      !tooSoon && (Math.abs(cur.v - lastSent.v) > s.excDev || (s.excMax > 0 && dt >= s.excMax));
    if (passes) {
      if (held && held.t !== lastSent.t) out.push(held);
      out.push(cur);
      lastSent = cur;
      held = null;
    } else {
      held = cur;
    }
  }
  return out;
}

export interface DoorStep {
  /** the event under test */
  event: TimedValue;
  /** the last archived event (the door's hinge) */
  anchor: TimedValue;
  /** slope limits of the door after this event, in value units per millisecond */
  upper: number;
  lower: number;
  archived: TimedValue | null;
}

/**
 * Swinging-door compression over snapshot events. Returns the archived events and, for
 * teaching, the door state after each event.
 */
export function applyCompression(
  events: readonly TimedValue[],
  s: CompressionSettings,
): { archived: TimedValue[]; steps: DoorStep[] } {
  if (events.length === 0) return { archived: [], steps: [] };
  if (!s.compressing) {
    return {
      archived: [...events],
      steps: events.map((e) => ({ event: e, anchor: e, upper: 0, lower: 0, archived: e })),
    };
  }
  const first = events[0] as TimedValue;
  const archived: TimedValue[] = [first];
  const steps: DoorStep[] = [];
  let anchor = first;
  let held: TimedValue | null = null; // the snapshot: last event received, not yet archived
  let upper = Infinity;
  let lower = -Infinity;

  const archive = (e: TimedValue): void => {
    archived.push(e);
    anchor = e;
    upper = Infinity;
    lower = -Infinity;
  };

  for (let i = 1; i < events.length; i++) {
    const cur = events[i] as TimedValue;
    const dt = cur.t - anchor.t;
    let archivedNow: TimedValue | null = null;
    if (dt <= 0) continue;

    if (s.compMin > 0 && dt / 1000 < s.compMin) {
      held = cur;
      steps.push({ event: cur, anchor, upper, lower, archived: null });
      continue;
    }

    // Door test: is the new event outside the band the door still allows?
    const slope = (cur.v - anchor.v) / dt;
    if ((slope > upper || slope < lower) && held) {
      // Archive the held snapshot (the last value that still fitted) and swing a new door from it.
      archivedNow = held;
      archive(held);
    }
    const sinceArchive = (cur.t - anchor.t) / 1000;
    if (s.compMax > 0 && sinceArchive >= s.compMax) {
      // CompMax: archive this event regardless of deviation.
      archivedNow = cur;
      archive(cur);
      held = null;
    } else {
      // Narrow the door so every dropped event stays within CompDev of the line.
      const d = cur.t - anchor.t;
      upper = Math.min(upper, (cur.v + s.compDev - anchor.v) / d);
      lower = Math.max(lower, (cur.v - s.compDev - anchor.v) / d);
      held = cur;
    }
    steps.push({ event: cur, anchor, upper, lower, archived: archivedNow });
  }
  // The latest snapshot is always visible to clients; archive it at the end of the window so a
  // chart of the window ends at the current value.
  if (held && held.t !== anchor.t) archived.push(held);
  return { archived, steps };
}

/** Linear interpolation over archived events, the way PI clients draw a non-step trend. */
export function interpolate(points: readonly TimedValue[], t: number, step = false): number | null {
  if (points.length === 0) return null;
  const first = points[0] as TimedValue;
  const last = points[points.length - 1] as TimedValue;
  if (t < first.t) return null;
  if (t >= last.t) return last.v;
  let lo = 0;
  let hi = points.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if ((points[mid] as TimedValue).t <= t) lo = mid;
    else hi = mid;
  }
  const a = points[lo] as TimedValue;
  const b = points[hi] as TimedValue;
  if (step || b.t === a.t) return a.v;
  return a.v + ((b.v - a.v) * (t - a.t)) / (b.t - a.t);
}

/** Largest gap between the original samples and the line redrawn from the archived events. */
export function maxReconstructionError(
  original: readonly TimedValue[],
  archived: readonly TimedValue[],
): number {
  let worst = 0;
  for (const p of original) {
    const v = interpolate(archived, p.t);
    if (v !== null) worst = Math.max(worst, Math.abs(v - p.v));
  }
  return worst;
}
