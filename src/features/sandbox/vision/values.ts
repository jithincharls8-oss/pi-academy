/**
 * Reads data for display symbols from the simulated plant: resolves `<element>|<attribute>`
 * items to AF attributes, and gets current values, series and summaries for PI Point,
 * static (None) and Formula attributes.
 */
import type { TimedValue } from '@/core/sim/compression';
import {
  formatValue,
  interpolated,
  plotValues,
  snapshot,
  summary,
  valueAt as pointValueAt,
} from '@/core/sim/data';
import { evaluate, parse, type ExprContext, type Node } from '@/core/sim/expr';
import {
  allElements,
  digitalStateName,
  findElement,
  findPoint,
  plant,
  type SimAttribute,
  type SimElement,
  type SimPoint,
} from '@/core/sim/plant';
import { itemLabel, parseItem } from './model';
import type { Reading } from './multistate';

export interface ResolvedItem {
  item: string;
  element: SimElement;
  attribute: SimAttribute;
  label: string;
  units: string;
  point: SimPoint | null;
  digitalStates: string[] | null;
}

export function resolveItem(item: string): ResolvedItem | null {
  const p = parseItem(item);
  if (!p) return null;
  const element = findElement(p.element);
  if (!element) return null;
  const attribute = element.attributes.find(
    (a) => a.name.toLowerCase() === p.attribute.toLowerCase(),
  );
  if (!attribute) return null;
  const point = attribute.tag ? (findPoint(attribute.tag) ?? null) : null;
  const set = point?.pointtype === 'Digital' ? point.digitalset : null;
  return {
    item,
    element,
    attribute,
    label: itemLabel(item),
    units: attribute.uom,
    point,
    digitalStates: set ? (plant().digitalSets.find((d) => d.name === set)?.states ?? null) : null,
  };
}

export function isNumeric(r: ResolvedItem): boolean {
  return r.attribute.type !== 'String' && !r.digitalStates;
}

export function elementsOfTemplate(template: string, root?: string): SimElement[] {
  const rootPath = root?.toLowerCase();
  return allElements().filter(
    (e) =>
      e.template === template &&
      (!rootPath ||
        e.path.toLowerCase().startsWith(`${rootPath}\\`) ||
        e.path.toLowerCase() === rootPath),
  );
}

/* ---------------------------------------------------------------- formulas */

const parsed = new Map<string, Node | null>();

function formulaNode(a: SimAttribute): Node | null {
  if (!a.formula) return null;
  const key = `${a.formula.expr}|${Object.keys(a.formula.vars).join(',')}`;
  if (parsed.has(key)) return parsed.get(key) ?? null;
  const vars = a.formula.vars;
  const quoted = a.formula.expr.replace(/\b([A-Za-z_]\w*)\b/g, (m) => (m in vars ? `'${m}'` : m));
  let node: Node | null;
  try {
    node = parse(quoted);
  } catch {
    node = null;
  }
  parsed.set(key, node);
  return node;
}

function staticNumber(a: SimAttribute): number | null {
  return typeof a.value === 'number' ? a.value : null;
}

/** Evaluate a Formula attribute with each variable's value supplied by `varValue`. */
function evalFormula(
  r: ResolvedItem,
  now: number,
  varValue: (attr: SimAttribute) => number | null,
): number | null {
  const node = formulaNode(r.attribute);
  const vars = r.attribute.formula?.vars;
  if (!node || !vars) return null;
  const ctx: ExprContext = {
    now,
    resolve: (name) => {
      const attrName = vars[name];
      const a = attrName ? r.element.attributes.find((x) => x.name === attrName) : undefined;
      const v = a ? varValue(a) : null;
      return v === null ? null : { value: { type: 'number', value: v } };
    },
  };
  try {
    const out = evaluate(node, ctx);
    return out.type === 'number' && Number.isFinite(out.value) ? out.value : null;
  } catch {
    return null;
  }
}

/* ---------------------------------------------------------------- values */

/** Value at a time: number, digital state index, string, or null when unavailable. */
export function readAt(r: ResolvedItem, t: number, now: number): number | string | null {
  const a = r.attribute;
  if (r.point) return t >= now ? snapshot(r.point, now).v : pointValueAt(r.point, t, now);
  if (a.dataReference === 'Formula') {
    return evalFormula(r, now, (v) => {
      const p = v.tag ? findPoint(v.tag) : undefined;
      if (p) return t >= now ? snapshot(p, now).v : pointValueAt(p, t, now);
      return staticNumber(v);
    });
  }
  return a.value ?? null;
}

/** The reading used by multi-state: digital points give their state name. */
export function readingOf(r: ResolvedItem, raw: number | string | null): Reading {
  if (raw === null) return null;
  if (r.digitalStates && typeof raw === 'number') return r.digitalStates[Math.round(raw)] ?? null;
  return raw;
}

/** Timestamp of the value shown at `end` (the snapshot time for live ranges). */
export function valueTime(r: ResolvedItem, end: number, now: number): number {
  if (r.point && end >= now) return snapshot(r.point, now).t;
  return Math.min(end, now);
}

