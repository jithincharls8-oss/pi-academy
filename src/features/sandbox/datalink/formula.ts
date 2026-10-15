/**
 * A small spreadsheet formula parser: numbers, "strings" (with "" escapes), TRUE/FALSE,
 * A1 / $A$1 references, A1:B5 ranges, function calls with omitted arguments
 * (`PICurrVal("sinusoid",0,)`), and Excel operator precedence:
 * comparison < & < + - < * / < ^ < unary minus < percent.
 */

export type BinaryOp = '+' | '-' | '*' | '/' | '^' | '&' | '=' | '<>' | '<' | '>' | '<=' | '>=';

export type Node =
  | { t: 'num'; v: number }
  | { t: 'str'; v: string }
  | { t: 'bool'; v: boolean }
  | { t: 'ref'; col: number; row: number }
  | { t: 'range'; c1: number; r1: number; c2: number; r2: number }
  | { t: 'call'; name: string; args: (Node | null)[] }
  | { t: 'neg'; e: Node }
  | { t: 'pct'; e: Node }
  | { t: 'bin'; op: BinaryOp; l: Node; r: Node };

export class FormulaError extends Error {
  constructor(
    message: string,
    readonly position: number,
  ) {
    super(message);
  }
}

/* ---------------------------------------------------------------- addresses */

