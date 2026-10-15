/** Canvas geometry: grid snapping, moving and resizing symbols inside the display bounds. */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const MIN_SIZE = 20;

export function snap(v: number, grid: number, on = true): number {
  if (!on || grid <= 1) return Math.round(v);
  return Math.round(v / grid) * grid;
}

/** Keep a rectangle inside the canvas (it may not start left of or above the origin). */
export function clampRect(r: Rect, width: number, height: number): Rect {
  const w = Math.min(Math.max(MIN_SIZE, r.w), width);
  const h = Math.min(Math.max(MIN_SIZE, r.h), height);
  return {
    x: Math.min(Math.max(0, r.x), width - w),
    y: Math.min(Math.max(0, r.y), height - h),
    w,
    h,
  };
}

/**
 * Move a group of rectangles by (dx, dy). The group's top-left corner snaps to the grid so the
 * relative layout of the selection is preserved, and the whole group stays on the canvas.
 */
export function moveRects(
  rects: Rect[],
  dx: number,
  dy: number,
  opts: { grid: number; snap: boolean; width: number; height: number },
): Rect[] {
  if (!rects.length) return rects;
  const minX = Math.min(...rects.map((r) => r.x));
  const minY = Math.min(...rects.map((r) => r.y));
  const maxX = Math.max(...rects.map((r) => r.x + r.w));
  const maxY = Math.max(...rects.map((r) => r.y + r.h));
  let nx = snap(minX + dx, opts.grid, opts.snap);
  let ny = snap(minY + dy, opts.grid, opts.snap);
  nx = Math.min(Math.max(0, nx), Math.max(0, opts.width - (maxX - minX)));
  ny = Math.min(Math.max(0, ny), Math.max(0, opts.height - (maxY - minY)));
  const ox = nx - minX;
  const oy = ny - minY;
  return rects.map((r) => ({ ...r, x: r.x + ox, y: r.y + oy }));
}

/**
 * Resize from the bottom-right corner. With `proportional` (Shift+drag in PI Vision) the
 * aspect ratio is kept, following the larger of the two changes.
 */
export function resizeRect(
  r: Rect,
  dw: number,
  dh: number,
  opts: { grid: number; snap: boolean; width: number; height: number; proportional?: boolean },
): Rect {
  let w = r.w + dw;
  let h = r.h + dh;
  if (opts.proportional && r.w > 0 && r.h > 0) {
    const scale = Math.max(w / r.w, h / r.h);
    w = r.w * scale;
    h = r.h * scale;
  } else {
    w = snap(r.x + w, opts.grid, opts.snap) - r.x;
    h = snap(r.y + h, opts.grid, opts.snap) - r.y;
  }
  w = Math.min(Math.max(MIN_SIZE, Math.round(w)), opts.width - r.x);
  h = Math.min(Math.max(MIN_SIZE, Math.round(h)), opts.height - r.y);
  return { ...r, w, h };
}

export function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

/**
 * First free spot for a new symbol (used when adding from the keyboard rather than by drop):
 * scans the canvas in grid steps, left to right and top to bottom.
 */
export function freeSpot(
  size: { w: number; h: number },
  taken: Rect[],
  opts: { grid: number; width: number; height: number },
): { x: number; y: number } {
  const step = Math.max(opts.grid, 10) * 2;
  for (let y = step; y + size.h <= opts.height; y += step) {
    for (let x = step; x + size.w <= opts.width; x += step) {
      const r = { x, y, ...size };
      if (!taken.some((t) => overlaps(r, t))) return { x, y };
    }
  }
  return { x: step, y: step };
}

export function boundingBox(rects: Rect[]): Rect | null {
  if (!rects.length) return null;
  const x = Math.min(...rects.map((r) => r.x));
  const y = Math.min(...rects.map((r) => r.y));
  return {
    x,
    y,
    w: Math.max(...rects.map((r) => r.x + r.w)) - x,
    h: Math.max(...rects.map((r) => r.y + r.h)) - y,
  };
}

/** SVG path for a circular arc (angles in degrees, 0 = 3 o'clock, counter-clockwise). */
export function arcPath(cx: number, cy: number, r: number, from: number, to: number): string {
  const rad = (a: number): number => (a * Math.PI) / 180;
  const x1 = cx + r * Math.cos(rad(from));
  const y1 = cy - r * Math.sin(rad(from));
  const x2 = cx + r * Math.cos(rad(to));
  const y2 = cy - r * Math.sin(rad(to));
  const large = Math.abs(from - to) > 180 ? 1 : 0;
  const sweep = from > to ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} ${sweep} ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}
