/**
 * Simplified PI DataLink worksheet functions over the synthetic plant, with the names and
 * argument order of the DataLink user guide (research/dev2.md, dev2.datalink-functions), plus
 * the handful of Excel functions a report needs. Where the research leaves behaviour open
 * (outcode layouts, count placement, exact error texts) the behaviour here is deliberately
 * simple and each function's `simplified` note says so in the UI.
 */
import { interpolate, type TimedValue } from '@/core/sim/compression';
import {
  formatValue,
  interpolated,
  recorded,
  snapshot,
  summary,
  valueAt,
  type SummaryType,
} from '@/core/sim/data';
import { run, peContext } from '@/core/sim/expr';
import { DATA_SERVER, findPoint, type SimPoint } from '@/core/sim/plant';
import { parsePiTime, parseTimeRange, TimeParseError } from '@/core/sim/time';
import {
  CellError,
  EMPTY,
  bool,
  date,
  fail,
  fromSerial,
  isArray,
  num,
  piErr,
  scalar,
  str,
  toNumber,
  toText,
  type CellValue,
  type Value,
} from './values';

export interface FnContext {
  now: number;
}

export type SheetFunction = (args: Value[], ctx: FnContext) => Value;

/* ---------------------------------------------------------------- argument helpers */

function arg(args: Value[], i: number): CellValue {
  const v = args[i];
  return v ? scalar(v) : EMPTY;
}

function text(args: Value[], i: number): string {
  return toText(arg(args, i)).trim();
}

function optNumber(args: Value[], i: number, dflt: number): number {
  const v = arg(args, i);
  return v.kind === 'empty' ? dflt : toNumber(v);
}

function server(args: Value[], i: number): void {
  const s = text(args, i).replace(/^\\\\/, '');
  if (s !== '' && s.toUpperCase() !== DATA_SERVER) {
    fail(
      'PI',
      `PI Data Archive "${s}" is not known here. Leave it blank or use \\\\${DATA_SERVER}.`,
    );
  }
}

function tag(args: Value[], i: number): SimPoint {
  const raw = text(args, i);
  if (raw === '') fail('PI', 'Enter a tag name');
  const name = raw.replace(/^\\\\[^\\]+\\/, '');
  const p = findPoint(name);
  if (!p) fail('PI', `Tag not found: ${raw}`);
  return p;
}

/** A time argument: PI time text, a date cell, or an Excel serial number. */
function timeOf(v: CellValue, now: number, relativeTo = now): number {
  if (v.kind === 'date') return v.value;
  if (v.kind === 'number') return fromSerial(v.value);
  if (v.kind === 'empty') return fail('#VALUE!', 'A time is required');
  try {
    return parsePiTime(toText(v), now, relativeTo);
  } catch (e) {
    return fail('#VALUE!', e instanceof TimeParseError ? e.message : 'Invalid time');
  }
}

function timeRange(args: Value[], i: number, now: number): { start: number; end: number } {
  const a = arg(args, i);
  const b = arg(args, i + 1);
  if (a.kind === 'string' && b.kind === 'string') {
    try {
      return parseTimeRange(a.value, b.value, now);
    } catch (e) {
      return fail('#VALUE!', e instanceof TimeParseError ? e.message : 'Invalid time');
    }
  }
  const start = timeOf(a, now);
  return { start, end: timeOf(b, now, start) };
}

/** Interval text such as "1h", "15m", "30s", "1d". */
export function intervalMs(v: CellValue): number {
  const s = toText(v).trim().toLowerCase();
  const m =
    /^(\d+(?:\.\d+)?)\s*(s|sec|secs|seconds?|m|min|mins|minutes?|h|hr|hours?|d|days?)$/.exec(s);
  if (!m) return fail('#VALUE!', `"${s}" is not an interval. Use for example 1h, 15m or 30s.`);
  const unit = (m[2] ?? 's')[0];
  const ms = unit === 's' ? 1000 : unit === 'm' ? 60_000 : unit === 'h' ? 3_600_000 : 86_400_000;
  const out = Number(m[1]) * ms;
  if (out < 1000) return fail('#VALUE!', 'The interval must be at least 1 second');
  return out;
}

