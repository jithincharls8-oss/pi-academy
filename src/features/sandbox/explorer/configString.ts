/**
 * Config string helpers for the PSE mockup: reading and writing PI Point data reference
 * config strings, reading Formula config strings, and resolving template substitution
 * parameters such as `%Element%` or `%@Attribute%` for a chosen element.
 */
import type { SimElement } from '@/core/sim/plant';

export interface PiPointConfig {
  server: string;
  tag: string;
  /** trailing `key=value` options, kept in order (for example `ReadOnly=False`) */
  options: string[];
}

/**
 * Parse a PI Point config string: `\\SERVER\TAG;Option=Value;...`. A config string without the
 * `\\SERVER\` prefix uses `defaultServer`. Returns null for an empty string.
 */
export function parsePiPointConfig(cfg: string, defaultServer = ''): PiPointConfig | null {
  const [path = '', ...options] = cfg.split(';');
  const p = path.trim();
  if (!p) return null;
  const m = /^\\\\([^\\]+)\\(.+)$/.exec(p);
  const server = m ? (m[1] ?? '') : defaultServer;
  const tag = m ? (m[2] ?? '') : p;
  return { server, tag, options: options.map((o) => o.trim()).filter(Boolean) };
}

export function formatPiPointConfig(c: PiPointConfig): string {
  return [`\\\\${c.server}\\${c.tag}`, ...c.options].join(';');
}

export interface FormulaConfig {
  /** variable letter -> attribute path */
  vars: Record<string, string>;
  expr: string;
}

/** Parse a Formula config string such as `A=Flow;B=Rated Flow;[A/B*100]`. */
export function parseFormulaConfig(cfg: string): FormulaConfig | null {
  const m = /\[(.*)\]/s.exec(cfg);
  if (!m) return null;
  const vars: Record<string, string> = {};
  const head = cfg.slice(0, m.index);
  for (const part of head.split(';')) {
    const eq = part.indexOf('=');
    if (eq <= 0) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    if (k && v) vars[k] = v;
  }
  return { vars, expr: (m[1] ?? '').trim() };
}

export interface SubstitutionContext {
  server: string;
  database: string;
  element: SimElement;
  attribute: string;
  parent?: SimElement | null;
  /** text of an attribute value on an element, for `%@Name%` tokens */
  attributeText?: (element: SimElement, attribute: string) => string | undefined;
}

export interface SubstitutionResult {
  text: string;
  /** tokens that could not be resolved (left in place) */
  unresolved: string[];
  /** each resolved token and what it became, in order */
  steps: { token: string; value: string }[];
}

/**
 * Resolve substitution parameters in a config string. Supported tokens: `%Server%`,
 * `%Database%`, `%Element%`, `%..\Element%`, `%Attribute%`, `%Template%`, `%Description%`,
 * and attribute values `%@Name%`, `%@|Name%`, `%@..\Name%`, `%@..\|Name%`.
 * Unknown tokens are left as they are and reported.
 */
export function substitute(pattern: string, ctx: SubstitutionContext): SubstitutionResult {
  const unresolved: string[] = [];
  const steps: { token: string; value: string }[] = [];
  const text = pattern.replace(/%([^%;\\]*(?:\\[^%;]*)?)%/g, (whole, rawName: string) => {
    const value = resolveToken(rawName, ctx);
    if (value === undefined) {
      unresolved.push(whole);
      return whole;
    }
    steps.push({ token: whole, value });
    return value;
  });
  return { text, unresolved, steps };
}

function resolveToken(raw: string, ctx: SubstitutionContext): string | undefined {
  const name = raw.trim();
  const lower = name.toLowerCase();
  switch (lower) {
    case 'server':
      return ctx.server;
    case 'database':
      return ctx.database;
    case 'element':
      return ctx.element.name;
    case '..\\element':
      return ctx.parent?.name;
    case 'attribute':
      return ctx.attribute;
    case 'template':
      return ctx.element.template ?? undefined;
    case 'description':
      return ctx.element.description;
    default:
      break;
  }
  if (!name.startsWith('@') || !ctx.attributeText) return undefined;
  let rest = name.slice(1);
  let target: SimElement | null | undefined = ctx.element;
  if (rest.startsWith('..\\')) {
    target = ctx.parent;
    rest = rest.slice(3);
  }
  if (rest.startsWith('|')) rest = rest.slice(1);
  if (!target || !rest) return undefined;
  return ctx.attributeText(target, rest);
}