export function formatReading(
  r: ResolvedItem,
  raw: number | string | null,
  opts: { decimals?: number | null; units?: boolean } = {},
): string {
  if (raw === null) return 'No data';
  let text: string;
  if (typeof raw === 'string') text = raw;
  else if (r.digitalStates && r.point) text = digitalStateName(r.point.digitalset, raw);
  else if (opts.decimals !== null && opts.decimals !== undefined) text = raw.toFixed(opts.decimals);
  else if (r.point) text = formatValue(r.point, raw);
  else text = Number.isInteger(raw) ? String(raw) : raw.toFixed(2);
  return opts.units && r.units && !r.digitalStates ? `${text} ${r.units}` : text;
}

/** Sibling numeric attribute value (for multi-state limits and gauge scales). */
export function siblingNumber(
  r: ResolvedItem,
  name: string,
  t: number,
  now: number,
): number | null {
  const a = r.element.attributes.find((x) => x.name.toLowerCase() === name.toLowerCase());
  if (!a) return null;
  const sib = resolveItem(`${r.element.path}|${a.name}`);
  const v = sib ? readAt(sib, t, now) : null;
  return typeof v === 'number' ? v : null;
}

/** Plot series over a range (plot values for PI points, so spikes survive). */
export function seriesOf(
  r: ResolvedItem,
  start: number,
  end: number,
  now: number,
  intervals = 300,
): TimedValue[] {
  const stop = Math.min(end, now);
  if (stop <= start) return [];
  if (r.point) {
    const pts = plotValues(r.point, start, stop, intervals);
    const first = { t: start, v: pointValueAt(r.point, start, now) };
    const last = {
      t: stop,
      v: stop >= now ? snapshot(r.point, now).v : pointValueAt(r.point, stop, now),
    };
    return [first, ...pts.filter((p) => p.t > start && p.t < stop), last];
  }
  if (r.attribute.dataReference === 'Formula') {
    const n = Math.min(intervals, 240);
    const step = Math.max(1000, (stop - start) / n);
    const inputs = new Map<string, Map<number, number>>();
    for (const name of Object.values(r.attribute.formula?.vars ?? {})) {
      const a = r.element.attributes.find((x) => x.name === name);
      const p = a?.tag ? findPoint(a.tag) : undefined;
      if (a && p)
        inputs.set(a.name, new Map(interpolated(p, start, stop, step, now).map((x) => [x.t, x.v])));
    }
    const out: TimedValue[] = [];
    for (let t = start; t <= stop; t += step) {
      const v = evalFormula(r, now, (a) => inputs.get(a.name)?.get(t) ?? staticNumber(a));
      if (v !== null) out.push({ t, v });
    }
    return out;
  }
  const v = staticNumber(r.attribute);
  return v === null
    ? []
    : [
        { t: start, v },
        { t: stop, v },
      ];
}

/** Evenly spaced values (for the XY plot, which pairs X and Y by time). */
export function sampledOf(
  r: ResolvedItem,
  start: number,
  end: number,
  now: number,
  n = 120,
): TimedValue[] {
  const stop = Math.min(end, now);
  if (stop <= start) return [];
  const step = Math.max(1000, Math.floor((stop - start) / n));
  if (r.point) return interpolated(r.point, start, stop, step, now);
  const out: TimedValue[] = [];
  for (let t = start; t <= stop; t += step) {
    const v = readAt(r, t, now);
    if (typeof v === 'number') out.push({ t, v });
  }
  return out;
}

export interface RangeStats {
  min: number;
  max: number;
  avg: number;
}

export function statsOf(
  r: ResolvedItem,
  start: number,
  end: number,
  now: number,
): RangeStats | null {
  if (!isNumeric(r)) return null;
  if (r.point) {
    return {
      min: summary(r.point, start, end, 'Minimum', now),
      max: summary(r.point, start, end, 'Maximum', now),
      avg: summary(r.point, start, end, 'Average', now),
    };
  }
  const s = seriesOf(r, start, end, now, 120);
  if (!s.length) return null;
  const vs = s.map((p) => p.v);
  return {
    min: Math.min(...vs),
    max: Math.max(...vs),
    avg: vs.reduce((a, b) => a + b, 0) / vs.length,
  };
}

/** Scale for gauges and bars: the PI point's zero and span, or a sensible range otherwise. */
export function scaleOf(r: ResolvedItem): { min: number; max: number } {
  if (r.point) return { min: r.point.zero, max: r.point.zero + r.point.span };
  if (r.units === '%') return { min: 0, max: 120 };
  const v = staticNumber(r.attribute);
  return { min: 0, max: v && v > 0 ? v * 1.5 : 100 };
}

/** Limit attributes on the element that apply to this attribute (for trend reference lines). */
export function limitsOf(r: ResolvedItem): { value: number; label: string; tone: 'hi' | 'warn' }[] {
  const name = r.attribute.name.toLowerCase();
  return r.element.attributes
    .filter(
      (a) =>
        a.category === 'Limits' &&
        typeof a.value === 'number' &&
        a.uom === r.units &&
        a.name.toLowerCase().includes(name),
    )
    .map((a) => ({
      value: a.value as number,
      label: a.name,
      tone: /\blow\b/i.test(a.name) ? ('warn' as const) : ('hi' as const),
    }));
}
