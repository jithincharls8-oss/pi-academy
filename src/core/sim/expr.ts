/**
 * A teaching evaluator for PI Performance Equation (PE) and AF Analytics expression syntax,
 * running against the synthetic plant. It covers the operators and the functions whose names
 * and argument order appear in OSIsoft/AVEVA course material (see research/fn.md); it is not a
 * full reimplementation, and the UI says so.
 *
 * Syntax: numbers, "strings", 'references' (a PI tag in PE, an attribute name in AF, or a time
 * string when a function expects a time), + - * / ^, = <> < > <= >=, AND OR NOT,
 * IF ... THEN ... ELSE (with ELSE IF), and Function(args).
 */
import { formatValue, recorded, scans, snapshot, summary, valueAt, type SummaryType } from './data';
import { findPoint, type SimPoint } from './plant';
import { parsePiTime, parseTimeRange, TimeParseError } from './time';
import { interpolate } from './compression';

/* ---------------------------------------------------------------- values */

export type ExprValue =
  | { type: 'number'; value: number }
  | { type: 'string'; value: string }
  | { type: 'boolean'; value: boolean }
  | { type: 'time'; value: number }
  | { type: 'nooutput' };

export class ExprError extends Error {
  constructor(
    message: string,
    readonly position: number,
  ) {
    super(message);
  }
}

/* ---------------------------------------------------------------- lexer */

type Tok =
  | { k: 'num'; v: number; p: number }
  | { k: 'str'; v: string; p: number }
  | { k: 'ref'; v: string; p: number }
  | { k: 'id'; v: string; p: number }
  | { k: 'op'; v: string; p: number }
  | { k: 'eof'; p: number };

function lex(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i] as string;
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (src.startsWith('//', i)) {
      while (i < src.length && src[i] !== '\n') i++;
      continue;
    }
    if (src.startsWith('/*', i)) {
      const end = src.indexOf('*/', i + 2);
      i = end === -1 ? src.length : end + 2;
      continue;
    }
    const p = i;
    if (/[0-9.]/.test(c)) {
      const m = /^\d*\.?\d+(?:[eE][+-]?\d+)?/.exec(src.slice(i));
      if (!m) throw new ExprError(`Unexpected "${c}"`, p);
      out.push({ k: 'num', v: Number(m[0]), p });
      i += m[0].length;
      continue;
    }
    if (c === '"' || c === "'") {
      const end = src.indexOf(c, i + 1);
      if (end === -1) throw new ExprError(`Missing closing ${c}`, p);
      const text = src.slice(i + 1, end);
      out.push(c === '"' ? { k: 'str', v: text, p } : { k: 'ref', v: text, p });
      i = end + 1;
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      const m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i));
      const w = (m?.[0] ?? c) as string;
      out.push({ k: 'id', v: w, p });
      i += w.length;
      continue;
    }
    const two = src.slice(i, i + 2);
    if (['<>', '<=', '>='].includes(two)) {
      out.push({ k: 'op', v: two, p });
      i += 2;
      continue;
    }
    if ('+-*/^()=<>,'.includes(c)) {
      out.push({ k: 'op', v: c, p });
      i++;
      continue;
    }
    throw new ExprError(`Unexpected character "${c}"`, p);
  }
  out.push({ k: 'eof', p: src.length });
  return out;
}

/* ---------------------------------------------------------------- parser */

export type Node =
  | { t: 'num'; v: number; p: number }
  | { t: 'str'; v: string; p: number }
  | { t: 'ref'; v: string; p: number }
  | { t: 'unary'; op: string; e: Node; p: number }
  | { t: 'bin'; op: string; l: Node; r: Node; p: number }
  | { t: 'if'; c: Node; a: Node; b: Node; p: number }
  | { t: 'call'; name: string; args: Node[]; p: number }
  | { t: 'pairs'; pairs: [Node, Node][]; p: number };

const KEYWORDS = new Set(['if', 'then', 'else', 'and', 'or', 'not']);

