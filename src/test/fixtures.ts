import type { ContentBundle } from '@/core/schemas';

export function minimalBundle(): ContentBundle {
  return {
    version: 'v1-000000',
    generatedAt: '2026-10-15T00:00:00.000Z',
    lessons: [],
    questions: [
      {
        id: 'q-one',
        domain: 'data-archive',
        coverage: ['da.points'],
        difficulty: 1,
        prompt: 'What does a PI point store?',
        explanation: 'A PI point stores a time series of values for one measurement.',
        tags: [],
        sources: ['s1'],
        verify: false,
        type: 'fill',
        accepted: ['time series'],
        caseSensitive: false,
      },
      {
        id: 'q-two',
        domain: 'asset-framework',
        coverage: ['da.points'],
        difficulty: 2,
        prompt: 'Pick the AF object that groups attributes.',
        explanation: 'Elements hold attributes in Asset Framework.',
        tags: [],
        sources: ['s1'],
        verify: false,
        type: 'mcq',
        options: [
          { id: 'a', text: 'Element' },
          { id: 'b', text: 'Point' },
        ],
        answer: 'a',
      },
    ],
    glossary: [
      {
        id: 'pi-point',
        term: 'PI point',
        aliases: ['tag'],
        definition: 'A single time series stored in the PI Data Archive.',
        domain: 'data-archive',
        coverage: ['da.points'],
        related: [],
        sources: ['s1'],
        verify: false,
      },
    ],
    caseStudies: [],
    industries: [],
    challenges: [],
    sources: [
      {
        id: 's1',
        title: 'Test source',
        url: 'https://example.com/source',
        publisher: 'Test',
        kind: 'other',
        accessed: '2026-10-15',
        readable: true,
      },
    ],
    reference: {
      peFunctions: [],
      afFunctions: [],
      webApi: [],
      commands: [],
      errorCodes: [],
      decisionTrees: [],
    },
    coverage: [
      {
        id: 'da.points',
        domain: 'data-archive',
        title: 'Points',
        status: 'drafted',
        lessons: 0,
        questions: 2,
        terms: 1,
      },
    ],
  };
}
