/** Event rows for the Event table symbol, found from recorded digital values. */
import { recorded, valueAt } from '@/core/sim/data';
import { findPoint, plant } from '@/core/sim/plant';
import { findPeriods, type StatePeriod } from './events';
import { elementsOfTemplate } from './values';

export interface EventRow extends StatePeriod {
  element: string;
  elementPath: string;
  /** e.g. "Tripped" */
  state: string;
}

export function findEvents(
  template: string,
  root: string,
  attribute: string,
  state: string,
  start: number,
  end: number,
  now: number,
): EventRow[] {
  const rows: EventRow[] = [];
  const stop = Math.min(end, now);
  if (stop <= start) return rows;
  for (const e of elementsOfTemplate(template, root)) {
    const a = e.attributes.find((x) => x.name === attribute);
    const p = a?.tag ? findPoint(a.tag) : undefined;
    if (!p || p.pointtype !== 'Digital') continue;
    const set = p.digitalset;
    const states = statesOf(set);
    const target = states.findIndex((s) => s.toLowerCase() === state.toLowerCase());
    if (target < 0) continue;
    const events = recorded(p, start, stop);
    const initial = valueAt(p, start, now);
    for (const period of findPeriods(
      events,
      initial,
      start,
      stop,
      (v) => Math.round(v) === target,
    )) {
      rows.push({
        ...period,
        element: e.name,
        elementPath: e.path,
        state: states[target] ?? state,
      });
    }
  }
  return rows.sort((a, b) => b.start - a.start);
}

function statesOf(set: string): string[] {
  return plant().digitalSets.find((d) => d.name === set)?.states ?? [];
}

/** Digital attributes of a template and their states (for the configure pane). */
export function digitalAttributes(template: string): { name: string; states: string[] }[] {
  const e = elementsOfTemplate(template)[0];
  if (!e) return [];
  const out: { name: string; states: string[] }[] = [];
  for (const a of e.attributes) {
    const p = a.tag ? findPoint(a.tag) : undefined;
    if (p?.pointtype === 'Digital') out.push({ name: a.name, states: statesOf(p.digitalset) });
  }
  return out;
}
