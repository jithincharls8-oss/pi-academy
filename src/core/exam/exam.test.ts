import { describe, expect, it } from 'vitest';
import type { Domain, Question } from '../schemas';
import { DOMAINS } from '../schemas';
import { selectDaily, selectMock, selectQuiz } from './select';
import { allocate, MOCK_BLUEPRINT } from './blueprint';
import { grade, normaliseWebApi } from './grade';
import { readinessByDomain } from './readiness';
import { hashString, seededRandom, shuffle } from '../random/prng';

function pool(n: number): Question[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `q-${String(i).padStart(4, '0')}`,
    domain: DOMAINS[i % 10] as Domain,
    coverage: ['da.points'],
    difficulty: ((i % 3) + 1) as 1 | 2 | 3,
    prompt: `Question number ${i}?`,
    explanation: 'Explanation text long enough.',
    tags: [],
    sources: ['s'],
    verify: false,
    type: 'fill' as const,
    accepted: ['x'],
    caseSensitive: false,
  }));
}

describe('prng', () => {
  it('is deterministic per seed and differs across seeds', () => {
    const a = seededRandom('x');
    const b = seededRandom('x');
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect(hashString('a')).not.toBe(hashString('b'));
    expect(shuffle([1, 2, 3, 4, 5], seededRandom('s'))).toEqual(
      shuffle([1, 2, 3, 4, 5], seededRandom('s')),
    );
  });
});

describe('selectDaily', () => {
  const p = pool(300);
  it('returns the same set for the same date and content version', () => {
    const a = selectDaily(p, '2026-10-15', 'v1').map((q) => q.id);
    const b = selectDaily([...p].reverse(), '2026-10-15', 'v1').map((q) => q.id);
    expect(a).toEqual(b);
    expect(a).toHaveLength(10);
  });
  it('changes from day to day', () => {
    const a = selectDaily(p, '2026-10-15', 'v1').map((q) => q.id);
    const b = selectDaily(p, '2026-10-16', 'v1').map((q) => q.id);
    expect(a).not.toEqual(b);
  });
  it('mixes topics and difficulties', () => {
    const qs = selectDaily(p, '2026-10-15', 'v1');
    const perDomain = new Map<string, number>();
    for (const q of qs) perDomain.set(q.domain, (perDomain.get(q.domain) ?? 0) + 1);
    expect(Math.max(...perDomain.values())).toBeLessThanOrEqual(2);
    expect(qs.filter((q) => q.difficulty === 1)).toHaveLength(3);
    expect(qs.filter((q) => q.difficulty === 2)).toHaveLength(4);
    expect(qs.filter((q) => q.difficulty === 3)).toHaveLength(3);
    expect(new Set(qs.map((q) => q.id)).size).toBe(10);
  });
  it('still returns 10 unique questions from a lopsided pool', () => {
    const lopsided = pool(40).map((q) => ({
      ...q,
      domain: 'data-archive' as Domain,
      difficulty: 1 as const,
    }));
    const qs = selectDaily(lopsided, '2026-10-15', 'v1');
    expect(new Set(qs.map((q) => q.id)).size).toBe(10);
  });
  it('returns the whole pool when it is smaller than the exam', () => {
    expect(selectDaily(pool(4), '2026-10-15', 'v1')).toHaveLength(4);
  });
});

describe('selectMock and allocate', () => {
  it('allocates exactly the requested total', () => {
    const a = allocate(60, MOCK_BLUEPRINT);
    expect([...a.values()].reduce((s, n) => s + n, 0)).toBe(60);
    expect(a.get('data-archive')).toBe(12);
  });
  it('builds a 60-question mock with no duplicates', () => {
    const qs = selectMock(pool(500), 'seed-1');
    expect(qs).toHaveLength(60);
    expect(new Set(qs.map((q) => q.id)).size).toBe(60);
  });
  it('quiz filters by domain', () => {
    const qs = selectQuiz(pool(100), { seed: 's', size: 5, domain: 'analytics' });
    expect(qs).toHaveLength(5);
    expect(qs.every((q) => q.domain === 'analytics')).toBe(true);
  });
});

const base = {
  id: 'q',
  domain: 'data-archive' as const,
  coverage: ['da.points'],
  difficulty: 1 as const,
  prompt: 'prompt text here',
  explanation: 'explanation text here',
  tags: [],
  sources: ['s'],
  verify: false,
};

