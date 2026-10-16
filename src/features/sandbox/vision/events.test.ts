import { describe, expect, it } from 'vitest';
import { eventWindow, findPeriods, formatDuration } from './events';
import { findEvents } from './eventData';
import { unitState } from '@/core/sim/plant';

const isTripped = (v: number): boolean => v === 2;

describe('findPeriods', () => {
  it('finds closed periods from state changes', () => {
    const ev = [
      { t: 10, v: 1 },
      { t: 20, v: 2 },
      { t: 35, v: 1 },
      { t: 50, v: 2 },
      { t: 55, v: 2 },
      { t: 60, v: 0 },
    ];
    expect(findPeriods(ev, 1, 0, 100, isTripped)).toEqual([
      { start: 20, end: 35 },
      { start: 50, end: 60 },
    ]);
  });
  it('opens a period at the range start and leaves a running one open', () => {
    expect(
      findPeriods(
        [
          { t: 30, v: 1 },
          { t: 80, v: 2 },
        ],
        2,
        0,
        100,
        isTripped,
      ),
    ).toEqual([
      { start: 0, end: 30 },
      { start: 80, end: null },
    ]);
  });
  it('ignores events outside the range and sorts input', () => {
    const ev = [
      { t: 40, v: 1 },
      { t: 200, v: 2 },
      { t: 30, v: 2 },
    ];
    expect(findPeriods(ev, null, 0, 100, isTripped)).toEqual([{ start: 30, end: 40 }]);
  });
});

describe('event helpers', () => {
  it('formats durations', () => {
    expect(formatDuration(42_000)).toBe('42s');
    expect(formatDuration(25 * 60_000 + 3000)).toBe('25m 03s');
    expect(formatDuration(2 * 3_600_000 + 5 * 60_000)).toBe('2h 05m');
  });
  it('pads the event window and stops at now', () => {
    expect(eventWindow({ start: 1_000_000, end: 2_000_000 }, 10_000_000)).toEqual({
      start: 100_000,
      end: 2_900_000,
    });
    expect(eventWindow({ start: 9_000_000, end: null }, 9_600_000).end).toBe(9_600_000);
  });
});

describe('pump trips from simulated data', () => {
  it('matches the plant state model', () => {
    // Find a known trip in the state model, then search a window around it.
    let trip = 0;
    for (let t = Date.UTC(2026, 9, 1); t < Date.UTC(2026, 10, 1) && !trip; t += 60_000) {
      if (unitState('P101', t) === 2) trip = t;
    }
    expect(trip).toBeGreaterThan(0);
    const start = trip - 3 * 3_600_000;
    const now = trip + 3 * 3_600_000;
    const area = '\\\\AFSRV01\\Riverbend\\Riverbend Plant\\Process';
    const rows = findEvents('Pump', area, 'Status', 'Tripped', start, now, now);
    expect(rows.some((r) => r.element === 'P-101' && r.start <= trip + 60_000)).toBe(true);
    for (const r of rows) {
      expect(r.state).toBe('Tripped');
      const mid = r.end === null ? r.start + 1000 : (r.start + r.end) / 2;
      const unit = r.element.replace('-', '');
      expect(unitState(unit, mid)).toBe(2);
    }
    // newest first
    const starts = rows.map((r) => r.start);
    expect([...starts].sort((a, b) => b - a)).toEqual(starts);
  });
});
