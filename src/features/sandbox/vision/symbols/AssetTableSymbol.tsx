import { useMemo } from 'react';
import { colorVar } from '../colors';
import { matchingElements } from '../criteria';
import { makeItem, type AssetTableSymbol as AssetTableConfig } from '../model';
import { formatReading, readAt, resolveItem } from '../values';
import { multiStateOf, type SymbolEnv } from './env';

/** Asset comparison table: one row per element of a template, one column per attribute. */
export function AssetTableSymbol({ sym, env }: { sym: AssetTableConfig; env: SymbolEnv }) {
  const { now, end } = env;
  const t = Math.min(end, now);
  const rows = useMemo(
    () =>
      matchingElements(sym.template, sym.root, sym.filter, t, now).map((e) => ({
        e,
        cells: sym.columns.map((col) => {
          const item = makeItem(e.path, col.attribute);
          const r = resolveItem(item);
          const raw = r ? readAt(r, t, now) : null;
          const ms = multiStateOf(col.multiState, r, raw, t, now);
          return { item, r, text: r ? formatReading(r, raw) : '–', ms };
        }),
      })),
    [sym.template, sym.root, sym.filter, sym.columns, t, now],
  );
  const units = (name: string): string => {
    const first = rows[0]?.e.attributes.find((a) => a.name === name);
    return first?.uom ? ` (${first.uom})` : '';
  };
  const th = 'px-2 py-1 text-left font-medium text-fg-muted';
  return (
    <div className="h-full overflow-auto">
      <div className="px-2 pt-1 text-xs font-medium">
        {sym.title || `${sym.template} comparison`}
      </div>
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-surface">
          <tr className="border-b border-tool-grid">
            <th className={th} scope="col">
              Element
            </th>
            {sym.columns.map((c) => (
              <th key={c.attribute} className={`${th} text-right`} scope="col">
                {c.attribute}
                {units(c.attribute)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ e, cells }) => (
            <tr key={e.id} className="border-b border-tool-grid last:border-0">
              <th scope="row" className="px-2 py-1 text-left font-medium">
                {!env.design && env.onSwitchAsset ? (
                  <button
                    type="button"
                    className="text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                    aria-label={`Switch display to ${e.name}`}
                    onClick={() => env.onSwitchAsset?.(e.path)}
                  >
                    {e.name}
                  </button>
                ) : (
                  e.name
                )}
              </th>
              {cells.map((c) => (
                <td key={c.item} className="px-2 py-1 text-right tabular-nums">
                  <span className="inline-flex items-center gap-1.5">
                    {c.ms ? (
                      <span
                        aria-hidden
                        className="size-2.5 rounded-full"
                        style={{ background: colorVar(c.ms.color) }}
                      />
                    ) : null}
                    {!env.design && c.r ? (
                      <button
                        type="button"
                        className="hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                        aria-label={`${c.r.label}: ${c.text}. Open ad hoc trend`}
                        onClick={() => env.onAdHoc([c.item], c.r?.label ?? c.item)}
                      >
                        {c.text}
                      </button>
                    ) : (
                      c.text
                    )}
                  </span>
                </td>
              ))}
            </tr>
          ))}
          {!rows.length ? (
            <tr>
              <td colSpan={sym.columns.length + 1} className="px-2 py-3 text-fg-muted">
                No {sym.template} elements match the criteria.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
