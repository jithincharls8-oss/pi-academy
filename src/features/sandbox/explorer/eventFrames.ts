/**
 * Event frames for the PSE mockup. The sandbox has no Analysis Service, so "Pump Trip" and
 * "Compressor Trip" event frames are found by scanning the archived Status values of each unit
 * for Tripped periods, the way an Event Frame Generation analysis with the start trigger
 * 'Status' = "Tripped" would have created them.
 */
import type { TimedValue } from '@/core/sim/compression';
import { recorded, summary, valueAt } from '@/core/sim/data';
import type { SimElement } from '@/core/sim/plant';
import { DATA_SERVER } from '@/core/sim/plant';
import { formatPiTime } from '@/core/sim/time';
import { parsePiPointConfig } from './configString';

export interface EventFrameTemplate {
  name: string;
  description: string;
  /** element template whose elements this event type applies to */
  elementTemplate: string;
  namingPattern: string;
  startTrigger: string;
  severityRule: string;
  attributes: { name: string; uom: string; configString: string }[];
}

export const EVENT_FRAME_TEMPLATES: EventFrameTemplate[] = [
  {
    name: 'Pump Trip',
    description: 'A feed or transfer pump tripped',
    elementTemplate: 'Pump',
    namingPattern: '%TEMPLATE% - %ELEMENT% - %STARTTIME:yyyy-MM-dd HH:mm:ss%',
    startTrigger: '\'Status\' = "Tripped"',
    severityRule: 'Major when the trip lasts more than 40 minutes, otherwise Minor (sandbox rule)',
    attributes: [
      {
        name: 'Flow At Start',
        uom: 'm3/h',
        configString: '.\\Elements[.]|Flow;TimeRangeMethod=StartTime',
      },
      {
        name: 'Average Flow',
        uom: 'm3/h',
        configString: '.\\Elements[.]|Flow;TimeRangeMethod=Average',
      },
      {
        name: 'Maximum Bearing Temperature',
        uom: 'degC',
        configString: '.\\Elements[.]|Bearing Temperature;TimeRangeMethod=Maximum',
      },
    ],
  },
  {
    name: 'Compressor Trip',
    description: 'The instrument air compressor tripped',
    elementTemplate: 'Compressor',
    namingPattern: '%TEMPLATE% - %ELEMENT% - %STARTTIME:yyyy-MM-dd HH:mm:ss%',
    startTrigger: '\'Status\' = "Tripped"',
    severityRule: 'Major when the trip lasts more than 40 minutes, otherwise Minor (sandbox rule)',
    attributes: [
      {
        name: 'Receiver Pressure At Start',
        uom: 'bar',
        configString: '.\\Elements[.]|Discharge Pressure;TimeRangeMethod=StartTime',
      },
      {
        name: 'Minimum Power',
        uom: 'kW',
        configString: '.\\Elements[.]|Power;TimeRangeMethod=Minimum',
      },
    ],
  },
];

/** State code for Tripped in the PumpStatus digital set. */
export const TRIPPED = 2;

export interface Interval {
  start: number;
  /** null while the state still holds at the end of the data (an active event frame) */
  end: number | null;
}

/** Periods in a step series where the value equals `code`. Values must be sorted by time. */
export function findStateIntervals(values: TimedValue[], code: number): Interval[] {
  const out: Interval[] = [];
  let open: number | null = null;
  for (const e of values) {
    const inState = Math.round(e.v) === code;
    if (inState && open === null) open = e.t;
    else if (!inState && open !== null) {
      out.push({ start: open, end: e.t });
      open = null;
    }
  }
  if (open !== null) out.push({ start: open, end: null });
  return out;
}

/** PSE-style wildcard match: `*` any run of characters, `?` one character, case-insensitive. */
export function wildcardMatch(pattern: string, text: string): boolean {
  const p = pattern.trim();
  if (!p || p === '*') return true;
  const re = new RegExp(
    `^${p
      .split('')
      .map((c) => (c === '*' ? '.*' : c === '?' ? '.' : c.replace(/[.+^${}()|[\]\\]/g, '\\$&')))
      .join('')}$`,
    'i',
  );
  return re.test(text);
}

function formatWith(t: number, fmt: string): string {
  const d = new Date(t);
  const p = (n: number): string => String(n).padStart(2, '0');
  return fmt
    .replace('yyyy', String(d.getFullYear()))
    .replace('MM', p(d.getMonth() + 1))
    .replace('dd', p(d.getDate()))
    .replace('HH', p(d.getHours()))
    .replace('mm', p(d.getMinutes()))
    .replace('ss', p(d.getSeconds()));
}

