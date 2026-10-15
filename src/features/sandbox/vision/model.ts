/**
 * The PI Vision mockup's display model. A display is a canvas of symbols; data symbols are
 * bound to data items written as `<element path>|<attribute name>`, the way PI Vision
 * references AF attributes. Saved displays are JSON and are validated with zod before loading.
 */
import { z } from 'zod';
import { TOKEN_COLORS } from './colors';

export const DISPLAY_VERSION = 1;

/** Tool name for saved displays in the user repository. */
export const VISION_TOOL = 'vision';

const color = z.enum(TOKEN_COLORS);
const timeRange = z.object({ start: z.string().min(1), end: z.string().min(1) });

const bound = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('number'), value: z.number() }),
  /** a sibling attribute of the bound element, e.g. "High Vibration Limit" (follows asset swap) */
  z.object({ kind: z.literal('attribute'), name: z.string().min(1) }),
]);

export const multiStateSchema = z.object({
  /** numeric states in ascending order: a value below `upTo` takes that colour; null = no maximum */
  ranges: z.array(z.object({ upTo: bound.nullable(), color })).max(5),
  /** digital states by name */
  states: z.array(z.object({ name: z.string(), color })),
  bad: color,
  blink: z.boolean(),
});

const base = {
  id: z.string().min(1),
  x: z.number(),
  y: z.number(),
  w: z.number().min(1),
  h: z.number().min(1),
};

const items = z.array(z.string());

const valueSymbol = z.object({
  ...base,
  kind: z.literal('value'),
  items,
  label: z.string().nullable(),
  showLabel: z.boolean(),
  showUnits: z.boolean(),
  showTimestamp: z.boolean(),
  decimals: z.number().int().min(0).max(6).nullable(),
  fontSize: z.number().min(8).max(72),
  color,
  multiState: multiStateSchema.nullable(),
});

const trendSymbol = z.object({
  ...base,
  kind: z.literal('trend'),
  items,
  title: z.string(),
  traceColors: z.array(color),
  showLimits: z.boolean(),
  scale: z.enum(['auto', 'span']),
  gridLines: z.boolean(),
  timeRange: timeRange.nullable(),
});

const tableSymbol = z.object({
  ...base,
  kind: z.literal('table'),
  items,
  title: z.string(),
  columns: z.object({
    description: z.boolean(),
    units: z.boolean(),
    minimum: z.boolean(),
    maximum: z.boolean(),
    average: z.boolean(),
    trend: z.boolean(),
  }),
});

const barSymbol = z.object({
  ...base,
  kind: z.literal('bar'),
  items,
  title: z.string(),
  orientation: z.enum(['vertical', 'horizontal']),
  showValues: z.boolean(),
  scale: z.enum(['auto', 'span']),
  color,
  multiState: multiStateSchema.nullable(),
});

const gaugeSymbol = z.object({
  ...base,
  kind: z.literal('gauge'),
  items,
  style: z.enum(['radial', 'vertical', 'horizontal']),
  showLabel: z.boolean(),
  showScale: z.boolean(),
  showUnits: z.boolean(),
  decimals: z.number().int().min(0).max(6).nullable(),
  color,
  multiState: multiStateSchema.nullable(),
});

const xySymbol = z.object({
  ...base,
  kind: z.literal('xy'),
  /** items[0] is the X axis, the rest are Y series */
  items,
  title: z.string(),
  regression: z.boolean(),
  correlation: z.boolean(),
});

const criteria = {
  template: z.string().min(1),
  /** search root element path */
  root: z.string().min(1),
  filter: z
    .object({ attribute: z.string().min(1), op: z.enum(['>', '<', '=']), value: z.string() })
    .nullable(),
};

const assetTableSymbol = z.object({
  ...base,
  kind: z.literal('assetTable'),
  ...criteria,
  title: z.string(),
  columns: z.array(
    z.object({ attribute: z.string().min(1), multiState: multiStateSchema.nullable() }),
  ),
});

const eventTableSymbol = z.object({
  ...base,
  kind: z.literal('eventTable'),
  template: z.string().min(1),
  root: z.string().min(1),
  /** a digital attribute, e.g. Status */
  attribute: z.string().min(1),
  /** the state that opens an event, e.g. Tripped */
  state: z.string().min(1),
  title: z.string(),
  timeRange: timeRange.nullable(),
});

const textSymbol = z.object({
  ...base,
  kind: z.literal('text'),
  text: z.string(),
  fontSize: z.number().min(8).max(72),
  bold: z.boolean(),
  color,
  fill: color.nullable(),
});

const shapeSymbol = z.object({
  ...base,
  kind: z.literal('shape'),
  shape: z.enum(['rectangle', 'ellipse', 'line']),
  line: z.enum(['horizontal', 'vertical', 'diagonal-down', 'diagonal-up']),
  stroke: color,
  fill: color.nullable(),
  strokeWidth: z.number().min(0).max(12),
  /** optional data item driving multi-state fill */
  items,
  multiState: multiStateSchema.nullable(),
});

const memberSymbol = z.discriminatedUnion('kind', [
  valueSymbol,
  trendSymbol,
  tableSymbol,
  barSymbol,
  gaugeSymbol,
  xySymbol,
  textSymbol,
  shapeSymbol,
]);

const collectionSymbol = z.object({
  ...base,
  kind: z.literal('collection'),
  ...criteria,
  /** the element the members were built against; each copy swaps it for another element */
  source: z.string().min(1),
  columns: z.number().int().min(1).max(12),
  /** member positions are relative to the collection's top-left corner */
  members: z.array(memberSymbol).min(1),
});