function pointCell(p: SimPoint, v: number): CellValue {
  return p.pointtype === 'Digital' ? str(formatValue(p, v)) : num(v);
}

/** Lay records (one per event) out as rows (column orientation) or transpose them. */
function layout(records: CellValue[][], rowOrientation: boolean): Value {
  if (records.length === 0) return piErr('No events found');
  if (!rowOrientation) return { kind: 'array', rows: records };
  const width = Math.max(...records.map((r) => r.length));
  const rows: CellValue[][] = [];
  for (let c = 0; c < width; c++) rows.push(records.map((r) => r[c] ?? EMPTY));
  return { kind: 'array', rows };
}

/* ---------------------------------------------------------------- retrieval modes */

export const ARCHIVE_MODES = [
  'previous',
  'previous only',
  'interpolated',
  'auto',
  'next',
  'next only',
  'exact time',
] as const;
export type ArchiveMode = (typeof ARCHIVE_MODES)[number];

function archiveMode(s: string, dflt: ArchiveMode): ArchiveMode {
  const k = s.trim().toLowerCase().replace(/\s+/g, ' ');
  if (k === '') return dflt;
  const m = ARCHIVE_MODES.find((x) => x === k);
  if (!m) return fail('#VALUE!', `Unknown mode "${s}". Use ${ARCHIVE_MODES.join(', ')}.`);
  return m;
}

/** Archived events around a time, widening the search until something is found. */
function eventsAround(p: SimPoint, t: number, now: number): TimedValue[] {
  for (let w = 3_600_000; w <= 8 * 86_400_000; w *= 4) {
    const ev = recorded(p, t - w, Math.min(now, t + w));
    const before = ev.some((e) => e.t <= t);
    const after = t >= now || ev.some((e) => e.t >= t);
    if (before && after) return ev;
  }
  return recorded(p, t - 8 * 86_400_000, Math.min(now, t + 8 * 86_400_000));
}

/** One value at a time using a DataLink retrieval mode. */
export function archiveValue(p: SimPoint, t: number, mode: ArchiveMode, now: number): CellValue {
  if (t >= now && mode !== 'exact time') {
    const s = snapshot(p, now);
    return pointCell(p, s.v);
  }
  const ev = eventsAround(p, t, now);
  const prev = (inclusive: boolean): TimedValue | undefined => {
    let out: TimedValue | undefined;
    for (const e of ev) if (inclusive ? e.t <= t : e.t < t) out = e;
    return out;
  };
  const next = (inclusive: boolean): TimedValue | undefined =>
    ev.find((e) => (inclusive ? e.t >= t : e.t > t));
  const pick = (e: TimedValue | undefined): CellValue =>
    e ? pointCell(p, e.v) : piErr('No events found');
  switch (mode) {
    case 'previous':
      return pick(prev(true));
    case 'previous only':
      return pick(prev(false));
    case 'next':
      return pick(next(true));
    case 'next only':
      return pick(next(false));
    case 'exact time':
      return pick(ev.find((e) => e.t === t));
    case 'interpolated':
      if (p.step) return pick(prev(false));
      return pointCell(p, interpolate(ev, t) ?? valueAt(p, t, now));
    case 'auto':
      if (p.step) return pick(prev(true));
      return pointCell(p, interpolate(ev, t) ?? valueAt(p, t, now));
  }
}

/* ---------------------------------------------------------------- calculations */

export const CALC_MODES = [
  'total',
  'average',
  'mean',
  'minimum',
  'maximum',
  'range',
  'standard deviation',
  'count',
] as const;
export type CalcMode = (typeof CALC_MODES)[number];