export function parse(src: string): Node {
  const toks = lex(src);
  let i = 0;
  const peek = (): Tok => toks[i] as Tok;
  const next = (): Tok => toks[i++] as Tok;
  const isOp = (v: string): boolean => {
    const t = peek();
    return t.k === 'op' && t.v === v;
  };
  const isKw = (v: string): boolean => {
    const t = peek();
    return t.k === 'id' && t.v.toLowerCase() === v;
  };
  const expect = (v: string): void => {
    const t = next();
    if (!(t.k === 'op' && t.v === v) && !(t.k === 'id' && t.v.toLowerCase() === v)) {
      throw new ExprError(`Expected "${v.toUpperCase()}"`, t.p);
    }
  };

  const expr = (): Node => ifExpr();
  const ifExpr = (): Node => {
    if (isKw('if')) {
      const p = next().p;
      const c = expr();
      expect('then');
      const a = expr();
      expect('else');
      const b = expr();
      return { t: 'if', c, a, b, p };
    }
    return or();
  };
  const or = (): Node => {
    let l = and();
    while (isKw('or')) {
      const p = next().p;
      l = { t: 'bin', op: 'or', l, r: and(), p };
    }
    return l;
  };
  const and = (): Node => {
    let l = not();
    while (isKw('and')) {
      const p = next().p;
      l = { t: 'bin', op: 'and', l, r: not(), p };
    }
    return l;
  };
  const not = (): Node => {
    if (isKw('not')) {
      const p = next().p;
      return { t: 'unary', op: 'not', e: not(), p };
    }
    return cmp();
  };
  const cmp = (): Node => {
    let l = add();
    for (;;) {
      const t = peek();
      if (t.k === 'op' && ['=', '<>', '<', '>', '<=', '>='].includes(t.v)) {
        next();
        l = { t: 'bin', op: t.v, l, r: add(), p: t.p };
      } else return l;
    }
  };
  const add = (): Node => {
    let l = mul();
    for (;;) {
      const t = peek();
      if (t.k === 'op' && (t.v === '+' || t.v === '-')) {
        next();
        l = { t: 'bin', op: t.v, l, r: mul(), p: t.p };
      } else return l;
    }
  };
  const mul = (): Node => {
    let l = unary();
    for (;;) {
      const t = peek();
      if (t.k === 'op' && (t.v === '*' || t.v === '/')) {
        next();
        l = { t: 'bin', op: t.v, l, r: unary(), p: t.p };
      } else return l;
    }
  };
  const unary = (): Node => {
    const t = peek();
    if (t.k === 'op' && (t.v === '-' || t.v === '+')) {
      next();
      return { t: 'unary', op: t.v, e: unary(), p: t.p };
    }
    return pow();
  };
  const pow = (): Node => {
    const base = primary();
    if (isOp('^')) {
      const p = next().p;
      return { t: 'bin', op: '^', l: base, r: unary(), p };
    }
    return base;
  };
  const primary = (): Node => {
    const t = next();
    if (t.k === 'num') return { t: 'num', v: t.v, p: t.p };
    if (t.k === 'str') return { t: 'str', v: t.v, p: t.p };
    if (t.k === 'ref') return { t: 'ref', v: t.v, p: t.p };
    if (t.k === 'op' && t.v === '(') {
      // Curve's point list: (x1,y1) (x2,y2) ...
      const save = i;
      const first = tryPair();
      if (first) {
        const pairs: [Node, Node][] = [first];
        for (;;) {
          const s2 = i;
          if (!isOp('(')) break;
          next();
          const pr = tryPair();
          if (!pr) {
            i = s2;
            break;
          }
          pairs.push(pr);
        }
        return { t: 'pairs', pairs, p: t.p };
      }
      i = save;
      const e = expr();
      expect(')');
      return e;
    }
    if (t.k === 'id') {
      if (KEYWORDS.has(t.v.toLowerCase())) throw new ExprError(`Unexpected "${t.v}"`, t.p);
      if (isOp('(')) {
        next();
        const args: Node[] = [];
        if (!isOp(')')) {
          args.push(expr());
          while (isOp(',')) {
            next();
            args.push(expr());
          }
        }
        expect(')');
        return { t: 'call', name: t.v, args, p: t.p };
      }
      // A bare word: an AF variable or a PE tag name without quotes.
      return { t: 'ref', v: t.v, p: t.p };
    }
    throw new ExprError(t.k === 'eof' ? 'The expression ends too early' : 'Unexpected symbol', t.p);
  };
  /** after "(": reads "a, b)" and returns the pair, or null without consuming on failure */
  const tryPair = (): [Node, Node] | null => {
    const save = i;
    try {
      const a = add();
      if (!isOp(',')) {
        i = save;
        return null;
      }
      next();
      const b = add();
      if (!isOp(')')) {
        i = save;
        return null;
      }
      next();
      if (isOp('(') || isOp(')')) return [a, b];
      i = save;
      return null;
    } catch {
      i = save;
      return null;
    }
  };

  const tree = expr();
  const end = peek();
  if (end.k !== 'eof') throw new ExprError('Unexpected text after the expression', end.p);
  return tree;
}

