import type { ContentBundle, CoverageItem, Question } from '../schemas';

export interface ValidationReport {
  errors: string[];
  warnings: string[];
}

export interface ValidateOptions {
  /** fail when any coverage item lacks a lesson, a question or a glossary term */
  strictCoverage: boolean;
}

/** Normalise a prompt so trivially re-worded duplicates collide. */
export function normaliseForDuplicate(text: string): string {
  return text
    .toLowerCase()
    .replace(/[`*_"'’“”()[\]{}.,:;!?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function questionFingerprint(q: Question): string {
  const base = normaliseForDuplicate(q.prompt);
  switch (q.type) {
    case 'mcq':
    case 'multi':
    case 'scenario':
      return `${base}|${q.options
        .map((o) => normaliseForDuplicate(o.text))
        .sort()
        .join('|')}`;
    case 'ordering':
      return `${base}|${q.items.map((o) => normaliseForDuplicate(o.text)).join('|')}`;
    case 'matching':
      return `${base}|${q.pairs.map((p) => normaliseForDuplicate(p.left)).join('|')}`;
    default:
      return base;
  }
}

function findDuplicates(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) dups.add(id);
    seen.add(id);
  }
  return [...dups];
}

type Bundleish = Omit<ContentBundle, 'version' | 'generatedAt'>;

/**
 * Cross-reference validation run after every item has passed its zod schema.
 * Errors fail CI; warnings are printed.
 */
export function validateBundle(b: Bundleish, opts: ValidateOptions): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  const sourceIds = new Set(b.sources.map((s) => s.id));
  const lessonIds = new Set(b.lessons.map((l) => l.id));
  const questionIds = new Set(b.questions.map((q) => q.id));
  const termIds = new Set(b.glossary.map((g) => g.id));
  const caseIds = new Set(b.caseStudies.map((c) => c.id));
  const coverageIds = new Set(b.coverage.map((c) => c.id));

  const kinds: [string, readonly string[]][] = [
    ['source', b.sources.map((x) => x.id)],
    ['lesson', b.lessons.map((x) => x.id)],
    ['question', b.questions.map((x) => x.id)],
    ['glossary term', b.glossary.map((x) => x.id)],
    ['case study', b.caseStudies.map((x) => x.id)],
    ['industry hub', b.industries.map((x) => x.id)],
    ['challenge', b.challenges.map((x) => x.id)],
    ['PE function', b.reference.peFunctions.map((x) => x.id)],
    ['AF function', b.reference.afFunctions.map((x) => x.id)],
    ['Web API endpoint', b.reference.webApi.map((x) => x.id)],
    ['command', b.reference.commands.map((x) => x.id)],
    ['error code', b.reference.errorCodes.map((x) => x.id)],
    ['decision tree', b.reference.decisionTrees.map((x) => x.id)],
  ];
  for (const [kind, ids] of kinds) {
    for (const d of findDuplicates(ids)) errors.push(`duplicate ${kind} id: ${d}`);
  }
  for (const d of findDuplicates(b.sources.map((s) => s.url))) {
    warnings.push(`two sources share the URL ${d}`);
  }
  for (const d of findDuplicates(b.glossary.map((g) => g.term.toLowerCase()))) {
    errors.push(`duplicate glossary term: ${d}`);
  }

  const checkSources = (kind: string, id: string, refs: readonly string[]): void => {
    for (const s of refs) if (!sourceIds.has(s)) errors.push(`${kind} ${id} cites unknown source ${s}`);
  };
  const checkCoverage = (kind: string, id: string, refs: readonly string[]): void => {
    for (const c of refs) if (!coverageIds.has(c)) errors.push(`${kind} ${id} uses unknown coverage id ${c}`);
  };

  for (const l of b.lessons) {
    checkSources('lesson', l.id, l.sources);
    checkCoverage('lesson', l.id, l.coverage);
    for (const t of l.keyTerms) if (!termIds.has(t)) errors.push(`lesson ${l.id} key term ${t} is not in the glossary`);
    for (const q of l.knowledgeCheck) if (!questionIds.has(q)) errors.push(`lesson ${l.id} knowledge check ${q} does not exist`);
    for (const r of l.related) if (!lessonIds.has(r)) errors.push(`lesson ${l.id} related lesson ${r} does not exist`);
  }

  const fingerprints = new Map<string, string>();
  for (const q of b.questions) {
    checkSources('question', q.id, q.sources);
    checkCoverage('question', q.id, q.coverage);
    if (q.lessonId && !lessonIds.has(q.lessonId)) errors.push(`question ${q.id} links to missing lesson ${q.lessonId}`);
    if (!q.lessonId) warnings.push(`question ${q.id} has no lesson link`);
    const fp = questionFingerprint(q);
    const prev = fingerprints.get(fp);
    if (prev) errors.push(`duplicate question: ${q.id} repeats ${prev}`);
    else fingerprints.set(fp, q.id);
  }

  for (const g of b.glossary) {
    checkSources('glossary term', g.id, g.sources);
    checkCoverage('glossary term', g.id, g.coverage);
    for (const r of g.related) if (!termIds.has(r)) warnings.push(`glossary term ${g.id} relates to unknown term ${r}`);
  }

  for (const c of b.caseStudies) {
    checkSources('case study', c.id, c.sources);
    checkCoverage('case study', c.id, c.coverage);
  }
  for (const h of b.industries) {
    checkSources('industry hub', h.id, h.sources);
    checkCoverage('industry hub', h.id, h.coverage);
    for (const cs of h.caseStudies) if (!caseIds.has(cs)) errors.push(`industry hub ${h.id} links to missing case study ${cs}`);
  }
  for (const ch of b.challenges) {
    checkSources('challenge', ch.id, ch.sources);
    checkCoverage('challenge', ch.id, ch.coverage);
  }
  const refGroups = [
    ...b.reference.peFunctions,
    ...b.reference.afFunctions,
    ...b.reference.webApi,
    ...b.reference.commands,
    ...b.reference.errorCodes,
    ...b.reference.decisionTrees,
  ];
  for (const r of refGroups) checkSources('reference entry', r.id, r.sources);

  for (const item of b.coverage) {
    const gaps = coverageGaps(item);
    if (gaps.length === 0) continue;
    const msg = `coverage ${item.id} (${item.title}) has no ${gaps.join(', ')}`;
    if (opts.strictCoverage) errors.push(msg);
    else warnings.push(msg);
    if (item.status !== 'not started' && gaps.length > 0) {
      errors.push(`coverage ${item.id} is marked "${item.status}" but has no ${gaps.join(', ')}`);
    }
  }

  const unusedSources = [...sourceIds].filter((id) => !usesSource(b, id));
  for (const s of unusedSources) warnings.push(`source ${s} is not cited by anything`);

  return { errors, warnings };
}

export function coverageGaps(item: CoverageItem): string[] {
  const gaps: string[] = [];
  // The glossary section (glo.*) is a term-count target, not a topic: it is measured on terms only.
  if (item.id.startsWith('glo.')) return item.terms === 0 ? ['glossary terms'] : [];
  if (item.lessons === 0) gaps.push('lessons');
  if (item.questions === 0) gaps.push('questions');
  if (item.terms === 0) gaps.push('glossary terms');
  return gaps;
}

function usesSource(b: Bundleish, id: string): boolean {
  const lists: { sources: string[] }[][] = [
    b.lessons,
    b.questions,
    b.glossary,
    b.caseStudies,
    b.industries,
    b.challenges,
    b.reference.peFunctions,
    b.reference.afFunctions,
    b.reference.webApi,
    b.reference.commands,
    b.reference.errorCodes,
    b.reference.decisionTrees,
  ];
  return lists.some((list) => list.some((item) => item.sources.includes(id)));
}

/** Count lessons/questions/terms per coverage id. */
export function countCoverage(
  b: Pick<Bundleish, 'lessons' | 'questions' | 'glossary' | 'caseStudies' | 'industries'>,
  coverageIds: readonly string[],
): Map<string, { lessons: number; questions: number; terms: number }> {
  const counts = new Map(coverageIds.map((id) => [id, { lessons: 0, questions: 0, terms: 0 }]));
  const bump = (ids: readonly string[], key: 'lessons' | 'questions' | 'terms'): void => {
    for (const id of new Set(ids)) {
      const c = counts.get(id);
      if (c) c[key] += 1;
    }
  };
  for (const l of b.lessons) bump(l.coverage, 'lessons');
  for (const q of b.questions) bump(q.coverage, 'questions');
  for (const g of b.glossary) bump(g.coverage, 'terms');
  // Industry hubs count as the lesson for their industry; case studies as lessons for the library.
  for (const h of b.industries) bump(h.coverage, 'lessons');
  for (const c of b.caseStudies) bump(c.coverage, 'lessons');
  const glossaryAll = counts.get('glo.terms');
  if (glossaryAll) glossaryAll.terms = b.glossary.length;
  return counts;
}