function calcMode(s: string): CalcMode {
  // Accept the modern spelling "average (timeweighted)" as well as "average".
  const k = s
    .toLowerCase()
    .replace(/\(.*\)/, '')
    .trim();
  const alias: Record<string, CalcMode> = {
    avg: 'average',
    min: 'minimum',
    max: 'maximum',
    stdev: 'standard deviation',
    'std dev': 'standard deviation',
    'std deviation': 'standard deviation',
  };
  const m = CALC_MODES.find((x) => x === k) ?? alias[k];
  if (!m) return fail('#VALUE!', `Unknown mode "${s}". Use ${CALC_MODES.join(', ')}.`);
  return m;
}

function calcBasis(s: string): 'time-weighted' | 'event-weighted' {
  const k = s.trim().toLowerCase().replace(/\s+/g, '-');
  if (k === '' || k === 'time-weighted' || k === 'timeweighted') return 'time-weighted';
  if (k === 'event-weighted' || k === 'eventweighted') return 'event-weighted';
  return fail('#VALUE!', `Unknown calculation basis "${s}". Use time-weighted or event-weighted.`);
}

const SUMMARY_FOR: Record<Exclude<CalcMode, 'mean'>, SummaryType> = {
  total: 'Total',
  average: 'Average',
  minimum: 'Minimum',
  maximum: 'Maximum',
  range: 'Range',
  'standard deviation': 'StdDev',
  count: 'Count',
};

/** One calculated value over a range. Throws a CellError for DataLink messages. */
export function calcValue(
  p: SimPoint,
  start: number,
  end: number,
  mode: CalcMode,
  basis: 'time-weighted' | 'event-weighted',
  cfactor: number,
  now: number,
): number {
  if (start >= end) fail('#VALUE!', 'The start time must be before the end time');
  if (start >= now) fail('PI', 'No data: the range starts in the future');
  if (p.pointtype === 'Digital' && mode !== 'count') {
    fail('PI', `Calculation "${mode}" is not available for the digital tag ${p.tag}`);
  }
  if (basis === 'time-weighted' && mode !== 'mean') {
    const v = summary(p, start, end, SUMMARY_FOR[mode], now);
    return mode === 'total' ? v * cfactor : v;
  }
  const ev = recorded(p, start, Math.min(end, now)).map((e) => e.v);
  if (mode === 'count') return ev.length;
  if (ev.length === 0) fail('PI', 'No events found');
  const sum = ev.reduce((a, b) => a + b, 0);
  const mean = sum / ev.length;
  switch (mode) {
    case 'total':
      return sum * cfactor;
    case 'average':
    case 'mean':
      return mean;
    case 'minimum':
      return Math.min(...ev);
    case 'maximum':
      return Math.max(...ev);
    case 'range':
      return Math.max(...ev) - Math.min(...ev);
    case 'standard deviation': {
      if (ev.length < 2) fail('PI', 'Standard deviation needs at least two events');
      const ss = ev.reduce((a, b) => a + (b - mean) ** 2, 0);
      return Math.sqrt(ss / (ev.length - 1));
    }
  }
}

function calcOutcode(code: number): { ts: boolean; row: boolean; pct: boolean } {
  if (![0, 1, 2, 4, 5, 6, 7].includes(code)) {
    fail(
      '#VALUE!',
      `Outcode ${code} is not valid for calculation functions (use 0, 1, 2, 4, 5, 6 or 7, not 3)`,
    );
  }
  // 0/1/4/5 are column layouts; 2, 6 and 7 transpose them into rows.
  const row = code === 2 || code === 6 || code === 7;
  const ts = code === 1 || code === 5 || code === 7;
  const pct = code >= 4;
  return { ts, row, pct };
}

/* ---------------------------------------------------------------- DataLink functions */

const PICurrVal: SheetFunction = (args, { now }) => {
  const p = tag(args, 0);
  const outcode = optNumber(args, 1, 0);
  server(args, 2);
  const s = snapshot(p, now);
  if (!(outcode & 1)) return pointCell(p, s.v);
  return layout([[date(s.t), pointCell(p, s.v)]], Boolean(outcode & 2));
};

