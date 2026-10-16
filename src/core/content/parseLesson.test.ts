import { describe, expect, it } from 'vitest';
import { buildLesson, splitLessonSections } from './parseLesson';

const filler = 'This section has enough words in it to pass the minimum length rule easily.';
const body = `## Plain English
${filler}

## Deep Dive
${filler}

## Worked Example
${filler}

## Diagram
${filler}
\`\`\`mermaid
flowchart LR
  A --> B
## not a heading inside a fence
\`\`\`

## Common Mistakes
${filler}

## Real-World Scenario
${filler}
`;

const fm = {
  id: 'exception-and-compression',
  title: 'Exception and compression',
  summary: 'How PI filters data before and at the archive.',
  domain: 'data-archive',
  coverage: ['da.exception-compression'],
  level: 'beginner',
  roles: ['pi-admin'],
  minutes: 12,
  objectives: ['Explain exception', 'Explain compression'],
  keyTerms: ['compdev'],
  knowledgeCheck: ['q1', 'q2', 'q3'],
  sources: ['s1'],
};

describe('splitLessonSections', () => {
  it('splits all six sections and ignores headings inside code fences', () => {
    const s = splitLessonSections(body);
    expect(Object.keys(s)).toHaveLength(6);
    expect(s.diagram).toContain('## not a heading inside a fence');
  });

  it('reports missing sections by name', () => {
    expect(() => splitLessonSections(body.replace('## Common Mistakes', '## Deep Dive'))).toThrow(/duplicate/);
    const withoutScenario = body.slice(0, body.indexOf('## Real-World Scenario'));
    expect(() => splitLessonSections(withoutScenario)).toThrow(/Real-World Scenario/);
  });

  it('rejects unknown headings', () => {
    expect(() => splitLessonSections(`${body}\n## Bonus\n${filler}`)).toThrow(/unknown lesson section/);
  });
});

describe('buildLesson', () => {
  it('builds a valid lesson', () => {
    const lesson = buildLesson(fm, body);
    expect(lesson.related).toEqual([]);
    expect(lesson.sections.deepDive).toBe(filler);
  });

  it('requires exactly three knowledge-check questions', () => {
    expect(() => buildLesson({ ...fm, knowledgeCheck: ['q1'] }, body)).toThrow();
  });

  it('requires a mermaid block in the diagram section', () => {
    expect(() => buildLesson(fm, body.replace('```mermaid', '```text'))).toThrow(/mermaid/);
  });
});