/** Apply an event frame naming pattern (%TEMPLATE%, %ELEMENT%, %STARTTIME:format%). */
export function applyNamingPattern(
  pattern: string,
  ctx: { template: string; element: string; start: number },
): string {
  return pattern.replace(/%([A-Za-z.\\]+)(?::([^%]+))?%/g, (whole, name: string, fmt?: string) => {
    const k = name.toUpperCase();
    if (k === 'TEMPLATE') return ctx.template;
    if (k === 'ELEMENT') return ctx.element;
    if (k === 'STARTTIME') return fmt ? formatWith(ctx.start, fmt) : formatPiTime(ctx.start);
    return whole;
  });
}

export type Severity = 'Minor' | 'Major';

export interface EventFrame {
  id: string;
  name: string;
  template: string;
  element: SimElement;
  start: number;
  end: number | null;
  severity: Severity;
}

export function frameDuration(f: EventFrame, now: number): number {
  return (f.end ?? now) - f.start;
}

export function severityFor(durationMs: number): Severity {
  return durationMs > 40 * 60_000 ? 'Major' : 'Minor';
}

export function formatDuration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const p = (n: number): string => String(n).padStart(2, '0');
  return `${h}:${p(m)}:${p(sec)}`;
}

function statusTag(e: SimElement): string | null {
  const a = e.attributes.find((x) => x.name === 'Status' && x.dataReference === 'PI Point');
  if (!a) return null;
  return parsePiPointConfig(a.configString, DATA_SERVER)?.tag ?? a.tag ?? null;
}

export interface EventFrameQuery {
  start: number;
  end: number;
  now: number;
  /** template name, or null for all templates */
  template: string | null;
  /** element name filter with wildcards */
  elementName: string;
  /** event frame name filter with wildcards */
  name: string;
  elements: SimElement[];
}

/** Lead time scanned before the search start so frames already open at the start are found. */
const LEAD_MS = 2 * 3_600_000;

/**
 * Event frames overlapping [start, end] (the "Overlapped" search mode), newest first.
 */
export function searchEventFrames(q: EventFrameQuery): EventFrame[] {
  const out: EventFrame[] = [];
  const stop = Math.min(q.now, q.end + LEAD_MS);
  for (const tpl of EVENT_FRAME_TEMPLATES) {
    if (q.template && q.template !== tpl.name) continue;
    for (const el of q.elements) {
      if (el.template !== tpl.elementTemplate) continue;
      if (!wildcardMatch(q.elementName, el.name)) continue;
      const tag = statusTag(el);
      if (!tag) continue;
      const values = recorded(tag, q.start - LEAD_MS, stop);
      for (const iv of findStateIntervals(values, TRIPPED)) {
        const end = iv.end;
        if (iv.start > q.end || (end ?? q.now) < q.start) continue;
        const name = applyNamingPattern(tpl.namingPattern, {
          template: tpl.name,
          element: el.name,
          start: iv.start,
        });
        if (!wildcardMatch(q.name, name)) continue;
        out.push({
          id: `${el.id}-${iv.start}`,
          name,
          template: tpl.name,
          element: el,
          start: iv.start,
          end,
          severity: severityFor((end ?? q.now) - iv.start),
        });
      }
    }
  }
  return out.sort((a, b) => b.start - a.start);
}

/** Values for the event frame's attributes, following each attribute's TimeRangeMethod. */
export function eventFrameAttributes(
  f: EventFrame,
  now: number,
): { name: string; uom: string; configString: string; value: string }[] {
  const tpl = EVENT_FRAME_TEMPLATES.find((t) => t.name === f.template);
  if (!tpl) return [];
  const end = f.end ?? now;
  return tpl.attributes.map((a) => {
    const m = /\|([^;]+);TimeRangeMethod=([A-Za-z]+)/.exec(a.configString);
    const attrName = m?.[1] ?? '';
    const method = m?.[2] ?? '';
    const src = f.element.attributes.find((x) => x.name === attrName);
    const tag = src?.tag;
    let value = 'No data';
    if (tag && end > f.start) {
      const v =
        method === 'StartTime'
          ? valueAt(tag, f.start, now)
          : summary(
              tag,
              f.start,
              end,
              method === 'Maximum' ? 'Maximum' : method === 'Minimum' ? 'Minimum' : 'Average',
              now,
            );
      value = v.toFixed(2);
    }
    return { name: a.name, uom: a.uom, configString: a.configString, value };
  });
}
