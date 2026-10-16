/**
 * PI SMT > Data > Archive Editor, laid out like the real plug-in: a tab per point, a toolbar with
 * event counts, the Server / Tagname / Start Time / End Time query form, and a grid of Value,
 * Event Time, Questionable, Annotated and Substituted with a new-value row at the bottom.
 *
 * Like the real tool, the grid is a snapshot of one read: it does not update until Refresh, and
 * changes are pending until Save. The last row can be the point's snapshot, which is read with
 * the archived events but is not in an archive file yet, so it can vanish on the next Refresh.
 */
import { useState, type Dispatch, type KeyboardEvent } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CircleX,
  Paperclip,
  Plus,
  RefreshCw,
  Save,
  Search,
  Undo2,
  X,
} from 'lucide-react';
import { parsePiTime, TimeParseError } from '@/core/sim/time';
import { digitalStates, type SandboxPoint } from './points';
import {
  archivedValues,
  currentSnapshot,
  withEdits,
  type ArchiveEdit,
  type SmtAction,
} from './store';
import { cn } from '@/lib/cn';

const MAX_ROWS = 400;
type Boundary = 'Inside' | 'Outside' | 'Interpolated';
type PendingEdit = Omit<ArchiveEdit, 'id' | 'at'>;

interface Row {
  t: number;
  v: number;
  note: string;
  /** a pending (unsaved) change touches this row */
  pending: boolean;
  /** an interpolated boundary value: not an archived event, so it cannot be edited */
  synthetic: boolean;
}

interface Query {
  tag: string;
  start: string;
  mode: 'end' | 'count';
  end: string;
  count: string;
  boundary: Boundary;
  filter: string;
}

/** `7/4/2025 3:40:00 PM`, the way SMT shows event times on an en-US client. */
export function formatSmtTime(ms: number): string {
  return new Date(ms)
    .toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
    .replace(',', '');
}

/** Read `7/4/2025 3:40:00 PM` or any PI time expression (`*`, `*-10m`, `2026-10-16 08:00`). */
export function parseSmtTime(s: string, now: number): number {
  const m =
    /^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)\s*$/i.exec(s);
  if (!m) return parsePiTime(s, now);
  let h = Number(m[4]) % 12;
  if ((m[7] ?? '').toUpperCase() === 'PM') h += 12;
  const d = new Date(
    Number(m[3]),
    Number(m[1]) - 1,
    Number(m[2]),
    h,
    Number(m[5]),
    Number(m[6] ?? 0),
  );
  if (Number.isNaN(d.getTime())) throw new TimeParseError(`"${s}" is not a valid date`);
  return d.getTime();
}

/** Values as SMT shows them: 15 significant digits, so Float32 noise shows (51.3435645767667). */
export function formatSmtValue(p: SandboxPoint, v: number, states: string[]): string {
  if (states.length) return states[Math.round(v)] ?? `State ${Math.round(v)}`;
  if (p.pointtype === 'Int32') return String(Math.round(v));
  const n = p.pointtype === 'Float32' ? Math.fround(v) : v;
  return String(Number(n.toPrecision(15)));
}

/** PI filter expressions of the form `'TAG' > 50` (or `'.' > 50`), with >, >=, <, <=, = and <>. */
export function parseFilter(
  expr: string,
  tag: string,
): ((v: number) => boolean) | { error: string } | null {
  const s = expr.trim();
  if (!s) return null;
  const m = /^'([^']+)'\s*(>=|<=|<>|>|<|=)\s*(-?\d+(?:\.\d+)?)$/.exec(s);
  if (!m) return { error: "Write a filter such as 'RB.P101.FLOW' > 100." };
  const ref = m[1] ?? '';
  if (ref !== '.' && ref.toUpperCase() !== tag.toUpperCase())
    return { error: `The filter must refer to '${tag}' (or '.').` };
  const n = Number(m[3]);
  const op = m[2];
  return (v) =>
    op === '>'
      ? v > n
      : op === '>='
        ? v >= n
        : op === '<'
          ? v < n
          : op === '<='
            ? v <= n
            : op === '='
              ? v === n
              : v !== n;
}