const PIArcVal: SheetFunction = (args, { now }) => {
  const p = tag(args, 0);
  const t = timeOf(arg(args, 1), now);
  const outcode = optNumber(args, 2, 0);
  server(args, 3);
  const mode = archiveMode(text(args, 4), 'auto');
  const v = archiveValue(p, t, mode, now);
  if (!(outcode & 1) || v.kind === 'error') return v;
  return layout([[date(t), v]], Boolean(outcode & 2));
};

function convertExpr(v: ReturnType<typeof run>): CellValue {
  if (!v.ok) return fail('PI', `Expression error: ${v.error}`);
  switch (v.value.type) {
    case 'number':
      return num(v.value.value);
    case 'string':
      return str(v.value.value);
    case 'boolean':
      return bool(v.value.value);
    case 'time':
      return date(v.value.value);
    case 'nooutput':
      return piErr('No output');
  }
}

const PIExpVal: SheetFunction = (args, { now }) => {
  const expr = text(args, 0);
  if (expr === '') fail('PI', 'Enter a performance equation');
  const tv = arg(args, 1);
  const t = tv.kind === 'empty' ? now : timeOf(tv, now);
  server(args, 2);
  return convertExpr(run(expr, peContext(now, Math.min(t, now))));
};

export const BOUNDARY_TYPES = ['inside', 'outside', 'interpolated', 'auto'] as const;
export type BoundaryType = (typeof BOUNDARY_TYPES)[number];

function boundary(s: string): BoundaryType {
  const k = s.trim().toLowerCase();
  if (k === '') return 'inside';
  const m = BOUNDARY_TYPES.find((x) => x === k);
  if (!m) return fail('#VALUE!', `Unknown boundary type "${s}". Use ${BOUNDARY_TYPES.join(', ')}.`);
  return m;
}

/** Compressed (archived) events for a range with a DataLink boundary type. */
export function compressedEvents(
  p: SimPoint,
  start: number,
  end: number,
  mode: BoundaryType,
  now: number,
): TimedValue[] {
  const lo = Math.min(start, end);
  const hi = Math.min(Math.max(start, end), now);
  if (lo >= now) return [];
  const inside = recorded(p, lo, hi);
  let out = inside;
  const effective = mode === 'auto' ? (p.step ? 'inside' : 'interpolated') : mode;
  if (effective === 'outside') {
    const before = eventsAround(p, lo, now).filter((e) => e.t < lo);
    const after = hi < now ? eventsAround(p, hi, now).filter((e) => e.t > hi) : [];
    out = [
      ...(before.length ? [before[before.length - 1] as TimedValue] : []),
      ...inside,
      ...(after.length ? [after[0] as TimedValue] : []),
    ];
  } else if (effective === 'interpolated') {
    const middle = inside.filter((e) => e.t > lo && e.t < hi);
    out = [{ t: lo, v: valueAt(p, lo, now) }, ...middle, { t: hi, v: valueAt(p, hi, now) }];
  }
  return start > end ? [...out].reverse() : out;
}

function eventRecords(p: SimPoint, ev: TimedValue[], timestamps: boolean): CellValue[][] {
  return ev.map((e) => (timestamps ? [date(e.t), pointCell(p, e.v)] : [pointCell(p, e.v)]));
}

/** Outcode bits for compressed data: 1 timestamps, 2 row orientation, 8 hide count. */
function compressedOutput(p: SimPoint, ev: TimedValue[], outcode: number): Value {
  if (ev.length === 0) return piErr('No events found');
  const ts = Boolean(outcode & 1);
  const records = eventRecords(p, ev, ts);
  if (!(outcode & 8)) records.unshift(ts ? [num(ev.length), EMPTY] : [num(ev.length)]);
  return layout(records, Boolean(outcode & 2));
}

const PICompDat: SheetFunction = (args, { now }) => {
  const p = tag(args, 0);
  const { start, end } = timeRange(args, 1, now);
  const outcode = optNumber(args, 3, 0);
  server(args, 4);
  const mode = boundary(text(args, 5));
  return compressedOutput(p, compressedEvents(p, start, end, mode, now), outcode);
};

