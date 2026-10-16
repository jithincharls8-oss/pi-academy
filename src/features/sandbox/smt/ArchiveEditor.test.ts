import { describe, expect, it } from 'vitest';
import { formatSmtTime, formatSmtValue, parseFilter, parseSmtTime } from './ArchiveEditor';
import { initialPoints } from './points';
import { archivedValues, currentSnapshot } from './store';

const flow = initialPoints().find((p) => p.tag === 'RB.P101.FLOW');
if (!flow) throw new Error('fixture');

describe('Archive Editor helpers', () => {
  it('formats and reads SMT event times', () => {
    const t = new Date(2025, 6, 4, 15, 40, 0).getTime();
    expect(formatSmtTime(t)).toBe('7/4/2025 3:40:00 PM');
    expect(parseSmtTime('7/4/2025 3:40:00 PM', 0)).toBe(t);
    expect(parseSmtTime('*-1h', t)).toBe(t - 3_600_000);
  });

  it('shows Float32 values with 15 significant digits', () => {
    expect(formatSmtValue({ ...flow, pointtype: 'Float32' }, 51.343, [])).toBe('51.3429985046387');
    expect(formatSmtValue({ ...flow, pointtype: 'Float64' }, 51.343, [])).toBe('51.343');
  });

  it('parses filter expressions on the current tag only', () => {
    const f = parseFilter("'RB.P101.FLOW' > 100", 'RB.P101.FLOW');
    expect(typeof f).toBe('function');
    if (typeof f === 'function') {
      expect(f(101)).toBe(true);
      expect(f(99)).toBe(false);
    }
    expect(parseFilter("'.' <> 5", 'X')).toBeTypeOf('function');
    expect(parseFilter("'OTHER' > 1", 'RB.P101.FLOW')).toEqual({
      error: "The filter must refer to 'RB.P101.FLOW' (or '.').",
    });
    expect(parseFilter('', 'X')).toBeNull();
  });

  it('the snapshot is newer than every archived event', () => {
    const now = new Date(2026, 9, 16, 10, 0, 0).getTime();
    const snap = currentSnapshot(flow, now);
    const archived = archivedValues(flow, now - 7_200_000, now);
    expect(snap).not.toBeNull();
    expect(snap?.t).toBeGreaterThanOrEqual(archived.at(-1)?.t ?? 0);
  });
});