export const symbolSchema = z.discriminatedUnion('kind', [
  valueSymbol,
  trendSymbol,
  tableSymbol,
  barSymbol,
  gaugeSymbol,
  xySymbol,
  assetTableSymbol,
  eventTableSymbol,
  textSymbol,
  shapeSymbol,
  collectionSymbol,
]);

export const displaySchema = z.object({
  version: z.literal(DISPLAY_VERSION),
  name: z.string(),
  timeRange,
  /** asset context for switching: the template and the element currently shown */
  context: z.object({ template: z.string().min(1), element: z.string().min(1) }).nullable(),
  gridSize: z.number().int().min(2).max(100),
  snap: z.boolean(),
  showGrid: z.boolean(),
  width: z.number().min(200).max(4000),
  height: z.number().min(200).max(4000),
  symbols: z.array(symbolSchema),
});

export type MultiState = z.infer<typeof multiStateSchema>;
export type Bound = z.infer<typeof bound>;
export type VisionSymbol = z.infer<typeof symbolSchema>;
export type MemberSymbol = z.infer<typeof memberSymbol>;
export type SymbolKind = VisionSymbol['kind'];
export type Display = z.infer<typeof displaySchema>;
export type TimeRangeValue = z.infer<typeof timeRange>;
export type ValueSymbol = z.infer<typeof valueSymbol>;
export type TrendSymbol = z.infer<typeof trendSymbol>;
export type TableSymbol = z.infer<typeof tableSymbol>;
export type BarSymbol = z.infer<typeof barSymbol>;
export type GaugeSymbol = z.infer<typeof gaugeSymbol>;
export type XySymbol = z.infer<typeof xySymbol>;
export type AssetTableSymbol = z.infer<typeof assetTableSymbol>;
export type EventTableSymbol = z.infer<typeof eventTableSymbol>;
export type TextSymbol = z.infer<typeof textSymbol>;
export type ShapeSymbol = z.infer<typeof shapeSymbol>;
export type CollectionSymbol = z.infer<typeof collectionSymbol>;

/** Symbols bound to data items (and so affected by asset swap and drops). */
export type ItemSymbol = Extract<VisionSymbol, { items: string[] }>;

export function hasItems(s: VisionSymbol): s is ItemSymbol {
  return 'items' in s;
}

export const SYMBOL_NAMES: Record<SymbolKind, string> = {
  value: 'Value',
  trend: 'Trend',
  table: 'Table',
  bar: 'Bar chart',
  gauge: 'Gauge',
  xy: 'XY plot',
  assetTable: 'Asset comparison table',
  eventTable: 'Event table',
  text: 'Text',
  shape: 'Shape',
  collection: 'Collection',
};

export function emptyDisplay(name = ''): Display {
  return {
    version: DISPLAY_VERSION,
    name,
    timeRange: { start: '*-8h', end: '*' },
    context: null,
    gridSize: 10,
    snap: true,
    showGrid: true,
    width: 1400,
    height: 860,
    symbols: [],
  };
}

/** Parse and validate saved display JSON. Returns a readable error instead of throwing. */
export function parseDisplay(
  json: string,
): { ok: true; display: Display } | { ok: false; error: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { ok: false, error: 'The saved display is not valid JSON.' };
  }
  const r = displaySchema.safeParse(raw);
  if (!r.success) {
    const issue = r.error.issues[0];
    const where = issue?.path.join('.') || 'display';
    return {
      ok: false,
      error: `The saved display is invalid at ${where}: ${issue?.message ?? 'unknown'}`,
    };
  }
  return { ok: true, display: r.data };
}

export function serializeDisplay(d: Display): string {
  return JSON.stringify(d);
}

/* ---------------------------------------------------------------- data items */

/** `\\AFSRV01\Riverbend\Riverbend Plant\Process\P-101|Flow` */
export function makeItem(elementPath: string, attribute: string): string {
  return `${elementPath}|${attribute}`;
}

export function parseItem(item: string): { element: string; attribute: string } | null {
  const i = item.lastIndexOf('|');
  if (i <= 0 || i === item.length - 1) return null;
  return { element: item.slice(0, i), attribute: item.slice(i + 1) };
}

/** Last path segment of an element path. */
export function elementName(path: string): string {
  const parts = path.split('\\').filter(Boolean);
  return parts[parts.length - 1] ?? path;
}

/** Short label for an item: `P-101 Flow`. */
export function itemLabel(item: string): string {
  const p = parseItem(item);
  return p ? `${elementName(p.element)} ${p.attribute}` : item;
}

/**
 * Rewrite an element path for asset swapping: the element itself and anything under it (an
 * asset path swap, as with Related Assets) move to the new element.
 */
export function isUnder(path: string, root: string): boolean {
  const lp = path.toLowerCase();
  const lr = root.toLowerCase();
  return lp === lr || lp.startsWith(`${lr}\\`);
}

export function swapPath(path: string, from: string, to: string): string {
  return isUnder(path, from) ? to + path.slice(from.length) : path;
}

export function swapItem(item: string, from: string, to: string): string {
  const p = parseItem(item);
  if (!p) return item;
  return makeItem(swapPath(p.element, from, to), p.attribute);
}

/** Switch the display's asset context; symbols bound to the old element follow. */
export function swapAsset(d: Display, to: string): Display {
  const ctx = d.context;
  if (!ctx || ctx.element.toLowerCase() === to.toLowerCase()) return d;
  const from = ctx.element;
  return {
    ...d,
    context: { ...ctx, element: to },
    symbols: d.symbols.map((s) =>
      hasItems(s) ? { ...s, items: s.items.map((i) => swapItem(i, from, to)) } : s,
    ),
  };
}

/** True when an item is bound to the context element (shown as asset-relative in the pane). */
export function isRelative(item: string, d: Display): boolean {
  const p = parseItem(item);
  if (!p || !d.context) return false;
  return isUnder(p.element, d.context.element);
}