const PINCompDat: SheetFunction = (args, { now }) => {
  const p = tag(args, 0);
  const start = timeOf(arg(args, 1), now);
  const n = Math.trunc(optNumber(args, 2, 0));
  if (n === 0) fail('#VALUE!', 'numvals must not be 0 (negative counts backward in time)');
  if (Math.abs(n) > 5000) fail('#VALUE!', 'This sandbox returns at most 5000 values');
  const outcode = optNumber(args, 3, 0);
  server(args, 4);
  let ev: TimedValue[] = [];
  for (let w = 3_600_000; w <= 32 * 86_400_000; w *= 2) {
    ev =
      n > 0
        ? start >= now
          ? []
          : recorded(p, start, Math.min(now, start + w))
        : recorded(p, start - w, Math.min(start, now));
    if (ev.length >= Math.abs(n) || (n > 0 && start + w >= now)) break;
  }
  ev = n > 0 ? ev.slice(0, n) : ev.slice(-Math.abs(n)).reverse();
  return compressedOutput(p, ev, outcode);
};

const PISampDat: SheetFunction = (args, { now }) => {
  const p = tag(args, 0);
  const { start, end } = timeRange(args, 1, now);
  const ms = intervalMs(arg(args, 3));
  const outcode = optNumber(args, 4, 0);
  server(args, 5);
  if (![0, 1, 2, 3].includes(outcode)) fail('#VALUE!', 'Sampled data outcodes are 0, 1, 2 or 3');
  const lo = Math.min(start, end);
  const hi = Math.min(Math.max(start, end), now);
  if (lo >= now) return piErr('No events found');
  if ((hi - lo) / ms > 5000) fail('#VALUE!', 'More than 5000 samples: use a longer interval');
  let vals = interpolated(p, lo, hi, ms, now);
  if (start > end) vals = [...vals].reverse();
  return layout(eventRecords(p, vals, outcode === 1 || outcode === 3), outcode >= 2);
};

const PITimeDat: SheetFunction = (args, { now }) => {
  const p = tag(args, 0);
  const stamps = args[1] ?? EMPTY;
  server(args, 2);
  const mode = archiveMode(text(args, 3), 'interpolated');
  const one = (v: CellValue): CellValue => {
    if (v.kind === 'empty') return EMPTY;
    if (v.kind === 'error') return v;
    try {
      return archiveValue(p, timeOf(v, now), mode, now);
    } catch (e) {
      if (e instanceof CellError) return e.value;
      throw e;
    }
  };
  if (!isArray(stamps)) return one(stamps);
  return { kind: 'array', rows: stamps.rows.map((r) => r.map(one)) };
};

function calcRecord(
  p: SimPoint,
  start: number,
  end: number,
  args: Value[],
  first: number,
  now: number,
): { value: CellValue; out: { ts: boolean; row: boolean; pct: boolean } } {
  const mode = calcMode(text(args, first));
  const basis = calcBasis(text(args, first + 1));
  const minPct = optNumber(args, first + 2, 0);
  const cfactor = optNumber(args, first + 3, 1);
  const out = calcOutcode(optNumber(args, first + 4, 0));
  server(args, first + 5);
  if (minPct > 100) fail('PI', 'minpctgood above 100 can never be met');
  return { value: num(calcValue(p, start, end, mode, basis, cfactor, now)), out };
}

/** The sandbox's data is always 100 % good. */
const PERCENT_GOOD = 100;

const PIAdvCalcVal: SheetFunction = (args, { now }) => {
  const p = tag(args, 0);
  const { start, end } = timeRange(args, 1, now);
  const { value, out } = calcRecord(p, start, end, args, 3, now);
  const rec: CellValue[] = [
    ...(out.ts ? [date(start)] : []),
    value,
    ...(out.pct ? [num(PERCENT_GOOD)] : []),
  ];
  if (rec.length === 1) return value;
  return layout([rec], out.row);
};

