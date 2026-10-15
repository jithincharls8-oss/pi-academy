import { useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Download, Plus, RotateCcw, Save, Trash2, Upload } from 'lucide-react';
import { useApp } from '@/app/AppContext';
import { PageHeader, Progress } from '@/components/ui/misc';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Select, Textarea } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CONTENT_KINDS, type ContentKind } from '@/db/contentRepo';
import { summariseCoverage } from '@/core/coverage/parse';
import { readFileText, saveTextFile } from '@/lib/files';
import { localDate } from '@/lib/id';
import {
  checkPack,
  glossaryFromCsv,
  isKind,
  makePack,
  toCsv,
  verificationQueue,
  type ImportCheck,
} from './contentIo';

type Msg = { tone: 'ok' | 'error'; text: string } | null;

const KINDS = Object.keys(CONTENT_KINDS) as ContentKind[];

function itemTitle(item: object): string {
  const r = item as Record<string, unknown>;
  for (const k of ['title', 'term', 'name', 'company', 'prompt', 'path'])
    if (typeof r[k] === 'string') return r[k];
  return String(r.id);
}

function Status({ msg }: { msg: Msg }) {
  if (!msg) return null;
  return (
    <div
      role="status"
      className={
        msg.tone === 'ok'
          ? 'mb-4 rounded-md bg-success-soft p-3 text-success'
          : 'mb-4 whitespace-pre-wrap rounded-md bg-danger-soft p-3 text-danger'
      }
    >
      {msg.text}
    </div>
  );
}

/* ------------------------------------------------------------------ editor */

