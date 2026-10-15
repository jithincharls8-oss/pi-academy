/**
 * Sandbox PI points: the shared Riverbend points plus the PIPOINT attributes that the core
 * simulation does not need (exdesc, location2/3/5, security strings and so on).
 *
 * Attribute names follow the PIPOINT attribute list in research/da.md (da.point-attributes).
 * Where research gives no default (for example Archiving, Shutdown, DisplayDigits) the sandbox
 * picks a plausible value; those are listed in SANDBOX_DEFAULTS_NOTE.
 */
import { DIGITAL_SETS, plant, type PointType, type SimPoint } from '@/core/sim/plant';

export const POINT_TYPES: readonly PointType[] = [
  'Float32',
  'Float64',
  'Int32',
  'Digital',
  'String',
];

export interface SandboxPoint extends SimPoint {
  pointid: number;
  ptclassname: 'base' | 'classic';
  exdesc: string;
  typicalvalue: number;
  displaydigits: number;
  archiving: boolean;
  shutdown: boolean;
  future: boolean;
  /** the PIPOINT "scan" attribute: interface scanning on or off. `scan` holds the simulated period. */
  scanflag: boolean;
  location2: number;
  location3: number;
  location5: number;
  userint1: number;
  userint2: number;
  userreal1: number;
  userreal2: number;
  squareroot: number;
  totalcode: number;
  convers: number;
  filtercode: number;
  srcptid: number;
  sourcetag: string;
  ptsecurity: string;
  datasecurity: string;
  creator: string;
  changedate: string;
  changer: string;
}

export const SANDBOX_DEFAULTS_NOTE =
  'Research gives no defaults for Archiving, Shutdown, Scan, DisplayDigits, TypicalValue or Location2-5, so the sandbox uses Archiving=1, Shutdown=1, Scan=1, DisplayDigits=-5 and zeros.';

export const DEFAULT_PTSECURITY =
  'piadmins: A(r,w) | PIEngineers: A(r,w) | PIOperators: A(r) | PIWorld: A(r)';
export const DEFAULT_DATASECURITY =
  'piadmins: A(r,w) | PI Buffer: A(r,w) | PIEngineers: A(r) | PIOperators: A(r) | PIWorld: A(r)';
export const SANDBOX_USER = 'RIVERBEND\\learner';

/** Location3 for the OPC DA interface: 0 polled or event, 1 advise, 2 output (research). */
export const LOCATION3_MEANING: Record<number, string> = {
  0: 'Polled / event',
  1: 'Advise',
  2: 'Output',
};

function extras(p: SimPoint, index: number): Omit<SandboxPoint, keyof SimPoint> {
  return {
    pointid: index + 1,
    ptclassname: 'classic',
    exdesc: '',
    typicalvalue: p.pointtype === 'Digital' ? 0 : p.zero + p.span / 2,
    displaydigits: -5,
    archiving: true,
    shutdown: true,
    future: false,
    scanflag: true,
    location2: 0,
    location3: p.pointtype === 'Digital' ? 1 : 0,
    location5: 0,
    userint1: 0,
    userint2: 0,
    userreal1: 0,
    userreal2: 0,
    squareroot: 0,
    totalcode: 0,
    convers: 1,
    filtercode: 0,
    srcptid: 0,
    sourcetag: '',
    ptsecurity: DEFAULT_PTSECURITY,
    datasecurity: DEFAULT_DATASECURITY,
    creator: 'RIVERBEND\\pi.engineer',
    changedate: p.creationdate,
    changer: 'RIVERBEND\\pi.engineer',
  };
}

/** The starting sandbox: every plant point with full PIPOINT attributes. */
export function initialPoints(): SandboxPoint[] {
  return plant().points.map((p, i) => ({ ...p, ...extras(p, i) }));
}

