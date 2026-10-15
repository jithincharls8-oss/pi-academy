import { useMemo } from 'react';
import { formatPiTime } from '@/core/sim/time';
import { findEvents } from '../eventData';
import { eventWindow, formatDuration } from '../events';
import type { EventTableSymbol as EventTableConfig } from '../model';
import { symbolRange, type SymbolEnv } from './env';

/**
 * Event table: periods in which a digital attribute was in a state (e.g. pump trips), found
 * from recorded values of every element of the template. "Apply time range" moves the display
 * time bar to the event.
 */
export function EventTableSymbol({ sym, env }: { sym: EventTableConfig; env: SymbolEnv }) {
  const range = symbolRange(sym.timeRange, env);
  // Searching long ranges is the costliest call on a display, so refresh it once a minute.
  const minute = Math.floor(env.now / 60_000) * 60_000;
  const start = Math.floor(range.start / 60_000) * 60_000;
  const end = Math.min(Math.floor(range.end / 60_000) * 60_000, minute);
  const rows = useMemo(
    () => findEvents(sym.template, sym.root, sym.attribute, sym.state, start, end, minute),
    [sym.template, sym.root, sym.attribute, sym.state, start, end, minute],
  );
  const th = 'px-2 py-1 text-left font-medium text-fg-muted';
  return (
    <div className="h-full overflow-auto">
      <div className="flex items-baseline gap-2 px-2 pt-1 text-xs">
        <span className="font-medium">
          {sym.title || `${sym.template} ${sym.attribute} = ${sym.state}`}
        </span>
        <span className="text-fg-muted">
          {rows.length} event{rows.length === 1 ? '' : 's'}
        </span>
        {range.error ? <span className="text-danger">{range.error}</span> : null}
      </div>
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-surface">
          <tr className="border-b border-tool-grid">
            <th className={th} scope="col">
              Element
            </th>
            <th className={th} scope="col">
              Event
            </th>
            <th className={th} scope="col">
              Start
            </th>
            <th className={th} scope="col">
              End
            </th>
            <th className={`${th} text-right`} scope="col">
              Duration
            </th>
            <th className={th} scope="col">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={`${r.elementPath}-${r.start}`}
              className="border-b border-tool-grid last:border-0"
            >
              <td className="px-2 py-1 font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <span aria-hidden className="size-2.5 rounded-full bg-tool-alarm-hi" />
                  {r.element}
                </span>
              </td>
              <td className="px-2 py-1">
                {sym.attribute} = {r.state}
              </td>
              <td className="px-2 py-1 font-mono">{formatPiTime(r.start)}</td>
              <td className="px-2 py-1 font-mono">
                {r.end === null ? 'In progress' : formatPiTime(r.end)}
              </td>
              <td className="px-2 py-1 text-right tabular-nums">
                {formatDuration((r.end ?? env.now) - r.start)}
              </td>
              <td className="px-2 py-1">
                {!env.design ? (
                  <button
                    type="button"
                    className="text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                    aria-label={`Apply time range of ${r.element} event starting ${formatPiTime(r.start)}`}
                    onClick={() => {
                      const w = eventWindow(r, env.now);
                      env.onApplyTime(w.start, w.end);
                    }}
                  >
                    Apply time range
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
          {!rows.length ? (
            <tr>
              <td colSpan={6} className="px-2 py-3 text-fg-muted">
                No {sym.state} events in this time range. Try a longer range or another state.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
