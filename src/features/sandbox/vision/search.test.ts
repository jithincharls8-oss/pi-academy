import { describe, expect, it } from 'vitest';
import { allElements } from '@/core/sim/plant';
import { searchAssets, wildcardRegex } from './search';

describe('wildcards', () => {
  it('assumes * at the end and supports ? and *', () => {
    expect(wildcardRegex('P-1').test('P-101')).toBe(true);
    expect(wildcardRegex('P-1?3').test('P-103')).toBe(true);
    expect(wildcardRegex('P-1?3').test('P-1003')).toBe(false);
    expect(wildcardRegex('*Temp').test('Bearing Temperature')).toBe(true);
    expect(wildcardRegex('a.b').test('axb')).toBe(false);
  });
});

describe('searchAssets', () => {
  const els = allElements();
  it('finds elements by name', () => {
    const hits = searchAssets(els, 'P-10');
    expect(hits.filter((h) => !h.attribute).map((h) => h.element.name)).toEqual([
      'P-101',
      'P-102',
      'P-103',
    ]);
  });
  it('finds attributes by a later word and by PI tag', () => {
    const flow = searchAssets(els, 'Flow');
    expect(flow.some((h) => h.attribute?.name === 'Steam Flow')).toBe(true);
    const tag = searchAssets(els, 'RB.P101.VIB');
    expect(tag.map((h) => h.attribute?.name)).toContain('Vibration');
  });
  it('returns nothing for an empty query and honours the limit', () => {
    expect(searchAssets(els, '  ')).toEqual([]);
    expect(searchAssets(els, '*', 5)).toHaveLength(5);
  });
});
