import { useMemo } from 'react';
import { cn } from '@/lib/cn';
import { colorVar } from '../colors';
import type { BarSymbol as BarConfig } from '../model';
import { formatReading, isNumeric, readAt, resolveItem, scaleOf } from '../values';
import { colorOr, multiStateOf, type SymbolEnv } from './env';

/**
 * Bar chart: one bar per data item, vertical or horizontal. "Span" scales each bar to its PI
 * point's zero and span (so mixed units compare as a fraction); "Auto" shares one scale.
 * Multi-state colours each bar from its own value and limits.
 */
export function BarSymbol({ sym, env }: { sym: BarConfig; env: SymbolEnv }) {
  const { now, end } = env;
  const t = Math.min(end, now);
  const bars = useMemo(() => {
    const raw = sym.items.map((item) => {
      const r = resolveItem(item);
      const v = r && isNumeric(r) ? readAt(r, t, now) : null;
      return { item, r, v: typeof v === 'number' ? v : null };
    });
    const sharedMax = Math.max(1e-9, ...raw.map((b) => Math.abs(b.v ?? 0))) * 1.1;
    return raw.map((b) => {
      const scale = b.r && sym.scale === 'span' ? scaleOf(b.r) : { min: 0, max: sharedMax };
      const frac = b.v === null ? 0 : (b.v - scale.min) / (scale.max - scale.min || 1);
      const ms = multiStateOf(sym.multiState, b.r, b.v, t, now);
      return {
        ...b,
        frac: Math.max(0, Math.min(1, frac)),
        color: colorOr(ms, sym.color),
        blink: ms?.blink ?? false,
        text: b.r ? formatReading(b.r, b.v, { units: true }) : 'Not found',
        label: b.r?.label ?? b.item,
      };
    });
  }, [sym.items, sym.scale, sym.multiState, sym.color, t, now]);
  const vertical = sym.orientation === 'vertical';
  return (
    <div
      className="flex h-full flex-col overflow-hidden p-2"
      role="img"
      aria-label={`Bar chart: ${bars.map((b) => `${b.label} ${b.text}`).join('; ') || 'no data items'}`}
    >
      {sym.title ? <div className="mb-1 truncate text-xs font-medium">{sym.title}</div> : null}
      {!bars.length ? (
        <div className="text-xs text-fg-muted">Drop attributes here to add bars.</div>
      ) : null}
      {vertical ? (
        <div className="flex min-h-0 flex-1 items-stretch gap-2">
          {bars.map((b) => (
            <div key={b.item} className="flex min-w-0 flex-1 flex-col items-center">
              {sym.showValues ? (
                <span className="truncate text-[11px] tabular-nums">{b.text}</span>
              ) : null}
              <div className="relative w-full min-h-0 flex-1 rounded-sm bg-surface-2">
                <div
                  className={cn(
                    'absolute inset-x-0 bottom-0 rounded-sm',
                    b.blink && 'animate-pulse',
                  )}
                  style={{ height: `${b.frac * 100}%`, background: colorVar(b.color) }}
                />
              </div>
              <span
                className="mt-0.5 w-full truncate text-center text-[10px] text-fg-muted"
                title={b.label}
              >
                {b.label}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col justify-around gap-1">
          {bars.map((b) => (
            <div key={b.item} className="min-w-0">
              <div className="flex justify-between gap-2 text-[11px]">
                <span className="truncate text-fg-muted">{b.label}</span>
                {sym.showValues ? <span className="shrink-0 tabular-nums">{b.text}</span> : null}
              </div>
              <div className="h-3 rounded-sm bg-surface-2">
                <div
                  className={cn('h-full rounded-sm', b.blink && 'animate-pulse')}
                  style={{ width: `${b.frac * 100}%`, background: colorVar(b.color) }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
