/**
 * Creating symbols: defaults for each symbol type, what a drop creates, and how a dropped
 * attribute joins an existing symbol (another trace on a trend, another row on a table).
 */
import type { SimElement } from '@/core/sim/plant';
import { seriesColor } from './colors';
import {
  makeItem,
  type MemberSymbol,
  type MultiState,
  type ShapeSymbol,
  type SymbolKind,
  type VisionSymbol,
} from './model';

/** Symbol types offered in the palette as the default visualization for drops. */
export const DATA_KINDS = [
  'trend',
  'value',
  'table',
  'bar',
  'gauge',
  'xy',
  'assetTable',
  'eventTable',
] as const;
export type DataKind = (typeof DATA_KINDS)[number];

export const DEFAULT_SIZE: Record<SymbolKind, { w: number; h: number }> = {
  value: { w: 180, h: 60 },
  trend: { w: 460, h: 260 },
  table: { w: 480, h: 200 },
  bar: { w: 320, h: 220 },
  gauge: { w: 200, h: 170 },
  xy: { w: 380, h: 280 },
  assetTable: { w: 560, h: 180 },
  eventTable: { w: 520, h: 220 },
  text: { w: 200, h: 40 },
  shape: { w: 120, h: 80 },
  collection: { w: 200, h: 100 },
};

