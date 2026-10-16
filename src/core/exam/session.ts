import { z } from 'zod';
import type { Domain } from '../schemas';
import { addDays } from '../srs/sm2';
import type { Answer, GradeResult } from './grade';

/** Validates an answer read back from the database before it is shown or re-graded. */
export const AnswerSchema: z.ZodType<Answer> = z.discriminatedUnion('type', [
  z.object({ type: z.enum(['mcq', 'scenario']), choice: z.string().nullable() }),
  z.object({ type: z.literal('multi'), choices: z.array(z.string()) }),
  z.object({ type: z.literal('ordering'), order: z.array(z.string()) }),
  z.object({ type: z.literal('matching'), pairs: z.record(z.string(), z.string()) }),
  z.object({ type: z.enum(['fill', 'code']), text: z.string() }),
]);

export function parseAnswer(json: string): Answer | null {
  try {
    const r = AnswerSchema.safeParse(JSON.parse(json));
    return r.success ? r.data : null;
  } catch {
    return null;
  }
}

export interface AnswerRecord {
  answer: Answer;
  result: GradeResult;
}

export interface SessionSummary {
  total: number;
  answered: number;
  correct: number;
  /** 0..100, unanswered questions count as 0 */
  percent: number;
  byDomain: { domain: Domain; total: number; percent: number }[];
}

export function summarise(
  questions: readonly { id: string; domain: Domain }[],
  records: ReadonlyMap<string, AnswerRecord>,
): SessionSummary {
  let answered = 0;
  let correct = 0;
  let scoreSum = 0;
  const dom = new Map<Domain, { total: number; score: number }>();
  for (const q of questions) {
    const r = records.get(q.id);
    const d = dom.get(q.domain) ?? { total: 0, score: 0 };
    d.total += 1;
    if (r) {
      answered += 1;
      if (r.result.correct) correct += 1;
      scoreSum += r.result.score;
      d.score += r.result.score;
    }
    dom.set(q.domain, d);
  }
  const total = questions.length;
  return {
    total,
    answered,
    correct,
    percent: total === 0 ? 0 : Math.round((scoreSum / total) * 100),
    byDomain: [...dom.entries()]
      .map(([domain, v]) => ({
        domain,
        total: v.total,
        percent: Math.round((v.score / v.total) * 100),
      }))
      .sort((a, b) => a.percent - b.percent),
  };
}

/** Seconds left in a timed session; null when untimed. Never negative. */
export function secondsLeft(
  startedAt: string,
  timeLimitS: number | null,
  now: Date = new Date(),
): number | null {
  if (timeLimitS === null) return null;
  const elapsed = Math.floor((now.getTime() - new Date(startedAt).getTime()) / 1000);
  return Math.max(0, timeLimitS - elapsed);
}

export function formatClock(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export interface TopicScore {
  coverageId: string;
  attempts: number;
  /** 0..100 mean score over the most recent 20 attempts */
  percent: number;
}

/**
 * Average score per coverage item from the learner's attempts, weakest first. Items with fewer
 * than `minAttempts` answers are left out so one unlucky answer does not label a topic weak.
 */
export function topicScores(
  attempts: readonly { question_id: string; score: number; answered_at: string }[],
  coverageOf: (questionId: string) => readonly string[] | undefined,
  minAttempts = 2,
): TopicScore[] {
  const by = new Map<string, number[]>();
  const sorted = [...attempts].sort((a, b) => b.answered_at.localeCompare(a.answered_at));
  for (const a of sorted) {
    for (const c of coverageOf(a.question_id) ?? []) {
      const list = by.get(c) ?? [];
      if (list.length < 20) list.push(a.score);
      by.set(c, list);
    }
  }
  return [...by.entries()]
    .filter(([, s]) => s.length >= minAttempts)
    .map(([coverageId, s]) => ({
      coverageId,
      attempts: s.length,
      percent: Math.round((s.reduce((x, y) => x + y, 0) / s.length) * 100),
    }))
    .sort((a, b) => a.percent - b.percent || b.attempts - a.attempts);
}

export interface HeatCell {
  date: string;
  /** 0 = no daily exam, 1..4 = score bands */
  level: 0 | 1 | 2 | 3 | 4;
  score: number | null;
  future: boolean;
}

/** Score band for a 0..100 score. */
export function heatLevel(score: number | null): HeatCell['level'] {
  if (score === null) return 0;
  if (score >= 90) return 4;
  if (score >= 70) return 3;
  if (score >= 50) return 2;
  return 1;
}

function weekday(date: string): number {
  // 0 = Monday … 6 = Sunday, computed in UTC so local time zones cannot shift the day.
  const d = new Date(`${date}T00:00:00Z`).getUTCDay();
  return (d + 6) % 7;
}

/**
 * Calendar heatmap: `weeks` columns of Monday..Sunday ending with the week containing `today`.
 * Returns columns (weeks) of 7 cells.
 */
export function heatmap(
  log: readonly { date: string; score: number }[],
  today: string,
  weeks = 12,
): HeatCell[][] {
  const scores = new Map(log.map((l) => [l.date, l.score]));
  const lastMonday = addDays(today, -weekday(today));
  const start = addDays(lastMonday, -(weeks - 1) * 7);
  const cols: HeatCell[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col: HeatCell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(start, w * 7 + d);
      const score = scores.get(date) ?? null;
      col.push({ date, score, level: heatLevel(score), future: date > today });
    }
    cols.push(col);
  }
  return cols;
}
