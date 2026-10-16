import { CoverageItemSchema, DomainSchema, type CoverageItem } from '../schemas';

const START = '<!-- coverage:start -->';
const END = '<!-- coverage:end -->';
const HEADING = /^##\s+\d+\.\s+.+\(`([a-z-]+)`\)\s*$/;
const ROW = /^\|\s*([a-z]{2,3}\.[a-z0-9-]+)\s*\|(.+)\|\s*$/;

/** Parse the coverage tables in COVERAGE.md into typed items. Throws on malformed rows. */
export function parseCoverage(markdown: string): CoverageItem[] {
  const start = markdown.indexOf(START);
  const end = markdown.indexOf(END);
  if (start < 0 || end < start) throw new Error('COVERAGE.md is missing coverage markers');
  const lines = markdown.slice(start + START.length, end).split('\n');
  const items: CoverageItem[] = [];
  let domain: string | null = null;
  for (const line of lines) {
    const h = HEADING.exec(line);
    if (h) {
      domain = h[1] ?? null;
      continue;
    }
    const r = ROW.exec(line);
    if (!r) continue;
    if (!domain) throw new Error(`coverage row before any domain heading: ${line}`);
    const cells = (r[2] ?? '').split('|').map((c) => c.trim());
    if (cells.length !== 5) throw new Error(`coverage row needs 6 columns: ${line}`);
    const [title, status, lessons, questions, terms] = cells as [string, string, string, string, string];
    items.push(
      CoverageItemSchema.parse({
        id: r[1],
        domain: DomainSchema.parse(domain),
        title,
        status,
        lessons: Number(lessons),
        questions: Number(questions),
        terms: Number(terms),
      }),
    );
  }
  const ids = new Set<string>();
  for (const item of items) {
    if (ids.has(item.id)) throw new Error(`duplicate coverage id ${item.id}`);
    ids.add(item.id);
  }
  return items;
}

export interface CoverageCounts {
  lessons: number;
  questions: number;
  terms: number;
}

/** Rewrite the Lessons/Questions/Terms columns in COVERAGE.md, leaving everything else intact. */
export function rewriteCoverageCounts(
  markdown: string,
  counts: ReadonlyMap<string, CoverageCounts>,
): string {
  return markdown
    .split('\n')
    .map((line) => {
      const r = ROW.exec(line);
      if (!r) return line;
      const id = r[1] ?? '';
      const cells = (r[2] ?? '').split('|').map((c) => c.trim());
      if (cells.length !== 5) return line;
      const c = counts.get(id) ?? { lessons: 0, questions: 0, terms: 0 };
      return `| ${id} | ${cells[0]} | ${cells[1]} | ${c.lessons} | ${c.questions} | ${c.terms} |`;
    })
    .join('\n');
}

export interface CoverageSummary {
  total: number;
  byStatus: Record<CoverageItem['status'], number>;
  /** share of items with at least one lesson, one question and one term */
  withContentPct: number;
  /** weighted progress: drafted = 0.5, reviewed = 0.8, verified = 1 */
  progressPct: number;
}

const STATUS_WEIGHT: Record<CoverageItem['status'], number> = {
  'not started': 0,
  drafted: 0.5,
  reviewed: 0.8,
  verified: 1,
};

export function summariseCoverage(items: readonly CoverageItem[]): CoverageSummary {
  const byStatus: CoverageSummary['byStatus'] = {
    'not started': 0,
    drafted: 0,
    reviewed: 0,
    verified: 0,
  };
  let withContent = 0;
  let weighted = 0;
  for (const item of items) {
    byStatus[item.status] += 1;
    weighted += STATUS_WEIGHT[item.status];
    if (item.lessons > 0 && item.questions > 0 && item.terms > 0) withContent += 1;
  }
  const total = items.length;
  return {
    total,
    byStatus,
    withContentPct: total === 0 ? 0 : Math.round((withContent / total) * 1000) / 10,
    progressPct: total === 0 ? 0 : Math.round((weighted / total) * 1000) / 10,
  };
}
