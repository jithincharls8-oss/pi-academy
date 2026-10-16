import { describe, expect, it } from 'vitest';
import {
  CaseStudySchema,
  ChallengeSchema,
  DecisionTreeSchema,
  GlossaryTermSchema,
  IndustryHubSchema,
  QuestionSchema,
  SourceSchema,
} from './index';

const base = {
  id: 'q-compdev-basic',
  domain: 'data-archive',
  coverage: ['da.exception-compression'],
  difficulty: 1,
  prompt: 'Which attribute sets the compression deviation?',
  explanation: 'CompDev is the compression deviation in engineering units.',
  sources: ['aveva-da-compression'],
};

describe('QuestionSchema', () => {
  it('accepts a valid multiple-choice question and defaults verify to false', () => {
    const q = QuestionSchema.parse({
      ...base,
      type: 'mcq',
      options: [
        { id: 'a', text: 'CompDev' },
        { id: 'b', text: 'ExcDev' },
      ],
      answer: 'a',
    });
    expect(q.verify).toBe(false);
  });

  it('rejects an answer that is not one of the options', () => {
    const r = QuestionSchema.safeParse({
      ...base,
      type: 'mcq',
      options: [
        { id: 'a', text: 'CompDev' },
        { id: 'b', text: 'ExcDev' },
      ],
      answer: 'z',
    });
    expect(r.success).toBe(false);
  });

  it('rejects multi-select answers that reference unknown options', () => {
    const r = QuestionSchema.safeParse({
      ...base,
      type: 'multi',
      options: [
        { id: 'a', text: 'one' },
        { id: 'b', text: 'two' },
        { id: 'c', text: 'three' },
      ],
      answers: ['a', 'x'],
    });
    expect(r.success).toBe(false);
  });

  it('requires at least one source', () => {
    const r = QuestionSchema.safeParse({
      ...base,
      sources: [],
      type: 'fill',
      accepted: ['CompDev'],
    });
    expect(r.success).toBe(false);
  });

  it('requires a verifyNote when verify is true', () => {
    const r = QuestionSchema.safeParse({
      ...base,
      verify: true,
      type: 'fill',
      accepted: ['CompDev'],
    });
    expect(r.success).toBe(false);
    const ok = QuestionSchema.safeParse({
      ...base,
      verify: true,
      verifyNote: 'Default value not confirmed in current docs',
      type: 'fill',
      accepted: ['CompDev'],
    });
    expect(ok.success).toBe(true);
  });

  it('rejects code questions with invalid regex patterns', () => {
    const r = QuestionSchema.safeParse({
      ...base,
      type: 'code',
      language: 'pe',
      accepted: ["TagAvg('sinusoid','*-1h','*')"],
      requiredPatterns: ['('],
    });
    expect(r.success).toBe(false);
  });

  it('rejects ids that are not kebab-case', () => {
    const r = QuestionSchema.safeParse({ ...base, id: 'Bad Id', type: 'fill', accepted: ['x'] });
    expect(r.success).toBe(false);
  });
});

describe('SourceSchema', () => {
  it('requires an http(s) URL and an ISO date', () => {
    const good = {
      id: 'aveva-da-compression',
      title: 'Compression',
      url: 'https://docs.aveva.com/bundle/pi-server-da-admin/page/1022865.html',
      publisher: 'AVEVA',
      kind: 'docs',
      accessed: '2026-10-15',
      readable: false,
    };
    expect(SourceSchema.safeParse(good).success).toBe(true);
    expect(SourceSchema.safeParse({ ...good, url: 'ftp://x.y/z' }).success).toBe(false);
    expect(SourceSchema.safeParse({ ...good, accessed: '15/10/2026' }).success).toBe(false);
  });
});

describe('GlossaryTermSchema', () => {
  it('parses a term with defaults', () => {
    const t = GlossaryTermSchema.parse({
      id: 'compdev',
      term: 'CompDev',
      definition:
        'Compression deviation, in engineering units, used by the swinging door algorithm.',
      domain: 'data-archive',
      sources: ['s1'],
    });
    expect(t.aliases).toEqual([]);
    expect(t.related).toEqual([]);
  });
});

describe('CaseStudySchema', () => {
  it('requires every outcome to say who reported it', () => {
    const cs = {
      id: 'example-utility',
      company: 'Example Utility',
      title: 'A title here',
      industry: 'power',
      products: ['data-archive'],
      summary: 'A summary that is long enough to pass the minimum length check.',
      challenge: 'The challenge text goes here.',
      solution: 'The solution text goes here.',
      outcomes: [{ category: 'cost', text: 'Saved money' }],
      sources: ['s1'],
    };
    expect(CaseStudySchema.safeParse(cs).success).toBe(false);
    expect(
      CaseStudySchema.safeParse({
        ...cs,
        outcomes: [{ category: 'cost', text: 'Saved money', reportedBy: 'AVEVA' }],
      }).success,
    ).toBe(true);
  });
});

describe('IndustryHubSchema', () => {
  it('requires the hierarchy to be a mermaid diagram', () => {
    const hub = {
      id: 'water',
      title: 'Water',
      summary: 'Water and wastewater utilities use PI for treatment and network data.',
      hierarchy: 'not a diagram',
      tags: [
        { name: 'a', description: 'a' },
        { name: 'b', description: 'b' },
        { name: 'c', description: 'c' },
      ],
      templates: [{ name: 'Pump', description: 'pump', attributes: ['Flow'] }],
      calculations: [{ name: 'x', expression: 'y', description: 'z' }],
      eventFrames: [{ name: 'Pump trip', trigger: 'Status = Tripped' }],
      kpis: [
        { name: 'k1', definition: 'd' },
        { name: 'k2', definition: 'd' },
      ],
      pitfalls: ['p1', 'p2'],
      coverage: ['ind.water'],
      sources: ['s1'],
    };
    expect(IndustryHubSchema.safeParse(hub).success).toBe(false);
    expect(
      IndustryHubSchema.safeParse({ ...hub, hierarchy: '```mermaid\nflowchart TD\nA-->B\n```' })
        .success,
    ).toBe(true);
  });
});

describe('ChallengeSchema', () => {
  it('validates the discriminated check union', () => {
    const ch = {
      id: 'tune-compression',
      title: 'Tune compression',
      tool: 'compression',
      level: 'practitioner',
      brief: 'Store at most 20% of events while keeping error below 0.5 degC.',
      hints: ['Start with CompDev at half the instrument accuracy.'],
      solution: 'CompDev 0.4 works.',
      check: { kind: 'compression', scenarioId: 'noisy-temp', maxStoredRatio: 0.2, maxError: 0.5 },
      coverage: ['da.exception-compression'],
      sources: ['s1'],
    };
    expect(ChallengeSchema.safeParse(ch).success).toBe(true);
    expect(
      ChallengeSchema.safeParse({
        ...ch,
        check: { kind: 'compression', scenarioId: 'x', maxStoredRatio: 2, maxError: 1 },
      }).success,
    ).toBe(false);
  });
});

describe('DecisionTreeSchema', () => {
  it('rejects options pointing at missing nodes', () => {
    const tree = {
      id: 'no-data',
      title: 'No data arriving',
      description: 'Why is a tag not updating?',
      root: 'start',
      nodes: {
        start: {
          question: 'Is the interface running?',
          options: [
            { label: 'No', next: 'fix' },
            { label: 'Yes', next: 'missing' },
          ],
        },
        fix: { result: 'Start the interface', details: 'Check the service.' },
      },
      sources: ['s1'],
    };
    expect(DecisionTreeSchema.safeParse(tree).success).toBe(false);
  });
});
