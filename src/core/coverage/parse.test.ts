import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseCoverage, rewriteCoverageCounts, summariseCoverage } from './parse';

const sample = `intro
<!-- coverage:start -->
## 1. Foundations (\`foundations\`)

| ID | Item | Status | Lessons | Questions | Terms |
|---|---|---|---|---|---|
| fnd.history | History | drafted | 1 | 4 | 2 |
| fnd.historian | Historian | not started | 0 | 0 | 0 |
<!-- coverage:end -->`;

describe('parseCoverage', () => {
  it('parses rows with their domain', () => {
    const items = parseCoverage(sample);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ id: 'fnd.history', domain: 'foundations', status: 'drafted', questions: 4 });
  });

  it('rejects unknown statuses', () => {
    expect(() => parseCoverage(sample.replace('drafted', 'done'))).toThrow();
  });

  it('parses the real COVERAGE.md with every item in a known domain', () => {
    const items = parseCoverage(readFileSync(new URL('../../../COVERAGE.md', import.meta.url), 'utf8'));
    expect(items.length).toBeGreaterThan(80);
    expect(new Set(items.map((i) => i.domain)).size).toBe(12);
  });
});

describe('rewriteCoverageCounts', () => {
  it('updates counts and leaves status alone', () => {
    const out = rewriteCoverageCounts(sample, new Map([['fnd.historian', { lessons: 2, questions: 9, terms: 5 }]]));
    const items = parseCoverage(out);
    expect(items[1]).toMatchObject({ status: 'not started', lessons: 2, questions: 9, terms: 5 });
    expect(items[0]).toMatchObject({ lessons: 0, questions: 0, terms: 0 });
  });
});

describe('summariseCoverage', () => {
  it('computes honest percentages', () => {
    const s = summariseCoverage(parseCoverage(sample));
    expect(s.total).toBe(2);
    expect(s.withContentPct).toBe(50);
    expect(s.progressPct).toBe(25);
  });
});
