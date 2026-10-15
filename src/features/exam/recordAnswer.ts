import type { Question } from '@/core/schemas';
import type { Answer, GradeResult } from '@/core/exam/grade';
import { qualityFromGrade, sm2 } from '@/core/srs/sm2';
import type { ExamMode, UserRepo } from '@/db/userRepo';
import { localDate } from '@/lib/id';

/** Persist an answer and update the question's spaced-repetition card. */
export function recordAnswer(
  app: { user: UserRepo },
  q: Question,
  result: GradeResult,
  answer: Answer,
  mode: ExamMode,
  sessionId: string | null,
  fast = false,
): void {
  const today = localDate();
  app.user.recordAttempt({
    question_id: q.id,
    domain: q.domain,
    mode,
    correct: result.correct ? 1 : 0,
    score: result.score,
    answer: JSON.stringify(answer),
    session_id: sessionId,
  });
  const prev = app.user.srsCard(q.id);
  const next = sm2(
    prev
      ? { easiness: prev.easiness, intervalDays: prev.interval_days, repetitions: prev.repetitions }
      : null,
    qualityFromGrade(result.correct, result.score, fast),
    today,
  );
  app.user.saveSrsCard({
    question_id: q.id,
    easiness: next.easiness,
    interval_days: next.intervalDays,
    repetitions: next.repetitions,
    due_date: next.dueDate,
    last_review: today,
  });
}