function interpolateAt(a: Row, b: Row, t: number, step: boolean): number {
  if (step || b.t === a.t) return a.v;
  return a.v + ((b.v - a.v) * (t - a.t)) / (b.t - a.t);
}

const cell = 'border-r border-b border-tool-grid px-2 py-0.5 whitespace-nowrap';
const field =
  'h-6 rounded-none border border-tool-grid bg-tool-canvas px-1.5 text-[12px] text-fg focus-visible:outline-1 focus-visible:outline-ring aria-[invalid=true]:border-danger';
const iconButton =
  'inline-flex size-6 items-center justify-center rounded-sm text-fg-muted hover:bg-tool-select disabled:opacity-35 disabled:hover:bg-transparent focus-visible:outline-1 focus-visible:outline-ring [&_svg]:size-4';

export function ArchiveEditor({
  points,
  edits,
  now,
  dispatch,
}: {
  points: readonly SandboxPoint[];
  edits: Readonly<Record<string, ArchiveEdit[]>>;
  now: number;
  dispatch: Dispatch<SmtAction>;
}) {
  const [tabs, setTabs] = useState<Query[]>([
    {
      tag: 'RB.P101.FLOW',
      start: '*-2h',
      mode: 'end',
      end: '*',
      count: '100',
      boundary: 'Inside',
      filter: '',
    },
  ]);
  const [active, setActive] = useState(0);
  /** the time of the last read: the grid shows that read until Refresh */
  const [readAt, setReadAt] = useState(now);
  const [pending, setPending] = useState<PendingEdit[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [editing, setEditing] = useState<{ t: number; value: string } | null>(null);
  const [annotating, setAnnotating] = useState<{ t: number; note: string } | null>(null);
  const [draft, setDraft] = useState({ value: '', time: '*' });
  const [message, setMessage] = useState<{ tone: 'error' | 'info'; text: string } | null>(null);
  const [stringAnnotations, setStringAnnotations] = useState(false);

  const q = tabs[active] ?? tabs[0];
  const update = (patch: Partial<Query>): void =>
    setTabs((ts) => ts.map((t, i) => (i === active ? { ...t, ...patch } : t)));

  const point = q ? points.find((p) => p.tag.toUpperCase() === q.tag.trim().toUpperCase()) : null;
  const states = point?.pointtype === 'Digital' ? digitalStates(point.digitalset) : [];
  const key = point?.tag.toUpperCase() ?? '';
  const saved = edits[key] ?? [];

  const window_ = ((): { start: number; end: number } | { error: string } => {
    if (!q) return { error: 'No query' };
    try {
      const start = parseSmtTime(q.start, readAt);
      const end = q.mode === 'end' ? parseSmtTime(q.end, readAt) : readAt;
      if (end <= start) return { error: 'Start Time must be before End Time.' };
      return { start, end };
    } catch (e) {
      return { error: e instanceof TimeParseError ? e.message : 'Invalid time.' };
    }
  })();

  const filter = q && point ? parseFilter(q.filter, point.tag) : null;

  const rows = ((): Row[] => {
    if (!point || !q || 'error' in window_) return [];
    const { start, end } = window_;
    const stop = Math.min(end, readAt);
    const lookback = q.boundary === 'Inside' ? 0 : point.compmax * 1000;
    const all = [...saved, ...pending.map((p, i) => ({ ...p, id: `p${i}`, at: readAt }))];
    const base = withEdits(
      archivedValues(point, start - lookback, stop),
      all,
      start - lookback,
      stop,
    ).map((r) => ({ t: r.t, v: r.v, note: r.note, pending: false, synthetic: false }));
    const snap = currentSnapshot(point, readAt);
    const last = base.at(-1);
    if (snap && point.archiving && snap.t <= stop && snap.t >= start && (!last || snap.t > last.t))
      base.push({ t: snap.t, v: snap.v, note: '', pending: false, synthetic: false });
    const pendingTimes = new Set(pending.map((p) => p.t));
    for (const r of base) r.pending = pendingTimes.has(r.t);

    let out = base.filter((r) => r.t >= start && r.t <= end);
    if (q.boundary !== 'Inside') {
      const before = base.filter((r) => r.t < start).at(-1);
      if (before) {
        if (q.boundary === 'Outside') out = [before, ...out];
        else if (out[0])
          out = [
            {
              t: start,
              v: interpolateAt(before, out[0], start, point.step),
              note: '',
              pending: false,
              synthetic: true,
            },
            ...out,
          ];
      }
    }
    if (q.mode === 'count') {
      const n = Math.max(1, Math.min(MAX_ROWS, Number(q.count) || 1));
      out = out.slice(0, n);
    }
    return out;
  })();

  const shown = filter && typeof filter === 'function' ? rows.filter((r) => filter(r.v)) : rows;
  const visible = shown.slice(-MAX_ROWS);
  const selectedIndex = visible.findIndex((r) => r.t === selected);

  const parseValue = (raw: string): number | null => {
    if (states.length) {
      const i = states.findIndex((s) => s.toLowerCase() === raw.trim().toLowerCase());
      return i >= 0 ? i : null;
    }
    const n = Number(raw);
    return raw.trim() !== '' && Number.isFinite(n) ? n : null;
  };

  const refresh = (): void => {
    setReadAt(now);
    setEditing(null);
    setAnnotating(null);
    setMessage(null);
  };

  const shift = (dir: -1 | 1): void => {
    if (!q || 'error' in window_) return;
    const span = window_.end - window_.start;
    const fmt = (ms: number): string => formatSmtTime(ms);
    update({
      start: fmt(window_.start + dir * span),
      end: fmt(window_.end + dir * span),
      mode: 'end',
    });
  };

  const addPending = (e: PendingEdit): void => {
    setPending((p) => [...p, e]);
    setMessage(null);
  };

  const commitEdit = (): void => {
    if (!editing) return;
    const v = parseValue(editing.value);
    if (v === null) {
      setMessage({
        tone: 'error',
        text: states.length ? 'Choose a digital state.' : 'Enter a number.',
      });
      return;
    }
    const note = visible.find((r) => r.t === editing.t)?.note ?? '';
    addPending({ op: 'replace', t: editing.t, v, note });
    setEditing(null);
  };

  const addNewValue = (): void => {
    if (!point) return;
    const v = parseValue(draft.value);
    if (v === null) {
      setMessage({
        tone: 'error',
        text: states.length ? 'Choose a digital state.' : 'Enter a number in Value.',
      });
      return;
    }
    let t: number;
    try {
      t = Math.round(parseSmtTime(draft.time, now) / 1000) * 1000;
    } catch (e) {
      setMessage({
        tone: 'error',
        text: e instanceof TimeParseError ? e.message : 'Invalid Event Time.',
      });
      return;
    }
    if (t > now + 600_000 && !point.future) {
      setMessage({
        tone: 'error',
        text: 'Only future points accept values more than 10 minutes ahead.',
      });
      return;
    }
    addPending({ op: 'add', t, v, note: '' });
    setDraft({ value: '', time: '*' });
    setSelected(t);
  };

  const save = (): void => {
    if (!point) return;
    for (const e of pending) dispatch({ type: 'archiveEdit', tag: point.tag, edit: e, now });
    setMessage({
      tone: 'info',
      text: `Saved ${pending.length} change${pending.length === 1 ? '' : 's'} to the archive.`,
    });
    setPending([]);
  };

  const onGridKey = (e: KeyboardEvent<HTMLTableSectionElement>): void => {
    if (editing || annotating) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const i = Math.max(
        0,
        Math.min(visible.length - 1, selectedIndex + (e.key === 'ArrowDown' ? 1 : -1)),
      );
      setSelected(visible[i]?.t ?? null);
    } else if ((e.key === 'Enter' || e.key === 'F2') && selectedIndex >= 0) {
      const r = visible[selectedIndex];
      if (r && !r.synthetic) {
        e.preventDefault();
        setEditing({ t: r.t, value: formatSmtValue(point as SandboxPoint, r.v, states) });
      }
    } else if (e.key === 'Delete' && selectedIndex >= 0) {
      const r = visible[selectedIndex];
      if (r && !r.synthetic) addPending({ op: 'delete', t: r.t, v: 0, note: '' });
    }
  };

  const sel = selectedIndex >= 0 ? visible[selectedIndex] : undefined;

  return (
    <div className="font-[Segoe_UI,Tahoma,system-ui,sans-serif] text-[12px] text-fg">
      {/* tabs, one per point */}
      <div
        className="flex items-end gap-px bg-tool-select/50 px-1 pt-1"
        role="tablist"
        aria-label="Open points"
      >
        {tabs.map((t, i) => (
          <div
            key={i}
            className={cn(
              'flex items-center gap-1 border border-b-0 border-tool-grid px-2 py-0.5',
              i === active ? 'bg-tool-canvas' : 'bg-tool-select/40',
            )}
          >
            <button
              type="button"
              role="tab"
              aria-selected={i === active}
              onClick={() => {
                setActive(i);
                setPending([]);
                setSelected(null);
              }}
              className="max-w-56 truncate focus-visible:outline-1 focus-visible:outline-ring"
            >
              {t.tag || 'New tab'}
            </button>
            {tabs.length > 1 ? (
              <button
                type="button"
                aria-label={`Close ${t.tag}`}
                className="text-fg-muted hover:text-fg"
                onClick={() => {
                  setTabs((ts) => ts.filter((_, j) => j !== i));
                  setActive(0);
                  setPending([]);
                }}
              >
                <X className="size-3" aria-hidden />
              </button>
            ) : null}
          </div>
        ))}
        <button
          type="button"
          aria-label="Open another point in a new tab"
          className="mb-0.5 ml-1 text-tool-ok hover:opacity-80"
          onClick={() => {
            setTabs((ts) => [...ts, { ...(q as Query), filter: '' }]);
            setActive(tabs.length);
            setPending([]);
            setSelected(null);
          }}
        >
          <Plus className="size-4" aria-hidden strokeWidth={3} />
        </button>
      </div>

      <div className="border border-tool-grid bg-tool-canvas">
        {/* toolbar */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-tool-grid px-1 py-0.5">
          <div className="flex items-center" role="toolbar" aria-label="Archive Editor">
            <button
              type="button"
              className={iconButton}
              disabled={!pending.length}
              onClick={save}
              title="Save changes"
              aria-label="Save changes"
            >
              <Save aria-hidden />
            </button>
            <button
              type="button"
              className={iconButton}
              disabled={!pending.length}
              onClick={() => setPending((p) => p.slice(0, -1))}
              title="Undo last change"
              aria-label="Undo last change"
            >
              <Undo2 aria-hidden />
            </button>
            <button
              type="button"
              className={iconButton}
              disabled={!sel || sel.synthetic}
              onClick={() => sel && setAnnotating({ t: sel.t, note: sel.note })}
              title="Annotate the selected event"
              aria-label="Annotate the selected event"
            >
              <Paperclip aria-hidden />
            </button>
            <button
              type="button"
              className={iconButton}
              disabled={!sel || sel.synthetic}
              onClick={() => sel && addPending({ op: 'delete', t: sel.t, v: 0, note: '' })}
              title="Delete the selected event"
              aria-label="Delete the selected event"
            >
              <CircleX aria-hidden />
            </button>
            <button
              type="button"
              className={iconButton}
              onClick={refresh}
              title="Refresh"
              aria-label="Refresh"
            >
              <RefreshCw aria-hidden />
            </button>
          </div>
          <span>Event Count: {shown.length}</span>
          <span>Retrieved: {rows.length}</span>
          <span>Row: {selectedIndex >= 0 ? selectedIndex + 1 : visible.length + 1}</span>
          {pending.length ? (
            <span className="font-semibold text-tool-alarm-hi">{pending.length} unsaved</span>
          ) : null}
          <label className="ml-auto flex items-center gap-1">
            <span className="sr-only">Time zone</span>
            <select className={field} defaultValue="client" aria-label="Time zone">
              <option value="client">Use client timezone</option>
              <option value="server">Use server timezone</option>
            </select>
          </label>
        </div>

        {/* query form */}
        <form
          className="grid grid-cols-[auto_minmax(0,14rem)_auto_minmax(0,14rem)] items-center gap-x-3 gap-y-1 border-b border-tool-grid px-2 py-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            refresh();
          }}
          aria-label="Archive Editor query"
        >
          <label htmlFor="ae-server">Server:</label>
          <select id="ae-server" className={field} defaultValue="PISRV01">
            <option>PISRV01</option>
          </select>
          <label htmlFor="ae-tag">Tagname:</label>
          <div className="flex gap-1">
            <input
              id="ae-tag"
              list="ae-tags"
              className={cn(field, 'min-w-0 flex-1')}
              value={q?.tag ?? ''}
              aria-invalid={!point}
              onChange={(e) => {
                update({ tag: e.target.value });
                setPending([]);
                setSelected(null);
              }}
            />
            <datalist id="ae-tags">
              {points.map((p) => (
                <option key={p.tag} value={p.tag} />
              ))}
            </datalist>
            <button type="submit" className={iconButton} aria-label="Load point" title="Load point">
              <Search aria-hidden />
            </button>
          </div>

          <label htmlFor="ae-start">Start Time:</label>
          <input
            id="ae-start"
            className={field}
            value={q?.start ?? ''}
            onChange={(e) => update({ start: e.target.value })}
            aria-invalid={'error' in window_}
          />
          <fieldset className="flex flex-col leading-tight">
            <legend className="sr-only">End of range</legend>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="ae-mode"
                checked={q?.mode === 'end'}
                onChange={() => update({ mode: 'end' })}
              />
              End Time
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="ae-mode"
                checked={q?.mode === 'count'}
                onChange={() => update({ mode: 'count' })}
              />
              Event count
            </label>
          </fieldset>
          <div className="flex gap-1">
            <input
              aria-label={q?.mode === 'end' ? 'End Time' : 'Event count'}
              className={cn(field, 'min-w-0 flex-1')}
              value={q?.mode === 'end' ? q.end : (q?.count ?? '')}
              onChange={(e) =>
                update(q?.mode === 'end' ? { end: e.target.value } : { count: e.target.value })
              }
            />
            <button
              type="button"
              className={iconButton}
              onClick={() => shift(-1)}
              aria-label="Previous period"
              title="Previous period"
            >
              <ArrowLeft aria-hidden />
            </button>
            <button
              type="button"
              className={iconButton}
              onClick={() => shift(1)}
              aria-label="Next period"
              title="Next period"
            >
              <ArrowRight aria-hidden />
            </button>
          </div>

          <label htmlFor="ae-merge">Merge Type:</label>
          <select id="ae-merge" className={field} defaultValue="replace">
            <option value="replace">Replace Duplicates</option>
          </select>
          <label htmlFor="ae-boundary">Boundary Type:</label>
          <select
            id="ae-boundary"
            className={field}
            value={q?.boundary ?? 'Inside'}
            onChange={(e) => update({ boundary: e.target.value as Boundary })}
          >
            <option>Inside</option>
            <option>Outside</option>
            <option>Interpolated</option>
          </select>

          <label htmlFor="ae-show">Show Filtered:</label>
          <select id="ae-show" className={field} defaultValue="show">
            <option value="show">Show Filtered</option>
          </select>
          <label className="col-span-2 flex items-center gap-1">
            <input
              type="checkbox"
              checked={stringAnnotations}
              onChange={(e) => setStringAnnotations(e.target.checked)}
            />
            Use String Annotations?
          </label>

          <label htmlFor="ae-filter">Filter Expression:</label>
          <div className="col-span-3 flex gap-1">
            <input
              id="ae-filter"
              className={cn(field, 'min-w-0 flex-1 font-mono')}
              value={q?.filter ?? ''}
              placeholder={point ? `'${point.tag}' > 100` : undefined}
              onChange={(e) => update({ filter: e.target.value })}
              aria-invalid={!!filter && typeof filter !== 'function'}
            />
            <button
              type="submit"
              aria-label="Apply filter"
              title="Apply filter"
              className="inline-flex size-6 items-center justify-center rounded-sm bg-tool-ok text-tool-chrome-fg hover:opacity-90"
            >
              <ArrowRight className="size-4" aria-hidden />
            </button>
          </div>
        </form>

        {message || (filter && typeof filter !== 'function') || 'error' in window_ || !point ? (
          <p
            role={message?.tone === 'info' ? 'status' : 'alert'}
            className={cn(
              'border-b border-tool-grid px-2 py-1',
              message?.tone === 'info' ? 'text-tool-ok' : 'text-danger',
            )}
          >
            {!point
              ? `Point not found: ${q?.tag ?? ''}`
              : 'error' in window_
                ? window_.error
                : filter && typeof filter !== 'function'
                  ? filter.error
                  : message?.text}
          </p>
        ) : null}

        {annotating && point ? (
          <form
            className="flex items-center gap-2 border-b border-tool-grid bg-tool-select/30 px-2 py-1"
            aria-label="Annotation"
            onSubmit={(e) => {
              e.preventDefault();
              const r = visible.find((x) => x.t === annotating.t);
              if (r) addPending({ op: 'replace', t: r.t, v: r.v, note: annotating.note.trim() });
              setAnnotating(null);
            }}
          >
            <label htmlFor="ae-note">Annotation for {formatSmtTime(annotating.t)}:</label>
            <input
              id="ae-note"
              autoFocus
              className={cn(field, 'min-w-0 flex-1')}
              value={annotating.note}
              onChange={(e) => setAnnotating({ ...annotating, note: e.target.value })}
            />
            <button type="submit" className="h-6 border border-tool-grid px-2 hover:bg-tool-select">
              OK
            </button>
            <button
              type="button"
              className="h-6 border border-tool-grid px-2 hover:bg-tool-select"
              onClick={() => setAnnotating(null)}
            >
              Cancel
            </button>
          </form>
        ) : null}

        {/* grid */}
        <div className="max-h-[26rem] overflow-auto">
          <table className="border-collapse">
            <caption className="sr-only">{`Archived events for ${point?.tag ?? ''}`}</caption>
            <thead>
              <tr className="sticky top-0 z-10 bg-tool-canvas">
                <th scope="col" className={cn(cell, 'w-5 px-0')}>
                  <span className="sr-only">Row</span>
                </th>
                <th scope="col" className={cn(cell, 'w-40 text-left font-normal')}>
                  Value
                </th>
                <th scope="col" className={cn(cell, 'w-44 text-left font-normal')}>
                  Event Time
                </th>
                <th scope="col" className={cn(cell, 'w-24 font-normal')}>
                  Questionable
                </th>
                <th scope="col" className={cn(cell, 'w-24 font-normal')}>
                  Annotated
                </th>
                <th scope="col" className={cn(cell, 'w-24 font-normal')}>
                  Substituted
                </th>
                {stringAnnotations ? (
                  <th scope="col" className={cn(cell, 'min-w-48 text-left font-normal')}>
                    Annotation
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody
              tabIndex={0}
              onKeyDown={onGridKey}
              aria-label="Events: arrow keys select, Enter edits, Delete deletes"
              className="focus-visible:outline-1 focus-visible:outline-ring"
            >
              {point
                ? visible.map((r) => {
                    const isSel = r.t === selected;
                    const isEditing = editing?.t === r.t;
                    return (
                      <tr
                        key={r.t}
                        aria-selected={isSel}
                        onClick={() => setSelected(r.t)}
                        onDoubleClick={() =>
                          !r.synthetic &&
                          setEditing({ t: r.t, value: formatSmtValue(point, r.v, states) })
                        }
                        className={cn(
                          r.pending && 'bg-tool-alarm-warn/25',
                          isSel && 'bg-tool-select',
                        )}
                      >
                        <td className={cn(cell, 'px-0 text-center text-[10px] text-fg-muted')}>
                          {r.pending ? '✎' : isSel ? '▸' : ''}
                        </td>
                        <td className={cn(cell, 'tabular-nums')}>
                          {isEditing ? (
                            states.length ? (
                              <select
                                autoFocus
                                aria-label={`New value at ${formatSmtTime(r.t)}`}
                                className={cn(field, 'w-full')}
                                value={editing.value}
                                onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                                onBlur={commitEdit}
                              >
                                {states.map((s) => (
                                  <option key={s}>{s}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                autoFocus
                                aria-label={`New value at ${formatSmtTime(r.t)}`}
                                className={cn(field, 'w-full')}
                                value={editing.value}
                                onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') commitEdit();
                                  if (e.key === 'Escape') setEditing(null);
                                }}
                                onBlur={commitEdit}
                              />
                            )
                          ) : (
                            <span className={cn(r.synthetic && 'italic text-fg-muted')}>
                              {formatSmtValue(point, r.v, states)}
                            </span>
                          )}
                        </td>
                        <td className={cn(cell, 'tabular-nums')}>{formatSmtTime(r.t)}</td>
                        <td className={cn(cell, 'text-center')}>
                          <input
                            type="checkbox"
                            checked={false}
                            readOnly
                            tabIndex={-1}
                            aria-label="Questionable"
                          />
                        </td>
                        <td className={cn(cell, 'text-center')}>
                          <input
                            type="checkbox"
                            checked={!!r.note}
                            readOnly
                            tabIndex={-1}
                            aria-label="Annotated"
                            title={r.note || undefined}
                          />
                        </td>
                        <td className={cn(cell, 'text-center')}>
                          <input
                            type="checkbox"
                            checked={false}
                            readOnly
                            tabIndex={-1}
                            aria-label="Substituted"
                          />
                        </td>
                        {stringAnnotations ? <td className={cell}>{r.note}</td> : null}
                      </tr>
                    );
                  })
                : null}
              {point ? (
                <tr>
                  <td className={cn(cell, 'px-0 text-center text-fg-muted')}>*</td>
                  <td className={cn(cell, 'p-0')}>
                    {states.length ? (
                      <select
                        aria-label="New value"
                        className={cn(field, 'w-full border-0')}
                        value={draft.value}
                        onChange={(e) => setDraft({ ...draft, value: e.target.value })}
                      >
                        <option value="">Choose…</option>
                        {states.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        aria-label="New value"
                        inputMode="decimal"
                        className={cn(field, 'w-full border-0')}
                        value={draft.value}
                        onChange={(e) => setDraft({ ...draft, value: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && addNewValue()}
                      />
                    )}
                  </td>
                  <td className={cn(cell, 'p-0')}>
                    <input
                      aria-label="New event time"
                      className={cn(field, 'w-full border-0 bg-primary text-primary-fg')}
                      value={draft.time}
                      onChange={(e) => setDraft({ ...draft, time: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && addNewValue()}
                    />
                  </td>
                  <td className={cell} colSpan={stringAnnotations ? 4 : 3}>
                    <button
                      type="button"
                      className="h-5 border border-tool-grid px-2 hover:bg-tool-select"
                      onClick={addNewValue}
                    >
                      Add row
                    </button>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <details className="mt-2 text-xs text-fg-muted">
        <summary className="cursor-pointer text-fg">What you are looking at</summary>
        <div className="mt-1 max-w-3xl space-y-1">
          <p>
            The grid is one read of recorded values. It does not update by itself: press Refresh.
            The last row can be the point&apos;s snapshot, which is returned with the archived
            events but is not in an archive file yet. If the next value passes compression, the
            snapshot is archived; if not, it is discarded, so it can disappear on the next Refresh
            without anything being deleted.
          </p>
          <p>
            Changes are pending (✎) until you press Save. Edits to events older than the snapshot
            are out-of-order writes: they bypass compression and go straight to the archive.
            Annotations are stored per event. Everything here stays in this sandbox.
          </p>
        </div>
      </details>
    </div>
  );
}
