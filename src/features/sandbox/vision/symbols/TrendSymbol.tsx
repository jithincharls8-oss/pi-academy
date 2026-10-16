import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/cn';
import { colorVar, seriesColor } from '../colors';
import type { TrendSymbol as TrendConfig } from '../model';
import { mergeSeries } from '../stats';
import { formatReading, limitsOf, readAt, resolveItem, scaleOf, seriesOf } from '../values';
import { symbolRange, type SymbolEnv } from './env';

function fmtTime(t: number, span: number): string {
  const d = new Date(t);
  if (span > 2 * 86_400_000) {
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit' });
  }
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    ...(span < 3_600_000 ? { second: '2-digit' } : {}),
  });
}

/**
 * Trend symbol: one trace per data item on a single value scale, limit reference lines, a
 * legend with the value at the end of the range, trace hiding and ad hoc zoom (drag across the
 * plot or use the zoom buttons). Double-click opens it maximised.
 */
export function TrendSymbol({ sym, env }: { sym: TrendConfig; env: SymbolEnv }) {
  const range = symbolRange(sym.timeRange, env);
  const [zoom, setZoom] = useState<[number, number] | null>(null);
  const [drag, setDrag] = useState<{ a: number; b: number } | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());
  const start = zoom ? zoom[0] : range.start;
  const end = zoom ? zoom[1] : range.end;
  const resolved = useMemo(() => sym.items.map((i) => resolveItem(i)), [sym.items]);
  const intervals = Math.max(60, Math.round(sym.w / 2));
  const { now } = env;

  const series = useMemo(
    () =>
      resolved.map((r, i) => ({
        key: `s${i}`,
        r,
        points: r && r.attribute.type !== 'String' ? seriesOf(r, start, end, now, intervals) : [],
      })),
    [resolved, start, end, now, intervals],
  );
  const data = useMemo(() => mergeSeries(series), [series]);
  const limits = useMemo(() => {
    if (!sym.showLimits) return [];
    const seen = new Set<string>();
    const out: { value: number; label: string; tone: 'hi' | 'warn' }[] = [];
    for (const r of resolved) {
      if (!r) continue;
      for (const l of limitsOf(r)) {
        const key = `${r.element.name} ${l.label}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ ...l, label: key });
      }
    }
    return out;
  }, [resolved, sym.showLimits]);
  const domain = useMemo((): [number | 'auto', number | 'auto'] => {
    if (sym.scale !== 'span') return ['auto', 'auto'];
    const scales = resolved.filter((r) => r !== null).map((r) => scaleOf(r));
    if (!scales.length) return ['auto', 'auto'];
    return [Math.min(...scales.map((s) => s.min)), Math.max(...scales.map((s) => s.max))];
  }, [resolved, sym.scale]);

  const span = end - start;
  const zoomBy = (f: number): void => {
    const mid = (start + end) / 2;
    const half = (span * f) / 2;
    const s = Math.max(range.start, mid - half);
    const e = Math.min(range.end, mid + half);
    if (f >= 1 && s <= range.start && e >= range.end) setZoom(null);
    else if (e - s > 60_000) setZoom([s, e]);
  };
  const title =
    sym.title ||
    sym.items
      .map((_, i) => resolved[i]?.label ?? '')
      .filter(Boolean)
      .join(', ');
  const btn =
    'rounded p-1 text-fg-muted hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-ring';

  return (
    <div
      className="flex h-full flex-col overflow-hidden"
      onDoubleClick={() => !env.design && env.onAdHoc(sym.items, title || 'Trend')}
    >
      <div className="flex items-center gap-1 px-2 pt-1">
        <span className="truncate text-xs font-medium">
          {title || 'Trend (drop attributes here)'}
        </span>
        {range.error ? <span className="text-xs text-danger">{range.error}</span> : null}
        {!env.design ? (
          <span className="ml-auto flex shrink-0 items-center">
            <button type="button" className={btn} aria-label="Zoom in" onClick={() => zoomBy(0.5)}>
              <ZoomIn className="size-3.5" />
            </button>
            <button type="button" className={btn} aria-label="Zoom out" onClick={() => zoomBy(2)}>
              <ZoomOut className="size-3.5" />
            </button>
            {zoom ? (
              <button
                type="button"
                className={btn}
                aria-label="Reset zoom"
                onClick={() => setZoom(null)}
              >
                <RotateCcw className="size-3.5" />
              </button>
            ) : null}
          </span>
        ) : null}
      </div>
      <div
        className="min-h-0 flex-1"
        role="img"
        aria-label={`Trend of ${title || 'no data items'} from ${new Date(start).toLocaleString()} to ${new Date(end).toLocaleString()}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 6, right: 12, bottom: 0, left: 0 }}
            onMouseDown={(st) => {
              if (env.design || st.activeLabel === undefined) return;
              const t = Number(st.activeLabel);
              setDrag({ a: t, b: t });
            }}
            onMouseMove={(st) => {
              if (!drag || st.activeLabel === undefined) return;
              setDrag({ ...drag, b: Number(st.activeLabel) });
            }}
            onMouseUp={() => {
              if (drag && Math.abs(drag.b - drag.a) > 30_000) {
                setZoom([Math.min(drag.a, drag.b), Math.max(drag.a, drag.b)]);
              }
              setDrag(null);
            }}
          >
            {sym.gridLines ? <CartesianGrid stroke="var(--tool-grid)" /> : null}
            <XAxis
              dataKey="t"
              type="number"
              domain={[start, end]}
              scale="time"
              tickFormatter={(t: number) => fmtTime(t, span)}
              stroke="var(--fg-muted)"
              fontSize={10}
              allowDataOverflow
            />
            <YAxis
              stroke="var(--fg-muted)"
              fontSize={10}
              width={44}
              domain={domain}
              allowDataOverflow
            />
            <Tooltip
              labelFormatter={(t) => new Date(Number(t)).toLocaleString()}
              formatter={(v, name) => {
                const i = Number(String(name).slice(1));
                const r = resolved[i];
                return [
                  r ? formatReading(r, Number(v), { units: true }) : String(v),
                  r?.label ?? String(name),
                ];
              }}
              contentStyle={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                fontSize: 11,
              }}
            />
            {limits.map((l) => (
              <ReferenceLine
                key={l.label}
                y={l.value}
                stroke={l.tone === 'hi' ? 'var(--tool-alarm-hi)' : 'var(--tool-alarm-warn)'}
                strokeDasharray="4 3"
                label={{
                  value: l.label,
                  fontSize: 9,
                  fill: 'var(--fg-muted)',
                  position: 'insideTopRight',
                }}
              />
            ))}
            {series.map((s, i) =>
              hidden.has(s.key) ? null : (
                <Line
                  key={s.key}
                  dataKey={s.key}
                  name={s.key}
                  type={s.r?.digitalStates ? 'stepAfter' : 'linear'}
                  stroke={colorVar(sym.traceColors[i] ?? seriesColor(i))}
                  strokeWidth={1.6}
                  dot={false}
                  isAnimationActive={false}
                  connectNulls
                />
              ),
            )}
            {drag ? (
              <ReferenceArea x1={drag.a} x2={drag.b} fill="var(--tool-select)" fillOpacity={0.4} />
            ) : null}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ul
        className="flex flex-wrap gap-x-3 gap-y-0.5 px-2 pb-1 text-[11px]"
        aria-label="Trend legend"
      >
        {series.map((s, i) => {
          const r = s.r;
          const label = r?.label ?? sym.items[i] ?? '';
          const value = r
            ? formatReading(r, readAt(r, Math.min(end, now), now), { units: true })
            : 'Not found';
          const off = hidden.has(s.key);
          const content = (
            <>
              <span
                aria-hidden
                className="inline-block h-0.5 w-3"
                style={{ background: colorVar(sym.traceColors[i] ?? seriesColor(i)) }}
              />
              <span className={cn('truncate', off && 'line-through opacity-60')}>{label}</span>
              <span className="tabular-nums text-fg-muted">{value}</span>
            </>
          );
          return (
            <li key={s.key} className="min-w-0">
              {env.design ? (
                <span className="flex items-center gap-1">{content}</span>
              ) : (
                <button
                  type="button"
                  className="flex items-center gap-1 rounded hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-ring"
                  aria-pressed={!off}
                  aria-label={`${off ? 'Show' : 'Hide'} trace ${label}`}
                  onClick={() =>
                    setHidden((h) => {
                      const n = new Set(h);
                      if (n.has(s.key)) n.delete(s.key);
                      else n.add(s.key);
                      return n;
                    })
                  }
                >
                  {content}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
