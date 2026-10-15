import type { Question } from '@/core/schemas';
import { grade, type Answer, type GradeResult } from '@/core/exam/grade';
import {
  parseAnswer,
  summarise,
  type AnswerRecord,
  type SessionSummary,
} from '@/core/exam/session';
import type { ExamMode, ExamSessionRow, UserRepo } from '@/db/userRepo';
import { recordAnswer } from './recordAnswer';
import { localDate } from '@/lib/id';

export interface LoadedSession {
  session: ExamSessionRow;
  questions: Question[];
  records: Map<string, AnswerRecord>;
  /** question ids in the session that no longer exist in the library */
  missing: string[];
}

export function startSession(
  app: { user: UserRepo },
  opts: {
    mode: ExamMode;
    questions: readonly Question[];
    seed: string;
    date: string;
    timeLimitS?: number | null;
  },
): string {
  return app.user.createSession({
    mode: opts.mode,
    seed: opts.seed,
    date: opts.date,
    question_ids: JSON.stringify(opts.questions.map((q) => q.id)),
    time_limit_s: opts.timeLimitS ?? null,
  });
}

function parseIds(json: string): string[] {
  try {
    const v: unknown = JSON.parse(json);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/**
 * Reads a session with the learner's saved answers. Answers are re-graded against the current
 * question so an edited question never shows a stale verdict.
 */
export function loadSession(
  app: { user: UserRepo },
  questionsById: ReadonlyMap<string, Question>,
  sessionId: string,
): LoadedSession | null {
  const session = app.user.session(sessionId);
  if (!session) return null;
  const ids = parseIds(session.question_ids);
  const questions: Question[] = [];
  const missing: string[] = [];
  for (const id of ids) {
    const q = questionsById.get(id);
    if (q) questions.push(q);
    else missing.push(id);
  }
  const records = new Map<string, AnswerRecord>();
  for (const a of app.user.attempts(sessionId)) {
    const q = questionsById.get(a.question_id);
    const answer = parseAnswer(a.answer);
    if (!q || !answer || answer.type !== q.type) continue;
    records.set(q.id, { answer, result: grade(q, answer) });
  }
  return { session, questions, records, missing };
}

/** Saves one answer in a session. A question already answered in the session is ignored. */
export function answerInSession(
  app: { user: UserRepo },
  loaded: LoadedSession,
  q: Question,
  answer: Answer,
  result: GradeResult,
  fast = false,
): LoadedSession {
  if (loaded.records.has(q.id) || loaded.session.finished_at) return loaded;
  recordAnswer(app, q, result, answer, loaded.session.mode, loaded.session.id, fast);
  const records = new Map(loaded.records);
  records.set(q.id, { answer, result });
  return { ...loaded, records };
}

/**
 * Marks the session finished and, for the daily exam, logs the day for streaks. A daily exam
 * finished after its day has passed is scored but does not count toward the streak.
 */
export function finishSession(
  app: { user: UserRepo },
  loaded: LoadedSession,
  today: string = localDate(),
): SessionSummary {
  const summary = summarise(loaded.questions, loaded.records);
  if (!loaded.session.finished_at) {
    app.user.finishSession(loaded.session.id, summary.percent);
    if (loaded.session.mode === 'daily' && loaded.session.date === today)
      app.user.logDaily(loaded.session.date, summary.percent);
  }
  return summary;
}

/** The most recent daily session for a date, if one was started. */
export function dailySessionFor(app: { user: UserRepo }, date: string): ExamSessionRow | undefined {
  return app.user.sessions('daily').find((s) => s.date === date);
}
