/**
 * Sheet evaluation: every cell's raw input becomes a value. Formulas that return arrays
 * spill into the cells below and to the right, like DataLink array functions in a dynamic-array
 * Excel; a spill blocked by typed content (or an earlier spill, or the sheet edge) shows #SPILL!.
 */
import { cellKey, colName, FormulaError, parseFormula, type Node } from './formula';
import { FUNCTIONS, type FnContext } from './functions';
import {
  CellError,
  EMPTY,
  bool,
  err,
  isArray,
  literal,
  num,
  scalar,
  str,
  toNumber,
  toText,
  type CellValue,
  type Value,
} from './values';

export const ROWS = 40;
export const COLS = 12;

export type Cells = Record<string, string>;

export interface SpillArea {
  anchor: string;
  col: number;
  row: number;
  rows: number;
  cols: number;
  blocked: boolean;
}

export interface SheetResult {
  value: (col: number, row: number) => CellValue;
  /** accepted spill areas and blocked ones (for drawing borders and explaining #SPILL!) */
  spills: SpillArea[];
  /** the anchor whose spill covers a cell, if any */
  spillOwner: (col: number, row: number) => string | null;
}

function within(col: number, row: number): boolean {
  return col >= 0 && row >= 0 && col < COLS && row < ROWS;
}

function parseKey(key: string): { col: number; row: number } {
  const m = /^([A-Z]+)(\d+)$/.exec(key);
  let col = 0;
  for (const ch of m?.[1] ?? 'A') col = col * 26 + (ch.charCodeAt(0) - 64);
  return { col: col - 1, row: Number(m?.[2] ?? 1) - 1 };
}

const COMPARE_OPS = new Set(['=', '<>', '<', '>', '<=', '>=']);

