import { useMemo } from 'react';
import type { TableSymbol as TableConfig } from '../model';
import { formatReading, readAt, resolveItem, seriesOf, statsOf } from '../values';
import type { SymbolEnv } from './env';
import { Sparkline } from './Sparkline';

/** Table symbol: one row per data item with value, units, description, summaries and a trend. */
export function TableSymbol({ sym, env }: { sym: TableConfig; env: SymbolEnv }) {
  const { now, start, end } = env;
  const c = sym.columns;
  const rows = useMemo(
    () =>
      sym.items.map((item) => {
        const r = resolveItem(item);
        if (!r) return { item, r, value: 'Not found', stats: null, points: [] };
        const raw = readAt(r, Math.min(end, now), now);
        const stats = c.minimum || c.maximum || c.average ? statsOf(r, start, end, now) : null;
        const points =
          c.trend && r.attribute.type !== 'String' ? seriesOf(r, start, end, now, 60) : [];
        return { item, r, value: formatReading(r, raw), stats, points };
      }),
    [sym.items, start, end, now, c.minimum, c.maximum, c.average, c.trend],
  );
  const fmt = (r: (typeof rows)[number]['r'], v: number | undefined): string =>
    r && v !== undefined ? formatReading(r, v) : '–';
  const th = 'px-2 py-1 text-left font-medium text-fg-muted';
  return (
    <div className="h-full overflow-auto">
      {sym.title ? <div className="px-2 pt-1 text-xs font-medium">{sym.title}</div> : null}
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-surface">
          <tr className="border-b border-tool-grid">
            <th className={th} scope="col">
              Name
            </th>
            {c.description ? (
              <th className={th} scope="col">
                Description
              </th>
            ) : null}
            <th className={`${th} text-right`} scope="col">
              Value
            </th>
            {c.units ? (
              <th className={th} scope="col">
                Units
              </th>
            ) : null}
            {c.minimum ? (
              <th className={`${th} text-right`} scope="col">
                Minimum
              </th>
            ) : null}
            {c.maximum ? (
              <th className={`${th} text-right`} scope="col">
                Maximum
              </th>
            ) : null}
            {c.average ? (
              <th className={`${th} text-right`} scope="col">
                Average
              </th>
            ) : null}
            {c.trend ? (
              <th className={th} scope="col">
                Trend
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.item} className="border-b border-tool-grid last:border-0">
              <td className="px-2 py-1">
                {!env.design && row.r ? (
                  <button
                    type="button"
                    className="text-left text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                    onClick={() => env.onAdHoc([row.item], row.r?.label ?? row.item)}
                  >
                    {row.r.label}
                  </button>
                ) : (
                  (row.r?.label ?? row.item)
                )}
              </td>
              {c.description ? (
                <td className="px-2 py-1 text-fg-muted">{row.r?.attribute.description}</td>
              ) : null}
              <td className="px-2 py-1 text-right font-medium tabular-nums">{row.value}</td>
              {c.units ? <td className="px-2 py-1 text-fg-muted">{row.r?.units}</td> : null}
              {c.minimum ? (
                <td className="px-2 py-1 text-right tabular-nums">{fmt(row.r, row.stats?.min)}</td>
              ) : null}
              {c.maximum ? (
                <td className="px-2 py-1 text-right tabular-nums">{fmt(row.r, row.stats?.max)}</td>
              ) : null}
              {c.average ? (
                <td className="px-2 py-1 text-right tabular-nums">{fmt(row.r, row.stats?.avg)}</td>
              ) : null}
              {c.trend ? (
                <td className="px-2 py-1">
                  <Sparkline
                    points={row.points}
                    start={start}
                    end={Math.min(end, now)}
                    step={Boolean(row.r?.digitalStates)}
                  />
                </td>
              ) : null}
            </tr>
          ))}
          {!rows.length ? (
            <tr>
              <td className="px-2 py-3 text-fg-muted" colSpan={8}>
                Drop attributes here to add rows.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
