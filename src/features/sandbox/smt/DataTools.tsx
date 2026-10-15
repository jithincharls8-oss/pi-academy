import { useMemo, useState, type Dispatch } from 'react';
import { Pause, Play, Pencil, Trash2, Plus, Undo2 } from 'lucide-react';
import { formatValue, snapshot } from '@/core/sim/data';
import { DIGITAL_SETS } from '@/core/sim/plant';
import { parsePiTime, TimeParseError } from '@/core/sim/time';
import { TimeRangeBar, resolveRange, type TimeRange } from '../shared/TimeRangeBar';
import { digitalStates, formatStamp, wildcardMatch, type SandboxPoint } from './points';
import { archivedValues, withEdits, type ArchiveEdit, type SmtAction } from './store';
import { Grid, Note, Td, Th, ToolHeader, fieldClass, smallButton } from './ui';
import { cn } from '@/lib/cn';

function matchesQuery(p: SandboxPoint, q: string): boolean {
  const s = q.trim();
  if (!s) return true;
  if (/[*?]/.test(s)) return wildcardMatch(s, p.tag);
  return (
    p.tag.toLowerCase().includes(s.toLowerCase()) ||
    p.descriptor.toLowerCase().includes(s.toLowerCase())
  );
}

function display(p: SandboxPoint, v: number): string {
  return formatValue(p, v);
}

/* ------------------------------------------------------------ Current Values */

export function CurrentValues({
  points,
  now,
  paused,
  setPaused,
}: {
  points: readonly SandboxPoint[];
  now: number;
  paused: boolean;
  setPaused: (p: boolean) => void;
}) {
  const [query, setQuery] = useState('RB.*');
  const rows = points.filter((p) => matchesQuery(p, query));
  return (
    <div>
      <ToolHeader
        title="Current Values"
        actions={
          <button
            type="button"
            className={smallButton}
            onClick={() => setPaused(!paused)}
            aria-pressed={!paused}
          >
            {paused ? <Play aria-hidden /> : <Pause aria-hidden />}{' '}
            {paused ? 'Resume auto refresh' : 'Pause auto refresh'}
          </button>
        }
      >
        Snapshot values: the latest event for each point, before compression decides whether it is
        archived. Refreshes every 5 seconds.
      </ToolHeader>
      <div className="mb-2 flex items-center gap-2">
        <label htmlFor="cv-search" className="text-xs font-medium">
          Tag mask
        </label>
        <input
          id="cv-search"
          className={cn(fieldClass, 'max-w-xs font-mono')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="RB.P101*"
        />
        <span className="text-xs text-fg-muted" aria-live="polite">
          {rows.length} points · {paused ? 'paused' : 'live'} · {formatStamp(now)}
        </span>
      </div>
      <Grid caption="Current values" className="max-h-[34rem]">
        <thead>
          <tr>
            <Th>Tag</Th>
            <Th className="text-right">Value</Th>
            <Th>Units</Th>
            <Th>Timestamp</Th>
            <Th>Descriptor</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const snap = snapshot(p, now);
            return (
              <tr key={p.tag} className="hover:bg-surface-2">
                <Td mono>{p.tag}</Td>
                <Td mono className="text-right">
                  {p.scanflag ? (
                    display(p, snap.v)
                  ) : (
                    <span className="text-fg-muted italic">Scan off</span>
                  )}
                </Td>
                <Td>{p.engunits}</Td>
                <Td mono>{formatStamp(snap.t)}</Td>
                <Td className="text-fg-muted">{p.descriptor}</Td>
              </tr>
            );
          })}
        </tbody>
      </Grid>
    </div>
  );
}

/* ------------------------------------------------------------ Digital States */

