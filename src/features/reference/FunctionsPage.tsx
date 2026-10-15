import { Link, useParams } from 'react-router-dom';
import { useApp } from '@/app/AppContext';
import { PageHeader } from '@/components/ui/misc';
import { cn } from '@/lib/cn';
import { ListDetail, Field, Code } from './ListDetail';

const KINDS = { pe: 'Performance Equations', af: 'AF Analytics expressions' } as const;

export function FunctionsPage() {
  const { kind: rawKind, id } = useParams();
  const kind = rawKind === 'af' ? 'af' : 'pe';
  const { library } = useApp();
  const list = kind === 'pe' ? library.peFunction : library.afFunction;
  const items = [...list]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((f) => ({
      ...f,
      title: f.name,
      subtitle: f.description,
      group: f.category,
      keywords: f.signature,
    }));
  return (
    <div>
      <PageHeader
        title="Function reference"
        description="Signatures, arguments and examples. Entries whose exact signature could not be read in a primary source are marked for verification."
      />
      <div role="tablist" aria-label="Function family" className="mb-4 flex gap-2">
        {(Object.keys(KINDS) as (keyof typeof KINDS)[]).map((k) => (
          <Link
            key={k}
            role="tab"
            aria-selected={k === kind}
            to={`/reference/functions/${k}`}
            className={cn(
              'rounded-md border px-3 py-1.5 text-sm',
              k === kind
                ? 'border-primary bg-primary-soft text-primary'
                : 'border-border hover:bg-surface-2',
            )}
          >
            {KINDS[k]} ({(k === 'pe' ? library.peFunction : library.afFunction).length})
          </Link>
        ))}
      </div>
      <ListDetail
        items={items}
        selectedId={id}
        basePath={`/reference/functions/${kind}`}
        filterLabel="Filter functions"
        emptyTitle="No functions yet"
        emptyText="The function catalogue arrives with the content packs."
        renderDetail={(f) => (
          <>
            <h2 className="font-mono text-xl font-semibold">{f.name}</h2>
            <p className="mt-1 text-sm text-fg-muted">{f.category}</p>
            <Field label="Signature">
              <Code>{f.signature}</Code>
            </Field>
            <p className="mt-4">{f.description}</p>
            {f.params.length ? (
              <Field label="Arguments">
                <dl className="space-y-1 text-sm">
                  {f.params.map((p) => (
                    <div key={p.name} className="flex gap-3">
                      <dt className="w-28 shrink-0 font-mono">{p.name}</dt>
                      <dd>{p.description}</dd>
                    </div>
                  ))}
                </dl>
              </Field>
            ) : null}
            <Field label="Returns">{f.returns}</Field>
            <Field label="Example">
              <Code>{f.example}</Code>
            </Field>
            {f.notes ? <Field label="Notes">{f.notes}</Field> : null}
          </>
        )}
      />
    </div>
  );
}
