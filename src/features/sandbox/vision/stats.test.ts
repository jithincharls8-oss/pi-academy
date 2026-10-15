import { describe, expect, it } from 'vitest';
import { mergeSeries, pairByTime, regression } from './stats';

describe('regression', () => {
  it('fits a perfect line', () => {
    const r = regression([
      { x: 0, y: 1 },
      { x: 1, y: 3 },
      { x: 2, y: 5 },
    ]);
    expect(r?.slope).toBeCloseTo(2);
    expect(r?.intercept).toBeCloseTo(1);
    expect(r?.r).toBeCloseTo(1);
  });
  it('reports negative correlation', () => {
    const r = regression([
      { x: 0, y: 4 },
      { x: 1, y: 2 },
      { x: 2, y: 1 },
    ]);
    expect(r?.r).toBeLessThan(-0.9);
  });
  it('returns null with too few points or no X spread', () => {
    expect(regression([{ x: 1, y: 1 }])).toBeNull();
    expect(
      regression([
        { x: 1, y: 1 },
        { x: 1, y: 2 },
      ]),
    ).toBeNull();
  });
});

describe('series helpers', () => {
  it('pairs by timestamp', () => {
    expect(
      pairByTime(
        [
          { t: 1, v: 10 },
          { t: 2, v: 20 },
        ],
        [{ t: 2, v: 5 }],
      ),
    ).toEqual([{ x: 20, y: 5, t: 2 }]);
  });
  it('merges series into sorted rows', () => {
    expect(
      mergeSeries([
        { key: 'a', points: [{ t: 2, v: 1 }] },
        {
          key: 'b',
          points: [
            { t: 1, v: 3 },
            { t: 2, v: 4 },
          ],
        },
      ]),
    ).toEqual([
      { t: 1, b: 3 },
      { t: 2, a: 1, b: 4 },
    ]);
  });
});