let seq = 0;
export function newId(prefix = 's'): string {
  seq += 1;
  const rand =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}${rand}${seq.toString(36)}`;
}

export interface Placement {
  id: string;
  x: number;
  y: number;
}

export interface TemplateCriteria {
  template: string;
  root: string;
}

/** A new data symbol bound to `items` (asset and event tables use `criteria`). */
export function createDataSymbol(
  kind: DataKind,
  at: Placement,
  items: string[],
  criteria?: TemplateCriteria & {
    attributes?: string[];
    digital?: { attribute: string; state: string };
  },
): VisionSymbol {
  const size = DEFAULT_SIZE[kind];
  const rect = { id: at.id, x: at.x, y: at.y, ...size };
  switch (kind) {
    case 'value':
      return {
        ...rect,
        kind,
        items: items.slice(0, 1),
        label: null,
        showLabel: true,
        showUnits: true,
        showTimestamp: false,
        decimals: null,
        fontSize: 20,
        color: 'default',
        multiState: null,
      };
    case 'trend':
      return {
        ...rect,
        kind,
        items,
        title: '',
        traceColors: items.map((_, i) => seriesColor(i)),
        showLimits: true,
        scale: 'auto',
        gridLines: true,
        timeRange: null,
      };
    case 'table':
      return {
        ...rect,
        kind,
        items,
        h: Math.max(size.h, 60 + items.length * 30),
        title: '',
        columns: {
          description: true,
          units: true,
          minimum: false,
          maximum: false,
          average: false,
          trend: true,
        },
      };
    case 'bar':
      return {
        ...rect,
        kind,
        items,
        title: '',
        orientation: 'vertical',
        showValues: true,
        scale: 'span',
        color: 'chart-1',
        multiState: null,
      };
    case 'gauge':
      return {
        ...rect,
        kind,
        items: items.slice(0, 1),
        style: 'radial',
        showLabel: true,
        showScale: true,
        showUnits: true,
        decimals: null,
        color: 'chart-1',
        multiState: null,
      };
    case 'xy':
      return {
        ...rect,
        kind,
        items: items.slice(0, 2),
        title: '',
        regression: true,
        correlation: true,
      };
    case 'assetTable':
      return {
        ...rect,
        kind,
        template: criteria?.template ?? 'Pump',
        root: criteria?.root ?? '',
        filter: null,
        title: '',
        columns: (criteria?.attributes ?? []).map((attribute) => ({ attribute, multiState: null })),
      };
    case 'eventTable':
      return {
        ...rect,
        kind,
        template: criteria?.template ?? 'Pump',
        root: criteria?.root ?? '',
        attribute: criteria?.digital?.attribute ?? 'Status',
        state: criteria?.digital?.state ?? 'Tripped',
        title: '',
        timeRange: null,
      };
  }
}

export function createText(at: Placement, text = 'Label'): VisionSymbol {
  return {
    id: at.id,
    x: at.x,
    y: at.y,
    ...DEFAULT_SIZE.text,
    kind: 'text',
    text,
    fontSize: 16,
    bold: false,
    color: 'default',
    fill: null,
  };
}

export function createShape(at: Placement, shape: ShapeSymbol['shape']): VisionSymbol {
  const size = shape === 'line' ? { w: 160, h: 20 } : DEFAULT_SIZE.shape;
  return {
    id: at.id,
    x: at.x,
    y: at.y,
    ...size,
    kind: 'shape',
    shape,
    line: 'horizontal',
    stroke: 'muted',
    fill: shape === 'line' ? null : 'surface-2',
    strokeWidth: 2,
    items: [],
    multiState: null,
  };
}

/** Attributes worth showing for an element: PI Point and Formula attributes first. */
export function dynamicAttributes(e: SimElement): string[] {
  return e.attributes
    .filter((a) => a.dataReference === 'PI Point' || a.dataReference === 'Formula')
    .map((a) => a.name);
}

export function numericDynamicAttributes(e: SimElement): string[] {
  return e.attributes
    .filter(
      (a) =>
        (a.dataReference === 'PI Point' || a.dataReference === 'Formula') &&
        a.type !== 'Digital' &&
        a.type !== 'String',
    )
    .map((a) => a.name);
}

/**
 * What dropping a whole element creates. PI Vision builds a symbol for the element's
 * attributes; here the default visualization decides: a trend of its numeric attributes, a
 * bar chart, an asset comparison or event table of its template, otherwise a table.
 */
export function symbolForElement(
  kind: DataKind,
  e: SimElement,
  at: Placement,
  digital?: { attribute: string; state: string },
): { symbol: VisionSymbol; note: string } {
  const numeric = numericDynamicAttributes(e).map((a) => makeItem(e.path, a));
  const all = dynamicAttributes(e).map((a) => makeItem(e.path, a));
  const parent = e.path.slice(0, e.path.lastIndexOf('\\'));
  if ((kind === 'assetTable' || kind === 'eventTable') && e.template && e.template !== 'Area') {
    if (kind === 'eventTable' && digital) {
      return {
        symbol: createDataSymbol(kind, at, [], { template: e.template, root: parent, digital }),
        note: `Event table of ${e.template} elements (${digital.attribute} = ${digital.state})`,
      };
    }
    if (kind === 'assetTable') {
      return {
        symbol: createDataSymbol(kind, at, [], {
          template: e.template,
          root: parent,
          attributes: dynamicAttributes(e).slice(0, 5),
        }),
        note: `Asset comparison table of ${e.template} elements`,
      };
    }
  }
  if (kind === 'trend' && numeric.length) {
    return {
      symbol: createDataSymbol('trend', at, numeric.slice(0, 4)),
      note: `Trend of ${Math.min(4, numeric.length)} attributes of ${e.name}`,
    };
  }
  if (kind === 'bar' && numeric.length) {
    return {
      symbol: createDataSymbol('bar', at, numeric.slice(0, 6)),
      note: `Bar chart of ${e.name} attributes`,
    };
  }
  return {
    symbol: createDataSymbol('table', at, all.length ? all : numeric),
    note: all.length
      ? `Table of ${all.length} attributes of ${e.name}`
      : `${e.name} has no data attributes; an empty table was added`,
  };
}

/**
 * Add a dropped item to an existing symbol: a trace on a trend, a row on a table, a bar on a
 * bar chart, the Y series on an XY plot. Returns null when the symbol cannot take more items.
 */
export function addItemTo(s: VisionSymbol, item: string): VisionSymbol | null {
  switch (s.kind) {
    case 'trend':
      if (s.items.includes(item)) return null;
      return {
        ...s,
        items: [...s.items, item],
        traceColors: [...s.traceColors, seriesColor(s.items.length)],
      };
    case 'table':
      if (s.items.includes(item)) return null;
      return { ...s, items: [...s.items, item], h: Math.max(s.h, 60 + (s.items.length + 1) * 30) };
    case 'bar':
      return s.items.includes(item) ? null : { ...s, items: [...s.items, item] };
    case 'xy':
      if (s.items.length < 2) return { ...s, items: [...s.items, item] };
      return { ...s, items: [s.items[0] ?? item, item] };
    case 'value':
    case 'gauge':
    case 'shape':
      return { ...s, items: [item] };
    default:
      return null;
  }
}

/** Remove the item at index; trend trace colours stay aligned. */
export function removeItemAt(s: VisionSymbol, index: number): VisionSymbol {
  if (!('items' in s)) return s;
  const items = s.items.filter((_, i) => i !== index);
  if (s.kind === 'trend') {
    return { ...s, items, traceColors: s.traceColors.filter((_, i) => i !== index) };
  }
  if (s.kind === 'shape') return { ...s, items, multiState: items.length ? s.multiState : null };
  return { ...s, items };
}

export function withMultiState<T extends { multiState: MultiState | null }>(
  s: T,
  ms: MultiState | null,
): T {
  return { ...s, multiState: ms };
}

/** Copy symbols (for paste and collections) with fresh ids, offset by (dx, dy). */
export function cloneSymbols<T extends VisionSymbol | MemberSymbol>(
  symbols: T[],
  dx: number,
  dy: number,
): T[] {
  return symbols.map((s) => {
    const copy = { ...s, id: newId(), x: s.x + dx, y: s.y + dy };
    if (copy.kind === 'collection') copy.members = cloneSymbols(copy.members, 0, 0);
    return copy;
  });
}
