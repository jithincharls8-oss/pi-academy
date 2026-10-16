import { describe, expect, it } from 'vitest';
import { addDays, qualityFromGrade, sm2 } from './sm2';
import { currentStreak, longestStreak } from '../progress/streak';

describe('SM-2', () => {
  it('follows the 1, 6, I*EF interval sequence', () => {
    const a = sm2(null, 5, '2026-10-15');
    expect(a).toMatchObject({ intervalDays: 1, repetitions: 1, dueDate: '2026-10-16' });
    const b = sm2(a, 5, '2026-10-16');
    expect(b).toMatchObject({ intervalDays: 6, repetitions: 2, dueDate: '2026-10-22' });
    const c = sm2(b, 5, '2026-10-22');
    expect(c.intervalDays).toBe(Math.round(6 * b.easiness));
  });
  it('resets repetitions on a failed recall but keeps easiness above 1.3', () => {
    let s = sm2(null, 4, '2026-10-15');
    for (let i = 0; i < 10; i++) s = sm2(s, 0, '2026-10-15');
    expect(s.repetitions).toBe(0);
    expect(s.intervalDays).toBe(1);
    expect(s.easiness).toBe(1.3);
  });
  it('raises easiness for perfect answers and lowers it for hard ones', () => {
    expect(sm2(null, 5, '2026-10-15').easiness).toBe(2.6);
    expect(sm2(null, 3, '2026-10-15').easiness).toBeCloseTo(2.36);
  });
  it('maps grades to quality', () => {
    expect(qualityFromGrade(false, 0)).toBe(1);
    expect(qualityFromGrade(false, 0.6)).toBe(2);
    expect(qualityFromGrade(true, 1, true)).toBe(5);
  });
  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });
});

describe('streaks', () => {
  const done = ['2026-10-10', '2026-10-12', '2026-10-13', '2026-10-14'];
  it('counts back from yesterday when today is not done yet', () => {
    expect(currentStreak(done, '2026-10-15')).toBe(3);
  });
  it('includes today when done', () => {
    expect(currentStreak([...done, '2026-10-15'], '2026-10-15')).toBe(4);
  });
  it('breaks after a missed day', () => {
    expect(currentStreak(done, '2026-10-16')).toBe(0);
  });
  it('finds the longest run', () => {
    expect(longestStreak(done)).toBe(3);
    expect(longestStreak([])).toBe(0);
  });
});
