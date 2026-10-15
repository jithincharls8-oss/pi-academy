import { describe, expect, it } from 'vitest';
import { countCoverage, normaliseForDuplicate, validateBundle } from './validate';
import type { ContentBundle, Question } from '../schemas';

type B = Omit<ContentBundle, 'version' | 'generatedAt'>;

function q(id: string, prompt: string, extra: Partial<Question> = {}): Question {
  return {
    id,
    domain: 'data-archive',
    coverage: ['da.points'],
    difficulty: 1,
    prompt,
    explanation: 'An explanation long enough to pass.',
    tags: [],
    sources: ['s1'],
    verify: false,
    type: 'fill',
    accepted: ['x'],
    caseSensitive: false,
    ...extra,
  } as Question;
}

function bundle(over: Partial<B> = {}): B {
  return {
    lessons: [],
    questions: [],
    glossary: [],
    caseStudies: [],
    industries: [],
    challenges: [],
    sources: [
      {
        id: 's1',
        title: 'Source',
        url: 'https://example.com/a',
        publisher: 'AVEVA',
        kind: 'docs',
        accessed: '2026-10-15',
        readable: true,
      },
    ],
    reference: { peFunctions: [], afFunctions: [], webApi: [], commands: [], errorCodes: [], decisionTrees: [] },
    coverage: [{ id: 'da.points', domain: 'data-archive', title: 'Points', status: 'not started', lessons: 0, questions: 0, terms: 0 }],
    ...over,
  };
}

describe('validateBundle', () => {
  it('flags unknown sources and coverage ids', () => {
    const r = validateBundle(
      bundle({ questions: [q('a', 'What is a point?', { sources: ['nope'], coverage: ['da.zzz'] })] }),
      { strictCoverage: false },
    );
    expect(r.errors.some((e) => e.includes('unknown source nope'))).toBe(true);
    expect(r.errors.some((e) => e.includes('unknown coverage id da.zzz'))).toBe(true);
  });

  it('detects duplicate questions even when punctuation and case differ', () => {
    const r = validateBundle(
      bundle({ questions: [q('a', 'What is a PI point?'), q('b', 'what is a "PI point"')] }),
      { strictCoverage: false },
    );
    expect(r.errors).toContain('duplicate question: b repeats a');
  });

  it('only fails coverage gaps in strict mode, but always fails a status that claims content', () => {
    expect(validateBundle(bundle(), { strictCoverage: false }).errors).toHaveLength(0);
    expect(validateBundle(bundle(), { strictCoverage: true }).errors.length).toBeGreaterThan(0);
    const lying = bundle();
    lying.coverage[0] = { ...lying.coverage[0]!, status: 'drafted' };
    expect(validateBundle(lying, { strictCoverage: false }).errors.some((e) => e.includes('marked "drafted"'))).toBe(true);
  });
});

describe('countCoverage', () => {
  it('counts each item once per coverage id', () => {
    const counts = countCoverage(
      { ...bundle(), questions: [q('a', 'one?', { coverage: ['da.points', 'da.points'] }), q('b', 'two?')] },
      ['da.points'],
    );
    expect(counts.get('da.points')).toEqual({ lessons: 0, questions: 2, terms: 0 });
  });
});

describe('normaliseForDuplicate', () => {
  it('strips punctuation and whitespace', () => {
    expect(normaliseForDuplicate('  What  is `CompDev`?  ')).toBe('what is compdev');
  });
});
