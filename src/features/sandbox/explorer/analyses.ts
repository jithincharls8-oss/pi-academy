/**
 * Expression analyses for the PSE mockup: multi-row expressions where each row is a variable
 * later rows can use, evaluated against one element with Evaluate (at "now") or Preview Results
 * (at a series of trigger times over a range), plus the ready-made examples.
 */
import { evaluate, ExprError, parse, type ExprValue, type Node } from '@/core/sim/expr';
import { recorded } from '@/core/sim/data';
import type { SimElement } from '@/core/sim/plant';
import { afContext, AttributeError, resolveAttributePath, type AfScope } from './afContext';

export interface AnalysisRow {
  id: string;
  name: string;
  expression: string;
  /** output attribute name, or null when the variable is not mapped */
  output: string | null;
}

export type Schedule =
  | { kind: 'event'; triggers: 'any' | string[] }
  | { kind: 'periodic'; periodS: number; offsetS: number };

export interface AnalysisDef {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  rows: AnalysisRow[];
  schedule: Schedule;
}

export type RowResult =
  { ok: true; value: ExprValue } | { ok: false; error: string; position: number };

const VARIABLE_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** Locate a quoted reference in the source, for errors raised while resolving it. */
function referencePosition(src: string, ref: string): number {
  const i = src.indexOf(`'${ref}'`);
  if (i >= 0) return i;
  const j = src.indexOf(ref);
  return j >= 0 ? j : 0;
}

/** Evaluate one expression against an element; errors carry a character position. */
export function evaluateExpression(
  src: string,
  scope: AfScope,
  now: number,
  at: number,
  variables: Map<string, ExprValue>,
): RowResult {
  if (!src.trim()) return { ok: false, error: 'The expression is empty', position: 0 };
  try {
    const node = parse(src);
    return { ok: true, value: evaluate(node, afContext({ scope, now, at, variables })) };
  } catch (e) {
    if (e instanceof ExprError) return { ok: false, error: e.message, position: e.position };
    if (e instanceof AttributeError) {
      return { ok: false, error: e.message, position: referencePosition(src, e.reference) };
    }
    return { ok: false, error: e instanceof Error ? e.message : String(e), position: 0 };
  }
}

/** Evaluate every row in order; each successful row becomes a variable for later rows. */
export function evaluateAnalysis(
  def: AnalysisDef,
  scope: AfScope,
  now: number,
  at: number = now,
): RowResult[] {
  const vars = new Map<string, ExprValue>();
  const seen = new Set<string>();
  return def.rows.map((row) => {
    const key = row.name.trim().toLowerCase();
    if (!VARIABLE_NAME.test(row.name.trim())) {
      return {
        ok: false,
        error: 'Variable names start with a letter and use letters, digits or _ only',
        position: 0,
      };
    }
    if (seen.has(key)) {
      return { ok: false, error: `Variable "${row.name}" is defined twice`, position: 0 };
    }
    seen.add(key);
    const r = evaluateExpression(row.expression, scope, now, at, vars);
    if (r.ok) vars.set(key, r.value);
    return r;
  });
}

function collectRefs(n: Node, out: Set<string>): void {
  switch (n.t) {
    case 'ref':
      out.add(n.v);
      return;
    case 'unary':
      collectRefs(n.e, out);
      return;
    case 'bin':
      collectRefs(n.l, out);
      collectRefs(n.r, out);
      return;
    case 'if':
      collectRefs(n.c, out);
      collectRefs(n.a, out);
      collectRefs(n.b, out);
      return;
    case 'call':
      n.args.forEach((a) => collectRefs(a, out));
      return;
    case 'pairs':
      n.pairs.forEach(([a, b]) => {
        collectRefs(a, out);
        collectRefs(b, out);
      });
      return;
    default:
      return;
  }
}

/** Attribute references the analysis reads (not variables, not time strings). */
export function analysisInputs(def: AnalysisDef, scope: AfScope): string[] {
  const vars = new Set(def.rows.map((r) => r.name.trim().toLowerCase()));
  const refs = new Set<string>();
  for (const r of def.rows) {
    try {
      collectRefs(parse(r.expression), refs);
    } catch {
      // rows with syntax errors contribute no inputs
    }
  }
  const out: string[] = [];
  for (const ref of refs) {
    if (vars.has(ref.toLowerCase())) continue;
    if (resolveAttributePath(scope, ref) && !out.includes(ref)) out.push(ref);
  }
  return out;
}