/* ---------------------------------------------------------------- evaluation */

export interface ExprContext {
  now: number;
  /** resolves a 'reference' to a PI point, a static value, or nothing */
  resolve: (name: string) => { point: SimPoint } | { value: ExprValue } | null;
  /** evaluation time ('*' in time strings) */
  at?: number;
}

const num = (value: number): ExprValue => ({ type: 'number', value });
const str = (value: string): ExprValue => ({ type: 'string', value });
const bool = (value: boolean): ExprValue => ({ type: 'boolean', value });

function asNumber(v: ExprValue, p: number): number {
  if (v.type === 'number') return v.value;
  if (v.type === 'boolean') return v.value ? 1 : 0;
  if (v.type === 'time') return v.value / 1000;
  if (v.type === 'string' && v.value.trim() !== '' && !Number.isNaN(Number(v.value))) {
    return Number(v.value);
  }
  throw new ExprError(`Expected a number but got ${describe(v)}`, p);
}

function truthy(v: ExprValue, p: number): boolean {
  if (v.type === 'boolean') return v.value;
  return asNumber(v, p) !== 0;
}

export function describe(v: ExprValue): string {
  switch (v.type) {
    case 'number':
      return String(Math.round(v.value * 1e6) / 1e6);
    case 'string':
      return `"${v.value}"`;
    case 'boolean':
      return v.value ? 'True' : 'False';
    case 'time':
      return new Date(v.value).toLocaleString();
    case 'nooutput':
      return 'NoOutput (no value is written)';
  }
}

function pointValue(p: SimPoint, t: number, now: number): ExprValue {
  const v = t >= now ? snapshot(p, now).v : valueAt(p, t, now);
  return p.pointtype === 'Digital' ? str(formatValue(p, v)) : num(v);
}

