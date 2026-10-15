import { describe, expect, it } from 'vitest';
import { arcPath, boundingBox, clampRect, freeSpot, moveRects, resizeRect, snap } from './geometry';

const opts = { grid: 10, snap: true, width: 1000, height: 600 };

describe('snap', () => {
  it('rounds to the grid, or to whole pixels when off', () => {
    expect(snap(14, 10)).toBe(10);
    expect(snap(15, 10)).toBe(20);
    expect(snap(14.6, 10, false)).toBe(15);
  });
});

describe('moveRects', () => {
  it('snaps the group corner and keeps relative layout', () => {
    const out = moveRects(
      [
        { x: 10, y: 10, w: 50, h: 50 },
        { x: 100, y: 40, w: 50, h: 50 },
      ],
      23,
      7,
      opts,
    );
    expect(out).toEqual([
      { x: 30, y: 20, w: 50, h: 50 },
      { x: 120, y: 50, w: 50, h: 50 },
    ]);
  });
  it('keeps the group on the canvas', () => {
    const out = moveRects([{ x: 900, y: 500, w: 80, h: 80 }], 500, 500, opts);
    expect(out[0]).toEqual({ x: 920, y: 520, w: 80, h: 80 });
    expect(moveRects([{ x: 10, y: 10, w: 10, h: 10 }], -100, -100, opts)[0]).toMatchObject({
      x: 0,
      y: 0,
    });
  });
});

describe('resizeRect', () => {
  it('snaps the far edge and enforces a minimum size', () => {
    expect(resizeRect({ x: 10, y: 10, w: 100, h: 50 }, 13, 4, opts)).toEqual({
      x: 10,
      y: 10,
      w: 110,
      h: 50,
    });
    expect(resizeRect({ x: 0, y: 0, w: 100, h: 50 }, -200, -200, opts)).toMatchObject({
      w: 20,
      h: 20,
    });
  });
  it('keeps the aspect ratio when proportional', () => {
    const r = resizeRect({ x: 0, y: 0, w: 100, h: 50 }, 100, 0, { ...opts, proportional: true });
    expect(r).toEqual({ x: 0, y: 0, w: 200, h: 100 });
  });
  it('does not grow past the canvas', () => {
    expect(resizeRect({ x: 900, y: 0, w: 50, h: 50 }, 500, 0, opts).w).toBe(100);
  });
});

describe('placement helpers', () => {
  it('clamps rectangles', () => {
    expect(clampRect({ x: -5, y: 590, w: 5, h: 30 }, 1000, 600)).toEqual({
      x: 0,
      y: 570,
      w: 20,
      h: 30,
    });
  });
  it('finds a free spot that does not overlap', () => {
    const spot = freeSpot({ w: 100, h: 100 }, [{ x: 0, y: 0, w: 300, h: 300 }], opts);
    expect(spot.x >= 300 || spot.y >= 300).toBe(true);
  });
  it('computes bounding boxes', () => {
    expect(boundingBox([])).toBeNull();
    expect(
      boundingBox([
        { x: 10, y: 20, w: 10, h: 10 },
        { x: 50, y: 5, w: 5, h: 5 },
      ]),
    ).toEqual({ x: 10, y: 5, w: 45, h: 25 });
  });
  it('draws an arc path', () => {
    expect(arcPath(100, 100, 50, 180, 0)).toBe('M 50.00 100.00 A 50 50 0 0 1 150.00 100.00');
  });
});