/** Thin a sorted list of times to at most `max` evenly picked entries. */
export function thin(times: number[], max: number): number[] {
  if (times.length <= max) return times;
  const out: number[] = [];
  const step = (times.length - 1) / (max - 1);
  for (let i = 0; i < max; i++) out.push(times[Math.round(i * step)] as number);
  return [...new Set(out)];
}

/**
 * Trigger times in a range. Periodic: clock-aligned to local midnight plus the offset.
 * Event-triggered: the archived event times of the triggering PI Point inputs.
 */
export function triggerTimes(
  def: AnalysisDef,
  scope: AfScope,
  start: number,
  end: number,
  now: number,
  max = 150,
): number[] {
  const stop = Math.min(end, now);
  if (stop <= start) return [];
  if (def.schedule.kind === 'periodic') {
    const period = Math.max(1, def.schedule.periodS) * 1000;
    const d = new Date(start);
    d.setHours(0, 0, 0, 0);
    const anchor = d.getTime() + def.schedule.offsetS * 1000;
    let t = anchor + Math.ceil((start - anchor) / period) * period;
    const out: number[] = [];
    for (; t <= stop && out.length < 10_000; t += period) out.push(t);
    return thin(out, max);
  }
  const inputs =
    def.schedule.triggers === 'any' ? analysisInputs(def, scope) : def.schedule.triggers;
  const times = new Set<number>();
  for (const name of inputs) {
    const hit = resolveAttributePath(scope, name);
    if (!hit || hit.attribute.dataReference !== 'PI Point' || !hit.attribute.tag) continue;
    try {
      for (const e of recorded(hit.attribute.tag, start, stop)) times.add(e.t);
    } catch {
      // a missing tag contributes no trigger events
    }
  }
  return thin(
    [...times].sort((a, b) => a - b),
    max,
  );
}

export interface PreviewResult {
  times: number[];
  results: RowResult[][];
}

/** Preview Results: evaluate the analysis at each trigger time in the range. */
export function previewAnalysis(
  def: AnalysisDef,
  scope: AfScope,
  start: number,
  end: number,
  now: number,
  max = 150,
): PreviewResult {
  const times = triggerTimes(def, scope, start, end, now, max);
  return { times, results: times.map((t) => evaluateAnalysis(def, scope, now, t)) };
}

export function scheduleLabel(s: Schedule): string {
  if (s.kind === 'event') {
    return s.triggers === 'any'
      ? 'Event-triggered, any input'
      : `Event-triggered on ${s.triggers.join(', ') || 'no inputs'}`;
  }
  const p = s.periodS;
  const txt = p % 3600 === 0 ? `${p / 3600} h` : p % 60 === 0 ? `${p / 60} min` : `${p} s`;
  return `Periodic every ${txt}${s.offsetS ? `, offset ${s.offsetS} s` : ''}`;
}

/* ---------------------------------------------------------------- examples */

let counter = 0;
export function newId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

const row = (name: string, expression: string, output: string | null = null): AnalysisRow => ({
  id: `${name}`,
  name,
  expression,
  output,
});

function def(
  id: string,
  name: string,
  description: string,
  rows: AnalysisRow[],
  schedule: Schedule,
  category = 'Calculated Data',
): AnalysisDef {
  return { id, name, description, category, enabled: true, rows, schedule };
}

