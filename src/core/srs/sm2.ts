/** SuperMemo-2 spaced repetition (Wozniak, 1990). Quality is 0..5. */
export interface Sm2State {
  easiness: number;
  intervalDays: number;
  repetitions: number;
  /** YYYY-MM-DD */
  dueDate: string;
}

export const SM2_INITIAL: Omit<Sm2State, 'dueDate'> = {
  easiness: 2.5,
  intervalDays: 0,
  repetitions: 0,
};
export const SM2_MIN_EASINESS = 1.3;

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

export function sm2(
  prev: Omit<Sm2State, 'dueDate'> | null,
  quality: number,
  today: string,
): Sm2State {
  const q = Math.max(0, Math.min(5, Math.round(quality)));
  const state = prev ?? SM2_INITIAL;
  let { easiness, intervalDays, repetitions } = state;
  if (q < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) intervalDays = 1;
    else if (repetitions === 2) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * easiness);
  }
  easiness = Math.max(SM2_MIN_EASINESS, easiness + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  return {
    easiness: Math.round(easiness * 1000) / 1000,
    intervalDays,
    repetitions,
    dueDate: addDays(today, intervalDays),
  };
}

/** Map a graded answer to SM-2 quality: wrong = 1 (or 2 if partly right), right = 4, right and fast = 5. */
export function qualityFromGrade(correct: boolean, score: number, fast = false): number {
  if (!correct) return score >= 0.5 ? 2 : 1;
  return fast ? 5 : 4;
}
