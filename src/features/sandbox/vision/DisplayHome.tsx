import { useMemo, useState } from 'react';
import { FilePlus2, FolderOpen, Pencil, Trash2 } from 'lucide-react';
import { useApp } from '@/app/AppContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { EmptyState, PageHeader } from '@/components/ui/misc';
import { EXAMPLES } from './examples';
import { parseDisplay, serializeDisplay, VISION_TOOL, type Display } from './model';
import { resolveItem } from './values';

function summary(d: Display): string {
  const items = d.symbols.flatMap((s) => ('items' in s ? s.items : []));
  const missing = items.filter((i) => !resolveItem(i)).length;
  const ctx = d.context ? ` · switches ${d.context.template} assets` : '';
  return `${d.symbols.length} symbols${ctx}${missing ? ` · ${missing} missing data items` : ''}`;
}

/** Thumbnail: the symbol layout drawn as blocks. */
function Thumbnail({ d }: { d: Display }) {
  const fill = (k: string): string =>
    k === 'trend' || k === 'xy'
      ? 'var(--chart-1)'
      : k === 'shape' || k === 'text'
        ? 'var(--surface-3)'
        : k === 'collection'
          ? 'var(--chart-3)'
          : 'var(--chart-6)';
  return (
    <svg
      viewBox={`0 0 ${d.width} ${d.height}`}
      className="h-28 w-full rounded-t-lg bg-tool-canvas"
      aria-hidden
    >
      {d.symbols.map((s) => (
        <rect
          key={s.id}
          x={s.x}
          y={s.y}
          width={s.w}
          height={s.h}
          rx={6}
          fill={fill(s.kind)}
          fillOpacity={0.35}
          stroke="var(--border)"
        />
      ))}
    </svg>
  );
}

const matches = (q: string, ...texts: string[]): boolean =>
  !q.trim() || texts.some((t) => t.toLowerCase().includes(q.trim().toLowerCase()));

/** Display list: example displays, the learner's saved displays and "New display". */
export function DisplayHome({
  onOpen,
  onNew,
}: {
  onOpen: (d: Display, savedId: string | null) => void;
  onNew: () => void;
}) {
  const { user, flush, rev } = useApp();
  const [q, setQ] = useState('');
  const [rename, setRename] = useState<{ id: string; name: string; display: Display } | null>(null);
  const [remove, setRemove] = useState<{ id: string; name: string } | null>(null);
  const saved = useMemo(() => {
    void rev;
    return user.savedDisplays(VISION_TOOL).map((row) => ({ row, parsed: parseDisplay(row.data) }));
  }, [user, rev]);
  const examples = useMemo(() => EXAMPLES.map((e) => ({ e, d: e.build() })), []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="PI Vision display mockup"
        description="Build and explore PI Vision style displays on the simulated Riverbend plant: symbols, multi-state, asset switching, collections and event tables."
        actions={
          <Button onClick={onNew}>
            <FilePlus2 /> New display
          </Button>
        }
      />
      <div className="max-w-sm">
        <label htmlFor="vision-filter" className="text-sm font-medium">
          Filter by keywords
        </label>
        <Input
          id="vision-filter"
          className="mt-1"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Display name"
        />
      </div>

      <section aria-labelledby="vision-examples">
        <h2 id="vision-examples" className="mb-3 text-lg font-semibold">
          Example displays
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {examples
            .filter(({ e }) => matches(q, e.name, e.description))
            .map(({ e, d }) => (
              <li key={e.id}>
                <Card className="flex h-full flex-col">
                  <Thumbnail d={d} />
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{e.name}</h3>
                      <Badge tone="info">Example</Badge>
                    </div>
                    <p className="flex-1 text-sm text-fg-muted">{e.description}</p>
                    <p className="text-xs text-fg-muted">{summary(d)}</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="self-start"
                      onClick={() => onOpen(e.build(), null)}
                    >
                      <FolderOpen /> Open {e.name}
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
        </ul>
      </section>

      <section aria-labelledby="vision-mine">
        <h2 id="vision-mine" className="mb-3 text-lg font-semibold">
          My displays
        </h2>
        {saved.length === 0 ? (
          <EmptyState
            title="No saved displays yet"
            action={
              <Button variant="secondary" onClick={onNew}>
                New display
              </Button>
            }
          >
            Open an example and use Save as, or start a new display. Displays are stored in this app
            on this device.
          </EmptyState>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {saved
              .filter(({ row }) => matches(q, row.name))
              .map(({ row, parsed }) => (
                <li key={row.id}>
                  <Card className="flex h-full flex-col">
                    {parsed.ok ? <Thumbnail d={parsed.display} /> : null}
                    <div className="flex flex-1 flex-col gap-2 p-4">
                      <h3 className="font-semibold">{row.name}</h3>
                      <p className="flex-1 text-xs text-fg-muted">
                        {parsed.ok
                          ? summary(parsed.display)
                          : `This display could not be read. ${parsed.error}`}
                      </p>
                      <p className="text-xs text-fg-subtle">
                        Modified {new Date(row.updated_at).toLocaleString()}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {parsed.ok ? (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => onOpen(parsed.display, row.id)}
                            >
                              <FolderOpen /> Open
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={`Rename ${row.name}`}
                              onClick={() =>
                                setRename({ id: row.id, name: row.name, display: parsed.display })
                              }
                            >
                              <Pencil /> Rename
                            </Button>
                          </>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Delete ${row.name}`}
                          onClick={() => setRemove({ id: row.id, name: row.name })}
                        >
                          <Trash2 /> Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                </li>
              ))}
          </ul>
        )}
      </section>

      <Dialog open={Boolean(rename)} onOpenChange={(o) => !o && setRename(null)}>
        <DialogContent title="Rename display">
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!rename || !rename.name.trim()) return;
              const name = rename.name.trim();
              user.saveDisplay(
                VISION_TOOL,
                name,
                serializeDisplay({ ...rename.display, name }),
                rename.id,
              );
              void flush();
              setRename(null);
            }}
          >
            <label htmlFor="vision-rename" className="text-sm font-medium">
              Display name
            </label>
            <Input
              id="vision-rename"
              autoFocus
              value={rename?.name ?? ''}
              onChange={(e) => setRename((r) => (r ? { ...r, name: e.target.value } : r))}
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setRename(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!rename?.name.trim()}>
                Rename
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(remove)} onOpenChange={(o) => !o && setRemove(null)}>
        <DialogContent
          title="Delete display?"
          description={remove ? `"${remove.name}" will be removed from this device.` : undefined}
        >
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRemove(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (remove) user.deleteDisplay(remove.id);
                void flush();
                setRemove(null);
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
