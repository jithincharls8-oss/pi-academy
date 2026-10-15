import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApp } from '@/app/AppContext';
import { PageHeader } from '@/components/ui/misc';
import { Button } from '@/components/ui/button';
import type { DecisionTree } from '@/core/schemas/reference';
import { ListDetail } from './ListDetail';

/** Steps through a tree one question at a time, keeping the path so the user can step back. */
function TreeWalker({ tree }: { tree: DecisionTree }) {
  const [path, setPath] = useState<{ node: string; choice?: string }[]>([{ node: tree.root }]);
  const current = path[path.length - 1] as { node: string };
  const node = tree.nodes[current.node];
  if (!node) return <p role="alert">This tree points to a node that does not exist.</p>;

  const choose = (label: string, next: string) =>
    setPath((p) => [...p.slice(0, -1), { node: current.node, choice: label }, { node: next }]);
  const back = () =>
    setPath((p) =>
      p.length > 1 ? [...p.slice(0, -2), { node: (p[p.length - 2] as { node: string }).node }] : p,
    );

  return (
    <div className="mt-4 space-y-4">
      {path.length > 1 ? (
        <ol className="space-y-1 text-sm text-fg-muted" aria-label="Your answers so far">
          {path.slice(0, -1).map((s) => {
            const n = tree.nodes[s.node];
            return (
              <li key={s.node}>
                {n && 'question' in n ? n.question : ''}{' '}
                <span className="font-medium text-fg">{s.choice}</span>
              </li>
            );
          })}
        </ol>
      ) : null}
      <div className="rounded-lg border border-border bg-surface-2 p-4" aria-live="polite">
        {'question' in node ? (
          <fieldset>
            <legend className="font-semibold">{node.question}</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {node.options.map((o) => (
                <Button key={o.label} variant="secondary" onClick={() => choose(o.label, o.next)}>
                  {o.label}
                </Button>
              ))}
            </div>
          </fieldset>
        ) : (
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-fg-muted">
              Recommendation
            </div>
            <p className="mt-1 text-lg font-semibold">{node.result}</p>
            <p className="mt-2 text-sm">{node.details}</p>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={back} disabled={path.length < 2}>
          Back
        </Button>
        <Button
          variant="secondary"
          onClick={() => setPath([{ node: tree.root }])}
          disabled={path.length < 2}
        >
          Start again
        </Button>
      </div>
    </div>
  );
}

export function DecisionTreesPage() {
  const { id } = useParams();
  const { library } = useApp();
  const items = library.decisionTree.map((t) => ({ ...t, subtitle: t.description }));
  return (
    <div>
      <PageHeader
        title="Decision trees"
        description="Answer a few questions to pick the right PI approach, such as which interface, calculation engine or high-availability option to use."
      />
      <ListDetail
        items={items}
        selectedId={id}
        basePath="/reference/decisions"
        filterLabel="Filter decision trees"
        emptyTitle="No decision trees yet"
        emptyText="Decision trees arrive with the content packs."
        renderDetail={(t) => (
          <>
            <h2 className="text-lg font-semibold">{t.title}</h2>
            <p className="mt-2 text-fg-muted">{t.description}</p>
            <TreeWalker key={t.id} tree={t} />
          </>
        )}
      />
      <p className="mt-6 text-sm text-fg-muted">
        Want the full picture for a site? Try the{' '}
        <Link className="text-primary underline" to="/planner">
          Deployment Planner
        </Link>
        .
      </p>
    </div>
  );
}
