import { describe, expect, it } from 'vitest';
import { findElement } from '@/core/sim/plant';
import { matchingElements } from './criteria';

describe('matchingElements', () => {
  const area = findElement('AREA-PROCESS')?.path ?? '';
  const now = Date.UTC(2026, 9, 15, 10);
  it('lists every element of the template under the root', () => {
    expect(matchingElements('Pump', area, null, now, now).map((e) => e.name)).toEqual([
      'P-101',
      'P-102',
      'P-103',
    ]);
    expect(
      matchingElements('Pump', findElement('AREA-UTILITIES')?.path ?? '', null, now, now),
    ).toEqual([]);
  });
  it('filters by a static attribute', () => {
    const big = matchingElements(
      'Pump',
      area,
      { attribute: 'Rated Flow', op: '>', value: '100' },
      now,
      now,
    );
    expect(big.map((e) => e.name)).toEqual(['P-101', 'P-102']);
  });
});
