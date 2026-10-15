import { useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/misc';
import { SourceList } from '@/components/content/SourceList';
import { cn } from '@/lib/cn';

export interface ListItem {
  id: string;
  title: string;
  subtitle?: string;
  group?: string;
  /** extra text matched by the filter box */
  keywords?: string;
  sources: readonly string[];
  verify: boolean;
  verifyNote?: string | undefined;
}

/**
 * Two-pane reference browser: filterable, grouped list on the left, detail on the right.
 * The selected id lives in the URL so every entry has a shareable link.
 */
export function ListDetail<T extends ListItem>({
  items,
  selectedId,
  basePath,
  renderDetail,
  emptyTitle,
  emptyText,
  filterLabel,
}: {
  items: readonly T[];
  selectedId: string | undefined;
  basePath: string;
  renderDetail: (item: T) => ReactNode;
  emptyTitle: string;
  emptyText: string;
  filterLabel: string;
}) {
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((i) =>
      `${i.title} ${i.subtitle ?? ''} ${i.keywords ?? ''}`.toLowerCase().includes(s),
    );
  }, [items, q]);
  const groups = useMemo(() => {
    const m = new Map<string, T[]>();
    for (const i of filtered) {
      const g = i.group ?? '';
      m.set(g, [...(m.get(g) ?? []), i]);
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);
  const selected = items.find((i) => i.id === selectedId);

  if (items.length === 0) return <EmptyState title={emptyTitle}>{emptyText}</EmptyState>;

  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
      <div className="space-y-3">
        <label className="relative block">
          <span className="sr-only">{filterLabel}</span>
          <Search className="absolute left-2.5 top-2.5 size-4 text-fg-muted" aria-hidden />
          <Input
            className="pl-8"
            placeholder={filterLabel}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              const first = filtered[0];
              if (e.key === 'Enter' && first)
                navigate(`${basePath}/${encodeURIComponent(first.id)}`);
            }}
          />
        </label>
        <p className="text-xs text-fg-muted" aria-live="polite">
          {filtered.length} of {items.length}
        </p>
        <nav
          aria-label={filterLabel}
          className="max-h-[70vh] overflow-y-auto rounded-lg border border-border bg-surface"
        >
          {groups.map(([g, list]) => (
            <div key={g}>
              {g ? (
                <div className="sticky top-0 bg-surface-2 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-fg-muted">
                  {g}
                </div>
              ) : null}
              <ul>
                {list.map((i) => (
                  <li key={i.id}>
                    <Link
                      to={`${basePath}/${encodeURIComponent(i.id)}`}
                      aria-current={i.id === selectedId ? 'page' : undefined}
                      className={cn(
                        'block border-b border-border/60 px-3 py-2 text-sm hover:bg-surface-2',
                        i.id === selectedId && 'bg-primary-soft',
                      )}
                    >
                      <span className="font-medium">{i.title}</span>
                      {i.verify ? (
                        <Badge tone="warning" className="ml-2">
                          verify
                        </Badge>
                      ) : null}
                      {i.subtitle ? (
                        <span className="block truncate text-xs text-fg-muted">{i.subtitle}</span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div>
        {selected ? (
          <article className="rounded-lg border border-border bg-surface p-6">
            {selected.verify ? (
              <div
                className="mb-4 rounded-md border border-warning bg-warning-soft p-3 text-sm"
                role="note"
              >
                <span className="font-semibold">Needs verification.</span>{' '}
                {selected.verifyNote ??
                  'This entry could not be checked against a readable primary source.'}
              </div>
            ) : null}
            {renderDetail(selected)}
            <SourceList ids={selected.sources} />
          </article>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-10 text-center text-fg-muted">
            Choose an entry on the left.
          </div>
        )}
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mt-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-fg-muted">{label}</h3>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-md bg-surface-2 p-3 font-mono text-sm">
      <code>{children}</code>
    </pre>
  );
}
