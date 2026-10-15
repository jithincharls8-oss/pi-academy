/**
 * PI time expressions, as documented for PI clients and the PI Web API:
 * a reference time (`*`, `t`/`today`, `y`/`yesterday`, a weekday name, or an absolute date)
 * followed by optional signed intervals such as `-8h` or `+30m`. A bare interval (`-1d`) is
 * relative to a supplied base (the other end of a time range), defaulting to now.
 *
 * Times are handled as epoch milliseconds in the learner's local time zone.
 */

const UNIT_MS = {
  ms: 1,
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
  w: 7 * 86_400_000,
} as const;

const UNIT_ALIASES: Record<string, keyof typeof UNIT_MS | 'mo' | 'y'> = {
  ms: 'ms',
  millisecond: 'ms',
  milliseconds: 'ms',
  s: 's',
  sec: 's',
  second: 's',
  seconds: 's',
  m: 'm',
  min: 'm',
  minute: 'm',
  minutes: 'm',
  h: 'h',
  hr: 'h',
  hour: 'h',
  hours: 'h',
  d: 'd',
  day: 'd',
  days: 'd',
  w: 'w',
  week: 'w',
  weeks: 'w',
  mo: 'mo',
  month: 'mo',
  months: 'mo',
  y: 'y',
  year: 'y',
  years: 'y',
};

/** Units that accept fractional amounts (s, m, h, ms). Days, weeks, months, years do not. */
const FRACTIONAL = new Set(['ms', 's', 'm', 'h']);

const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export class TimeParseError extends Error {}

function startOfDay(ms: number): Date {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d;
}

function applyInterval(base: number, sign: 1 | -1, amount: number, unit: string): number {
  const u = UNIT_ALIASES[unit];
  if (!u) throw new TimeParseError(`Unknown time unit "${unit}"`);
  if (!Number.isInteger(amount) && !FRACTIONAL.has(u)) {
    throw new TimeParseError(`"${unit}" does not allow fractions; use a smaller unit`);
  }
  if (u === 'mo' || u === 'y') {
    const d = new Date(base);
    d.setMonth(d.getMonth() + sign * amount * (u === 'y' ? 12 : 1));
    return d.getTime();
  }
  return base + sign * amount * UNIT_MS[u];
}

const INTERVAL = /([+-])\s*(\d+(?:\.\d+)?)\s*([a-z]+)/gy;

function parseIntervals(rest: string, base: number): number {
  let t = base;
  const s = rest.trim().toLowerCase();
  if (!s) return t;
  INTERVAL.lastIndex = 0;
  let pos = 0;
  while (pos < s.length) {
    INTERVAL.lastIndex = pos;
    const m = INTERVAL.exec(s);
    if (!m) throw new TimeParseError(`Cannot read "${rest.trim()}" as a time offset`);
    t = applyInterval(t, m[1] === '-' ? -1 : 1, Number(m[2]), m[3] ?? '');
    pos = INTERVAL.lastIndex;
    while (s[pos] === ' ') pos++;
  }
  return t;
}

/**
 * Parse a PI time expression to epoch milliseconds.
 * @param now the current time
 * @param relativeTo base for a bare interval such as `-1h` (defaults to `now`)
 */
export function parsePiTime(expr: string, now: number, relativeTo: number = now): number {
  const raw = expr.trim();
  if (raw === '' || raw === '*') return now;
  const lower = raw.toLowerCase();

  if (/^[+-]/.test(lower)) return parseIntervals(lower, relativeTo);

  const ref = /^(\*|today|t|yesterday|y|sun|mon|tue|wed|thu|fri|sat)(?=$|[\s+-])/.exec(lower);
  if (ref) {
    const word = ref[1] ?? '';
    let base: number;
    if (word === '*') base = now;
    else if (word === 't' || word === 'today') base = startOfDay(now).getTime();
    else if (word === 'y' || word === 'yesterday') {
      const d = startOfDay(now);
      d.setDate(d.getDate() - 1);
      base = d.getTime();
    } else {
      const d = startOfDay(now);
      const back = (d.getDay() - WEEKDAYS.indexOf(word) + 7) % 7;
      d.setDate(d.getDate() - back);
      base = d.getTime();
    }
    return parseIntervals(lower.slice(word.length), base);
  }

  // Absolute date, optionally followed by offsets: "2026-10-15 08:00" or "2026-10-15T08:00:00".
  const abs = /^(\d{4}-\d{2}-\d{2}(?:[ t]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)?)(.*)$/i.exec(raw);
  if (abs) {
    const iso = (abs[1] ?? '').replace(' ', 'T');
    const ms = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).getTime();
    if (Number.isNaN(ms)) throw new TimeParseError(`"${abs[1]}" is not a valid date`);
    return parseIntervals(abs[2] ?? '', ms);
  }
  throw new TimeParseError(`Cannot read "${raw}" as a PI time`);
}

/** Parse a start/end pair; a bare interval in either is relative to the other end. */
export function parseTimeRange(
  start: string,
  end: string,
  now: number,
): { start: number; end: number } {
  const endRelative = /^\s*[+-]/.test(end);
  const startRelative = /^\s*[+-]/.test(start);
  if (endRelative && startRelative) {
    throw new TimeParseError('Start and end cannot both be relative offsets');
  }
  if (endRelative) {
    const s = parsePiTime(start, now);
    return { start: s, end: parsePiTime(end, now, s) };
  }
  const e = parsePiTime(end, now);
  return { start: parsePiTime(start, now, e), end: e };
}

export function formatPiTime(ms: number): string {
  const d = new Date(ms);
  const p = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
