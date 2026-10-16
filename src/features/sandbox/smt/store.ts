/**
 * The SMT sandbox state: points, archive edits, forced archive shifts, tuning overrides and the
 * messages your actions add to the message log. Everything lives in component state only.
 */
import { applyCompression, applyException, type TimedValue } from '@/core/sim/compression';
import { scans } from '@/core/sim/data';
import { initialPoints, SANDBOX_USER, type SandboxPoint } from './points';
import type { PiconfigChange } from './piconfig';
import { TUNING_PARAMETERS, type ArchiveShift, type LogEntry, type Severity } from './server';

export interface ArchiveEdit {
  id: string;
  op: 'add' | 'replace' | 'delete';
  t: number;
  v: number;
  note: string;
  at: number;
}

export interface SmtState {
  points: SandboxPoint[];
  userLog: LogEntry[];
  shifts: ArchiveShift[];
  /** configured tuning values (what SMT shows) */
  tuning: Record<string, string>;
  /** values in effect: a change applies once its subsystem restarts */
  applied: Record<string, string>;
  restartPending: string[];
  archiveEdits: Record<string, ArchiveEdit[]>;
  seq: number;
}

export type SmtAction =
  | { type: 'savePoint'; original: string | null; point: SandboxPoint; now: number }
  | { type: 'deletePoint'; tag: string; now: number }
  | { type: 'piconfig'; points: SandboxPoint[]; changes: PiconfigChange[]; now: number }
  | { type: 'forceShift'; now: number; sizeMB: number }
  | { type: 'setTuning'; name: string; value: string; now: number }
  | { type: 'restartDone'; subsystem: string; now: number }
  | { type: 'archiveEdit'; tag: string; edit: Omit<ArchiveEdit, 'id' | 'at'>; now: number }
  | { type: 'undoArchiveEdit'; tag: string; id: string }
  | { type: 'reset' };

export function initialState(): SmtState {
  return {
    points: initialPoints(),
    userLog: [],
    shifts: [],
    tuning: {},
    applied: {},
    restartPending: [],
    archiveEdits: {},
    seq: 0,
  };
}

function log(
  s: SmtState,
  now: number,
  program: string,
  severity: Severity,
  message: string,
  messageId = '',
): Pick<SmtState, 'userLog' | 'seq'> {
  const entry: LogEntry = {
    id: `u${s.seq}`,
    t: now,
    severity,
    program,
    source: 'SMT (sandbox)',
    message,
    messageId,
  };
  return { userLog: [...s.userLog, entry], seq: s.seq + 1 };
}

function changeMessage(c: PiconfigChange, via: string): { text: string; id: string } {
  if (c.kind === 'create')
    return { text: `Point created: ${c.tag} by ${SANDBOX_USER} (${via})`, id: '6079' };
  if (c.kind === 'delete')
    return { text: `Point deleted: ${c.tag} by ${SANDBOX_USER} (${via})`, id: '' };
  return {
    text: `Point edited: ${c.tag}${c.attributes.length ? ` [${c.attributes.join(', ')}]` : ''} by ${SANDBOX_USER} (${via})`,
    id: '',
  };
}

function diffAttributes(a: SandboxPoint, b: SandboxPoint): string[] {
  const skip = new Set(['profile', 'changedate', 'changer']);
  return (Object.keys(b) as (keyof SandboxPoint)[])
    .filter((k) => !skip.has(k) && a[k] !== b[k])
    .map(String);
}

function without<T>(rec: Readonly<Record<string, T>>, key: string): Record<string, T> {
  return Object.fromEntries(Object.entries(rec).filter(([k]) => k !== key));
}

