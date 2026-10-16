import { describe, expect, it } from 'vitest';
import { findElement } from '@/core/sim/plant';
import { EXAMPLES } from './examples';
import { hasItems, makeItem } from './model';
import {
  formatReading,
  limitsOf,
  readAt,
  readingOf,
  resolveItem,
  scaleOf,
  seriesOf,
  siblingNumber,
} from './values';

const now = Date.UTC(2026, 9, 15, 10, 0, 0);
const P = findElement('P101')?.path ?? '';

describe('resolveItem and values', () => {
  it('resolves PI Point, static and formula attributes', () => {
    const flow = resolveItem(makeItem(P, 'Flow'));
    expect(flow?.point?.tag).toBe('RB.P101.FLOW');
    const rated = resolveItem(makeItem(P, 'Rated Flow'));
    expect(rated && readAt(rated, now, now)).toBe(140);
    expect(resolveItem(makeItem(P, 'Nope'))).toBeNull();
    expect(resolveItem('garbage')).toBeNull();
  });

  it('computes Flow Efficiency from Flow and Rated Flow', () => {
    const eff = resolveItem(makeItem(P, 'Flow Efficiency'));
    const flow = resolveItem(makeItem(P, 'Flow'));
    if (!eff || !flow) throw new Error('missing');
    const f = readAt(flow, now, now);
    const e = readAt(eff, now, now);
    expect(typeof f).toBe('number');
    expect(e).toBeCloseTo(((f as number) / 140) * 100, 3);
    const s = seriesOf(eff, now - 3_600_000, now, now, 60);
    expect(s.length).toBeGreaterThan(30);
  });

  it('names digital states and formats numbers', () => {
    const status = resolveItem(makeItem(P, 'Status'));
    if (!status) throw new Error('missing');
    expect(readingOf(status, 2)).toBe('Tripped');
    expect(formatReading(status, 1, { units: true })).toBe('Running');
    const flow = resolveItem(makeItem(P, 'Flow'));
    if (!flow) throw new Error('missing');
    expect(formatReading(flow, 112.345, { decimals: 1, units: true })).toBe('112.3 m3/h');
    expect(formatReading(flow, null)).toBe('No data');
  });

  it('reads limits, siblings and scales', () => {
    const vib = resolveItem(makeItem(P, 'Vibration'));
    if (!vib) throw new Error('missing');
    expect(limitsOf(vib)).toEqual([{ value: 7.1, label: 'High Vibration Limit', tone: 'hi' }]);
    expect(siblingNumber(vib, 'High Vibration Limit', now, now)).toBe(7.1);
    expect(scaleOf(vib)).toEqual({ min: 0, max: 20 });
  });

  it('builds series that start and end on the range', () => {
    const flow = resolveItem(makeItem(P, 'Flow'));
    if (!flow) throw new Error('missing');
    const s = seriesOf(flow, now - 8 * 3_600_000, now, now);
    expect(s[0]?.t).toBe(now - 8 * 3_600_000);
    expect(s[s.length - 1]?.t).toBe(now);
  });
});

describe('example displays', () => {
  it('bind only to attributes that exist', () => {
    for (const ex of EXAMPLES) {
      const d = ex.build();
      for (const s of d.symbols) {
        const groups = s.kind === 'collection' ? s.members : [s];
        for (const g of groups) {
          if (!hasItems(g)) continue;
          for (const i of g.items) expect(resolveItem(i), `${ex.name}: ${i}`).not.toBeNull();
        }
      }
    }
  });
});
