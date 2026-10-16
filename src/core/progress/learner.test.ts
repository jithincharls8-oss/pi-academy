import { describe, expect, it } from 'vitest';
import { levelFor, summariseLearner, XP_RULES } from './learner';

const noon = (d: string): string => new Date(`${d}T12:00:00`).toISOString();

describe('levelFor', () => {
  it('starts at level 1 and needs 100 more XP per level', () => {
    expect(levelFor(0)).toEqual({ level: 1, into: 0, needed: 100 });
    expect(levelFor(99).level).toBe(1);
    expect(levelFor(100)).toEqual({ level: 2, into: 0, needed: 200 });
    expect(levelFor(350)).toEqual({ level: 3, into: 50, needed: 300 });
  });
});

describe('summariseLearner', () => {
  it('is all zeros for a new learner', () => {
    const s = summariseLearner({
      today: '2026-10-16',
      attempts: [],
      lessons: [],
      daily: [],
      srsDue: [],
    });
    expect(s.xp).toBe(0);
    expect(s.streak).toBe(0);
    expect(s.quests.every((q) => q.done === 0)).toBe(true);
  });

  it('adds XP from answers, lessons and daily exams, and fills today’s quests', () => {
    const s = summariseLearner({
      today: '2026-10-16',
      attempts: [
        { correct: 1, answered_at: noon('2026-10-16') },
        { correct: 0, answered_at: noon('2026-10-16') },
        { correct: 1, answered_at: noon('2026-10-15') },
      ],
      lessons: [{ status: 'completed', completed_at: noon('2026-10-16') }],
      daily: [
        { date: '2026-10-15', completed: 1 },
        { date: '2026-10-16', completed: 1 },
      ],
      srsDue: ['2026-10-14', '2026-10-16', '2026-10-20'],
    });
    expect(s.xp).toBe(
      2 * XP_RULES.correctAnswer + XP_RULES.lessonCompleted + 2 * XP_RULES.dailyExamCompleted,
    );
    expect(s.xpToday).toBe(
      XP_RULES.correctAnswer + XP_RULES.lessonCompleted + XP_RULES.dailyExamCompleted,
    );
    expect(s.streak).toBe(2);
    expect(s.reviewsDue).toBe(2);
    expect(s.quests.map((q) => q.done)).toEqual([1, 2, 1]);
  });
});
