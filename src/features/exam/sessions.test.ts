import { beforeEach, describe, expect, it } from 'vitest';
import type { Question } from '@/core/schemas';
import { grade } from '@/core/exam/grade';
import { UserRepo } from '@/db/userRepo';
import { testDb } from '@/test/db';
import { minimalBundle } from '@/test/fixtures';
import {
  answerInSession,
  dailySessionFor,
  finishSession,
  loadSession,
  startSession,
} from './sessions';

let app: { user: UserRepo };
const questions = minimalBundle().questions;
const byId = new Map<string, Question>(questions.map((q) => [q.id, q]));

beforeEach(async () => {
  app = { user: new UserRepo(await testDb()) };
});

describe('exam sessions', () => {
  it('saves answers, resumes them and finishes with a daily log entry', () => {
    const id = startSession(app, { mode: 'daily', questions, seed: 's', date: '2026-10-15' });
    let loaded = loadSession(app, byId, id);
    expect(loaded?.questions.map((q) => q.id)).toEqual(['q-one', 'q-two']);

    const q2 = byId.get('q-two') as Question;
    const ans = { type: 'mcq' as const, choice: 'a' };
    loaded = answerInSession(app, loaded!, q2, ans, grade(q2, ans));
    // answering twice in a session is ignored
    answerInSession(app, loaded, q2, { type: 'mcq', choice: 'b' }, { correct: false, score: 0 });
    expect(app.user.attempts(id)).toHaveLength(1);
    expect(app.user.srsCard('q-two')).toBeDefined();

    const resumed = loadSession(app, byId, id);
    expect(resumed?.records.get('q-two')?.result.correct).toBe(true);

    const summary = finishSession(app, resumed!, '2026-10-15');
    expect(summary).toMatchObject({ total: 2, answered: 1, percent: 50 });
    expect(app.user.session(id)?.finished_at).not.toBeNull();
    expect(app.user.dailyLog()).toEqual([{ date: '2026-10-15', completed: 1, score: 50 }]);
    expect(dailySessionFor(app, '2026-10-15')?.id).toBe(id);
  });

  it('does not count a daily exam finished on a later day toward the streak', () => {
    const id = startSession(app, { mode: 'daily', questions, seed: 's', date: '2026-10-14' });
    finishSession(app, loadSession(app, byId, id)!, '2026-10-15');
    expect(app.user.session(id)?.finished_at).not.toBeNull();
    expect(app.user.dailyLog()).toEqual([]);
  });

  it('reports questions that were removed from the library', () => {
    const id = startSession(app, { mode: 'quiz', questions, seed: 's', date: '2026-10-15' });
    const partial = new Map([['q-one', byId.get('q-one') as Question]]);
    expect(loadSession(app, partial, id)?.missing).toEqual(['q-two']);
    expect(loadSession(app, byId, 'nope')).toBeNull();
  });
});
