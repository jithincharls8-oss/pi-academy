import { useMemo } from 'react';
import { cn } from '@/lib/cn';
import { colorVar } from '../colors';
import { arcPath } from '../geometry';
import type { GaugeSymbol as GaugeConfig } from '../model';
import { formatReading, readAt, resolveItem, scaleOf } from '../values';
import { colorOr, multiStateOf, type SymbolEnv } from './env';

const FROM = 210;
const TO = -30;

/** Radial, vertical and horizontal gauges share zero/span scale logic. */
export function GaugeSymbol({ sym, env }: { sym: GaugeConfig; env: SymbolEnv }) {
  const item = sym.items[0];
  const r = useMemo(() => (item ? resolveItem(item) : null), [item]);
  const t = Math.min(env.end, env.now);
  const raw = r ? readAt(r, t, env.now) : null;
  const v = typeof raw === 'number' ? raw : null;
  const scale = r ? scaleOf(r) : { min: 0, max: 100 };
  const frac =
    v === null ? 0 : Math.max(0, Math.min(1, (v - scale.min) / (scale.max - scale.min || 1)));
  const ms = multiStateOf(sym.multiState, r, raw, t, env.now);
  const color = colorVar(colorOr(ms, sym.color));
  const text = r
    ? formatReading(r, raw, { decimals: sym.decimals, units: sym.showUnits })
    : 'No data item';
  const label = r?.label ?? 'Drop an attribute here';
  const fmt = (n: number): string =>
    Math.abs(n) >= 100 ? n.toFixed(0) : String(Math.round(n * 10) / 10);
  const aria = `${label} gauge: ${text}, scale ${fmt(scale.min)} to ${fmt(scale.max)}`;

  if (sym.style === 'radial') {
    const angle = FROM + (TO - FROM) * frac;
    return (
      <div
        className="flex h-full flex-col items-center overflow-hidden p-1"
        role="img"
        aria-label={aria}
      >
        {sym.showLabel ? (
          <div className="w-full truncate text-center text-xs text-fg-muted">{label}</div>
        ) : null}
        <svg viewBox="0 0 200 150" className="min-h-0 w-full flex-1" aria-hidden>
          <path
            d={arcPath(100, 95, 75, FROM, TO)}
            stroke="var(--surface-3)"
            strokeWidth={14}
            fill="none"
            strokeLinecap="round"
          />
          {frac > 0.001 ? (
            <path
              d={arcPath(100, 95, 75, FROM, angle)}
              stroke={color}
              strokeWidth={14}
              fill="none"
              strokeLinecap="round"
              className={cn(ms?.blink && 'animate-pulse')}
            />
          ) : null}
          <text x={100} y={102} textAnchor="middle" fontSize={22} fontWeight={600} fill="var(--fg)">
            {text}
          </text>
          {sym.showScale ? (
            <>
              <text x={38} y={148} textAnchor="middle" fontSize={11} fill="var(--fg-muted)">
                {fmt(scale.min)}
              </text>
              <text x={162} y={148} textAnchor="middle" fontSize={11} fill="var(--fg-muted)">
                {fmt(scale.max)}
              </text>
            </>
          ) : null}
        </svg>
      </div>
    );
  }
  const vertical = sym.style === 'vertical';
  return (
    <div
      className={cn(
        'flex h-full overflow-hidden p-2',
        vertical ? 'flex-col' : 'flex-col justify-center',
      )}
      role="img"
      aria-label={aria}
    >
      {sym.showLabel ? <div className="truncate text-xs text-fg-muted">{label}</div> : null}
      <div className="text-base font-semibold tabular-nums">{text}</div>
      {vertical ? (
        <div className="flex min-h-0 flex-1 gap-1">
          <div className="relative w-8 rounded-sm bg-surface-3">
            <div
              className={cn('absolute inset-x-0 bottom-0 rounded-sm', ms?.blink && 'animate-pulse')}
              style={{ height: `${frac * 100}%`, background: color }}
            />
          </div>
          {sym.showScale ? (
            <div className="flex flex-col justify-between text-[10px] text-fg-muted">
              <span>{fmt(scale.max)}</span>
              <span>{fmt((scale.max + scale.min) / 2)}</span>
              <span>{fmt(scale.min)}</span>
            </div>
          ) : null}
        </div>
      ) : (
        <div>
          <div className="h-5 rounded-sm bg-surface-3">
            <div
              className={cn('h-full rounded-sm', ms?.blink && 'animate-pulse')}
              style={{ width: `${frac * 100}%`, background: color }}
            />
          </div>
          {sym.showScale ? (
            <div className="flex justify-between text-[10px] text-fg-muted">
              <span>{fmt(scale.min)}</span>
              <span>{fmt((scale.max + scale.min) / 2)}</span>
              <span>{fmt(scale.max)}</span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
