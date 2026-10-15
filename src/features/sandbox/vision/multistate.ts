/**
 * Multi-state: colour a symbol by the value of its data item. Numeric items use up to five
 * ranges with editable maximums (a maximum can be a sibling limit attribute, so it follows an
 * asset swap); digital items colour by state name. A missing value takes the Bad data colour.
 */
import type { TokenColor } from './colors';
import type { Bound, MultiState } from './model';

export type Reading = number | string | null;

export interface MultiStateResult {
  color: TokenColor;
  /** which state matched: a range index, a state name, or "bad" */
  state: string;
  blink: boolean;
}

/** Resolve a range maximum. `lookup` reads a sibling attribute's value by name. */
export function resolveBound(
  b: Bound,
  lookup: (attribute: string) => number | null,
): number | null {
  return b.kind === 'number' ? b.value : lookup(b.name);
}

export function evaluateMultiState(
  ms: MultiState,
  reading: Reading,
  lookup: (attribute: string) => number | null,
): MultiStateResult {
  const bad = { color: ms.bad, state: 'bad', blink: false };
  if (reading === null || (typeof reading === 'number' && !Number.isFinite(reading))) return bad;
  if (typeof reading === 'string') {
    const s = ms.states.find((x) => x.name.toLowerCase() === reading.toLowerCase());
    return s ? { color: s.color, state: s.name, blink: ms.blink && s.color === 'alarm' } : bad;
  }
  for (let i = 0; i < ms.ranges.length; i++) {
    const r = ms.ranges[i];
    if (!r) continue;
    const max = r.upTo ? resolveBound(r.upTo, lookup) : null;
    if (r.upTo && max === null) continue;
    if (max === null || reading < max) {
      return { color: r.color, state: `range ${i + 1}`, blink: ms.blink && r.color === 'alarm' };
    }
  }
  return bad;
}

/** Default colours for a digital set's states, by common state names. */
export function digitalDefaults(states: string[]): MultiState {
  const pick = (name: string): TokenColor => {
    const n = name.toLowerCase();
    if (/trip|fault|alarm|fail/.test(n)) return 'alarm';
    if (/run|on|high fire|open/.test(n) && !/off/.test(n)) return 'ok';
    if (/purge|low fire|start/.test(n)) return 'warn';
    return 'muted';
  };
  return {
    ranges: [],
    states: states.map((name) => ({ name, color: pick(name) })),
    bad: 'muted',
    blink: false,
  };
}

/**
 * Default ranges for a numeric attribute. When the element has limit attributes for it
 * (e.g. "High Vibration Limit", or "Low Level Limit" and "High Level Limit") they become the
 * maximums; otherwise the ranges split the point's span at 80 % and 95 %.
 */
export function numericDefaults(
  attribute: string,
  siblings: { name: string; category: string }[],
  span: { min: number; max: number },
): MultiState {
  const a = attribute.toLowerCase();
  const limits = siblings.filter(
    (s) => s.category === 'Limits' && s.name.toLowerCase().includes(a),
  );
  const low = limits.find((s) => /\blow\b/i.test(s.name));
  const high = limits.find((s) => /\bhigh\b/i.test(s.name));
  const ranges: MultiState['ranges'] = [];
  if (low) ranges.push({ upTo: { kind: 'attribute', name: low.name }, color: 'warn' });
  if (high) {
    ranges.push({ upTo: { kind: 'attribute', name: high.name }, color: 'ok' });
    ranges.push({ upTo: null, color: 'alarm' });
  } else if (low) {
    ranges.push({ upTo: null, color: 'ok' });
  } else {
    const len = span.max - span.min;
    const round = (v: number): number => Math.round(v * 100) / 100;
    ranges.push({ upTo: { kind: 'number', value: round(span.min + len * 0.8) }, color: 'ok' });
    ranges.push({ upTo: { kind: 'number', value: round(span.min + len * 0.95) }, color: 'warn' });
    ranges.push({ upTo: null, color: 'alarm' });
  }
  return { ranges, states: [], bad: 'muted', blink: false };
}