export function smtReducer(s: SmtState, a: SmtAction): SmtState {
  switch (a.type) {
    case 'savePoint': {
      if (a.original === null) {
        const c: PiconfigChange = { kind: 'create', tag: a.point.tag, attributes: [] };
        const m = changeMessage(c, 'Point Builder');
        return {
          ...s,
          points: [...s.points, a.point],
          ...log(s, a.now, 'pibasess', 'Informational', m.text, m.id),
        };
      }
      const key = a.original.toUpperCase();
      const before = s.points.find((p) => p.tag.toUpperCase() === key);
      if (!before) return s;
      const changed = diffAttributes(before, a.point);
      const m = changeMessage(
        { kind: 'edit', tag: a.point.tag, attributes: changed },
        'Point Builder',
      );
      let edits = { ...s.archiveEdits };
      if (before.tag !== a.point.tag && edits[key]) {
        edits[a.point.tag.toUpperCase()] = edits[key] as ArchiveEdit[];
        edits = without(edits, key);
      }
      return {
        ...s,
        points: s.points.map((p) => (p === before ? a.point : p)),
        archiveEdits: edits,
        ...log(s, a.now, 'pibasess', 'Informational', m.text, m.id),
      };
    }
    case 'deletePoint': {
      const key = a.tag.toUpperCase();
      if (!s.points.some((p) => p.tag.toUpperCase() === key)) return s;
      const m = changeMessage({ kind: 'delete', tag: a.tag, attributes: [] }, 'Point Builder');
      let edits = { ...s.archiveEdits };
      edits = without(edits, key);
      return {
        ...s,
        points: s.points.filter((p) => p.tag.toUpperCase() !== key),
        archiveEdits: edits,
        ...log(s, a.now, 'pibasess', 'Informational', m.text, m.id),
      };
    }
    case 'piconfig': {
      let next: SmtState = { ...s, points: a.points };
      for (const c of a.changes) {
        const m = changeMessage(c, 'piconfig');
        next = { ...next, ...log(next, a.now, 'pibasess', 'Informational', m.text, m.id) };
      }
      return next;
    }
    case 'forceShift': {
      const shifted = { ...s, shifts: [...s.shifts, { t: a.now, sizeMB: a.sizeMB }] };
      return {
        ...shifted,
        ...log(
          s,
          a.now,
          'piarchss',
          'Informational',
          `Forced archive shift requested by ${SANDBOX_USER}; new primary archive ${a.sizeMB} MB`,
        ),
      };
    }
    case 'setTuning': {
      const def = TUNING_PARAMETERS.find((p) => p.name === a.name);
      if (!def) return s;
      const old = s.tuning[a.name] ?? def.value;
      if (old === a.value) return s;
      const tuning = { ...s.tuning, [a.name]: a.value };
      const restartPending = s.restartPending.includes(def.subsystem)
        ? s.restartPending
        : [...s.restartPending, def.subsystem];
      return {
        ...s,
        tuning,
        restartPending,
        ...log(
          s,
          a.now,
          'pibasess',
          'Informational',
          `Tuning parameter ${a.name} changed from "${old}" to "${a.value}" by ${SANDBOX_USER}; takes effect after ${def.subsystem} restarts`,
        ),
      };
    }
    case 'restartDone': {
      const applied = { ...s.applied };
      for (const p of TUNING_PARAMETERS) {
        const v = s.tuning[p.name];
        if (p.subsystem === a.subsystem && v !== undefined) applied[p.name] = v;
      }
      return {
        ...s,
        applied,
        restartPending: s.restartPending.filter((x) => x !== a.subsystem),
        ...log(s, a.now, 'pinetmgr', 'Informational', `${a.subsystem} restarted (sandbox)`),
      };
    }
    case 'archiveEdit': {
      const key = a.tag.toUpperCase();
      const edit: ArchiveEdit = { ...a.edit, id: `e${s.seq}`, at: a.now };
      const verb = a.edit.op === 'add' ? 'added' : a.edit.op === 'replace' ? 'replaced' : 'deleted';
      return {
        ...s,
        archiveEdits: { ...s.archiveEdits, [key]: [...(s.archiveEdits[key] ?? []), edit] },
        ...log(
          s,
          a.now,
          'piarchss',
          'Informational',
          `Archive event ${verb} for ${a.tag} at ${new Date(a.edit.t).toLocaleString()} by ${SANDBOX_USER}${a.edit.note ? ` (annotation: ${a.edit.note})` : ''}`,
        ),
      };
    }
    case 'undoArchiveEdit': {
      const key = a.tag.toUpperCase();
      return {
        ...s,
        archiveEdits: {
          ...s.archiveEdits,
          [key]: (s.archiveEdits[key] ?? []).filter((e) => e.id !== a.id),
        },
      };
    }
    case 'reset':
      return initialState();
  }
}