export function evaluateSheet(cells: Cells, ctx: FnContext): SheetResult {
  const rawOf = (key: string): string => cells[key] ?? '';
  const anchors = Object.keys(cells)
    .filter((k) => rawOf(k).trim().startsWith('='))
    .map((k) => ({ key: k, ...parseKey(k) }))
    .filter((a) => within(a.col, a.row))
    .sort((a, b) => a.row - b.row || a.col - b.col);

  const memo = new Map<string, Value>();
  const inProgress = new Set<string>();
  const spillMemo = new Map<string, SpillArea | null>();

  const evalCell = (key: string): Value => {
    const hit = memo.get(key);
    if (hit) return hit;
    if (inProgress.has(key)) return err('#CIRC!', `Circular reference involving ${key}`);
    const raw = rawOf(key);
    if (!raw.trim().startsWith('=')) {
      const v = literal(raw);
      memo.set(key, v);
      return v;
    }
    inProgress.add(key);
    let v: Value;
    try {
      v = evalNode(parseFormula(raw.trim().slice(1)));
    } catch (e) {
      if (e instanceof CellError) v = e.value;
      else if (e instanceof FormulaError) v = err('#NAME?', e.message);
      else v = err('#VALUE!', e instanceof Error ? e.message : String(e));
    }
    inProgress.delete(key);
    if (isArray(v) && v.rows.length === 1 && (v.rows[0]?.length ?? 0) === 1) {
      v = v.rows[0]?.[0] ?? EMPTY;
    }
    memo.set(key, v);
    return v;
  };

  /** The spill area of an anchor that returned an array, or null if it did not. */
  const spillOf = (key: string): SpillArea | null => {
    if (spillMemo.has(key)) return spillMemo.get(key) ?? null;
    const v = evalCell(key);
    if (!isArray(v)) {
      spillMemo.set(key, null);
      return null;
    }
    const { col, row } = parseKey(key);
    const rows = v.rows.length;
    const cols = Math.max(...v.rows.map((r) => r.length));
    const area: SpillArea = { anchor: key, col, row, rows, cols, blocked: false };
    spillMemo.set(key, area); // provisional, so a cycle through here cannot recurse forever
    if (!within(col + cols - 1, row + rows - 1)) area.blocked = true;
    for (let r = row; r < row + rows && !area.blocked; r++) {
      for (let c = col; c < col + cols; c++) {
        if (r === row && c === col) continue;
        if (rawOf(cellKey(c, r)).trim() !== '') {
          area.blocked = true;
          break;
        }
      }
    }
    if (!area.blocked) {
      for (const a of anchors) {
        if (a.key === key) break;
        if (inProgress.has(a.key)) continue;
        const other = spillOf(a.key);
        if (!other || other.blocked) continue;
        const overlap =
          other.col < col + cols &&
          col < other.col + other.cols &&
          other.row < row + rows &&
          row < other.row + other.rows;
        if (overlap) {
          area.blocked = true;
          break;
        }
      }
    }
    return area;
  };

  const ownerOf = (col: number, row: number): string | null => {
    for (const a of anchors) {
      if (a.row > row) break;
      if (a.col > col || inProgress.has(a.key)) continue;
      const s = spillOf(a.key);
      if (s && !s.blocked && row < s.row + s.rows && col < s.col + s.cols) return a.key;
    }
    return null;
  };

  const valueAt = (col: number, row: number): CellValue => {
    if (!within(col, row)) return err('#REF!', 'Outside the sheet');
    const key = cellKey(col, row);
    if (rawOf(key).trim() !== '') {
      const v = evalCell(key);
      if (!isArray(v)) return v;
      const s = spillOf(key);
      if (s?.blocked) {
        return err(
          '#SPILL!',
          `The result needs ${s.rows} × ${s.cols} cells (${key}:${colName(s.col + s.cols - 1)}${s.row + s.rows}) but something is in the way. Clear those cells.`,
        );
      }
      return v.rows[0]?.[0] ?? EMPTY;
    }
    const owner = ownerOf(col, row);
    if (!owner) return EMPTY;
    const s = spillOf(owner);
    const v = evalCell(owner);
    if (!s || !isArray(v)) return EMPTY;
    return v.rows[row - s.row]?.[col - s.col] ?? EMPTY;
  };

  const evalNode = (n: Node): Value => {
    switch (n.t) {
      case 'num':
        return num(n.v);
      case 'str':
        return str(n.v);
      case 'bool':
        return bool(n.v);
      case 'ref': {
        const v = valueAt(n.col, n.row);
        return v.kind === 'error' ? fail(v) : v;
      }
      case 'range': {
        if (!within(n.c2, n.r2)) return err('#REF!', 'The range goes outside the sheet');
        const rows: CellValue[][] = [];
        for (let r = n.r1; r <= n.r2; r++) {
          const row: CellValue[] = [];
          for (let c = n.c1; c <= n.c2; c++) row.push(valueAt(c, r));
          rows.push(row);
        }
        return { kind: 'array', rows };
      }
      case 'neg':
        return num(-toNumber(one(n.e)));
      case 'pct':
        return num(toNumber(one(n.e)) / 100);
      case 'bin': {
        const l = one(n.l);
        const r = one(n.r);
        if (n.op === '&') return str(toText(l) + toText(r));
        if (COMPARE_OPS.has(n.op)) {
          let c: number;
          if (
            (l.kind === 'string' || r.kind === 'string') &&
            !(l.kind === 'empty' || r.kind === 'empty')
          ) {
            c = toText(l).localeCompare(toText(r), undefined, { sensitivity: 'accent' });
          } else {
            const a = toNumber(l);
            const b = toNumber(r);
            c = a === b ? 0 : a < b ? -1 : 1;
          }
          const ok =
            n.op === '='
              ? c === 0
              : n.op === '<>'
                ? c !== 0
                : n.op === '<'
                  ? c < 0
                  : n.op === '>'
                    ? c > 0
                    : n.op === '<='
                      ? c <= 0
                      : c >= 0;
          return bool(ok);
        }
        const a = toNumber(l);
        const b = toNumber(r);
        switch (n.op) {
          case '+':
            return num(a + b);
          case '-':
            return num(a - b);
          case '*':
            return num(a * b);
          case '/':
            return b === 0 ? fail(err('#DIV/0!', 'Division by zero')) : num(a / b);
          case '^': {
            const p = a ** b;
            return Number.isFinite(p) ? num(p) : fail(err('#NUM!', 'Number too large'));
          }
          default:
            return fail(err('#VALUE!', `Unknown operator ${n.op}`));
        }
      }
      case 'call': {
        if (n.name === 'IF') {
          const cond = n.args[0] ? one(n.args[0]) : EMPTY;
          const pick = toNumber(cond) !== 0 ? n.args[1] : n.args[2];
          if (!pick) return toNumber(cond) !== 0 ? bool(true) : bool(false);
          return evalNode(pick);
        }
        const fn = FUNCTIONS[n.name];
        if (!fn) return fail(err('#NAME?', `Unknown function ${n.name}`));
        const args = n.args.map((a): Value => (a ? evalNode(a) : EMPTY));
        for (const a of args) if (!isArray(a) && a.kind === 'error') return fail(a);
        return fn(args, ctx);
      }
    }
  };

  const one = (n: Node): CellValue => {
    const v = evalNode(n);
    if (isArray(v)) {
      const rows = v.rows.length;
      const cols = v.rows[0]?.length ?? 0;
      if (rows === 1 && cols === 1) return scalar(v);
      return fail(err('#VALUE!', 'A range was used where one value is expected'));
    }
    if (v.kind === 'error') return fail(v);
    return v;
  };

  // Evaluate everything up front so the result is stable and cheap to read while rendering.
  const values: CellValue[][] = [];
  for (let r = 0; r < ROWS; r++) {
    const row: CellValue[] = [];
    for (let c = 0; c < COLS; c++) row.push(valueAt(c, r));
    values.push(row);
  }
  const spills: SpillArea[] = [];
  for (const a of anchors) {
    const s = spillOf(a.key);
    if (s) spills.push(s);
  }
  const owners = new Map<string, string>();
  for (const s of spills) {
    if (s.blocked) continue;
    for (let r = s.row; r < s.row + s.rows; r++)
      for (let c = s.col; c < s.col + s.cols; c++) owners.set(cellKey(c, r), s.anchor);
  }
  return {
    value: (col, row) => values[row]?.[col] ?? EMPTY,
    spills,
    spillOwner: (col, row) => owners.get(cellKey(col, row)) ?? null,
  };
}

function fail(v: CellValue): never {
  if (v.kind === 'error') throw new CellError(v);
  throw new CellError({ kind: 'error', code: '#VALUE!', message: 'Invalid value' });
}