export function evaluate(node: Node, ctx: ExprContext): ExprValue {
  const at = ctx.at ?? ctx.now;

  const timeOf = (n: Node, relativeTo?: number): number => {
    if (n.t === 'ref' || n.t === 'str') {
      try {
        return parsePiTime(n.v, at, relativeTo ?? at);
      } catch (e) {
        throw new ExprError(e instanceof TimeParseError ? e.message : 'Bad time', n.p);
      }
    }
    const v = ev(n);
    if (v.type === 'time') return v.value;
    throw new ExprError("Expected a time such as '*-1h'", n.p);
  };
  const range = (a: Node, b: Node): { start: number; end: number } => {
    if ((a.t === 'ref' || a.t === 'str') && (b.t === 'ref' || b.t === 'str')) {
      try {
        return parseTimeRange(a.v, b.v, at);
      } catch (e) {
        throw new ExprError(e instanceof TimeParseError ? e.message : 'Bad time', a.p);
      }
    }
    return { start: timeOf(a), end: timeOf(b) };
  };
  const pointOf = (n: Node): SimPoint => {
    if (n.t !== 'ref') throw new ExprError('Expected a quoted tag or attribute', n.p);
    const r = ctx.resolve(n.v);
    if (r && 'point' in r) return r.point;
    throw new ExprError(`'${n.v}' is not a PI point here`, n.p);
  };
  const need = (args: Node[], n: number, name: string, p: number): void => {
    if (args.length < n) throw new ExprError(`${name} needs ${n} argument${n === 1 ? '' : 's'}`, p);
  };

  const ev = (n: Node): ExprValue => {
    switch (n.t) {
      case 'num':
        return num(n.v);
      case 'str':
        return str(n.v);
      case 'pairs':
        throw new ExprError('A point list is only allowed inside Curve()', n.p);
      case 'ref': {
        const r = ctx.resolve(n.v);
        if (!r) throw new ExprError(`Unknown tag or attribute '${n.v}'`, n.p);
        if ('value' in r) return r.value;
        return pointValue(r.point, at, ctx.now);
      }
      case 'unary': {
        const v = ev(n.e);
        if (n.op === 'not') return bool(!truthy(v, n.p));
        return num(n.op === '-' ? -asNumber(v, n.p) : asNumber(v, n.p));
      }
      case 'if':
        return truthy(ev(n.c), n.p) ? ev(n.a) : ev(n.b);
      case 'bin': {
        if (n.op === 'and') return bool(truthy(ev(n.l), n.p) && truthy(ev(n.r), n.p));
        if (n.op === 'or') return bool(truthy(ev(n.l), n.p) || truthy(ev(n.r), n.p));
        const l = ev(n.l);
        const r = ev(n.r);
        if (['=', '<>', '<', '>', '<=', '>='].includes(n.op)) {
          if (l.type === 'string' || r.type === 'string') {
            const a = l.type === 'string' ? l.value : describe(l);
            const b = r.type === 'string' ? r.value : describe(r);
            const c = a.localeCompare(b, undefined, { sensitivity: 'accent' });
            return bool(compare(n.op, c));
          }
          const a = asNumber(l, n.p);
          const b = asNumber(r, n.p);
          return bool(compare(n.op, a === b ? 0 : a < b ? -1 : 1));
        }
        if (l.type === 'time' && r.type === 'time' && n.op === '-') {
          return num((l.value - r.value) / 1000);
        }
        const a = asNumber(l, n.p);
        const b = asNumber(r, n.p);
        switch (n.op) {
          case '+':
            return num(a + b);
          case '-':
            return num(a - b);
          case '*':
            return num(a * b);
          case '/':
            if (b === 0) throw new ExprError('Division by zero', n.p);
            return num(a / b);
          case '^':
            return num(Math.pow(a, b));
        }
        throw new ExprError(`Unknown operator ${n.op}`, n.p);
      }
      case 'call':
        return call(n.name.toLowerCase(), n.args, n.p, n.name);
    }
  };

  const numArgs = (args: Node[]): number[] => args.map((a) => asNumber(ev(a), a.p));

  const tagSummary = (args: Node[], p: number, name: string, type: SummaryType): ExprValue => {
    need(args, 3, name, p);
    const pt = pointOf(args[0] as Node);
    const { start, end } = range(args[1] as Node, args[2] as Node);
    if (end <= start) throw new ExprError('The end time must be after the start time', p);
    return num(summary(pt, start, end, type, ctx.now));
  };

  const timeCompare = (args: Node[], p: number, name: string, op: string): ExprValue => {
    need(args, 4, name, p);
    const pt = pointOf(args[0] as Node);
    const { start, end } = range(args[1] as Node, args[2] as Node);
    const target = ev(args[3] as Node);
    const samples = scans(pt, start, Math.min(end, ctx.now));
    let secs = 0;
    for (let i = 1; i < samples.length; i++) {
      const prev = samples[i - 1] as { t: number; v: number };
      const cur = samples[i] as { t: number; v: number };
      const v: ExprValue = pt.pointtype === 'Digital' ? str(formatValue(pt, prev.v)) : num(prev.v);
      const c =
        v.type === 'string' && target.type === 'string'
          ? v.value.localeCompare(target.value, undefined, { sensitivity: 'accent' })
          : Math.sign(asNumber(v, p) - asNumber(target, p));
      if (compare(op, c)) secs += (cur.t - prev.t) / 1000;
    }
    return num(secs);
  };

  const call = (fn: string, args: Node[], p: number, display: string): ExprValue => {
    const math1 = (f: (x: number) => number): ExprValue => {
      need(args, 1, display, p);
      return num(f(asNumber(ev(args[0] as Node), p)));
    };
    switch (fn) {
      case 'abs':
        return math1(Math.abs);
      case 'sqr':
      case 'sqrt':
        return math1((x) => {
          if (x < 0) throw new ExprError('Square root of a negative number', p);
          return Math.sqrt(x);
        });
      case 'exp':
        return math1(Math.exp);
      case 'log':
        return math1(Math.log);
      case 'log10':
        return math1(Math.log10);
      case 'sin':
        return math1(Math.sin);
      case 'cos':
        return math1(Math.cos);
      case 'tan':
        return math1(Math.tan);
      case 'int':
        return math1(Math.trunc);
      case 'frac':
        return math1((x) => x - Math.trunc(x));
      case 'sgn':
        return math1(Math.sign);
      case 'mod': {
        need(args, 2, display, p);
        const [a, b] = numArgs(args) as [number, number];
        return num(a % b);
      }
      case 'round': {
        need(args, 1, display, p);
        const [x, unit = 1] = numArgs(args) as [number, number?];
        return num(Math.round(x / unit) * unit);
      }
      case 'poly': {
        need(args, 2, display, p);
        const [x, ...c] = numArgs(args) as [number, ...number[]];
        return num(c.reduce((s, k, i) => s + k * Math.pow(x, i), 0));
      }
      case 'avg':
      case 'max':
      case 'min':
      case 'total':
      case 'median': {
        need(args, 1, display, p);
        const xs = numArgs(args);
        if (fn === 'avg') return num(xs.reduce((a, b) => a + b, 0) / xs.length);
        if (fn === 'total') return num(xs.reduce((a, b) => a + b, 0));
        if (fn === 'max') return num(Math.max(...xs));
        if (fn === 'min') return num(Math.min(...xs));
        const s = [...xs].sort((a, b) => a - b);
        const m = s.length >> 1;
        return num(s.length % 2 ? (s[m] as number) : ((s[m - 1] as number) + (s[m] as number)) / 2);
      }
      case 'curve': {
        need(args, 2, display, p);
        const x = asNumber(ev(args[0] as Node), p);
        const list = args[1] as Node;
        if (list.t !== 'pairs')
          throw new ExprError('Curve needs points like (0,0) (10,100)', list.p);
        const pts = list.pairs
          .map(([a, b]) => ({ t: asNumber(ev(a), a.p), v: asNumber(ev(b), b.p) }))
          .sort((a, b) => a.t - b.t);
        const first = pts[0] as { t: number; v: number };
        if (x <= first.t) return num(first.v);
        return num(interpolate(pts, x) ?? first.v);
      }
      case 'tagval': {
        need(args, 1, display, p);
        const pt = pointOf(args[0] as Node);
        const t = args[1] ? timeOf(args[1]) : at;
        return pointValue(pt, t, ctx.now);
      }
      case 'prevval': {
        need(args, 2, display, p);
        const pt = pointOf(args[0] as Node);
        const t = timeOf(args[1] as Node);
        const rec = recorded(pt, t - pt.compmax * 1000, t).filter((e) => e.t < t);
        const last = rec[rec.length - 1];
        if (!last) throw new ExprError('No recorded value before that time', p);
        return pt.pointtype === 'Digital' ? str(formatValue(pt, last.v)) : num(last.v);
      }
      case 'tagavg':
        return tagSummary(args, p, display, 'Average');
      case 'tagtot':
        return tagSummary(args, p, display, 'Total');
      case 'tagmax':
        return tagSummary(args, p, display, 'Maximum');
      case 'tagmin':
        return tagSummary(args, p, display, 'Minimum');
      case 'range':
        return tagSummary(args, p, display, 'Range');
      case 'stdev':
        return tagSummary(args, p, display, 'StdDev');
      case 'pctgood':
        return tagSummary(args, p, display, 'PercentGood');
      case 'eventcount':
        return tagSummary(args, p, display, 'Count');
      case 'tagmean': {
        need(args, 3, display, p);
        const pt = pointOf(args[0] as Node);
        const { start, end } = range(args[1] as Node, args[2] as Node);
        const rec = recorded(pt, start, Math.min(end, ctx.now));
        if (!rec.length) throw new ExprError('No recorded values in that range', p);
        return num(rec.reduce((s, e) => s + e.v, 0) / rec.length);
      }
      case 'timeeq':
        return timeCompare(args, p, display, '=');
      case 'timene':
        return timeCompare(args, p, display, '<>');
      case 'timegt':
        return timeCompare(args, p, display, '>');
      case 'timege':
        return timeCompare(args, p, display, '>=');
      case 'timelt':
        return timeCompare(args, p, display, '<');
      case 'timele':
        return timeCompare(args, p, display, '<=');
      case 'parsetime':
        need(args, 1, display, p);
        return { type: 'time', value: timeOf(args[0] as Node) };
      case 'bod':
      case 'bom': {
        need(args, 1, display, p);
        const d = new Date(timeOf(args[0] as Node));
        d.setHours(0, 0, 0, 0);
        if (fn === 'bom') d.setDate(1);
        return { type: 'time', value: d.getTime() };
      }
      case 'hour':
      case 'minute':
      case 'day':
      case 'month':
      case 'year':
      case 'weekday':
      case 'daysec': {
        need(args, 1, display, p);
        const d = new Date(timeOf(args[0] as Node));
        const map: Record<string, number> = {
          hour: d.getHours(),
          minute: d.getMinutes(),
          day: d.getDate(),
          month: d.getMonth() + 1,
          year: d.getFullYear(),
          weekday: d.getDay() + 1,
          daysec: d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds(),
        };
        return num(map[fn] as number);
      }
      case 'concat':
        return str(args.map((a) => valueText(ev(a))).join(''));
      case 'text':
        return str(args.map((a) => valueText(ev(a))).join(''));
      case 'len': {
        need(args, 1, display, p);
        return num(valueText(ev(args[0] as Node)).length);
      }
      case 'nooutput':
        return { type: 'nooutput' };
      case 'badval': {
        need(args, 1, display, p);
        const v = ev(args[0] as Node);
        return bool(v.type === 'number' && !Number.isFinite(v.value));
      }
      default:
        throw new ExprError(
          `${display}() is not available in this simulator. See the function reference for what is supported.`,
          p,
        );
    }
  };

  return ev(node);
}

