import MiniSearch from 'minisearch';
import type { Library } from '@/db/contentRepo';

export type SearchKind =
  | 'lesson'
  | 'glossary'
  | 'question'
  | 'caseStudy'
  | 'industry'
  | 'peFunction'
  | 'afFunction'
  | 'webApi'
  | 'command'
  | 'errorCode';

export interface SearchDoc {
  key: string;
  kind: SearchKind;
  id: string;
  title: string;
  text: string;
  domain: string;
}

export interface SearchHit {
  key: string;
  kind: SearchKind;
  id: string;
  title: string;
  domain: string;
  score: number;
}

const stripMd = (s: string): string => s.replace(/```[\s\S]*?```/g, ' ').replace(/[#*_`>|[\]()-]/g, ' ');

export function buildSearchDocs(lib: Library): SearchDoc[] {
  const docs: SearchDoc[] = [];
  const add = (kind: SearchKind, id: string, title: string, text: string, domain: string): void => {
    docs.push({ key: `${kind}:${id}`, kind, id, title, text: stripMd(text), domain });
  };
  for (const l of lib.lesson) {
    add('lesson', l.id, l.title, [l.summary, ...l.objectives, ...Object.values(l.sections)].join(' '), l.domain);
  }
  for (const g of lib.glossary) add('glossary', g.id, g.term, [g.aliases.join(' '), g.definition].join(' '), g.domain);
  for (const q of lib.question) add('question', q.id, q.prompt.slice(0, 120), `${q.prompt} ${q.explanation}`, q.domain);
  for (const c of lib.caseStudy) {
    add('caseStudy', c.id, `${c.company}: ${c.title}`, [c.summary, c.challenge, c.solution].join(' '), 'case-studies');
  }
  for (const h of lib.industry) add('industry', h.id, h.title, [h.summary, ...h.pitfalls].join(' '), 'industries');
  for (const f of lib.peFunction) add('peFunction', f.id, f.name, `${f.signature} ${f.description}`, 'analytics');
  for (const f of lib.afFunction) add('afFunction', f.id, f.name, `${f.signature} ${f.description}`, 'analytics');
  for (const e of lib.webApi) add('webApi', e.id, `${e.method} ${e.path}`, `${e.controller} ${e.summary}`, 'integration');
  for (const c of lib.command) add('command', c.id, `${c.tool} ${c.command}`, c.description, 'data-archive');
  for (const e of lib.errorCode) add('errorCode', e.id, `${e.code} ${e.message}`, `${e.meaning} ${e.resolution}`, 'administration');
  return docs;
}

export class SearchIndex {
  private readonly mini = new MiniSearch<SearchDoc>({
    idField: 'key',
    fields: ['title', 'text'],
    storeFields: ['kind', 'id', 'title', 'domain'],
    searchOptions: { boost: { title: 3 }, prefix: true, fuzzy: 0.2, combineWith: 'AND' },
  });

  constructor(docs: readonly SearchDoc[]) {
    this.mini.addAll(docs);
  }

  search(query: string, opts: { kinds?: readonly SearchKind[]; limit?: number } = {}): SearchHit[] {
    const q = query.trim();
    if (q.length < 2) return [];
    const kinds = opts.kinds ? new Set(opts.kinds) : null;
    const results = this.mini.search(q, kinds ? { filter: (r) => kinds.has(r['kind'] as SearchKind) } : {});
    return results.slice(0, opts.limit ?? 50).map((r) => ({
      key: String(r.id),
      kind: r['kind'] as SearchKind,
      id: String(r['id']),
      title: String(r['title']),
      domain: String(r['domain']),
      score: r.score,
    }));
  }
}