export function formatStamp(ms: number): string {
  const d = new Date(ms);
  const p = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/**
 * A new point with research defaults (ExcDevPercent 0.1, CompDevPercent 0.2, ExcMax 600 s,
 * CompMax 28800 s, Zero 0, Span 100). Its simulated signal is a slow wave across its span.
 */
export function newPoint(tag: string, pointid: number, now: number): SandboxPoint {
  const base: SimPoint = {
    tag,
    descriptor: '',
    engunits: '',
    pointtype: 'Float32',
    pointsource: 'OPC',
    digitalset: '',
    span: 100,
    zero: 0,
    step: false,
    excdev: 0.1,
    excmin: 0,
    excmax: 600,
    compressing: true,
    compdev: 0.2,
    compmin: 0,
    compmax: 28800,
    scan: 5,
    location1: 1,
    location4: 2,
    instrumenttag: '',
    creationdate: formatStamp(now),
    profile: { kind: 'wave', base: 50, amp: 20, periodH: 2, noise: 0.5 },
  };
  return {
    ...base,
    ...extras(base, pointid - 1),
    creator: SANDBOX_USER,
    changer: SANDBOX_USER,
  };
}

/**
 * Keep the simulated signal sensible after edits: a point changed to Digital needs a state
 * profile, and a numeric point needs a numeric one.
 */
export function withProfile(p: SandboxPoint): SandboxPoint {
  if (p.pointtype === 'Digital' && p.profile.kind !== 'state') {
    return { ...p, profile: { kind: 'state', unit: p.tag }, step: true };
  }
  if (p.pointtype !== 'Digital' && p.profile.kind === 'state') {
    const mid = p.zero + p.span / 2;
    return {
      ...p,
      profile: { kind: 'wave', base: mid, amp: p.span / 5, periodH: 2, noise: p.span / 200 },
    };
  }
  return p;
}

export function digitalStates(set: string): string[] {
  return DIGITAL_SETS.find((d) => d.name.toLowerCase() === set.toLowerCase())?.states ?? [];
}

/* ------------------------------------------------------------ attribute access */

type AttrKind = 'string' | 'number' | 'int' | 'bool' | 'pointtype' | 'ptclass';

interface AttrDef {
  key: keyof SandboxPoint;
  kind: AttrKind;
  readonly?: boolean;
}

/** PIPOINT attributes the sandbox piconfig understands, by lower-case attribute name. */
export const PIPOINT_ATTRIBUTES: Record<string, AttrDef> = {
  tag: { key: 'tag', kind: 'string' },
  pointid: { key: 'pointid', kind: 'int', readonly: true },
  descriptor: { key: 'descriptor', kind: 'string' },
  exdesc: { key: 'exdesc', kind: 'string' },
  engunits: { key: 'engunits', kind: 'string' },
  pointtype: { key: 'pointtype', kind: 'pointtype' },
  ptclassname: { key: 'ptclassname', kind: 'ptclass' },
  pointsource: { key: 'pointsource', kind: 'string' },
  digitalset: { key: 'digitalset', kind: 'string' },
  zero: { key: 'zero', kind: 'number' },
  span: { key: 'span', kind: 'number' },
  typicalvalue: { key: 'typicalvalue', kind: 'number' },
  displaydigits: { key: 'displaydigits', kind: 'int' },
  step: { key: 'step', kind: 'bool' },
  future: { key: 'future', kind: 'bool' },
  archiving: { key: 'archiving', kind: 'bool' },
  shutdown: { key: 'shutdown', kind: 'bool' },
  scan: { key: 'scanflag', kind: 'bool' },
  excdev: { key: 'excdev', kind: 'number' },
  excmin: { key: 'excmin', kind: 'int' },
  excmax: { key: 'excmax', kind: 'int' },
  compressing: { key: 'compressing', kind: 'bool' },
  compdev: { key: 'compdev', kind: 'number' },
  compmin: { key: 'compmin', kind: 'int' },
  compmax: { key: 'compmax', kind: 'int' },
  location1: { key: 'location1', kind: 'int' },
  location2: { key: 'location2', kind: 'int' },
  location3: { key: 'location3', kind: 'int' },
  location4: { key: 'location4', kind: 'int' },
  location5: { key: 'location5', kind: 'int' },
  instrumenttag: { key: 'instrumenttag', kind: 'string' },
  userint1: { key: 'userint1', kind: 'int' },
  userint2: { key: 'userint2', kind: 'int' },
  userreal1: { key: 'userreal1', kind: 'number' },
  userreal2: { key: 'userreal2', kind: 'number' },
  squareroot: { key: 'squareroot', kind: 'int' },
  totalcode: { key: 'totalcode', kind: 'int' },
  convers: { key: 'convers', kind: 'number' },
  filtercode: { key: 'filtercode', kind: 'int' },
  srcptid: { key: 'srcptid', kind: 'int' },
  sourcetag: { key: 'sourcetag', kind: 'string' },
  ptsecurity: { key: 'ptsecurity', kind: 'string' },
  datasecurity: { key: 'datasecurity', kind: 'string' },
  creationdate: { key: 'creationdate', kind: 'string', readonly: true },
  creator: { key: 'creator', kind: 'string', readonly: true },
  changedate: { key: 'changedate', kind: 'string', readonly: true },
  changer: { key: 'changer', kind: 'string', readonly: true },
};

/** Derived attributes: CompDevPercent = CompDev x 100 / Span (and the same for exception). */
export const DERIVED_ATTRIBUTES = ['compdevpercent', 'excdevpercent'] as const;

export function isKnownAttribute(name: string): boolean {
  const n = name.toLowerCase();
  return n in PIPOINT_ATTRIBUTES || (DERIVED_ATTRIBUTES as readonly string[]).includes(n);
}

function round(n: number, digits = 6): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

function isDiscrete(p: SandboxPoint): boolean {
  return p.pointtype === 'Digital' || p.pointtype === 'String';
}

/** Attribute value as text, the way piconfig lists it (booleans as 0/1). */
export function getAttribute(p: SandboxPoint, name: string): string {
  const n = name.toLowerCase();
  if (n === 'compdevpercent')
    return isDiscrete(p) || p.span <= 0 ? '0' : String(round((p.compdev * 100) / p.span));
  if (n === 'excdevpercent')
    return isDiscrete(p) || p.span <= 0 ? '0' : String(round((p.excdev * 100) / p.span));
  const def = PIPOINT_ATTRIBUTES[n];
  if (!def) throw new Error(`Unknown attribute "${name}"`);
  const v = p[def.key];
  if (typeof v === 'boolean') return v ? '1' : '0';
  if (typeof v === 'number') return String(round(v));
  return typeof v === 'string' ? v : '';
}

export type SetResult = { ok: true; point: SandboxPoint } | { ok: false; error: string };

function parseBool(raw: string): boolean | null {
  const s = raw.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(s)) return true;
  if (['0', 'false', 'no', 'off'].includes(s)) return false;
  return null;
}

