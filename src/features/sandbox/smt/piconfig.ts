/**
 * A sandbox piconfig interpreter for the PIPOINT table. Pure: it takes the session and the
 * sandbox points and returns new ones, so it can be tested without a UI.
 *
 * Syntax from research/da.md (da.tools) and research/dev2.md (dev2.piconfig):
 * - Commands start with `@`, comments with `*`, fields are comma-separated by default.
 * - `@table`/`@tabl`, `@mode list|edit|create|delete` (with an optional `, t`), `@istr`/
 *   `@istructure`, `@ostr`/`@ostructure`, `@select`/`@sele attr=pattern,...`, `@ends`/
 *   `@endsection`, `@ptclass`, `@delimiter`, `@exit`/`@quit`/`@bye`, `?tbl`, `?atr`.
 * - Abbreviations to the first four letters (`@tabl`, `@sele`) are inferred from examples.
 *
 * Simplified: the meaning of `, t` is unverified (believed to make create tolerant of points
 * that already exist, which is what the sandbox does), several `@sele` lines in one block
 * are ORed, and messages are sandbox wording, not piconfig's real error text.
 */
import {
  DERIVED_ATTRIBUTES,
  PIPOINT_ATTRIBUTES,
  formatStamp,
  getAttribute,
  isKnownAttribute,
  newPoint,
  setAttribute,
  wildcardMatch,
  withProfile,
  type SandboxPoint,
} from './points';
import { validatePoint } from './validation';

export type PiconfigMode = 'list' | 'edit' | 'create' | 'delete';

export interface Selection {
  attr: string;
  pattern: string;
}

export interface PiconfigSession {
  table: 'pipoint' | null;
  mode: PiconfigMode;
  tolerant: boolean;
  istr: string[];
  ostr: string[];
  delimiter: string;
  ptclass: 'base' | 'classic';
  /** each @select line is one AND-group; groups are ORed when @ends runs */
  selections: Selection[][];
}

export interface PiconfigChange {
  kind: 'create' | 'edit' | 'delete';
  tag: string;
  attributes: string[];
}

export interface PiconfigContext {
  now: number;
  user: string;
}

export interface PiconfigResult {
  session: PiconfigSession;
  points: SandboxPoint[];
  output: string[];
  changes: PiconfigChange[];
  exit: boolean;
}

export function newSession(): PiconfigSession {
  return {
    table: null,
    mode: 'list',
    tolerant: false,
    istr: [],
    ostr: [],
    delimiter: ',',
    ptclass: 'classic',
    selections: [],
  };
}

const COMMANDS = [
  'table',
  'mode',
  'istructure',
  'ostructure',
  'select',
  'endsection',
  'ptclass',
  'delimiter',
  'exit',
  'quit',
  'bye',
  'echo',
  'output',
  'input',
  'modify',
] as const;
type Command = (typeof COMMANDS)[number];

/** Resolve `@tabl`, `@istr`, `@ends`... to a full command name. */
export function resolveCommand(word: string): Command | null {
  const w = word.toLowerCase();
  const aliases: Record<string, Command> = {
    istr: 'istructure',
    ostr: 'ostructure',
    ends: 'endsection',
    sele: 'select',
  };
  if (aliases[w]) return aliases[w];
  for (const c of COMMANDS) {
    if (c === w) return c;
    if (w.length >= 4 && c.startsWith(w)) return c;
  }
  return null;
}