/* ------------------------------------------------------------ archive values for a point */

const archCache = new Map<string, TimedValue[]>();

/** Archived values of a sandbox point (exception then compression), using its current settings. */
export function archivedValues(p: SandboxPoint, start: number, end: number): TimedValue[] {
  if (!p.archiving || !p.scanflag) return [];
  const key = [
    p.tag,
    start,
    end,
    p.excdev,
    p.excmin,
    p.excmax,
    p.compressing,
    p.compdev,
    p.compmin,
    p.compmax,
    p.pointtype,
    p.zero,
    p.span,
  ].join('|');
  const hit = archCache.get(key);
  if (hit) return hit;
  const lead = Math.min(p.compmax * 1000, 2 * 3_600_000);
  const snap = applyException(scans(p, start - lead, end), {
    excDev: p.excdev,
    excMin: p.excmin,
    excMax: p.excmax,
  });
  const { archived } = applyCompression(snap, {
    compressing: p.compressing,
    compDev: p.compdev,
    compMin: p.compmin,
    compMax: p.compmax,
  });
  const out = archived.filter((e) => e.t >= start && e.t <= end);
  if (archCache.size > 100) archCache.clear();
  archCache.set(key, out);
  return out;
}

export interface ArchiveRow {
  t: number;
  v: number;
  status: 'original' | 'added' | 'replaced';
  note: string;
}

/** Apply sandbox edits (in order) to the archived values in a window. */
export function withEdits(
  values: readonly TimedValue[],
  edits: readonly ArchiveEdit[],
  start: number,
  end: number,
): ArchiveRow[] {
  const rows = new Map<number, ArchiveRow>();
  for (const v of values) rows.set(v.t, { t: v.t, v: v.v, status: 'original', note: '' });
  for (const e of edits) {
    if (e.t < start || e.t > end) continue;
    if (e.op === 'delete') rows.delete(e.t);
    else {
      const existed = rows.get(e.t);
      rows.set(e.t, {
        t: e.t,
        v: e.v,
        status:
          existed && existed.status !== 'added'
            ? 'replaced'
            : existed
              ? 'added'
              : e.op === 'add'
                ? 'added'
                : 'replaced',
        note: e.note,
      });
    }
  }
  return [...rows.values()].sort((a, b) => a.t - b.t);
}

/** Count of edits older than the snapshot, i.e. out-of-order archive writes. */
export function outOfOrderCount(edits: Readonly<Record<string, ArchiveEdit[]>>): number {
  return Object.values(edits).reduce(
    (a, list) => a + list.filter((e) => e.op !== 'delete').length,
    0,
  );
}

/**
 * The point's current snapshot: the newest value that passed the exception test. A recorded
 * values read (and so the Archive Editor) returns it after the archived events, although it is
 * not in an archive file yet. Compression decides only when the next value arrives.
 */
const snapCache = new Map<string, TimedValue | null>();

export function currentSnapshot(p: SandboxPoint, now: number): TimedValue | null {
  if (!p.scanflag) return null;
  const key = [p.tag, now, p.excdev, p.excmin, p.excmax, p.pointtype, p.zero, p.span].join('|');
  if (snapCache.has(key)) return snapCache.get(key) ?? null;
  const span = Math.max(p.excmax, 60) * 2000;
  const events = applyException(scans(p, now - span, now), {
    excDev: p.excdev,
    excMin: p.excmin,
    excMax: p.excmax,
  });
  const snap = events.at(-1) ?? null;
  if (snapCache.size > 200) snapCache.clear();
  snapCache.set(key, snap);
  return snap;
}
