import type { Domain, Question } from '../schemas';
import { seededRandom, shuffle } from '../random/prng';
import { allocate, MOCK_BLUEPRINT } from './blueprint';

export const DAILY_SIZE = 10;
/** easy / medium / hard counts for the daily exam */
export const DAILY_DIFFICULTY_MIX: Readonly<Record<1 | 2 | 3, number>> = { 1: 3, 2: 4, 3: 3 };
export const DAILY_MAX_PER_DOMAIN = 2;

type Q = Pick<Question, 'id' | 'domain' | 'difficulty'>;

/**
 * Daily exam: same date + same content version = same 10 questions, in the same order.
 * Mixes topics (at most two per domain, relaxed only if the pool is too small) and
 * difficulties (3 easy, 4 medium, 3 hard, borrowing from neighbours when a band runs short).
 */
export function selectDaily<T extends Q>(
  pool: readonly T[],
  date: string,
  contentVersion: string,
  size = DAILY_SIZE,
): T[] {
  if (pool.length <= size)
    return shuffle(sortById(pool), seededRandom(`daily|${date}|${contentVersion}|order`));
  const rand = seededRandom(`daily|${date}|${contentVersion}`);
  const ordered = shuffle(sortById(pool), rand);
  const targets = scaleMix(size);
  const picked: T[] = [];
  const perDomain = new Map<Domain, number>();
  const take = (q: T): void => {
    picked.push(q);
    perDomain.set(q.domain, (perDomain.get(q.domain) ?? 0) + 1);
  };
  const used = new Set<string>();

  for (const cap of [DAILY_MAX_PER_DOMAIN, Number.POSITIVE_INFINITY]) {
    for (const d of [1, 2, 3] as const) {
      for (const q of ordered) {
        if (countDifficulty(picked, d) >= targets[d]) break;
        if (used.has(q.id) || q.difficulty !== d || (perDomain.get(q.domain) ?? 0) >= cap) continue;
        take(q);
        used.add(q.id);
      }
    }
  }
  // Borrow from any difficulty if a band was short.
  for (const cap of [DAILY_MAX_PER_DOMAIN, Number.POSITIVE_INFINITY]) {
    for (const q of ordered) {
      if (picked.length >= size) break;
      if (used.has(q.id) || (perDomain.get(q.domain) ?? 0) >= cap) continue;
      take(q);
      used.add(q.id);
    }
  }
  // Present in a stable mixed order, easiest first within the shuffle.
  return shuffle(picked, seededRandom(`daily|${date}|${contentVersion}|order`)).sort(
    (a, b) => a.difficulty - b.difficulty,
  );
}

function scaleMix(size: number): Record<1 | 2 | 3, number> {
  if (size === DAILY_SIZE) return { ...DAILY_DIFFICULTY_MIX };
  const easy = Math.round(size * 0.3);
  const hard = Math.round(size * 0.3);
  return { 1: easy, 2: size - easy - hard, 3: hard };
}

function countDifficulty(qs: readonly Q[], d: 1 | 2 | 3): number {
  return qs.filter((q) => q.difficulty === d).length;
}

function sortById<T extends Q>(qs: readonly T[]): T[] {
  return [...qs].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/** Mock exam: `size` questions allocated by the blueprint; shortfalls are filled from other domains. */
export function selectMock<T extends Q>(
  pool: readonly T[],
  seed: string,
  size = 60,
  weights = MOCK_BLUEPRINT,
): T[] {
  const rand = seededRandom(`mock|${seed}`);
  const ordered = shuffle(sortById(pool), rand);
  const quota = allocate(Math.min(size, pool.length), weights);
  const picked: T[] = [];
  const used = new Set<string>();
  for (const [domain, n] of quota) {
    let got = 0;
    for (const q of ordered) {
      if (got >= n) break;
      if (q.domain === domain && !used.has(q.id)) {
        picked.push(q);
        used.add(q.id);
        got += 1;
      }
    }
  }
  for (const q of ordered) {
    if (picked.length >= Math.min(size, pool.length)) break;
    if (!used.has(q.id)) {
      picked.push(q);
      used.add(q.id);
    }
  }
  return shuffle(picked, seededRandom(`mock|${seed}|order`));
}

/** Topic quiz: questions filtered by domain/coverage, optionally weighted to weak topics. */
export function selectQuiz<T extends Q & { coverage: readonly string[] }>(
  pool: readonly T[],
  opts: {
    seed: string;
    size: number;
    domain?: Domain;
    coverageId?: string;
    difficulty?: 1 | 2 | 3;
  },
): T[] {
  const filtered = pool.filter(
    (q) =>
      (!opts.domain || q.domain === opts.domain) &&
      (!opts.coverageId || q.coverage.includes(opts.coverageId)) &&
      (!opts.difficulty || q.difficulty === opts.difficulty),
  );
  return shuffle(sortById(filtered), seededRandom(`quiz|${opts.seed}`)).slice(0, opts.size);
}
