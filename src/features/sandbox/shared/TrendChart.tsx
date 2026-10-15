import { useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TimedValue } from '@/core/sim/compression';

export const SERIES_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
];

export interface TrendSeries {
  key: string;
  label: string;
  points: TimedValue[];
  step?: boolean;
  units?: string;
  color?: string;
  /** draw dots at each value (for showing archived events) */
  dots?: boolean;
  dashed?: boolean;
}

function fmtTime(t: number, span: number): string {
  const d = new Date(t);
  if (span > 2 * 86_400_000)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit' });
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    ...(span < 3_600_000 ? { second: '2-digit' } : {}),
  });
}

/**
 * Multi-series time trend. Series are merged on timestamps; each line connects across gaps,
 * so archived (compressed) data is drawn the way PI clients interpolate it.
 */
export function TrendChart({
  series,
  start,
  end,
  height = 260,
  yDomain,
  limits,
  ariaLabel,
}: {
  series: TrendSeries[];
  start: number;
  end: number;
  height?: number;
  yDomain?: [number | 'auto', number | 'auto'];
  limits?: { value: number; label: string; tone: 'hi' | 'warn' }[];
  ariaLabel?: string;
}) {
  const data = useMemo(() => {
    const rows = new Map<number, Record<string, number>>();
    for (const s of series) {
      for (const p of s.points) {
        const row = rows.get(p.t) ?? { t: p.t };
        row[s.key] = p.v;
        rows.set(p.t, row);
      }
    }
    return [...rows.values()].sort((a, b) => (a['t'] as number) - (b['t'] as number));
  }, [series]);
  const span = end - start;
  return (
    <div
      style={{ height }}
      role="img"
      aria-label={ariaLabel ?? `Trend of ${series.map((s) => s.label).join(', ')}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid stroke="var(--tool-grid)" />
          <XAxis
            dataKey="t"
            type="number"
            domain={[start, end]}
            scale="time"
            tickFormatter={(t: number) => fmtTime(t, span)}
            stroke="var(--fg-muted)"
            fontSize={11}
            allowDataOverflow
          />
          <YAxis
            stroke="var(--fg-muted)"
            fontSize={11}
            width={52}
            domain={yDomain ?? ['auto', 'auto']}
          />
          <Tooltip
            labelFormatter={(t) => new Date(Number(t)).toLocaleString()}
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              fontSize: 12,
            }}
          />
          {limits?.map((l) => (
            <ReferenceLine
              key={l.label}
              y={l.value}
              stroke={l.tone === 'hi' ? 'var(--tool-alarm-hi)' : 'var(--tool-alarm-warn)'}
              strokeDasharray="4 3"
              label={{
                value: l.label,
                fontSize: 10,
                fill: 'var(--fg-muted)',
                position: 'insideTopRight',
              }}
            />
          ))}
          {series.map((s, i) => (
            <Line
              key={s.key}
              dataKey={s.key}
              name={s.label}
              type={s.step ? 'stepAfter' : 'linear'}
              stroke={s.color ?? SERIES_COLORS[i % SERIES_COLORS.length]}
              strokeWidth={1.6}
              strokeDasharray={s.dashed ? '5 4' : undefined}
              dot={s.dots ? { r: 2.5 } : false}
              isAnimationActive={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