function ContentEditor({
  kind,
  setKind,
  initialId,
}: {
  kind: ContentKind;
  setKind: (k: ContentKind) => void;
  initialId: string | null;
}) {
  const { library, content, flush, reloadLibrary } = useApp();
  const list = library[kind] as readonly { id: string }[];
  const initial = initialId ? list.find((i) => i.id === initialId) : undefined;
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<string | null>(initial ? initialId : null);
  const [draft, setDraft] = useState(initial ? JSON.stringify(initial, null, 2) : '');
  const [msg, setMsg] = useState<Msg>(null);
  const shown = list.filter((i) =>
    `${i.id} ${itemTitle(i)}`.toLowerCase().includes(filter.trim().toLowerCase()),
  );

  const open = (id: string | null) => {
    setSelected(id);
    setMsg(null);
    const item = id ? list.find((i) => i.id === id) : undefined;
    setDraft(
      item
        ? JSON.stringify(item, null, 2)
        : '{\n  "id": "",\n  "sources": [],\n  "verify": false\n}',
    );
  };

  const save = async () => {
    let value: unknown;
    try {
      value = JSON.parse(draft);
    } catch (e) {
      setMsg({ tone: 'error', text: `Not valid JSON: ${(e as Error).message}` });
      return;
    }
    const r = content.upsert(kind, value);
    if (!r.ok) {
      setMsg({ tone: 'error', text: `Not saved. Fix these first:\n${r.errors.join('\n')}` });
      return;
    }
    await flush();
    reloadLibrary();
    setSelected(r.item.id);
    setMsg({
      tone: 'ok',
      text: `Saved ${r.item.id}. It overrides the bundled version on this device.`,
    });
  };

  const act = async (fn: () => void, text: string) => {
    fn();
    await flush();
    reloadLibrary();
    setMsg({ tone: 'ok', text });
  };

  const origin = selected ? content.origin(kind, selected) : null;

  return (
    <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
      <div className="space-y-2">
        <label htmlFor="adm-kind" className="block text-sm font-medium">
          Content type
        </label>
        <Select
          id="adm-kind"
          value={kind}
          onChange={(e) => {
            if (isKind(e.target.value)) setKind(e.target.value);
            setSelected(null);
            setDraft('');
          }}
        >
          {KINDS.map((k) => (
            <option key={k} value={k}>
              {CONTENT_KINDS[k].label} ({(library[k] as readonly unknown[]).length})
            </option>
          ))}
        </Select>
        <Input
          aria-label="Filter items"
          placeholder="Filter by id or title"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <Button variant="secondary" className="w-full" onClick={() => open(null)}>
          <Plus aria-hidden /> New item
        </Button>
        <ul
          className="max-h-[32rem] overflow-y-auto rounded-md border border-border"
          aria-label="Items"
        >
          {shown.map((i) => (
            <li key={i.id}>
              <button
                type="button"
                onClick={() => open(i.id)}
                aria-current={selected === i.id}
                className="block w-full border-b border-border px-3 py-2 text-left text-sm hover:bg-surface-2 aria-[current=true]:bg-primary-soft"
              >
                <span className="block truncate font-medium">{itemTitle(i)}</span>
                <span className="block truncate font-mono text-xs text-fg-muted">{i.id}</span>
              </button>
            </li>
          ))}
          {!shown.length ? <li className="p-3 text-sm text-fg-muted">Nothing matches.</li> : null}
        </ul>
      </div>
      <div className="min-w-0">
        <Status msg={msg} />
        {draft ? (
          <>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">{selected ?? 'New item'}</h2>
              {origin === 'user' ? <Badge tone="accent">Your item</Badge> : null}
              {origin === 'both' ? <Badge tone="warning">Edited bundled item</Badge> : null}
              {origin === 'bundle' ? <Badge>Bundled</Badge> : null}
            </div>
            <label htmlFor="adm-json" className="mb-1 block text-sm text-fg-muted">
              Edit as JSON. It is checked against the {CONTENT_KINDS[kind].label.toLowerCase()}{' '}
              schema before saving; see CONTENT_GUIDE.md for every field.
            </label>
            <Textarea
              id="adm-json"
              spellCheck={false}
              className="min-h-[28rem] font-mono text-xs"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={() => void save()}>
                <Save aria-hidden /> Save
              </Button>
              {origin === 'both' && selected ? (
                <Button
                  variant="secondary"
                  onClick={() =>
                    void act(
                      () => content.revert(kind, selected),
                      `Reverted ${selected} to the bundled version.`,
                    )
                  }
                >
                  <RotateCcw aria-hidden /> Revert to bundled
                </Button>
              ) : null}
              {selected ? (
                <Button
                  variant="danger"
                  onClick={() => {
                    if (
                      !window.confirm(
                        `Delete ${selected}? Bundled items can be restored by importing a content pack or resetting content.`,
                      )
                    )
                      return;
                    const id = selected;
                    setSelected(null);
                    setDraft('');
                    void act(() => content.remove(kind, id), `Deleted ${id}.`);
                  }}
                >
                  <Trash2 aria-hidden /> Delete
                </Button>
              ) : null}
            </div>
          </>
        ) : (
          <p className="text-sm text-fg-muted">Pick an item to edit, or create a new one.</p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ import / export */

function ImportExport() {
  const { library, content, flush, reloadLibrary } = useApp();
  const [kinds, setKinds] = useState<Set<ContentKind>>(new Set(KINDS));
  const [csvKind, setCsvKind] = useState<ContentKind>('glossary');
  const [check, setCheck] = useState<(ImportCheck & { file: string }) | null>(null);
  const [msg, setMsg] = useState<Msg>(null);
  const packRef = useRef<HTMLInputElement>(null);
  const csvRef = useRef<HTMLInputElement>(null);

  const exportPack = async (userOnly: boolean) => {
    const items: Partial<Record<ContentKind, unknown[]>> = {};
    if (userOnly) {
      for (const row of content.userItems())
        if (!row.deleted && kinds.has(row.kind))
          (items[row.kind] ??= []).push(JSON.parse(row.data) as unknown);
    } else for (const k of kinds) items[k] = [...(library[k] as readonly unknown[])];
    const n = Object.values(items).reduce((a, l) => a + (l?.length ?? 0), 0);
    const ok = await saveTextFile(
      `pi-academy-content-${userOnly ? 'mine-' : ''}${localDate()}.json`,
      JSON.stringify(makePack(items), null, 2),
    );
    if (ok) setMsg({ tone: 'ok', text: `Exported ${n} items.` });
  };

  const exportCsv = async () => {
    const rows = library[csvKind] as readonly object[];
    const ok = await saveTextFile(
      `pi-academy-${csvKind}-${localDate()}.csv`,
      toCsv(rows),
      'text/csv',
    );
    if (ok)
      setMsg({
        tone: 'ok',
        text: `Exported ${rows.length} ${CONTENT_KINDS[csvKind].label.toLowerCase()} as CSV.`,
      });
  };

  const load = async (file: File, csv: boolean) => {
    try {
      const text = await readFileText(file);
      setCheck({ ...(csv ? glossaryFromCsv(text) : checkPack(text)), file: file.name });
      setMsg(null);
    } catch (e) {
      setMsg({ tone: 'error', text: `Could not read ${file.name}: ${(e as Error).message}` });
    }
  };

  const apply = async () => {
    if (!check) return;
    let n = 0;
    for (const v of check.valid) if (content.upsert(v.kind, v.value).ok) n++;
    await flush();
    reloadLibrary();
    setMsg({ tone: 'ok', text: `Imported ${n} items from ${check.file}.` });
    setCheck(null);
  };

  return (
    <div className="space-y-8">
      <Status msg={msg} />
      <section aria-labelledby="exp-h">
        <h2 id="exp-h" className="font-semibold">
          Export a content pack (JSON)
        </h2>
        <p className="mt-1 text-sm text-fg-muted">
          A pack can be imported on another device, or its items pasted into /content in the
          repository.
        </p>
        <fieldset className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          <legend className="sr-only">Content types to export</legend>
          {KINDS.map((k) => (
            <label key={k} className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                checked={kinds.has(k)}
                onChange={(e) => {
                  const next = new Set(kinds);
                  if (e.target.checked) next.add(k);
                  else next.delete(k);
                  setKinds(next);
                }}
              />
              {CONTENT_KINDS[k].label}
            </label>
          ))}
        </fieldset>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => void exportPack(false)} disabled={!kinds.size}>
            <Download aria-hidden /> Export all selected
          </Button>
          <Button variant="secondary" onClick={() => void exportPack(true)} disabled={!kinds.size}>
            <Download aria-hidden /> Export only my edits
          </Button>
        </div>
      </section>

      <section aria-labelledby="csv-h">
        <h2 id="csv-h" className="font-semibold">
          Export as CSV
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Select
            aria-label="Content type for CSV"
            className="w-60"
            value={csvKind}
            onChange={(e) => isKind(e.target.value) && setCsvKind(e.target.value)}
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {CONTENT_KINDS[k].label}
              </option>
            ))}
          </Select>
          <Button variant="secondary" onClick={() => void exportCsv()}>
            <Download aria-hidden /> Export CSV
          </Button>
        </div>
        <p className="mt-1 text-xs text-fg-muted">
          Lists are joined with "|"; nested fields are written as JSON.
        </p>
      </section>

      <section aria-labelledby="imp-h">
        <h2 id="imp-h" className="font-semibold">
          Import
        </h2>
        <p className="mt-1 text-sm text-fg-muted">
          Every item is checked first. Nothing is written until you confirm, and valid items become
          your own edits, which you can revert later.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => packRef.current?.click()}>
            <Upload aria-hidden /> Import content pack (JSON)
          </Button>
          <Button variant="secondary" onClick={() => csvRef.current?.click()}>
            <Upload aria-hidden /> Import glossary CSV
          </Button>
          <input
            ref={packRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            aria-label="Content pack file"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void load(f, false);
              e.target.value = '';
            }}
          />
          <input
            ref={csvRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            aria-label="Glossary CSV file"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void load(f, true);
              e.target.value = '';
            }}
          />
        </div>
        {check ? (
          <div className="mt-4 rounded-md border border-border p-4" aria-live="polite">
            <p className="text-sm">
              <span className="font-medium">{check.file}</span>: {check.valid.length} valid items,{' '}
              {check.errors.length} problems.
            </p>
            {check.errors.length ? (
              <ul className="mt-2 max-h-48 overflow-y-auto text-xs text-danger">
                {check.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            ) : null}
            <div className="mt-3 flex gap-2">
              <Button onClick={() => void apply()} disabled={!check.valid.length}>
                Import {check.valid.length} valid items
              </Button>
              <Button variant="secondary" onClick={() => setCheck(null)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ coverage & verification */

function CoverageView() {
  const { library } = useApp();
  const rows = useMemo(() => {
    const count = (list: readonly { coverage?: readonly string[] }[], id: string) =>
      list.filter((i) => i.coverage?.includes(id)).length;
    return library.coverage.map((c) => ({
      ...c,
      lessons: count(library.lesson, c.id),
      questions: count(library.question, c.id),
      terms: count(library.glossary, c.id),
    }));
  }, [library]);
  const sum = summariseCoverage(rows);
  const total = (k: 'lessons' | 'questions' | 'terms') => rows.reduce((a, r) => a + r[k], 0);
  const domains = [...new Set(rows.map((r) => r.domain))];
  return (
    <div>
      <Progress
        value={sum.withContentPct}
        label="Coverage items with lessons, questions and terms"
      />
      <p className="mt-2 text-sm text-fg-muted">
        {sum.withContentPct}% of {sum.total} syllabus items have a lesson, questions and glossary
        terms. Library: {library.lesson.length} lessons, {library.question.length} questions,{' '}
        {library.glossary.length} terms, {library.caseStudy.length} case studies. Counts here are
        live; statuses come from COVERAGE.md.
      </p>
      {domains.map((d) => (
        <section key={d} className="mt-6" aria-label={d}>
          <h2 className="mb-2 font-semibold capitalize">{d.replace(/-/g, ' ')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-fg-muted">
                  <th className="py-1 pr-3 font-medium">Item</th>
                  <th className="py-1 pr-3 font-medium">Status</th>
                  <th className="py-1 pr-3 text-right font-medium">Lessons</th>
                  <th className="py-1 pr-3 text-right font-medium">Questions</th>
                  <th className="py-1 text-right font-medium">Terms</th>
                </tr>
              </thead>
              <tbody>
                {rows
                  .filter((r) => r.domain === d)
                  .map((r) => (
                    <tr key={r.id} className="border-b border-border">
                      <td className="py-1 pr-3">
                        {r.title} <span className="font-mono text-xs text-fg-muted">{r.id}</span>
                      </td>
                      <td className="py-1 pr-3">
                        <Badge
                          tone={
                            r.status === 'verified'
                              ? 'success'
                              : r.status === 'not started'
                                ? 'neutral'
                                : 'info'
                          }
                        >
                          {r.status}
                        </Badge>
                      </td>
                      {(['lessons', 'questions', 'terms'] as const).map((k) => (
                        <td
                          key={k}
                          className={`py-1 pr-3 text-right tabular-nums ${r[k] === 0 ? 'text-danger' : ''}`}
                        >
                          {r[k]}
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
      <p className="mt-4 text-xs text-fg-muted">
        Totals tagged to a coverage item: {total('lessons')} lessons, {total('questions')}{' '}
        questions, {total('terms')} terms (an item can count towards several).
      </p>
    </div>
  );
}

function VerificationView({ onEdit }: { onEdit: (kind: ContentKind, id: string) => void }) {
  const { library } = useApp();
  const queue = useMemo(
    () =>
      verificationQueue(Object.fromEntries(KINDS.map((k) => [k, library[k] as readonly object[]]))),
    [library],
  );
  return (
    <div>
      <p className="text-sm text-fg-muted">
        {queue.length} items are flagged "Needs verification": the fact could not be read in a
        source, or the source was uncertain. Check each against an official source, fix it if
        needed, then set <code>verify</code> to false and remove the note.
      </p>
      <ul className="mt-4 divide-y divide-border rounded-md border border-border">
        {queue.map((q) => (
          <li
            key={`${q.kind}:${q.id}`}
            className="flex flex-wrap items-start justify-between gap-3 p-3"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Badge>{CONTENT_KINDS[q.kind].label}</Badge>
                <span className="font-medium">{q.title}</span>
              </div>
              <p className="mt-1 text-sm text-fg-muted">{q.note}</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => onEdit(q.kind, q.id)}>
              Review
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AdminPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') ?? 'content';
  const [kind, setKind] = useState<ContentKind>('glossary');
  const [editorKey, setEditorKey] = useState(0);
  return (
    <div>
      <PageHeader
        title="Admin"
        description="Edit, add and remove content, move content between devices, and track coverage and verification. Changes are stored on this device."
      />
      <Tabs value={tab} onValueChange={(t) => setParams({ tab: t })}>
        <TabsList aria-label="Admin sections">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="io">Import and export</TabsTrigger>
          <TabsTrigger value="coverage">Coverage</TabsTrigger>
          <TabsTrigger value="verify">Verification</TabsTrigger>
        </TabsList>
        <TabsContent value="content" className="mt-4">
          <ContentEditor
            key={editorKey}
            kind={kind}
            setKind={setKind}
            initialId={params.get('edit')}
          />
        </TabsContent>
        <TabsContent value="io" className="mt-4">
          <ImportExport />
        </TabsContent>
        <TabsContent value="coverage" className="mt-4">
          <CoverageView />
        </TabsContent>
        <TabsContent value="verify" className="mt-4">
          <VerificationView
            onEdit={(k, id) => {
              setKind(k);
              setEditorKey((n) => n + 1);
              setParams({ tab: 'content', edit: id });
            }}
          />
        </TabsContent>
      </Tabs>
      <p className="mt-8 text-xs text-fg-muted">
        To reset everything you changed here, use{' '}
        <Link className="text-primary underline" to="/settings">
          Settings
        </Link>
        .
      </p>
    </div>
  );
}
