/**
 * Content pack import/export for the Admin page. A pack is JSON:
 * `{ format: 'pi-academy-content', version: 1, items: { <kind>: [...] } }`.
 * CSV export flattens any kind for spreadsheets; CSV import is supported for glossary terms,
 * whose fields are flat.
 */
import { z } from 'zod';
import { CONTENT_KINDS, type ContentKind } from '@/db/contentRepo';

export const PACK_FORMAT = 'pi-academy-content';

const PackSchema = z.object({
  format: z.literal(PACK_FORMAT),
  version: z.literal(1),
  exportedAt: z.string().optional(),
  items: z.record(z.string(), z.array(z.unknown())),
});

export interface Pack {
  format: typeof PACK_FORMAT;
  version: 1;
  exportedAt: string;
  items: Partial<Record<ContentKind, unknown[]>>;
}

export function makePack(items: Partial<Record<ContentKind, unknown[]>>, now = new Date()): Pack {
  return { format: PACK_FORMAT, version: 1, exportedAt: now.toISOString(), items };
}

export const isKind = (k: string): k is ContentKind => Object.hasOwn(CONTENT_KINDS, k);

export interface ImportCheck {
  valid: { kind: ContentKind; id: string; value: unknown }[];
  errors: string[];
}

/** Parse and validate a pack without writing anything. */
export function checkPack(text: string): ImportCheck {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (e) {
    return { valid: [], errors: [`Not valid JSON: ${(e as Error).message}`] };
  }
  const pack = PackSchema.safeParse(json);
  if (!pack.success) {
    return {
      valid: [],
      errors: [
        `Not a PI Academy content pack (expected "format": "${PACK_FORMAT}", "version": 1).`,
      ],
    };
  }
  const out: ImportCheck = { valid: [], errors: [] };
  for (const [kind, list] of Object.entries(pack.data.items)) {
    if (!isKind(kind)) {
      out.errors.push(`Unknown content type "${kind}".`);
      continue;
    }
    list.forEach((raw, n) => {
      const r = CONTENT_KINDS[kind].schema.safeParse(raw);
      const label =
        typeof raw === 'object' && raw !== null && 'id' in raw ? String(raw.id) : `#${n + 1}`;
      if (r.success) out.valid.push({ kind, id: (r.data as { id: string }).id, value: r.data });
      else
        out.errors.push(
          `${kind} ${label}: ${r.error.issues.map((i) => `${i.path.join('.') || 'item'} ${i.message}`).join('; ')}`,
        );
    });
  }
  return out;
}

/* ------------------------------------------------------------------ CSV */

function cell(v: unknown): string {
  const s =
    v === undefined || v === null
      ? ''
      : Array.isArray(v)
        ? v.every((x) => typeof x !== 'object')
          ? v.join('|')
          : JSON.stringify(v)
        : typeof v === 'object'
          ? JSON.stringify(v)
          : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV with one column per top-level field; arrays of plain values are joined with `|`. */
export function toCsv(rows: readonly object[]): string {
  const cols: string[] = [];
  for (const r of rows) for (const k of Object.keys(r)) if (!cols.includes(k)) cols.push(k);
  const lines = [cols.join(',')];
  for (const r of rows) {
    const rec = r as Record<string, unknown>;
    lines.push(cols.map((c) => cell(rec[c])).join(','));
  }
  return lines.join('\r\n') + '\r\n';
}

/** RFC 4180 CSV parser (quoted fields, doubled quotes, CRLF or LF). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i] as string;
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
    } else if (c === '"' && field === '') quoted = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.some((f) => f !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f !== '')) rows.push(row);
  return rows;
}

const LIST_FIELDS = new Set(['aliases', 'coverage', 'related', 'sources']);

/** Glossary terms from CSV with a header row (id, term, definition, domain, sources, ...). */
export function glossaryFromCsv(text: string): ImportCheck {
  const [header, ...rows] = parseCsv(text.replace(/^\uFEFF/, ''));
  if (!header) return { valid: [], errors: ['The file is empty.'] };
  const cols = header.map((h) => h.trim());
  for (const need of ['id', 'term', 'definition', 'domain', 'sources']) {
    if (!cols.includes(need))
      return {
        valid: [],
        errors: [`Missing column "${need}". Export glossary CSV to see the layout.`],
      };
  }
  const out: ImportCheck = { valid: [], errors: [] };
  rows.forEach((r, n) => {
    const obj: Record<string, unknown> = {};
    cols.forEach((c, i) => {
      const v = (r[i] ?? '').trim();
      if (c === 'verify') obj[c] = v.toLowerCase() === 'true';
      else if (LIST_FIELDS.has(c)) obj[c] = v ? v.split('|').map((s) => s.trim()) : [];
      else if (v) obj[c] = v;
    });
    const parsed = CONTENT_KINDS.glossary.schema.safeParse(obj);
    if (parsed.success)
      out.valid.push({ kind: 'glossary', id: parsed.data.id, value: parsed.data });
    else
      out.errors.push(
        `Row ${n + 2}: ${parsed.error.issues.map((i) => `${i.path.join('.') || 'item'} ${i.message}`).join('; ')}`,
      );
  });
  return out;
}

/** Items flagged for verification across the library, for the verification queue. */
export function verificationQueue(
  lists: Partial<Record<ContentKind, readonly object[]>>,
): { kind: ContentKind; id: string; title: string; note: string }[] {
  const out: { kind: ContentKind; id: string; title: string; note: string }[] = [];
  for (const [kind, list] of Object.entries(lists)) {
    if (!isKind(kind) || !list) continue;
    for (const item of list) {
      const r = item as {
        id?: unknown;
        verify?: unknown;
        verifyNote?: unknown;
        title?: unknown;
        term?: unknown;
        name?: unknown;
        prompt?: unknown;
        company?: unknown;
      };
      if (r.verify !== true) continue;
      const title = [r.title, r.term, r.name, r.company, r.prompt].find(
        (x) => typeof x === 'string',
      );
      out.push({
        kind,
        id: String(r.id),
        title: typeof title === 'string' ? title : String(r.id),
        note: typeof r.verifyNote === 'string' ? r.verifyNote : '',
      });
    }
  }
  return out;
}