const PIAdvCalcDat: SheetFunction = (args, { now }) => {
  const p = tag(args, 0);
  const { start, end } = timeRange(args, 1, now);
  const ms = intervalMs(arg(args, 3));
  if (end <= start) fail('#VALUE!', 'The start time must be before the end time');
  if ((end - start) / ms > 2000) fail('#VALUE!', 'More than 2000 intervals: use a longer interval');
  const records: CellValue[][] = [];
  let out = { ts: false, row: false, pct: false };
  for (let t = start; t < end && t < now; t += ms) {
    const r = calcRecord(p, t, Math.min(t + ms, end), args, 4, now);
    out = r.out;
    records.push([...(out.ts ? [date(t)] : []), r.value, ...(out.pct ? [num(PERCENT_GOOD)] : [])]);
  }
  if (records.length === 0) {
    calcRecord(p, start, end, args, 4, now);
    return piErr('No data: the range starts in the future');
  }
  return layout(records, out.row);
};

/* ---------------------------------------------------------------- Excel functions */

function flatten(args: Value[]): CellValue[] {
  const out: CellValue[] = [];
  for (const a of args) {
    if (isArray(a)) for (const r of a.rows) out.push(...r);
    else out.push(a);
  }
  return out;
}

function numbersOf(args: Value[]): number[] {
  const out: number[] = [];
  for (const a of args) {
    if (isArray(a)) {
      for (const r of a.rows)
        for (const c of r) {
          if (c.kind === 'error') throw new CellError(c);
          if (c.kind === 'number') out.push(c.value);
          else if (c.kind === 'date') out.push(toNumber(c));
        }
    } else if (a.kind !== 'empty') out.push(toNumber(a));
  }
  return out;
}

const SUM: SheetFunction = (args) => num(numbersOf(args).reduce((a, b) => a + b, 0));
const AVERAGE: SheetFunction = (args) => {
  const n = numbersOf(args);
  if (!n.length) return fail('#DIV/0!', 'AVERAGE of no numbers');
  return num(n.reduce((a, b) => a + b, 0) / n.length);
};
const MIN: SheetFunction = (args) => {
  const n = numbersOf(args);
  return num(n.length ? Math.min(...n) : 0);
};
const MAX: SheetFunction = (args) => {
  const n = numbersOf(args);
  return num(n.length ? Math.max(...n) : 0);
};
const COUNT: SheetFunction = (args) =>
  num(flatten(args).filter((c) => c.kind === 'number' || c.kind === 'date').length);
const ROUND: SheetFunction = (args) => {
  const x = toNumber(arg(args, 0));
  const d = Math.trunc(optNumber(args, 1, 0));
  const f = 10 ** d;
  return num(Math.round(x * f) / f);
};
const ABS: SheetFunction = (args) => num(Math.abs(toNumber(arg(args, 0))));
const NOW: SheetFunction = (_args, { now }) => date(now);
const CONCAT: SheetFunction = (args) =>
  str(
    flatten(args)
      .map((c) => toText(c))
      .join(''),
  );

export const FUNCTIONS: Record<string, SheetFunction> = {
  PICURRVAL: PICurrVal,
  PIARCVAL: PIArcVal,
  PIEXPVAL: PIExpVal,
  PICOMPDAT: PICompDat,
  PINCOMPDAT: PINCompDat,
  PISAMPDAT: PISampDat,
  PITIMEDAT: PITimeDat,
  PIADVCALCVAL: PIAdvCalcVal,
  PIADVCALCDAT: PIAdvCalcDat,
  SUM,
  AVERAGE,
  MIN,
  MAX,
  COUNT,
  ROUND,
  ABS,
  NOW,
  CONCAT,
  CONCATENATE: CONCAT,
};

/** Functions recalculated on every clock tick (DataLink: "Current Value is a volatile function"). */
export const VOLATILE = new Set(['PICURRVAL', 'NOW', 'PIEXPVAL']);
