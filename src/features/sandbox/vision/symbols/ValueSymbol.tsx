import { useMemo } from 'react';
import { formatPiTime } from '@/core/sim/time';
import { cn } from '@/lib/cn';
import { colorVar } from '../colors';
import type { ValueSymbol as ValueConfig } from '../model';
import { formatReading, readAt, resolveItem, valueTime } from '../values';
import { colorOr, multiStateOf, type SymbolEnv } from './env';

/** Value symbol: label, value, units and timestamp; click in view mode for an ad hoc trend. */
export function ValueSymbol({ sym, env }: { sym: ValueConfig; env: SymbolEnv }) {
  const item = sym.items[0];
  const r = useMemo(() => (item ? resolveItem(item) : null), [item]);
  const t = Math.min(env.end, env.now);
  const raw = r ? readAt(r, t, env.now) : null;
  const ms = multiStateOf(sym.multiState, r, raw, t, env.now);
  const text = r
    ? formatReading(r, raw, { decimals: sym.decimals, units: sym.showUnits })
    : 'No data item';
  const label = sym.label ?? r?.label ?? 'Drop an attribute here';
  const color = colorOr(ms, sym.color);
  const valueClass = cn(
    'block max-w-full truncate text-left font-semibold tabular-nums leading-tight',
    ms?.blink && 'animate-pulse',
  );
  const valueStyle = { fontSize: sym.fontSize, color: colorVar(color) };
  return (
    <div className="flex h-full flex-col justify-center overflow-hidden px-2 py-1">
      {sym.showLabel ? <div className="truncate text-xs text-fg-muted">{label}</div> : null}
      <div className="flex items-center gap-1.5">
        {ms ? (
          <span
            aria-hidden
            className="size-2.5 shrink-0 rounded-full"
            style={{ background: colorVar(ms.color) }}
          />
        ) : null}
        {!env.design && r && item ? (
          <button
            type="button"
            className={cn(
              valueClass,
              'rounded hover:underline focus-visible:outline-2 focus-visible:outline-ring',
            )}
            style={valueStyle}
            aria-label={`${label}: ${text}. Open ad hoc trend`}
            onClick={() => env.onAdHoc([item], label)}
          >
            {text}
          </button>
        ) : (
          <span className={valueClass} style={valueStyle}>
            {text}
          </span>
        )}
      </div>
      {sym.showTimestamp && r ? (
        <div className="truncate font-mono text-[10px] text-fg-muted">
          {formatPiTime(valueTime(r, env.end, env.now))}
        </div>
      ) : null}
    </div>
  );
}
