/**
 * AF attribute resolution for the PSE mockup: builds the working copy of an element (base model
 * plus your edits) and an expression context in which 'Attribute' names, relative paths such as
 * '..|Attribute', and earlier analysis variables resolve the way AF analyses resolve them.
 */
import { evaluate, parse, type ExprContext, type ExprValue, type Node } from '@/core/sim/expr';
import { DATA_SERVER, findPoint, type SimAttribute, type SimElement } from '@/core/sim/plant';
import { effectiveValue, field, type CheckoutState } from './checkout';
import { parseFormulaConfig, parsePiPointConfig } from './configString';

/** Raised when an attribute exists but cannot supply a value (missing tag, bad formula …). */
export class AttributeError extends Error {
  constructor(
    message: string,
    readonly reference: string,
  ) {
    super(message);
  }
}

/** Map of element id -> parent element, for the base tree. */
export function parentMap(root: SimElement): Map<string, SimElement> {
  const out = new Map<string, SimElement>();
  const walk = (e: SimElement): void => {
    for (const c of e.children) {
      out.set(c.id, e);
      walk(c);
    }
  };
  walk(root);
  return out;
}

/** The element with your description, static value and data reference edits applied. */
export function workingElement(base: SimElement, state: CheckoutState): SimElement {
  const desc = effectiveValue(state, base.id, field.description);
  const attributes = base.attributes.map((a): SimAttribute => {
    const value = effectiveValue(state, base.id, field.value(a.name));
    const config = effectiveValue(state, base.id, field.config(a.name));
    if (value === undefined && config === undefined) return a;
    const next: SimAttribute = { ...a };
    if (typeof value === 'string' || typeof value === 'number') next.value = value;
    if (typeof config === 'string') {
      next.configString = config;
      if (a.dataReference === 'PI Point') {
        const tag = parsePiPointConfig(config, DATA_SERVER)?.tag;
        if (tag) next.tag = tag;
        else delete next.tag;
      }
    }
    return next;
  });
  return { ...base, description: typeof desc === 'string' ? desc : base.description, attributes };
}

export interface AfScope {
  element: SimElement;
  /** returns the (working) parent of an element, if any */
  parentOf: (e: SimElement) => SimElement | undefined;
}

/**
 * Find the attribute a reference names. Forms: `Name`, `|Name`, `.|Name`, `..|Name` (parent
 * element), `..\..|Name` (grandparent).
 */
export function resolveAttributePath(
  scope: AfScope,
  path: string,
): { element: SimElement; attribute: SimAttribute } | null {
  let rest = path.trim();
  let el: SimElement | undefined = scope.element;
  if (rest.startsWith('.|')) rest = rest.slice(1);
  else if (rest.startsWith('..')) {
    // ..|Name, ..\..|Name, ..\..\..|Name
    const m = /^((?:\.\.\\)*)\.\.\|(.+)$/.exec(rest);
    if (!m) return null;
    const ups = (m[1] ?? '').length / 3 + 1;
    for (let i = 0; i < ups && el; i++) el = scope.parentOf(el);
    rest = `|${m[2] ?? ''}`;
  }
  if (rest.startsWith('|')) rest = rest.slice(1);
  if (!el || !rest) return null;
  const want = rest.toLowerCase();
  const attribute = el.attributes.find((a) => a.name.toLowerCase() === want);
  return attribute ? { element: el, attribute } : null;
}

function staticValue(a: SimAttribute): ExprValue {
  const v = a.value;
  if (v === undefined || v === '') return { type: 'string', value: '' };
  if (a.type === 'Boolean') return { type: 'boolean', value: v === 1 || v === 'True' };
  if (a.type === 'String') return { type: 'string', value: String(v) };
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? { type: 'number', value: n } : { type: 'string', value: String(v) };
}

export interface AfContextOptions {
  scope: AfScope;
  now: number;
  /** evaluation time; defaults to now */
  at?: number;
  /** analysis variables computed by earlier rows (looked up before attributes) */
  variables?: Map<string, ExprValue>;
}

const MAX_FORMULA_DEPTH = 5;

/** An expression context for an AF analysis or a Formula data reference on one element. */
export function afContext(opts: AfContextOptions, depth = 0): ExprContext {
  const { scope, now } = opts;
  const at = opts.at ?? now;
  const ctx: ExprContext = {
    now,
    at,
    resolve: (name) => {
      const v = opts.variables?.get(name.toLowerCase());
      if (v) return { value: v };
      const hit = resolveAttributePath(scope, name);
      if (!hit) return null;
      const a = hit.attribute;
      switch (a.dataReference) {
        case 'PI Point': {
          const cfg = parsePiPointConfig(a.configString, DATA_SERVER);
          const tag = cfg?.tag ?? a.tag;
          if (!tag) throw new AttributeError(`'${name}' has no PI point configured`, name);
          if (cfg && cfg.server.toUpperCase() !== DATA_SERVER) {
            throw new AttributeError(`Data server "${cfg.server}" is not known here`, name);
          }
          const point = findPoint(tag);
          if (!point)
            throw new AttributeError(`PI point "${tag}" for '${name}' was not found`, name);
          return { point };
        }
        case 'None':
          return { value: staticValue(a) };
        case 'Formula': {
          if (depth >= MAX_FORMULA_DEPTH) {
            throw new AttributeError(`Formula for '${name}' refers to itself`, name);
          }
          return { value: formulaValue(hit.element, a, opts, depth + 1) };
        }
        default:
          throw new AttributeError(
            `'${name}' uses the ${a.dataReference} data reference, which this simulator cannot evaluate`,
            name,
          );
      }
    },
  };
  return ctx;
}

function refNode(path: string): Node {
  return { t: 'ref', v: path, p: 0 };
}

function formulaValue(
  element: SimElement,
  a: SimAttribute,
  opts: AfContextOptions,
  depth: number,
): ExprValue {
  const cfg = parseFormulaConfig(a.configString);
  if (!cfg) throw new AttributeError(`Formula for '${a.name}' has no [expression]`, a.name);
  const own: AfContextOptions = { scope: { ...opts.scope, element }, now: opts.now };
  if (opts.at !== undefined) own.at = opts.at;
  const outer = afContext(own, depth);
  try {
    const vars = new Map<string, ExprValue>();
    for (const [k, path] of Object.entries(cfg.vars)) {
      vars.set(k.toLowerCase(), evaluate(refNode(path), outer));
    }
    const inner = afContext({ ...own, variables: vars }, depth);
    return evaluate(parse(cfg.expr), inner);
  } catch (e) {
    if (e instanceof AttributeError) throw e;
    throw new AttributeError(
      `Formula for '${a.name}' failed: ${e instanceof Error ? e.message : String(e)}`,
      a.name,
    );
  }
}

/** Value of an attribute on an element at a time, as the attribute grid shows it. */
export function attributeValue(
  scope: AfScope,
  attribute: string,
  now: number,
  at?: number,
): { ok: true; value: ExprValue } | { ok: false; error: string } {
  try {
    const opts: AfContextOptions = { scope, now };
    if (at !== undefined) opts.at = at;
    return { ok: true, value: evaluate(refNode(`|${attribute}`), afContext(opts)) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
