import { currentStreak } from './streak';

/** XP rules, shown to learners on the home page so the numbers are never a mystery. */
export const XP_RULES = { correctAnswer: 10, lessonCompleted: 50, dailyExamCompleted: 30 } as const;

/** Each level needs 100 XP more than the one before: 100, 200, 300, ... */
export function levelFor(xp: number): { level: number; into: number; needed: number } {
  let level = 1;
  let remaining = Math.max(0, Math.floor(xp));
  while (remaining >= level * 100) {
    remaining -= level * 100;
    level += 1;
  }
  return { level, into: remaining, needed: level * 100 };
}

export interface LearnerInput {
  today: string;
  attempts: readonly { correct: number; answered_at: string }[];
  lessons: readonly { status: string; completed_at: string | null }[];
  daily: readonly { date: string; completed: number }[];
  srsDue: readonly string[];
}

export interface Quest {
  id: 'lesson' | 'answers' | 'daily';
  label: string;
  done: number;
  goal: number;
}

export interface LearnerSummary {
  xp: number;
  xpToday: number;
  level: ReturnType<typeof levelFor>;
  streak: number;
  dailyDoneToday: boolean;
  reviewsDue: number;
  lessonsCompleted: number;
  quests: Quest[];
}

/** Local calendar date of an ISO timestamp (attempts and lessons are stored as UTC ISO). */
function dayOf(iso: string): string {
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function summariseLearner(input: LearnerInput): LearnerSummary {
  const { today } = input;
  const correct = input.attempts.filter((a) => a.correct > 0);
  const lessonsDone = input.lessons.filter((l) => l.status === 'completed');
  const dailyDone = input.daily.filter((d) => d.completed > 0);

  const xp =
    correct.length * XP_RULES.correctAnswer +
    lessonsDone.length * XP_RULES.lessonCompleted +
    dailyDone.length * XP_RULES.dailyExamCompleted;

  const correctToday = correct.filter((a) => dayOf(a.answered_at) === today).length;
  const answeredToday = input.attempts.filter((a) => dayOf(a.answered_at) === today).length;
  const lessonsToday = lessonsDone.filter(
    (l) => l.completed_at && dayOf(l.completed_at) === today,
  ).length;
  const dailyDoneToday = dailyDone.some((d) => d.date === today);

  const xpToday =
    correctToday * XP_RULES.correctAnswer +
    lessonsToday * XP_RULES.lessonCompleted +
    (dailyDoneToday ? XP_RULES.dailyExamCompleted : 0);

  return {
    xp,
    xpToday,
    level: levelFor(xp),
    streak: currentStreak(
      dailyDone.map((d) => d.date),
      today,
    ),
    dailyDoneToday,
    reviewsDue: input.srsDue.filter((d) => d <= today).length,
    lessonsCompleted: lessonsDone.length,
    quests: [
      { id: 'lesson', label: 'Finish a lesson', done: Math.min(lessonsToday, 1), goal: 1 },
      { id: 'answers', label: 'Answer 10 questions', done: Math.min(answeredToday, 10), goal: 10 },
      { id: 'daily', label: "Complete today's exam", done: dailyDoneToday ? 1 : 0, goal: 1 },
    ],
  };
}
