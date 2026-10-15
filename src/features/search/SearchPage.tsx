import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '@/app/AppContext';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState, PageHeader } from '@/components/ui/misc';
import { DOMAIN_LABELS, DomainSchema } from '@/core/schemas';
import type { SearchKind } from '@/content/search';
import { KIND_LABELS, hrefFor } from '@/lib/links';
import { cn } from '@/lib/cn';

const KINDS = Object.keys(KIND_LABELS) as SearchKind[];

export function SearchPage() {
  const { search } = useApp();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const rawKind = params.get('kind');
  const kind = rawKind && rawKind in KIND_LABELS ? (rawKind as SearchKind) : null;
  const hits = useMemo(
    () => search.search(q, { kinds: kind ? [kind] : undefined, limit: 100 }),
    [search, q, kind],
  );

  const set = (next: { q?: string; kind?: SearchKind | null }): void => {
    const p = new URLSearchParams(params);
    if (next.q !== undefined) p.set('q', next.q);
    if (next.kind !== undefined) {
      if (next.kind) p.set('kind', next.kind);
      else p.delete('kind');
    }
    setParams(p, { replace: true });
  };

  return (
    <div>
      <PageHeader
        title="Search"
        description="Search every lesson, glossary term, question, case study and reference entry."
      />
      <Input
        autoFocus
        type="search"
        aria-label="Search"
        placeholder="Try “compression”, “WebID”, “TagAvg” or “-10722”"
        value={q}
        onChange={(e) => set({ q: e.target.value })}
        className="h-11 text-base"
      />
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter by type">
        <button
          onClick={() => set({ kind: null })}
          className={cn(
            'rounded-full border px-3 py-1 text-sm',
            !kind ? 'border-primary bg-primary-soft text-primary' : 'border-border',
          )}
          aria-pressed={!kind}
        >
          All
        </button>
        {KINDS.map((k) => (
          <button
            key={k}
            onClick={() => set({ kind: k })}
            aria-pressed={kind === k}
            className={cn(
              'rounded-full border px-3 py-1 text-sm',
              kind === k ? 'border-primary bg-primary-soft text-primary' : 'border-border',
            )}
          >
            {KIND_LABELS[k]}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {q.trim().length < 2 ? (
          <EmptyState title="Type at least two characters to search." />
        ) : hits.length === 0 ? (
          <EmptyState title={`No results for “${q}”.`}>
            Try a shorter word, or remove the type filter.
          </EmptyState>
        ) : (
          <ul
            className="divide-y divide-border rounded-lg border border-border bg-surface"
            aria-label={`${hits.length} results`}
          >
            {hits.map((h) => {
              const domain = DomainSchema.safeParse(h.domain);
              return (
                <li key={h.key}>
                  <Link
                    to={hrefFor(h.kind, h.id)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2"
                  >
                    <Badge tone="primary">{KIND_LABELS[h.kind]}</Badge>
                    <span className="min-w-0 flex-1 truncate">{h.title}</span>
                    {domain.success ? (
                      <span className="hidden text-xs text-fg-muted sm:inline">
                        {DOMAIN_LABELS[domain.data]}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