export function DigitalStates() {
  const [selected, setSelected] = useState(DIGITAL_SETS[0]?.name ?? '');
  const set = DIGITAL_SETS.find((d) => d.name === selected);
  return (
    <div>
      <ToolHeader title="Digital States">
        Digital state sets map a digital point&apos;s stored integers to state names. The PI Base
        Subsystem keeps the Digital State Table.
      </ToolHeader>
      <div className="grid gap-4 md:grid-cols-[14rem_1fr]">
        <div>
          <h3 className="mb-1 text-xs font-medium text-fg-muted">State sets</h3>
          <ul className="space-y-1 text-sm" aria-label="Digital state sets">
            {[...DIGITAL_SETS.map((d) => d.name), 'SYSTEM'].map((n) => (
              <li key={n}>
                <button
                  type="button"
                  aria-current={n === selected ? 'true' : undefined}
                  onClick={() => setSelected(n)}
                  className={cn(
                    'w-full rounded px-2 py-1 text-left',
                    n === selected ? 'bg-tool-select' : 'hover:bg-surface-2',
                  )}
                >
                  {n}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-3">
          {set ? (
            <Grid caption={`States in ${set.name}`}>
              <thead>
                <tr>
                  <Th>Code</Th>
                  <Th>State</Th>
                </tr>
              </thead>
              <tbody>
                {set.states.map((s, i) => (
                  <tr key={s}>
                    <Td mono>{i}</Td>
                    <Td>{s}</Td>
                  </tr>
                ))}
              </tbody>
            </Grid>
          ) : (
            <>
              <Grid caption="Some SYSTEM states">
                <thead>
                  <tr>
                    <Th>State</Th>
                    <Th>Meaning</Th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <Td>Shutdown</Td>
                    <Td>Written when the server shuts down, for points with Shutdown on.</Td>
                  </tr>
                  <tr>
                    <Td>Intf Shut</Td>
                    <Td>The interface was shut down.</Td>
                  </tr>
                  <tr>
                    <Td>I/O Timeout</Td>
                    <Td>The interface lost communication with the source.</Td>
                  </tr>
                </tbody>
              </Grid>
              <Note>
                SYSTEM is the global set every point can use. Only three of its states are confirmed
                in the research notes, so the sandbox lists those and no codes.
              </Note>
            </>
          )}
          <Note tone="warn">
            Only append new states to a set. Never renumber an existing state: archive records store
            the set ID, so history would be read with the wrong names until archives are
            reprocessed.
          </Note>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ Archive Editor */

const MAX_ROWS = 400;

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
  const [tag, setTag] = useState('RB.P101.FLOW');
  const [range, setRange] = useState<TimeRange>({ start: '*-1h', end: '*' });
  const [editing, setEditing] = useState<{ t: number; value: string; note: string } | null>(null);
  const [adding, setAdding] = useState<{
    time: string;
    value: string;
    note: string;
    error: string;
  } | null>(null);
  const point = points.find((p) => p.tag.toUpperCase() === tag.trim().toUpperCase());
  const resolved = resolveRange(range, now);
  const win = typeof resolved === 'string' ? null : resolved;
  const wStart = win?.start ?? 0;
  const wEnd = win?.end ?? 0;
  const editKey = point ? point.tag.toUpperCase() : '';
  const myEdits = useMemo(() => edits[editKey] ?? [], [edits, editKey]);

  const rows = useMemo(() => {
    if (!point || wEnd <= wStart) return [];
    return withEdits(archivedValues(point, wStart, Math.min(wEnd, now)), myEdits, wStart, wEnd);
  }, [point, wStart, wEnd, now, myEdits]);

  const states = point?.pointtype === 'Digital' ? digitalStates(point.digitalset) : [];

  const parseValue = (raw: string): number | null => {
    if (states.length) {
      const i = states.findIndex((s) => s.toLowerCase() === raw.trim().toLowerCase());
      return i >= 0 ? i : null;
    }
    const n = Number(raw);
    return raw.trim() !== '' && Number.isFinite(n) ? n : null;
  };

  const valueInput = (id: string, value: string, onChange: (v: string) => void, label: string) =>
    states.length ? (
      <select
        id={id}
        aria-label={label}
        className={cn(fieldClass, 'w-32')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {states.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    ) : (
      <input
        id={id}
        aria-label={label}
        inputMode="decimal"
        className={cn(fieldClass, 'w-28 font-mono')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );

  const submitAdd = (): void => {
    if (!adding || !point) return;
    let t: number;
    try {
      t = parsePiTime(adding.time, now);
    } catch (e) {
      setAdding({ ...adding, error: e instanceof TimeParseError ? e.message : 'Invalid time' });
      return;
    }
    if (t > now + 600_000 && !point.future) {
      setAdding({
        ...adding,
        error: 'Only future points accept values more than 10 minutes ahead.',
      });
      return;
    }
    const v = parseValue(adding.value);
    if (v === null) {
      setAdding({ ...adding, error: states.length ? 'Choose a state.' : 'Enter a number.' });
      return;
    }
    dispatch({
      type: 'archiveEdit',
      tag: point.tag,
      edit: { op: 'add', t: Math.round(t / 1000) * 1000, v, note: adding.note.trim() },
      now,
    });
    setAdding(null);
  };

  return (
    <div>
      <ToolHeader title="Archive Editor">
        View the archived (compressed) events of one point and try edits. Sandbox only: edits live
        in this page&apos;s memory and the underlying simulated data never changes.
      </ToolHeader>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="ae-tag" className="text-xs font-medium">
            Tag
          </label>
          <input
            id="ae-tag"
            list="ae-tags"
            className={cn(fieldClass, 'w-56 font-mono')}
            value={tag}
            onChange={(e) => {
              setTag(e.target.value);
              setEditing(null);
            }}
            aria-invalid={!point}
          />
          <datalist id="ae-tags">
            {points.map((p) => (
              <option key={p.tag} value={p.tag} />
            ))}
          </datalist>
        </div>
        <TimeRangeBar value={range} onChange={setRange} now={now} compact />
      </div>
      {!point ? (
        <p role="alert" className="text-sm text-danger">
          No point named {tag}.
        </p>
      ) : (
        <>
          <Note className="mb-3">
            <p>
              Edits to events older than the snapshot are out-of-order writes: they bypass
              compression and go straight to the archive. Heavy out-of-order writing and many
              annotations slow the archive, so real edits should be rare and noted.
            </p>
            <p>Annotations are stored per event in the archive&apos;s matching .ann file.</p>
          </Note>
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
            <span>
              {rows.length} events
              {rows.length > MAX_ROWS ? ` (showing the latest ${MAX_ROWS})` : ''} · {myEdits.length}{' '}
              sandbox edit{myEdits.length === 1 ? '' : 's'} on this point
            </span>
            <button
              type="button"
              className={cn(smallButton, 'ml-auto')}
              onClick={() =>
                setAdding({
                  time: formatStamp(Math.floor(now / 60_000) * 60_000 - 600_000),
                  value: states[0] ?? '',
                  note: '',
                  error: '',
                })
              }
            >
              <Plus aria-hidden /> Add value
            </button>
          </div>
          {adding ? (
            <form
              className="mb-3 flex flex-wrap items-end gap-2 rounded border border-tool-grid bg-surface p-2"
              onSubmit={(e) => {
                e.preventDefault();
                submitAdd();
              }}
              aria-label="Add archived value"
            >
              <div>
                <label htmlFor="ae-add-time" className="block text-[11px] font-medium">
                  Timestamp (PI time)
                </label>
                <input
                  id="ae-add-time"
                  className={cn(fieldClass, 'w-44 font-mono')}
                  value={adding.time}
                  onChange={(e) => setAdding({ ...adding, time: e.target.value, error: '' })}
                />
              </div>
              <div>
                <label htmlFor="ae-add-value" className="block text-[11px] font-medium">
                  Value
                </label>
                {valueInput(
                  'ae-add-value',
                  adding.value,
                  (v) => setAdding({ ...adding, value: v, error: '' }),
                  'Value',
                )}
              </div>
              <div className="min-w-48 flex-1">
                <label htmlFor="ae-add-note" className="block text-[11px] font-medium">
                  Annotation
                </label>
                <input
                  id="ae-add-note"
                  className={fieldClass}
                  value={adding.note}
                  onChange={(e) => setAdding({ ...adding, note: e.target.value })}
                  placeholder="Why the value was added"
                />
              </div>
              <button type="submit" className={smallButton}>
                Add
              </button>
              <button type="button" className={smallButton} onClick={() => setAdding(null)}>
                Cancel
              </button>
              {adding.error ? (
                <p role="alert" className="w-full text-xs text-danger">
                  {adding.error}
                </p>
              ) : null}
            </form>
          ) : null}
          <Grid caption={`Archived values for ${point.tag}`} className="max-h-[28rem]">
            <thead>
              <tr>
                <Th>Timestamp</Th>
                <Th className="text-right">Value</Th>
                <Th>Status</Th>
                <Th>Annotation</Th>
                <Th>
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {rows
                .slice(-MAX_ROWS)
                .reverse()
                .map((r) => {
                  const isEditing = editing?.t === r.t;
                  return (
                    <tr key={r.t} className={cn(r.status !== 'original' && 'bg-accent-soft')}>
                      <Td mono>{formatStamp(r.t)}</Td>
                      <Td mono className="text-right">
                        {isEditing
                          ? valueInput(
                              `ae-edit-${r.t}`,
                              editing.value,
                              (v) => setEditing({ ...editing, value: v }),
                              `New value at ${formatStamp(r.t)}`,
                            )
                          : display(point, r.v)}
                      </Td>
                      <Td>
                        {r.status === 'original'
                          ? 'Archived'
                          : r.status === 'added'
                            ? 'Added (sandbox)'
                            : 'Replaced (sandbox)'}
                      </Td>
                      <Td>
                        {isEditing ? (
                          <input
                            aria-label={`Annotation at ${formatStamp(r.t)}`}
                            className={fieldClass}
                            value={editing.note}
                            onChange={(e) => setEditing({ ...editing, note: e.target.value })}
                          />
                        ) : (
                          r.note
                        )}
                      </Td>
                      <Td className="whitespace-nowrap">
                        {isEditing ? (
                          <span className="flex gap-1">
                            <button
                              type="button"
                              className={smallButton}
                              onClick={() => {
                                const v = parseValue(editing.value);
                                if (v === null) return;
                                dispatch({
                                  type: 'archiveEdit',
                                  tag: point.tag,
                                  edit: { op: 'replace', t: r.t, v, note: editing.note.trim() },
                                  now,
                                });
                                setEditing(null);
                              }}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              className={smallButton}
                              onClick={() => setEditing(null)}
                            >
                              Cancel
                            </button>
                          </span>
                        ) : (
                          <span className="flex gap-1">
                            <button
                              type="button"
                              className={smallButton}
                              aria-label={`Edit value at ${formatStamp(r.t)}`}
                              onClick={() =>
                                setEditing({
                                  t: r.t,
                                  value: states.length
                                    ? (states[Math.round(r.v)] ?? '')
                                    : String(r.v),
                                  note: r.note,
                                })
                              }
                            >
                              <Pencil aria-hidden />
                            </button>
                            <button
                              type="button"
                              className={smallButton}
                              aria-label={`Delete value at ${formatStamp(r.t)}`}
                              onClick={() =>
                                dispatch({
                                  type: 'archiveEdit',
                                  tag: point.tag,
                                  edit: { op: 'delete', t: r.t, v: 0, note: '' },
                                  now,
                                })
                              }
                            >
                              <Trash2 aria-hidden />
                            </button>
                          </span>
                        )}
                      </Td>
                    </tr>
                  );
                })}
              {!rows.length ? (
                <tr>
                  <td colSpan={5} className="px-2 py-3 text-fg-muted">
                    {point.archiving
                      ? 'No archived events in this range.'
                      : 'Archiving is off for this point, so nothing is stored.'}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </Grid>
          {myEdits.length ? (
            <section className="mt-3" aria-label="Sandbox edits">
              <h3 className="mb-1 text-xs font-semibold">Sandbox edits on {point.tag}</h3>
              <ul className="space-y-1 text-xs">
                {[...myEdits].reverse().map((e) => (
                  <li key={e.id} className="flex items-center gap-2">
                    <span className="font-mono">{formatStamp(e.t)}</span>
                    <span>
                      {e.op === 'delete'
                        ? 'deleted'
                        : `${e.op === 'add' ? 'added' : 'replaced with'} ${display(point, e.v)}`}
                      {e.note ? ` (${e.note})` : ''}
                    </span>
                    <button
                      type="button"
                      className={smallButton}
                      onClick={() =>
                        dispatch({ type: 'undoArchiveEdit', tag: point.tag, id: e.id })
                      }
                      aria-label={`Undo edit at ${formatStamp(e.t)}`}
                    >
                      <Undo2 aria-hidden /> Undo
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
