/**
 * Collections: a group of symbols built against one element, repeated for every element that
 * matches the collection criteria (search root, asset type and an optional attribute filter).
 */
import { boundingBox, type Rect } from './geometry';
import {
  hasItems,
  parseItem,
  swapItem,
  type CollectionSymbol,
  type MemberSymbol,
  type VisionSymbol,
} from './model';
import { newId } from './factory';

export const CELL_GAP = 20;

/** The single element every data item of the selection is bound to, if there is exactly one. */
export function commonElement(symbols: VisionSymbol[]): string | null {
  const paths = new Map<string, string>();
  for (const s of symbols) {
    if (!isMember(s)) return null;
    if (!hasItems(s)) continue;
    for (const i of s.items) {
      const p = parseItem(i);
      if (p) paths.set(p.element.toLowerCase(), p.element);
    }
  }
  if (paths.size !== 1) return null;
  return [...paths.values()][0] ?? null;
}

function isMember(s: VisionSymbol): s is MemberSymbol {
  return s.kind !== 'collection' && s.kind !== 'assetTable' && s.kind !== 'eventTable';
}

/** Convert selected symbols to a collection (members become relative to its corner). */
export function toCollection(
  symbols: VisionSymbol[],
  source: string,
  template: string,
  root: string,
): CollectionSymbol | null {
  const members = symbols.filter(isMember);
  const box = boundingBox(members);
  if (!box || !members.length) return null;
  return {
    id: newId('c'),
    kind: 'collection',
    x: box.x,
    y: box.y,
    w: box.w,
    h: box.h,
    template,
    root,
    filter: null,
    source,
    columns: 3,
    members: members.map((m) => ({ ...m, x: m.x - box.x, y: m.y - box.y })),
  };
}

/** Convert a collection back into ordinary symbols bound to its source element. */
export function fromCollection(c: CollectionSymbol): VisionSymbol[] {
  return c.members.map((m) => ({ ...m, id: newId(), x: m.x + c.x, y: m.y + c.y }));
}

export function cellSize(c: CollectionSymbol): { w: number; h: number } {
  const box = boundingBox(c.members) ?? { x: 0, y: 0, w: 100, h: 60 };
  return { w: box.x + box.w + CELL_GAP, h: box.y + box.h + CELL_GAP };
}

/** Outer rectangle of a collection that shows `count` copies. */
export function collectionRect(c: CollectionSymbol, count: number): Rect {
  const cell = cellSize(c);
  const n = Math.max(1, count);
  const cols = Math.min(c.columns, n);
  const rows = Math.ceil(n / c.columns);
  return { x: c.x, y: c.y, w: cols * cell.w, h: rows * cell.h };
}

/** Members re-bound to `element`, positioned in grid cell `index`. */
export function membersFor(c: CollectionSymbol, element: string, index: number): MemberSymbol[] {
  const cell = cellSize(c);
  const ox = (index % c.columns) * cell.w;
  const oy = Math.floor(index / c.columns) * cell.h;
  return c.members.map((m): MemberSymbol => {
    const moved = { ...m, id: `${m.id}@${index}`, x: m.x + ox, y: m.y + oy };
    return 'items' in moved
      ? { ...moved, items: moved.items.map((i) => swapItem(i, c.source, element)) }
      : moved;
  });
}

/** Test an attribute filter value (numbers compare numerically, text by equality). */
export function passesFilter(
  reading: number | string | null,
  op: '>' | '<' | '=',
  value: string,
): boolean {
  if (reading === null) return false;
  const n = Number(value);
  if (typeof reading === 'number' && value.trim() !== '' && !Number.isNaN(n)) {
    if (op === '>') return reading > n;
    if (op === '<') return reading < n;
    return Math.abs(reading - n) < 1e-9;
  }
  const text = String(reading).toLowerCase();
  return op === '=' ? text === value.trim().toLowerCase() : false;
}
