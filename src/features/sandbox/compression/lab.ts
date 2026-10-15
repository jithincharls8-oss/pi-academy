/**
 * Compression lab model: a custom signal generator, the exception -> compression pipeline with
 * counts and ratios, a plain-language reading of each swinging-door step, and teaching presets.
 * Lesson facts come from research/da.md (da.exception-compression).
 */
import {
  applyCompression,
  applyException,
  maxReconstructionError,
  type CompressionSettings,
  type DoorStep,
  type ExceptionSettings,
  type TimedValue,
} from '@/core/sim/compression';
import { mulberry32 } from '@/core/random/prng';

export interface SignalParams {
  base: number;
  sineAmp: number;
  sinePeriodMin: number;
  noise: number;
  /** minutes from the start; the step is applied from then on */
  stepAtMin: number;
  stepSize: number;
  rampPerHour: number;
  scanSec: number;
  durationMin: number;
  seed: number;
}

export const DEFAULT_SIGNAL: SignalParams = {
  base: 50,
  sineAmp: 4,
  sinePeriodMin: 30,
  noise: 0.4,
  stepAtMin: 35,
  stepSize: 3,
  rampPerHour: 0,
  scanSec: 5,
  durationMin: 60,
  seed: 7,
};

/** Deterministic custom signal: sine + uniform noise + step + ramp, sampled every scanSec. */
export function generateSignal(p: SignalParams, start: number): TimedValue[] {
  const rand = mulberry32(p.seed);
  const out: TimedValue[] = [];
  const stepMs = Math.max(1, p.scanSec) * 1000;
  const end = start + p.durationMin * 60_000;
  const period = Math.max(0.1, p.sinePeriodMin) * 60_000;
  for (let t = start; t <= end; t += stepMs) {
    const el = t - start;
    let v = p.base + p.sineAmp * Math.sin((2 * Math.PI * el) / period);
    if (el >= p.stepAtMin * 60_000) v += p.stepSize;
    v += (p.rampPerHour * el) / 3_600_000;
    v += p.noise * (rand() * 2 - 1);
    out.push({ t, v: Math.round(v * 1000) / 1000 });
  }
  return out;
}

export interface LabResult {
  raw: TimedValue[];
  sent: TimedValue[];
  archived: TimedValue[];
  steps: DoorStep[];
  stats: LabStats;
}

export interface LabStats {
  raw: number;
  sent: number;
  archived: number;
  /** percentage of raw scans removed by exception */
  exceptionReduction: number;
  /** percentage of sent events removed by compression */
  compressionReduction: number;
  /** percentage of raw scans not archived */
  totalReduction: number;
  /** raw scans per archived event (the "compression ratio", e.g. 3:1) */
  ratio: number;
  /** largest gap between the raw scans and the line redrawn from archived events */
  maxErrorRaw: number;
  /** largest gap between the snapshot events and that line (bounded by CompDev) */
  maxErrorSent: number;
}

function pct(part: number, whole: number): number {
  return whole === 0 ? 0 : (100 * (whole - part)) / whole;
}

export function runLab(
  raw: TimedValue[],
  exc: ExceptionSettings,
  comp: CompressionSettings,
): LabResult {
  const sent = applyException(raw, exc);
  const { archived, steps } = applyCompression(sent, comp);
  return {
    raw,
    sent,
    archived,
    steps,
    stats: {
      raw: raw.length,
      sent: sent.length,
      archived: archived.length,
      exceptionReduction: pct(sent.length, raw.length),
      compressionReduction: pct(archived.length, sent.length),
      totalReduction: pct(archived.length, raw.length),
      ratio: archived.length === 0 ? 0 : raw.length / archived.length,
      maxErrorRaw: maxReconstructionError(raw, archived),
      maxErrorSent: maxReconstructionError(sent, archived),
    },
  };
}

export type StepVerdict =
  | { kind: 'kept-all'; text: string }
  | { kind: 'compmin'; text: string }
  | { kind: 'held'; text: string }
  | { kind: 'door-broken'; text: string; archived: TimedValue }
  | { kind: 'compmax'; text: string };

const time = (t: number): string =>
  new Date(t).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

/** What happened at one swinging-door step, in words. */
export function explainStep(step: DoorStep, comp: CompressionSettings): StepVerdict {
  if (!comp.compressing) {
    return {
      kind: 'kept-all',
      text: 'Compressing is 0 (off), so every snapshot event is archived.',
    };
  }
  if (step.archived && step.archived.t === step.event.t) {
    return {
      kind: 'compmax',
      text: `CompMax: ${comp.compMax} s have passed since the last archived event, so this event is archived regardless of deviation and becomes the new anchor.`,
    };
  }
  if (step.archived) {
    return {
      kind: 'door-broken',
      archived: step.archived,
      text: `The line from the anchor to this event falls outside the door, so the held event at ${time(step.archived.t)} (the last one that still fitted) is archived. The door swings again from it.`,
    };
  }
  const dt = (step.event.t - step.anchor.t) / 1000;
  if (comp.compMin > 0 && dt < comp.compMin) {
    return {
      kind: 'compmin',
      text: `Only ${Math.round(dt)} s since the last archived event, less than CompMin (${comp.compMin} s): nothing may be archived yet, so the event is held.`,
    };
  }
  return {
    kind: 'held',
    text: `Inside the door: a straight line from the anchor still passes within CompDev (${comp.compDev}) of every held event. The event is held and the door narrows.`,
  };
}