/** Ready-made analyses so learners can press Evaluate straight away. */
export function exampleAnalyses(e: SimElement): AnalysisDef[] {
  switch (e.template) {
    case 'Pump':
      return [
        def(
          `${e.id}-eff`,
          'Flow Efficiency',
          'Flow as a percentage of rated flow, only while the pump runs',
          [
            row('FlowNow', "'Flow'"),
            row('Rated', "'Rated Flow'"),
            row(
              'Efficiency',
              'IF \'Status\' = "Running" THEN FlowNow / Rated * 100 ELSE NoOutput()',
              'Flow Efficiency Result',
            ),
          ],
          { kind: 'event', triggers: ['Flow'] },
        ),
        def(
          `${e.id}-avg`,
          'Hourly Average Flow',
          'Time-weighted average of the last hour',
          [row('AvgFlow', "TagAvg('Flow','*-1h','*')", 'Flow 1h Average')],
          { kind: 'periodic', periodS: 3600, offsetS: 0 },
          'Aggregation',
        ),
        def(
          `${e.id}-run`,
          'Running Hours Today',
          'Time in the Running state since midnight',
          [
            row('RunSeconds', "TimeEq('Status','t','*',\"Running\")"),
            row('RunHours', 'RunSeconds / 3600', 'Running Hours Today'),
          ],
          { kind: 'periodic', periodS: 600, offsetS: 0 },
          'Aggregation',
        ),
        def(
          `${e.id}-vib`,
          'Vibration Check',
          'Flags vibration above the alarm limit',
          [
            row('Vib', "'Vibration'"),
            row('Limit', "'High Vibration Limit'"),
            row('VibHigh', 'IF Vib > Limit THEN 1 ELSE 0', 'Vibration High Flag'),
          ],
          { kind: 'event', triggers: 'any' },
        ),
      ];
    case 'Tank':
      return [
        def(
          `${e.id}-vol`,
          'Tank Volume',
          'Volume held from level and capacity',
          [
            row('Volume', "'Level' / 100 * 'Capacity'", 'Volume'),
            row('Headroom', "'High Level Limit' - 'Level'"),
          ],
          { kind: 'event', triggers: ['Level'] },
        ),
        def(
          `${e.id}-avg`,
          'Level 8-hour Range',
          'Highest and lowest level over the last 8 hours',
          [
            row('LevelMax', "TagMax('Level','*-8h','*')"),
            row('LevelMin', "TagMin('Level','*-8h','*')"),
            row('Swing', 'LevelMax - LevelMin', 'Level Swing 8h'),
          ],
          { kind: 'periodic', periodS: 900, offsetS: 0 },
          'Aggregation',
        ),
      ];
    case 'Heat Exchanger':
      return [
        def(
          `${e.id}-dt`,
          'Temperature Rise',
          'Cold side temperature rise across the exchanger',
          [row('DeltaT', "'Outlet Temperature' - 'Inlet Temperature'", 'Temperature Rise')],
          { kind: 'event', triggers: 'any' },
        ),
      ];
    case 'Boiler':
      return [
        def(
          `${e.id}-ratio`,
          'Steam to Fuel Ratio',
          'kg of steam per Nm3 of gas while firing',
          [
            row('Fuel', "'Fuel Flow'"),
            row(
              'Ratio',
              "IF Fuel > 50 THEN 'Steam Flow' * 1000 / Fuel ELSE NoOutput()",
              'Steam to Fuel Ratio',
            ),
          ],
          { kind: 'periodic', periodS: 300, offsetS: 0 },
        ),
        def(
          `${e.id}-stack`,
          'Stack Above Ambient',
          "Uses '..\\..|Ambient Temperature' to read the site element two levels up",
          [
            row('Ambient', "'..\\..|Ambient Temperature'"),
            row('StackRise', "'Stack Temperature' - Ambient", 'Stack Rise'),
          ],
          { kind: 'periodic', periodS: 600, offsetS: 0 },
        ),
      ];
    case 'Compressor':
      return [
        def(
          `${e.id}-load`,
          'Motor Load',
          'Power as a percentage of the motor rating',
          [row('Load', "'Power' / 'Rated Power' * 100", 'Motor Load')],
          { kind: 'event', triggers: ['Power'] },
        ),
      ];
    default:
      if (e.attributes.some((a) => a.name === 'Ambient Temperature')) {
        return [
          def(
            `${e.id}-amb`,
            'Ambient Today',
            'Average ambient temperature since midnight',
            [
              row('AvgToday', "TagAvg('Ambient Temperature','t','*')", 'Ambient Average Today'),
              row('Batches', "'Batches Today'"),
            ],
            { kind: 'periodic', periodS: 1800, offsetS: 0 },
            'Aggregation',
          ),
        ];
      }
      return [];
  }
}

export function blankAnalysis(n: number): AnalysisDef {
  return {
    id: newId('an'),
    name: `New Analysis ${n}`,
    description: '',
    category: 'Calculated Data',
    enabled: false,
    rows: [{ id: newId('row'), name: 'Variable1', expression: '', output: null }],
    schedule: { kind: 'event', triggers: 'any' },
  };
}
