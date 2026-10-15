import { describe, expect, it } from 'vitest';
import {
  formatClock,
  heatLevel,
  heatmap,
  parseAnswer,
  secondsLeft,
  summarise,
  topicScores,
  type AnswerRecord,
} from './session';

describe('parseAnswer', () => {
  it('round-trips every answer shape', () => {
    const shapes = [
      { type: 'mcq', choice: 'a' },
      { type: 'scenario', choice: null },
      { type: 'multi', choices: ['a', 'b'] },
      { type: 'ordering', order: ['b', 'a'] },
      { type: 'matching', pairs: { x: 'y' } },
      { type: 'fill', text: 'Compressing' },
      { type: 'code', text: 'GET /piwebapi/points' },
    ];
    for (const s of shapes) expect(parseAnswer(JSON.stringify(s))).toEqual(s);
  });
  it('rejects malformed or unknown data instead of throwing', () => {
    expect(parseAnswer('not json')).toBeNull();
    expect(parseAnswer('{"type":"essay","text":"x"}')).toBeNull();
    expect(parseAnswer('{"type":"multi","choices":"a"}')).toBeNull();
  });
});

describe('summarise', () => {
  const qs = [
    { id: 'a', domain: 'data-archive' as const },
    { id: 'b', domain: 'data-archive' as const },
    { id: 'c', domain: 'analytics' as const },
    { id: 'd', domain: 'analytics' as const },
  ];
  const rec = (correct: boolean, score: number): AnswerRecord => ({
    answer: { type: 'mcq', choice: 'a' },
    result: { correct, score },
  });
  it('counts unanswered questions as zero and orders domains weakest first', () => {
    const s = summarise(
      qs,
      new Map([
        ['a', rec(true, 1)],
        ['b', rec(true, 1)],
        ['c', rec(false, 0.5)],
      ]),
    );
    expect(s).toMatchObject({ total: 4, answered: 3, correct: 2, percent: 63 });
    expect(s.byDomain.map((d) => d.domain)).toEqual(['analytics', 'data-archive']);
    expect(s.byDomain[0]?.percent).toBe(25);
  });
  it('handles an empty session', () => {
    expect(summarise([], new Map()).percent).toBe(0);
  });
});

describe('timer helpers', () => {
  it('counts down from the start time and stops at zero', () => {
    const start = '2026-10-15T10:00:00.000Z';
    expect(secondsLeft(start, null)).toBeNull();
    expect(secondsLeft(start, 600, new Date('2026-10-15T10:01:30.000Z'))).toBe(510);
    expect(secondsLeft(start, 600, new Date('2026-10-15T11:00:00.000Z'))).toBe(0);
  });
  it('formats clocks', () => {
    expect(formatClock(59)).toBe('00:59');
    expect(formatClock(5400)).toBe('1:30:00');
  });
});

describe('topicScores', () => {
  const cov: Record<string, string[]> = { q1: ['da.a'], q2: ['da.a', 'da.b'], q3: ['da.c'] };
  it('averages recent attempts per coverage item, weakest first, skipping thin data', () => {
    const t = topicScores(
      [
        { question_id: 'q1', score: 1, answered_at: '2026-10-01' },
        { question_id: 'q2', score: 0, answered_at: '2026-10-02' },
        { question_id: 'q2', score: 0.5, answered_at: '2026-10-03' },
        { question_id: 'q3', score: 0, answered_at: '2026-10-03' },
        { question_id: 'gone', score: 0, answered_at: '2026-10-03' },
      ],
      (id) => cov[id],
    );
    expect(t).toEqual([
      { coverageId: 'da.b', attempts: 2, percent: 25 },
      { coverageId: 'da.a', attempts: 3, percent: 50 },
    ]);
  });
});

describe('heatmap', () => {
  it('lays out Monday-first weeks ending with the current week', () => {
    // 2026-10-15 is a Thursday.
    const cols = heatmap(
      [
        { date: '2026-10-12', score: 95 },
        { date: '2026-10-14', score: 40 },
      ],
      '2026-10-15',
      2,
    );
    expect(cols).toHaveLength(2);
    expect(cols[1]?.[0]).toMatchObject({ date: '2026-10-12', level: 4 });
    expect(cols[1]?.[2]).toMatchObject({ date: '2026-10-14', level: 1 });
    expect(cols[1]?.[3]).toMatchObject({ date: '2026-10-15', level: 0, future: false });
    expect(cols[1]?.[4]?.future).toBe(true);
    expect(cols[0]?.[0]?.date).toBe('2026-10-05');
  });
  it('bands scores', () => {
    expect([null, 10, 50, 70, 90].map(heatLevel)).toEqual([0, 1, 2, 3, 4]);
  });
});