export interface Preset {
  id: string;
  title: string;
  lesson: string;
  /** the research fact it demonstrates */
  fact: string;
  signal: SignalParams;
  exc: ExceptionSettings;
  comp: CompressionSettings;
}

const OFF: ExceptionSettings = { excDev: 0, excMin: 0, excMax: 0 };
const flat = (over: Partial<SignalParams>): SignalParams => ({
  ...DEFAULT_SIGNAL,
  sineAmp: 0,
  noise: 0,
  stepSize: 0,
  ...over,
});

export const PRESETS: Preset[] = [
  {
    id: 'compdev-zero',
    title: 'CompDev = 0 still drops flat lines',
    lesson:
      'A flat signal with one step, exception off, Compressing = 1 and CompDev = 0. Only the events needed to draw the corners are archived: the identical repeated values are dropped.',
    fact: 'CompDev = 0 with compression on still drops flat-lined (identical) values; use Compressing = 0 to store every event.',
    signal: flat({ base: 50, stepAtMin: 25, stepSize: 5 }),
    exc: OFF,
    comp: { compressing: true, compDev: 0, compMin: 0, compMax: 28800 },
  },
  {
    id: 'compressing-off',
    title: 'Compressing = 0 keeps everything',
    lesson:
      'With Compressing = 0 every snapshot event reaches the archive. With exception also off, archived equals raw: the full data volume.',
    fact: 'Compressing = 0 means every snapshot event is archived.',
    signal: { ...DEFAULT_SIGNAL, noise: 0.6 },
    exc: OFF,
    comp: { compressing: false, compDev: 0.5, compMin: 0, compMax: 28800 },
  },
  {
    id: 'excmin-blocks',
    title: 'ExcMin only blocks',
    lesson:
      'ExcMin = 30 s with a 5 s scan. Values that would pass ExcDev are not sent sooner than 30 s after the last sent value, and nothing is ever sent because of ExcMin. Compare the gaps between sent values.',
    fact: 'ExcMin never forces a value to be sent: it only blocks values that arrive too soon. It is typically 0.',
    signal: { ...DEFAULT_SIGNAL, noise: 1, sineAmp: 3 },
    exc: { excDev: 0.2, excMin: 30, excMax: 600 },
    comp: { compressing: true, compDev: 0.4, compMin: 0, compMax: 28800 },
  },
  {
    id: 'compmax-forces',
    title: 'CompMax forces a value',
    lesson:
      'A perfectly flat signal would archive almost nothing. CompMax = 300 s archives an event every 5 minutes regardless of deviation, which also shows that data is still being collected.',
    fact: 'After CompMax seconds since the last archived event, the next event is archived regardless of deviation.',
    signal: flat({ base: 20 }),
    exc: OFF,
    comp: { compressing: true, compDev: 0.5, compMin: 0, compMax: 300 },
  },
  {
    id: 'too-wide',
    title: 'Too wide deadband hides a real change',
    lesson:
      'A real 1.5-unit step at 30 minutes with ExcDev 1.5 and CompDev 3. Both deadbands are wider than the change, so the archive shows a slow drift and loses when the step happened.',
    fact: 'Setting deviations too wide filters meaningful changes; setting them too narrow keeps noise. Set CompDev at or below instrument precision.',
    signal: flat({ base: 50, noise: 0.2, stepAtMin: 30, stepSize: 1.5 }),
    exc: { excDev: 1.5, excMin: 0, excMax: 600 },
    comp: { compressing: true, compDev: 3, compMin: 0, compMax: 28800 },
  },
  {
    id: 'rule-of-thumb',
    title: 'Rule of thumb: ExcDev = ½ CompDev',
    lesson:
      'Noise of ±0.3 with ExcDev 0.25 and CompDev 0.5. Most of the noise never leaves the interface, the archive keeps the shape, and the error stays within CompDev of the sent events.',
    fact: 'AVEVA rule of thumb: ExcDev = ½ CompDev, with CompDev ≤ instrument precision.',
    signal: { ...DEFAULT_SIGNAL, noise: 0.3 },
    exc: { excDev: 0.25, excMin: 0, excMax: 600 },
    comp: { compressing: true, compDev: 0.5, compMin: 0, compMax: 28800 },
  },
];