/** Set one attribute from text. Type checks happen here; cross-field rules in validation.ts. */
export function setAttribute(p: SandboxPoint, name: string, raw: string): SetResult {
  const n = name.toLowerCase();
  const value = raw.trim();
  if (n === 'compdevpercent' || n === 'excdevpercent') {
    const pct = Number(value);
    if (value === '' || !Number.isFinite(pct))
      return { ok: false, error: `${name} must be a number` };
    const dev = round((pct * p.span) / 100);
    return {
      ok: true,
      point: n === 'compdevpercent' ? { ...p, compdev: dev } : { ...p, excdev: dev },
    };
  }
  const def = PIPOINT_ATTRIBUTES[n];
  if (!def) return { ok: false, error: `Unknown attribute "${name}"` };
  if (def.readonly) return { ok: false, error: `${name} is read-only` };
  switch (def.kind) {
    case 'string':
      return { ok: true, point: { ...p, [def.key]: value } };
    case 'number':
    case 'int': {
      const num = Number(value);
      if (value === '' || !Number.isFinite(num))
        return { ok: false, error: `${name} must be a number` };
      if (def.kind === 'int' && !Number.isInteger(num))
        return { ok: false, error: `${name} must be a whole number` };
      return { ok: true, point: { ...p, [def.key]: num } };
    }
    case 'bool': {
      const b = parseBool(value);
      if (b === null) return { ok: false, error: `${name} must be 0 or 1` };
      return { ok: true, point: { ...p, [def.key]: b } };
    }
    case 'pointtype': {
      const t = POINT_TYPES.find((x) => x.toLowerCase() === value.toLowerCase());
      if (!t) return { ok: false, error: `pointtype must be one of ${POINT_TYPES.join(', ')}` };
      return { ok: true, point: { ...p, pointtype: t } };
    }
    case 'ptclass': {
      const c = value.toLowerCase();
      if (c !== 'base' && c !== 'classic')
        return { ok: false, error: 'ptclassname must be base or classic' };
      return { ok: true, point: { ...p, ptclassname: c } };
    }
  }
}

/** Case-insensitive wildcard match with * and ?. */
export function wildcardMatch(pattern: string, text: string): boolean {
  const re = new RegExp(
    `^${pattern
      .trim()
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')}$`,
    'i',
  );
  return re.test(text.trim());
}