/** Column index (0-based) to letters: 0 -> A, 25 -> Z, 26 -> AA. */
export function colName(c: number): string {
  let n = c + 1;
  let s = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

export function cellKey(col: number, row: number): string {
  return `${colName(col)}${row + 1}`;
}

/** Parse "B7" or "$B$7" to 0-based column and row. */
export function parseAddr(a: string): { col: number; row: number } | null {
  const m = /^\$?([A-Za-z]{1,2})\$?(\d+)$/.exec(a.trim());
  if (!m) return null;
  const letters = (m[1] ?? '').toUpperCase();
  let col = 0;
  for (const ch of letters) col = col * 26 + (ch.charCodeAt(0) - 64);
  const row = Number(m[2]) - 1;
  if (row < 0) return null;
  return { col: col - 1, row };
}

/* ---------------------------------------------------------------- tokens */

type Tok =
  | { k: 'num'; v: number; p: number }
  | { k: 'str'; v: string; p: number }
  | { k: 'ref'; v: string; p: number }
  | { k: 'ident'; v: string; p: number }
  | { k: 'op'; v: string; p: number }
  | { k: 'end'; p: number };

const REF = /^\$?[A-Za-z]{1,2}\$?\d+/;

function tokenize(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i] ?? '';
    if (c === ' ' || c === '\t' || c === '\n') {
      i++;
      continue;
    }
    if (c === '"') {
      let s = '';
      let j = i + 1;
      for (;;) {
        if (j >= src.length) throw new FormulaError('Unclosed string: add a closing "', i);
        const ch = src[j];
        if (ch === '"') {
          if (src[j + 1] === '"') {
            s += '"';
            j += 2;
            continue;
          }
          break;
        }
        s += ch;
        j++;
      }
      out.push({ k: 'str', v: s, p: i });
      i = j + 1;
      continue;
    }
    const numM = /^(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?/.exec(src.slice(i));
    if (numM) {
      out.push({ k: 'num', v: Number(numM[0]), p: i });
      i += numM[0].length;
      continue;
    }
    const rest = src.slice(i);
    const refM = REF.exec(rest);
    if (refM && !/^[A-Za-z0-9_.(]/.test(rest.slice(refM[0].length))) {
      out.push({ k: 'ref', v: refM[0], p: i });
      i += refM[0].length;
      continue;
    }
    const idM = /^[A-Za-z_][A-Za-z0-9_.]*/.exec(rest);
    if (idM) {
      out.push({ k: 'ident', v: idM[0], p: i });
      i += idM[0].length;
      continue;
    }
    const two = src.slice(i, i + 2);
    if (two === '<>' || two === '<=' || two === '>=') {
      out.push({ k: 'op', v: two, p: i });
      i += 2;
      continue;
    }
    if ('+-*/^&=<>(),:%'.includes(c)) {
      out.push({ k: 'op', v: c, p: i });
      i++;
      continue;
    }
    throw new FormulaError(`Unexpected character "${c}"`, i);
  }
  out.push({ k: 'end', p: src.length });
  return out;
}

/* ---------------------------------------------------------------- parser */

const COMPARE = new Set(['=', '<>', '<', '>', '<=', '>=']);

/** Parse formula text (without the leading "="). */
export function parseFormula(src: string): Node {
  const toks = tokenize(src);
  let pos = 0;
  const peek = (): Tok => toks[pos] as Tok;
  const next = (): Tok => toks[pos++] as Tok;
  const isOp = (v: string): boolean => {
    const t = peek();
    return t.k === 'op' && t.v === v;
  };
  const expect = (v: string): void => {
    const t = next();
    if (t.k !== 'op' || t.v !== v) throw new FormulaError(`Expected "${v}"`, t.p);
  };

  const comparison = (): Node => {
    let l = concat();
    for (;;) {
      const t = peek();
      if (t.k === 'op' && COMPARE.has(t.v)) {
        next();
        l = { t: 'bin', op: t.v as BinaryOp, l, r: concat() };
      } else return l;
    }
  };
  const concat = (): Node => {
    let l = additive();
    while (isOp('&')) {
      next();
      l = { t: 'bin', op: '&', l, r: additive() };
    }
    return l;
  };
  const additive = (): Node => {
    let l = multiplicative();
    for (;;) {
      if (isOp('+') || isOp('-')) {
        const op = (next() as { v: string }).v as BinaryOp;
        l = { t: 'bin', op, l, r: multiplicative() };
      } else return l;
    }
  };
  const multiplicative = (): Node => {
    let l = power();
    for (;;) {
      if (isOp('*') || isOp('/')) {
        const op = (next() as { v: string }).v as BinaryOp;
        l = { t: 'bin', op, l, r: power() };
      } else return l;
    }
  };
  const power = (): Node => {
    let l = unary();
    while (isOp('^')) {
      next();
      l = { t: 'bin', op: '^', l, r: unary() };
    }
    return l;
  };
  const unary = (): Node => {
    if (isOp('-')) {
      next();
      return { t: 'neg', e: unary() };
    }
    if (isOp('+')) {
      next();
      return unary();
    }
    return percent();
  };
  const percent = (): Node => {
    let e = primary();
    while (isOp('%')) {
      next();
      e = { t: 'pct', e };
    }
    return e;
  };
  const primary = (): Node => {
    const t = next();
    switch (t.k) {
      case 'num':
        return { t: 'num', v: t.v };
      case 'str':
        return { t: 'str', v: t.v };
      case 'ref': {
        const a = parseAddr(t.v);
        if (!a) throw new FormulaError(`Bad reference ${t.v}`, t.p);
        if (isOp(':')) {
          next();
          const t2 = next();
          const b = t2.k === 'ref' ? parseAddr(t2.v) : null;
          if (!b) throw new FormulaError('Expected a cell after ":"', t2.p);
          return {
            t: 'range',
            c1: Math.min(a.col, b.col),
            r1: Math.min(a.row, b.row),
            c2: Math.max(a.col, b.col),
            r2: Math.max(a.row, b.row),
          };
        }
        return { t: 'ref', col: a.col, row: a.row };
      }
      case 'ident': {
        const up = t.v.toUpperCase();
        if (isOp('(')) {
          next();
          const args: (Node | null)[] = [];
          if (isOp(')')) {
            next();
            return { t: 'call', name: up, args };
          }
          for (;;) {
            if (isOp(',') || isOp(')')) args.push(null);
            else args.push(comparison());
            if (isOp(',')) {
              next();
              continue;
            }
            expect(')');
            break;
          }
          return { t: 'call', name: up, args };
        }
        if (up === 'TRUE') return { t: 'bool', v: true };
        if (up === 'FALSE') return { t: 'bool', v: false };
        throw new FormulaError(`Unknown name "${t.v}". Text needs "double quotes".`, t.p);
      }
      case 'op':
        if (t.v === '(') {
          const e = comparison();
          expect(')');
          return e;
        }
        throw new FormulaError(`Unexpected "${t.v}"`, t.p);
      case 'end':
        throw new FormulaError('The formula ends too early', t.p);
    }
  };

  const tree = comparison();
  const t = peek();
  if (t.k !== 'end') throw new FormulaError('Unexpected text after the formula', t.p);
  return tree;
}

/** Function names used in a formula, for highlighting and the wizard. */
export function functionNames(node: Node): string[] {
  const out = new Set<string>();
  const walk = (n: Node | null): void => {
    if (!n) return;
    if (n.t === 'call') {
      out.add(n.name);
      n.args.forEach(walk);
    } else if (n.t === 'bin') {
      walk(n.l);
      walk(n.r);
    } else if (n.t === 'neg' || n.t === 'pct') walk(n.e);
  };
  walk(node);
  return [...out];
}
