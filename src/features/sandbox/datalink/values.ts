/** Cell values of the DataLink-style sheet and conversions between them. */

export type ErrorCode =
  | '#VALUE!'
  | '#NAME?'
  | '#REF!'
  | '#DIV/0!'
  | '#SPILL!'
  | '#CIRC!'
  | '#N/A'
  | '#NUM!'
  /** a DataLink result message such as "No events found", shown as text in the cell */
  | 'PI';

export type CellValue =
  | { kind: 'empty' }
  | { kind: 'number'; value: number }
  | { kind: 'string'; value: string }
  | { kind: 'bool'; value: boolean }
  /** a timestamp, epoch milliseconds (shown like an Excel date) */
  | { kind: 'date'; value: number }
  | { kind: 'error'; code: ErrorCode; message: string };

/** A formula result: one value, or an array that spills into neighbouring cells. */
export type Value = CellValue | { kind: 'array'; rows: CellValue[][] };

export const EMPTY: CellValue = { kind: 'empty' };
export const num = (value: number): CellValue => ({ kind: 'number', value });
export const str = (value: string): CellValue => ({ kind: 'string', value });
export const date = (value: number): CellValue => ({ kind: 'date', value });
export const bool = (value: boolean): CellValue => ({ kind: 'bool', value });
export const err = (code: ErrorCode, message: string): CellValue => ({
  kind: 'error',
  code,
  message,
});
/** A DataLink message shown in the cell (for example "No events found"). */
export const piErr = (message: string): CellValue => err('PI', message);

export class CellError extends Error {
  constructor(readonly value: CellValue & { kind: 'error' }) {
    super(value.message);
  }
}

export function fail(code: ErrorCode, message: string): never {
  throw new CellError({ kind: 'error', code, message });
}

/* ---------------------------------------------------------------- Excel dates */

const DAY = 86_400_000;

/** Excel serial date (local time, 1900 date system) for an epoch time. */
export function toSerial(ms: number): number {
  const local = ms - new Date(ms).getTimezoneOffset() * 60_000;
  return local / DAY + 25569;
}

export function fromSerial(serial: number): number {
  const guess = (serial - 25569) * DAY;
  return guess + new Date(guess).getTimezoneOffset() * 60_000;
}

/* ---------------------------------------------------------------- conversion */

export function isArray(v: Value): v is { kind: 'array'; rows: CellValue[][] } {
  return v.kind === 'array';
}

/** First value of an array, or the value itself. */
export function scalar(v: Value): CellValue {
  if (v.kind !== 'array') return v;
  return v.rows[0]?.[0] ?? EMPTY;
}

export function toNumber(v: CellValue): number {
  switch (v.kind) {
    case 'number':
      return v.value;
    case 'bool':
      return v.value ? 1 : 0;
    case 'empty':
      return 0;
    case 'date':
      return toSerial(v.value);
    case 'string': {
      const t = v.value.trim();
      if (t !== '' && !Number.isNaN(Number(t))) return Number(t);
      return fail('#VALUE!', `"${v.value}" is text, not a number`);
    }
    case 'error':
      throw new CellError(v);
  }
}

export function toText(v: CellValue): string {
  switch (v.kind) {
    case 'number':
      return formatNumber(v.value);
    case 'string':
      return v.value;
    case 'bool':
      return v.value ? 'TRUE' : 'FALSE';
    case 'empty':
      return '';
    case 'date':
      return formatDate(v.value);
    case 'error':
      throw new CellError(v);
  }
}

export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '#NUM!';
  if (Number.isInteger(n)) return String(n);
  const abs = Math.abs(n);
  const digits = abs >= 1000 ? 2 : abs >= 1 ? 4 : 6;
  return String(Number(n.toFixed(digits)));
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** DataLink's default timestamp format, dd-mmm-yy hh:mm:ss. */
export function formatDate(ms: number): string {
  const d = new Date(ms);
  const p = (n: number): string => String(n).padStart(2, '0');
  return `${p(d.getDate())}-${MONTHS[d.getMonth()]}-${p(d.getFullYear() % 100)} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/** Text shown in a grid cell. */
export function display(v: CellValue): string {
  if (v.kind === 'error') return v.code === 'PI' ? v.message : v.code;
  return toText(v);
}

/** Read typed cell input that is not a formula. */
export function literal(raw: string): CellValue {
  if (raw === '') return EMPTY;
  if (raw.startsWith("'")) return str(raw.slice(1));
  const t = raw.trim();
  if (t !== '' && /^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/.test(t)) return num(Number(t));
  if (/^true$/i.test(t)) return bool(true);
  if (/^false$/i.test(t)) return bool(false);
  return str(raw);
}
