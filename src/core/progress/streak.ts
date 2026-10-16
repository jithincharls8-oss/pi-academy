import { addDays } from '../srs/sm2';

/**
 * Current streak: consecutive days ending today (or yesterday, if today is not done yet)
 * with a completed daily exam.
 */
export function currentStreak(completedDates: Iterable<string>, today: string): number {
  const days = new Set(completedDates);
  let cursor = days.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (days.has(cursor)) {
    n += 1;
    cursor = addDays(cursor, -1);
  }
  return n;
}

export function longestStreak(completedDates: Iterable<string>): number {
  const sorted = [...new Set(completedDates)].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}
