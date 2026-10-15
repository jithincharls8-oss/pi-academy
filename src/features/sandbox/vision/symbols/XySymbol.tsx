import { useMemo } from 'react';
import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { XySymbol as XyConfig } from '../model';
import { pairByTime, regression } from '../stats';
import { resolveItem, sampledOf } from '../values';
import type { SymbolEnv } from './env';

/** XY plot: Y against X sampled on the same times, with optional regression line and r. */
export function XySymbol({ sym, env }: { sym: XyConfig; env: SymbolEnv }) {
  const { now, start, end } = env;
  const [xItem, yItem] = sym.items;
  const xr = useMemo(() => (xItem ? resolveItem(xItem) : null), [xItem]);
  const yr = useMemo(() => (yItem ? resolveItem(yItem) : null), [yItem]);
  const points = useMemo(
    () =>
      xr && yr ? pairByTime(sampledOf(xr, start, end, now), sampledOf(yr, start, end, now)) : [],
    [xr, yr, start, end, now],
  );
  const fit = useMemo(() => regression(points), [points]);
  const xs = points.map((p) => p.x);
  const xMin = xs.length ? Math.min(...xs) : 0;
  const xMax = xs.length ? Math.max(...xs) : 1;
  const title = sym.title || (xr && yr ? `${yr.label} vs ${xr.label}` : 'XY plot');
  const hint = !xr
    ? 'Drop an attribute for the X axis'
    : !yr
      ? 'Drop an attribute for the Y axis'
      : null;
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-2 pt-1 text-xs">
        <span className="truncate font-medium">{title}</span>
        {sym.correlation && fit ? (
          <span className="ml-auto shrink-0 tabular-nums text-fg-muted">
            r = {fit.r.toFixed(3)}
          </span>
        ) : null}
      </div>
      {hint ? (
        <div className="flex flex-1 items-center justify-center text-xs text-fg-muted">{hint}</div>
      ) : (
        <div
          className="min-h-0 flex-1"
          role="img"
          aria-label={`XY plot of ${title}, ${points.length} points${fit ? `, correlation ${fit.r.toFixed(2)}` : ''}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 6, right: 12, bottom: 14, left: 0 }}>
              <CartesianGrid stroke="var(--tool-grid)" />
              <XAxis
                type="number"
                dataKey="x"
                name={xr?.label}
                unit={xr?.units ? ` ${xr.units}` : ''}
                domain={['auto', 'auto']}
                stroke="var(--fg-muted)"
                fontSize={10}
                label={{
                  value: xr?.label,
                  position: 'insideBottom',
                  offset: -8,
                  fontSize: 10,
                  fill: 'var(--fg-muted)',
                }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name={yr?.label}
                domain={['auto', 'auto']}
                stroke="var(--fg-muted)"
                fontSize={10}
                width={44}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  fontSize: 11,
                }}
              />
              <Scatter data={points} fill="var(--chart-1)" isAnimationActive={false} />
              {sym.regression && fit ? (
                <ReferenceLine
                  segment={[
                    { x: xMin, y: fit.slope * xMin + fit.intercept },
                    { x: xMax, y: fit.slope * xMax + fit.intercept },
                  ]}
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  ifOverflow="extendDomain"
                />
              ) : null}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