/** Split a data line on the delimiter, honouring double-quoted fields. */
export function splitFields(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i] as string;
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else quoted = !quoted;
    } else if (!quoted && line.startsWith(delimiter, i)) {
      out.push(cur.trim());
      cur = '';
      i += delimiter.length - 1;
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function quoteIfNeeded(v: string, delimiter: string): string {
  return v.includes(delimiter) || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
}

function attrList(text: string, delimiter: string): string[] {
  return text
    .split(delimiter === ',' ? ',' : new RegExp(`[,${delimiter.replace(/[\\^\]-]/g, '\\$&')}]`))
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function parseSelection(text: string): Selection[] | string {
  const parts = text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const out: Selection[] = [];
  for (const part of parts) {
    const eq = part.indexOf('=');
    if (eq <= 0) return `Selection "${part}" must look like attribute=pattern`;
    const attr = part.slice(0, eq).trim().toLowerCase();
    if (!isKnownAttribute(attr)) return `Unknown attribute "${attr}" in selection`;
    out.push({ attr, pattern: part.slice(eq + 1).trim() });
  }
  return out.length ? out : 'Empty selection';
}

function matches(p: SandboxPoint, group: readonly Selection[]): boolean {
  return group.every((s) => wildcardMatch(s.pattern, getAttribute(p, s.attr)));
}

function listRow(p: SandboxPoint, s: PiconfigSession): string {
  const cols = s.ostr.length ? s.ostr : ['tag'];
  return cols.map((c) => quoteIfNeeded(getAttribute(p, c), s.delimiter)).join(s.delimiter);
}

/** Run one line of piconfig input. */
export function executeLine(
  session: PiconfigSession,
  rawLine: string,
  points: readonly SandboxPoint[],
  ctx: PiconfigContext,
): PiconfigResult {
  const result: PiconfigResult = {
    session,
    points: [...points],
    output: [],
    changes: [],
    exit: false,
  };
  const line = rawLine.trim();
  if (!line || line.startsWith('*')) return result;
  const out = result.output;

  if (line.startsWith('?')) {
    const q = line.slice(1).trim().toLowerCase();
    if (q === 'tbl' || q === 'table' || q === '') {
      out.push('pipoint   point database (the only table in this sandbox)');
      out.push('piarc     archive values: use the Archive Editor in this sandbox');
    } else if (q === 'atr') {
      if (!session.table) out.push('Error: no table selected; use @table pipoint first');
      else
        out.push(
          ...[...Object.keys(PIPOINT_ATTRIBUTES), ...DERIVED_ATTRIBUTES].map((a) => `  ${a}`),
        );
    } else out.push(`Error: unknown help topic "?${q}"`);
    return result;
  }

  if (line.startsWith('@')) {
    const m = /^@(\S+)\s*(.*)$/.exec(line);
    const word = m?.[1] ?? '';
    const arg = (m?.[2] ?? '').trim();
    const cmd = resolveCommand(word);
    if (!cmd) {
      out.push(`Error: unknown command "@${word}"`);
      return result;
    }
    switch (cmd) {
      case 'table': {
        const [name, cls] = arg.split(',').map((s) => s.trim().toLowerCase());
        if (name === 'pipoint') {
          result.session = { ...newSession(), delimiter: session.delimiter, table: 'pipoint' };
          if (cls === 'classic' || cls === 'base') result.session.ptclass = cls;
        } else if (name === 'piarc') {
          out.push(
            'Error: the piarc table is not available in this sandbox; use the Archive Editor',
          );
        } else out.push(`Error: unknown table "${arg}"`);
        return result;
      }
      case 'mode': {
        const [mode, flag] = arg.split(',').map((s) => s.trim().toLowerCase());
        if (mode !== 'list' && mode !== 'edit' && mode !== 'create' && mode !== 'delete') {
          out.push(`Error: mode must be list, edit, create or delete (got "${arg}")`);
          return result;
        }
        result.session = { ...session, mode, tolerant: flag === 't', selections: [] };
        if (flag === 't')
          out.push(
            '* ", t" accepted. Its exact meaning is unverified; here it lets create update existing points.',
          );
        return result;
      }
      case 'istructure':
      case 'ostructure': {
        if (!session.table) {
          out.push('Error: no table selected; use @table pipoint first');
          return result;
        }
        const attrs = attrList(arg, session.delimiter);
        const bad = attrs.filter((a) => !isKnownAttribute(a));
        if (!attrs.length)
          out.push(`Error: @${cmd === 'istructure' ? 'istr' : 'ostr'} needs a list of attributes`);
        else if (bad.length) out.push(`Error: unknown attribute(s) ${bad.join(', ')}`);
        else result.session = { ...session, [cmd === 'istructure' ? 'istr' : 'ostr']: attrs };
        return result;
      }
      case 'select': {
        if (!session.table) {
          out.push('Error: no table selected; use @table pipoint first');
          return result;
        }
        const sel = parseSelection(arg);
        if (typeof sel === 'string') out.push(`Error: ${sel}`);
        else result.session = { ...session, selections: [...session.selections, sel] };
        return result;
      }
      case 'endsection': {
        if (session.selections.length) {
          if (session.mode !== 'list') {
            out.push(
              'Error: @select runs in list mode only in this sandbox; use data lines to edit or delete',
            );
          } else {
            const hits = points.filter((p) => session.selections.some((g) => matches(p, g)));
            for (const p of hits) out.push(listRow(p, session));
            if (!hits.length) out.push('* No points matched the selection');
          }
        }
        result.session = { ...session, selections: [] };
        return result;
      }
      case 'ptclass': {
        const c = arg.toLowerCase();
        if (c !== 'classic' && c !== 'base') out.push('Error: @ptclass must be base or classic');
        else result.session = { ...session, ptclass: c };
        return result;
      }
      case 'delimiter': {
        if (!arg || arg.length > 1) out.push('Error: @delimiter needs a single character');
        else result.session = { ...session, delimiter: arg };
        return result;
      }
      case 'exit':
      case 'quit':
      case 'bye':
        result.exit = true;
        return result;
      case 'echo':
        out.push('* @echo accepted; the sandbox always echoes data');
        return result;
      case 'output':
      case 'input':
        out.push(
          `Error: @${cmd} files are not available in the sandbox; paste lines into the console instead`,
        );
        return result;
      case 'modify':
        out.push('Error: @modify is not supported in this sandbox');
        return result;
    }
  }

  // A data line.
  if (!session.table) {
    out.push('Error: no table selected; use @table pipoint first');
    return result;
  }
  const istr = session.istr.length ? session.istr : ['tag'];
  const fields = splitFields(line, session.delimiter);
  if (fields.length !== istr.length) {
    out.push(
      `Error: expected ${istr.length} field(s) (${istr.join(',')}), got ${fields.length}: ${line}`,
    );
    return result;
  }
  const values = new Map(istr.map((a, i) => [a, fields[i] as string]));
  const tag = values.get('tag');
  if (tag === undefined || tag === '') {
    out.push('Error: the input structure must include tag');
    return result;
  }

  if (session.mode === 'list') {
    const group: Selection[] = [...values].map(([attr, pattern]) => ({ attr, pattern }));
    const hits = points.filter((p) => matches(p, group));
    for (const p of hits) out.push(listRow(p, session));
    if (!hits.length) out.push(`* No points matched ${tag}`);
    return result;
  }

  const idx = points.findIndex((p) => p.tag.toUpperCase() === tag.toUpperCase());

  if (session.mode === 'delete') {
    if (idx < 0) {
      out.push(`Error: point ${tag} not found`);
      return result;
    }
    const removed = points[idx] as SandboxPoint;
    result.points = points.filter((_, i) => i !== idx);
    result.changes.push({ kind: 'delete', tag: removed.tag, attributes: [] });
    out.push(`* Deleted ${removed.tag}`);
    return result;
  }

  let creating = session.mode === 'create';
  if (creating && idx >= 0) {
    if (!session.tolerant) {
      out.push(`Error: point ${tag} already exists`);
      return result;
    }
    creating = false;
  }
  if (!creating && idx < 0) {
    out.push(`Error: point ${tag} not found`);
    return result;
  }

  const nextId = points.reduce((m, p) => Math.max(m, p.pointid), 0) + 1;
  let p: SandboxPoint = creating
    ? {
        ...newPoint(tag, nextId, ctx.now),
        ptclassname: session.ptclass,
        creator: ctx.user,
        changer: ctx.user,
      }
    : (points[idx] as SandboxPoint);
  // Set ordinary attributes first so percent attributes use the new Span; tag is the key.
  const ordered = [...values]
    .filter(([a]) => a !== 'tag')
    .sort(([a], [b]) => Number(a.endsWith('percent')) - Number(b.endsWith('percent')));
  for (const [attr, raw] of ordered) {
    const r = setAttribute(p, attr, raw);
    if (!r.ok) {
      out.push(`Error: ${tag}: ${r.error}`);
      return result;
    }
    p = r.point;
  }
  if (values.has('pointtype') && p.pointtype !== 'Digital' && !values.has('digitalset'))
    p = { ...p, digitalset: '' };
  p = withProfile({ ...p, changer: ctx.user, changedate: formatStamp(ctx.now) });
  const others = creating ? points : points.filter((_, i) => i !== idx);
  const v = validatePoint(p, others);
  if (!v.ok) {
    out.push(`Error: ${tag}: ${v.issues.map((i) => i.message).join('; ')}`);
    return result;
  }
  const changed = [...values.keys()].filter((a) => a !== 'tag');
  if (creating) {
    result.points = [...points, p];
    result.changes.push({ kind: 'create', tag: p.tag, attributes: changed });
    out.push(`* Created ${p.tag} (pointid ${p.pointid})`);
  } else {
    result.points = points.map((q, i) => (i === idx ? p : q));
    result.changes.push({ kind: 'edit', tag: p.tag, attributes: changed });
    out.push(`* Edited ${p.tag}${changed.length ? `: ${changed.join(', ')}` : ''}`);
  }
  return result;
}

/** Run several lines (a pasted script), threading the session and points through. */
export function executeScript(
  session: PiconfigSession,
  text: string,
  points: readonly SandboxPoint[],
  ctx: PiconfigContext,
): PiconfigResult {
  let acc: PiconfigResult = { session, points: [...points], output: [], changes: [], exit: false };
  for (const line of text.split(/\r?\n/)) {
    const r = executeLine(acc.session, line, acc.points, ctx);
    acc = {
      session: r.session,
      points: r.points,
      output: [...acc.output, ...r.output],
      changes: [...acc.changes, ...r.changes],
      exit: r.exit,
    };
    if (r.exit) break;
  }
  return acc;
}