function compare(op: string, c: number): boolean {
  switch (op) {
    case '=':
      return c === 0;
    case '<>':
      return c !== 0;
    case '<':
      return c < 0;
    case '>':
      return c > 0;
    case '<=':
      return c <= 0;
    default:
      return c >= 0;
  }
}

function valueText(v: ExprValue): string {
  return v.type === 'string' ? v.value : describe(v);
}

/** Functions the simulator implements, for autocomplete and the reference page. */
export const SUPPORTED_FUNCTIONS = [
  'Abs',
  'Sqr',
  'Exp',
  'Log',
  'Log10',
  'Sin',
  'Cos',
  'Tan',
  'Int',
  'Frac',
  'Sgn',
  'Mod',
  'Round',
  'Poly',
  'Curve',
  'Avg',
  'Max',
  'Min',
  'Median',
  'Total',
  'TagVal',
  'PrevVal',
  'TagAvg',
  'TagTot',
  'TagMax',
  'TagMin',
  'TagMean',
  'Range',
  'StDev',
  'PctGood',
  'EventCount',
  'TimeEq',
  'TimeNE',
  'TimeGT',
  'TimeGE',
  'TimeLT',
  'TimeLE',
  'ParseTime',
  'Bod',
  'Bom',
  'Hour',
  'Minute',
  'Day',
  'Month',
  'Year',
  'Weekday',
  'DaySec',
  'Concat',
  'Text',
  'Len',
  'NoOutput',
  'BadVal',
] as const;

/** PE context: references are PI tag names. */
export function peContext(now: number, at?: number): ExprContext {
  return {
    now,
    ...(at === undefined ? {} : { at }),
    resolve: (name) => {
      const p = findPoint(name);
      return p ? { point: p } : null;
    },
  };
}

/** Parse and evaluate in one go; errors come back as values for the UI. */
export function run(
  src: string,
  ctx: ExprContext,
): { ok: true; value: ExprValue } | { ok: false; error: string; position: number } {
  try {
    return { ok: true, value: evaluate(parse(src), ctx) };
  } catch (e) {
    if (e instanceof ExprError) return { ok: false, error: e.message, position: e.position };
    return { ok: false, error: e instanceof Error ? e.message : String(e), position: 0 };
  }
}
