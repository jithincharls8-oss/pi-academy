/** What every symbol renderer receives besides its own configuration. */
import { resolveRange } from '@/features/sandbox/shared/TimeRangeBar';
import type { TokenColor } from '../colors';
import type { MultiState, TimeRangeValue } from '../model';
import { evaluateMultiState, type MultiStateResult } from '../multistate';
import { readingOf, siblingNumber, type ResolvedItem } from '../values';

export interface SymbolEnv {
  now: number;
  /** resolved display time range */
  start: number;
  end: number;
  design: boolean;
  /** open an ad hoc trend of these items */
  onAdHoc: (items: string[], title: string) => void;
  /** set the display time range (Apply Time Range on an event) */
  onApplyTime: (start: number, end: number) => void;
  /** switch the display's asset context, when the element fits it */
  onSwitchAsset: ((elementPath: string) => void) | null;
}

/** A symbol's own time range (custom range on a trend or event table), else the display's. */
export function symbolRange(
  own: TimeRangeValue | null,
  env: SymbolEnv,
): { start: number; end: number; error: string | null } {
  if (!own) return { start: env.start, end: env.end, error: null };
  const r = resolveRange(own, env.now);
  return typeof r === 'string'
    ? { start: env.start, end: env.end, error: r }
    : { ...r, error: null };
}

export function multiStateOf(
  ms: MultiState | null,
  r: ResolvedItem | null,
  raw: number | string | null,
  t: number,
  now: number,
): MultiStateResult | null {
  if (!ms || !r) return null;
  return evaluateMultiState(ms, readingOf(r, raw), (name) => siblingNumber(r, name, t, now));
}

export function colorOr(res: MultiStateResult | null, fallback: TokenColor): TokenColor {
  return res ? res.color : fallback;
}