describe('grade', () => {
  it('grades multiple choice', () => {
    const q: Question = {
      ...base,
      type: 'mcq',
      options: [
        { id: 'a', text: 'A' },
        { id: 'b', text: 'B' },
      ],
      answer: 'b',
    };
    expect(grade(q, { type: 'mcq', choice: 'b' }).correct).toBe(true);
    expect(grade(q, { type: 'mcq', choice: null }).correct).toBe(false);
  });
  it('gives partial credit on multi-select and penalises wrong picks', () => {
    const q: Question = {
      ...base,
      type: 'multi',
      options: [
        { id: 'a', text: 'A' },
        { id: 'b', text: 'B' },
        { id: 'c', text: 'C' },
        { id: 'd', text: 'D' },
      ],
      answers: ['a', 'b'],
    };
    expect(grade(q, { type: 'multi', choices: ['b', 'a'] })).toMatchObject({
      correct: true,
      score: 1,
    });
    expect(grade(q, { type: 'multi', choices: ['a'] }).score).toBe(0.5);
    expect(grade(q, { type: 'multi', choices: ['a', 'c'] }).score).toBe(0);
  });
  it('grades ordering by position', () => {
    const q: Question = {
      ...base,
      type: 'ordering',
      items: [
        { id: 'a', text: 'A' },
        { id: 'b', text: 'B' },
        { id: 'c', text: 'C' },
      ],
    };
    expect(grade(q, { type: 'ordering', order: ['a', 'b', 'c'] }).correct).toBe(true);
    expect(grade(q, { type: 'ordering', order: ['a', 'c', 'b'] }).score).toBeCloseTo(1 / 3);
  });
  it('grades matching pairs', () => {
    const q: Question = {
      ...base,
      type: 'matching',
      pairs: [
        { left: '1', right: 'one' },
        { left: '2', right: 'two' },
        { left: '3', right: 'three' },
      ],
    };
    expect(
      grade(q, { type: 'matching', pairs: { '1': 'one', '2': 'two', '3': 'three' } }).correct,
    ).toBe(true);
    expect(
      grade(q, { type: 'matching', pairs: { '1': 'two', '2': 'one', '3': 'three' } }).score,
    ).toBeCloseTo(1 / 3);
  });
  it('grades fill-in tolerantly', () => {
    const q: Question = {
      ...base,
      type: 'fill',
      accepted: ['Swinging Door'],
      caseSensitive: false,
    };
    expect(grade(q, { type: 'fill', text: '  swinging   door ' }).correct).toBe(true);
    expect(grade(q, { type: 'fill', text: '' }).correct).toBe(false);
  });
  it('grades PE expressions ignoring case, spacing and smart quotes', () => {
    const q: Question = {
      ...base,
      type: 'code',
      language: 'pe',
      accepted: ["TagAvg('sinusoid', '*-1h', '*')"],
      requiredPatterns: [],
      forbiddenPatterns: [],
    };
    expect(grade(q, { type: 'code', text: 'tagavg(‘SINUSOID’,‘*-1h’,‘*’)' }).correct).toBe(true);
    expect(grade(q, { type: 'code', text: "TagAvg('sinusoid','*-2h','*')" }).correct).toBe(false);
  });
  it('grades PI Web API calls ignoring host, query order and encoding', () => {
    const q: Question = {
      ...base,
      type: 'code',
      language: 'webapi',
      accepted: ['GET /piwebapi/streams/{webId}/recorded?startTime=*-1d&endTime=*'],
      requiredPatterns: [],
      forbiddenPatterns: [],
    };
    expect(
      grade(q, {
        type: 'code',
        text: 'https://myserver/piwebapi/streams/{webId}/recorded?endTime=*&startTime=*-1d',
      }).correct,
    ).toBe(true);
    expect(normaliseWebApi('GET /piwebapi/points?path=%5C%5Csrv%5Csinusoid')).toBe(
      'GET /piwebapi/points?path=\\\\srv\\sinusoid',
    );
  });
  it('accepts pattern-based answers and rejects forbidden content', () => {
    const q: Question = {
      ...base,
      type: 'code',
      language: 'af',
      accepted: ["TagAvg('Flow', '*-1h', '*')"],
      requiredPatterns: ['^tagavg\\(', "'flow'"],
      forbiddenPatterns: ['tagtot'],
    };
    expect(grade(q, { type: 'code', text: "TagAvg('Flow','-1h','*')" }).correct).toBe(true);
    expect(
      grade(q, { type: 'code', text: "TagAvg('Flow','*-1h','*')+TagTot('Flow','*-1h','*')" })
        .correct,
    ).toBe(false);
  });
});

describe('readiness', () => {
  it('stays low with few attempts even if all correct', () => {
    const r = readinessByDomain([
      { domain: 'analytics', score: 1, answered_at: '2026-10-15T00:00:00Z' },
    ]);
    expect(r.analytics.score).toBeLessThan(15);
  });
  it('approaches the true rate with many attempts', () => {
    const attempts = Array.from({ length: 50 }, (_, i) => ({
      domain: 'analytics',
      score: i % 5 === 0 ? 0 : 1,
      answered_at: `2026-10-${String(1 + (i % 28)).padStart(2, '0')}T00:00:00Z`,
    }));
    const r = readinessByDomain(attempts);
    expect(r.analytics.score).toBeGreaterThan(55);
    expect(r.analytics.score).toBeLessThan(80);
    expect(r['data-archive'].score).toBe(0);
  });
});
