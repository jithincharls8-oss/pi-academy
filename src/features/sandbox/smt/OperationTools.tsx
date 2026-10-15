import { useMemo, useState, type Dispatch } from 'react';
import { Archive, RefreshCw, Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TimeRangeBar, resolveRange, type TimeRange } from '../shared/TimeRangeBar';
import { formatStamp } from './points';
import {
  archiveLifetimeMs,
  filterMessages,
  recommendedArchiveSizeMB,
  SERVER_PROFILE,
  SEVERITIES,
  TUNING_PARAMETERS,
  type ArchiveModel,
  type LogEntry,
  type ServerStats,
  type Severity,
} from './server';
import type { SmtAction } from './store';
import { Grid, Note, Td, Th, ToolHeader, fieldClass, smallButton } from './ui';
import { cn } from '@/lib/cn';

function duration(ms: number): string {
  const h = ms / 3_600_000;
  if (h >= 48) return `${(h / 24).toFixed(1)} days`;
  if (h >= 1) return `${h.toFixed(1)} hours`;
  return `${Math.round(ms / 60_000)} minutes`;
}

function omit(rec: Readonly<Record<string, string>>, key: string): Record<string, string> {
  return Object.fromEntries(Object.entries(rec).filter(([k]) => k !== key));
}

const n = (v: number): string => Math.round(v).toLocaleString('en-US');

/* ------------------------------------------------------------ Archives */

export function ArchivesView({
  model,
  projectedFill,
  now,
  nextSizeMB,
  dispatch,
}: {
  model: ArchiveModel;
  projectedFill: number;
  now: number;
  nextSizeMB: number;
  dispatch: Dispatch<SmtAction>;
}) {
  const [confirm, setConfirm] = useState(false);
  const sizing = recommendedArchiveSizeMB(SERVER_PROFILE.ramMB, SERVER_PROFILE.licensedPoints);
  const primary = model.archives[0];
  return (
    <div>
      <ToolHeader
        title="Archives"
        actions={
          confirm ? (
            <span className="flex items-center gap-1 text-xs">
              Start a new {nextSizeMB} MB primary archive now?
              <button
                type="button"
                className={cn(smallButton, 'border-primary text-primary')}
                onClick={() => {
                  dispatch({ type: 'forceShift', now, sizeMB: nextSizeMB });
                  setConfirm(false);
                }}
              >
                Shift
              </button>
              <button type="button" className={smallButton} onClick={() => setConfirm(false)}>
                Cancel
              </button>
            </span>
          ) : (
            <button type="button" className={smallButton} onClick={() => setConfirm(true)}>
              <Archive aria-hidden /> Force archive shift
            </button>
          )
        }
      >
        Registered archive files. The primary archive receives current data and has no end time. A
        new primary is initialised (an archive shift) when it is about 98% full.
      </ToolHeader>
      <Tabs defaultValue="historic">
        <TabsList aria-label="Archive sets">
          <TabsTrigger value="historic" className="text-xs">
            Historic
          </TabsTrigger>
          <TabsTrigger value="future" className="text-xs">
            Future
          </TabsTrigger>
        </TabsList>
        <TabsContent value="historic" className="mt-3 space-y-3">
          <Grid caption="Historic archives" className="max-h-[24rem]">
            <thead>
              <tr>
                <Th>#</Th>
                <Th>File</Th>
                <Th>Start</Th>
                <Th>End</Th>
                <Th className="text-right">Size (MB)</Th>
                <Th className="text-right">% used</Th>
                <Th>Type</Th>
                <Th>State</Th>
              </tr>
            </thead>
            <tbody>
              {model.archives.map((a) => (
                <tr key={a.start} className={cn(a.state === 'Primary' && 'bg-tool-select')}>
                  <Td mono>{a.index}</Td>
                  <Td mono>{a.path}</Td>
                  <Td mono>{formatStamp(a.start)}</Td>
                  <Td mono>{a.end === null ? 'Current Time' : formatStamp(a.end)}</Td>
                  <Td mono className="text-right">
                    {a.sizeMB}
                  </Td>
                  <Td mono className="text-right">
                    {a.usedPct.toFixed(1)}
                  </Td>
                  <Td>{a.type}</Td>
                  <Td>
                    {a.state}
                    {a.forced
                      ? a.state === 'Primary'
                        ? ' (created by a forced shift)'
                        : ' (ended by a forced shift)'
                      : ''}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Grid>
          {model.hiddenOlder ? (
            <p className="text-[11px] text-fg-muted">
              {model.hiddenOlder} older archives are registered but not listed in the sandbox.
            </p>
          ) : null}
        </TabsContent>
        <TabsContent value="future" className="mt-3">
          <Note>
            No future archives. PISRV01 has no points with Future set. Future archives are created
            on demand, one per calendar month, start at 1 MB and grow as they fill. Historic and
            future data never share an archive.
          </Note>
        </TabsContent>
      </Tabs>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <section
          className="rounded border border-tool-grid bg-surface p-3 text-xs"
          aria-label="Archive sizing"
        >
          <h3 className="mb-1 font-semibold">How the file size was chosen</h3>
          <p className="text-fg-muted">
            Sandbox server: {n(SERVER_PROFILE.ramMB)} MB RAM, {n(SERVER_PROFILE.licensedPoints)}{' '}
            licensed points.
          </p>
          <ol className="mt-1 list-decimal space-y-0.5 pl-5">
            <li>RAM ÷ 3 = {n(sizing.byRam)} MB</li>
            <li>3 × licensed points ÷ 1024 = {n(sizing.byPoints)} MB</li>
            <li>
              Take the smaller, round down to a power of 2, keep within 256 to 10,240 MB:{' '}
              {sizing.chosen} MB
            </li>
          </ol>
          <p className="mt-1 text-fg-muted">
            The 2024 sizing table agrees: up to 87,381 licensed points → 256 MB.
          </p>
        </section>
        <section
          className="rounded border border-tool-grid bg-surface p-3 text-xs"
          aria-label="Archive fill rate"
        >
          <h3 className="mb-1 font-semibold">How fast the primary fills</h3>
          <p>
            Fill rate {(model.fillBytesPerSec / 1024).toFixed(1)} KB/s: the Riverbend points&apos;
            average archived events per point × {n(SERVER_PROFILE.pointsInUse)} points in use ×{' '}
            {SERVER_PROFILE.bytesPerEvent} bytes per event (research estimate: 5 to 20 bytes).
          </p>
          <p className="mt-1">
            A {primary?.sizeMB ?? 256} MB archive lasts about {duration(model.fileDurationMs)}. Next
            shift expected about {formatStamp(model.nextShift)}.
          </p>
          <p className="mt-1">
            With your current point settings the next {nextSizeMB} MB file would last about{' '}
            {duration(archiveLifetimeMs(nextSizeMB, projectedFill))}. Tighter exception and
            compression settings make archives last longer.
          </p>
        </section>
      </div>
      <Note className="mt-3">
        File names follow Archive_AutoArchiveFileRoot plus the start time; the exact naming format
        is simplified. Keep archives and the event queue on separate volumes, and keep auto-creation
        on (or two empty archives ready) so a shift never overwrites the oldest archive.
      </Note>
    </div>
  );
}

/* ------------------------------------------------------------ Message Logs */

const PIGETMSG_SEVERITY: Record<Severity, string> = {
  Debug: '',
  Informational: '-si',
  Warning: '-sw',
  Error: '-se',
  Critical: '-sc',
};

function csv(entries: readonly LogEntry[]): string {
  const q = (s: string): string => `"${s.replace(/"/g, '""')}"`;
  return [
    'MessageSeverity,MessageTime,ProcessName,Source1,MessageID,Message',
    ...entries.map((e) =>
      [e.severity, formatStamp(e.t), e.program, e.source, e.messageId, e.message].map(q).join(','),
    ),
  ].join('\n');
}

export function MessageLogs({ entries, now }: { entries: readonly LogEntry[]; now: number }) {
  const [range, setRange] = useState<TimeRange>({ start: '*-2h', end: '*' });
  const [minSeverity, setMinSeverity] = useState<Severity>('Informational');
  const [text, setText] = useState('');
  const [program, setProgram] = useState('');
  const resolved = resolveRange(range, now);
  const win = typeof resolved === 'string' ? { start: now - 7_200_000, end: now } : resolved;
  const programs = useMemo(() => [...new Set(entries.map((e) => e.program))].sort(), [entries]);
  const rows = filterMessages(entries, {
    start: win.start,
    end: win.end,
    minSeverity,
    text: text ? `*${text}*` : '',
    program,
  });
  const cmd = [
    'pigetmsg',
    `-st ${range.start}`,
    `-et ${range.end}`,
    PIGETMSG_SEVERITY[minSeverity],
    program ? `-pr ${program}` : '',
    text ? `-msg "*${text}*"` : '',
  ]
    .filter(Boolean)
    .join(' ');
  const exportHref = `data:text/csv;charset=utf-8,${encodeURIComponent(csv(rows))}`;
  return (
    <div>
      <ToolHeader
        title="Message Logs"
        actions={
          <a className={smallButton} href={exportHref} download="pisrv01-messages.csv">
            <Download aria-hidden /> Export CSV
          </a>
        }
      >
        The PI Message Log as SMT shows it. Your sandbox actions (point edits, tuning changes,
        archive edits and shifts) appear here alongside generated server messages.
      </ToolHeader>
      <div className="mb-2 flex flex-wrap items-end gap-3">
        <TimeRangeBar value={range} onChange={setRange} now={now} compact />
        <div>
          <label htmlFor="ml-sev" className="block text-[11px] font-medium">
            Minimum severity
          </label>
          <select
            id="ml-sev"
            className={cn(fieldClass, 'w-36')}
            value={minSeverity}
            onChange={(e) => setMinSeverity(e.target.value as Severity)}
          >
            {SEVERITIES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="ml-prog" className="block text-[11px] font-medium">
            Program
          </label>
          <select
            id="ml-prog"
            className={cn(fieldClass, 'w-32')}
            value={program}
            onChange={(e) => setProgram(e.target.value)}
          >
            <option value="">All</option>
            {programs.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="ml-text" className="block text-[11px] font-medium">
            Message contains (* and ? wildcards)
          </label>
          <input
            id="ml-text"
            className={cn(fieldClass, 'w-56')}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
      </div>
      <p className="mb-2 text-xs">
        Command-line equivalent: <code className="rounded bg-surface-2 px-1 font-mono">{cmd}</code>
      </p>
      <Grid caption="Messages" className="max-h-[26rem]">
        <thead>
          <tr>
            <Th>Severity</Th>
            <Th>Time</Th>
            <Th>Program</Th>
            <Th>Source</Th>
            <Th>ID</Th>
            <Th>Message</Th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 300).map((e) => (
            <tr key={e.id}>
              <Td
                className={cn(
                  e.severity === 'Warning' && 'text-tool-alarm-warn',
                  (e.severity === 'Error' || e.severity === 'Critical') && 'text-tool-alarm-hi',
                  e.severity === 'Debug' && 'text-fg-muted',
                )}
              >
                {e.severity}
              </Td>
              <Td mono className="whitespace-nowrap">
                {formatStamp(e.t)}
              </Td>
              <Td mono>{e.program}</Td>
              <Td>{e.source}</Td>
              <Td mono>{e.messageId}</Td>
              <Td>{e.message}</Td>
            </tr>
          ))}
          {!rows.length ? (
            <tr>
              <td colSpan={6} className="px-2 py-3 text-fg-muted">
                No messages match the filters.
              </td>
            </tr>
          ) : null}
        </tbody>
      </Grid>
      <p className="mt-1 text-[11px] text-fg-muted">
        {rows.length} messages{rows.length > 300 ? ' (showing the newest 300)' : ''}.
      </p>
      <Note className="mt-2">
        Message wording is a simplified paraphrase. Message IDs are shown only where research
        confirms them: 6079 point creation, [-11091] ArcMaxCollect reached, [-11140] query time
        limit. Logs are kept for MessageLog_DayLimit days (default 35).
      </Note>
    </div>
  );
}

/* ------------------------------------------------------------ Snapshot and Archive Statistics */

export function StatisticsView({ stats }: { stats: ServerStats }) {
  const [which, setWhich] = useState<'snapshot' | 'archive'>('snapshot');
  const rowsFor =
    which === 'snapshot'
      ? [
          ['Point Count', n(stats.pointCount)],
          ['Snapshot Events', n(stats.snapshotEvents)],
          ['Snapshots/sec', stats.snapshotsPerSec.toFixed(2)],
          ['Out of Order Snapshot Events', n(stats.outOfOrderSnapshots)],
          ['Events Sent to Queue', n(stats.eventsSentToQueue)],
          ['Events in Queue', n(stats.eventsInQueue)],
          ['Events in Overflow Queues', n(stats.overflowQueueEvents)],
        ]
      : [
          ['Archived Events', n(stats.archivedEvents)],
          ['Archived Events/sec', stats.archivedPerSec.toFixed(2)],
          ['Out of Order Events', n(stats.archiveOutOfOrder)],
          ['Total Unflushed Events', n(stats.unflushedEvents)],
          ['Seconds since last write-cache flush', n(stats.secondsSinceFlush)],
          ['Cache Flush Operations/sec', stats.cacheFlushesPerSec.toFixed(4)],
          ['Events Read/sec', n(stats.eventsReadPerSec)],
          ['Archiving Flag', '3 (historic and future)'],
        ];
  return (
    <div>
      <ToolHeader title="Snapshot and Archive Statistics">
        Counters since the subsystems started at {formatStamp(stats.startedAt)}, derived from the
        scan rates and exception and compression settings of the sandbox points. Refreshes every 5
        seconds.
      </ToolHeader>
      <fieldset className="mb-3 flex gap-4 text-xs">
        <legend className="sr-only">Statistics to show</legend>
        {(['snapshot', 'archive'] as const).map((w) => (
          <label key={w} className="flex items-center gap-1">
            <input
              type="radio"
              name="stats-kind"
              value={w}
              checked={which === w}
              onChange={() => setWhich(w)}
            />
            {w === 'snapshot' ? 'Snapshot statistics' : 'Archive statistics'}
          </label>
        ))}
      </fieldset>
      <div className="grid gap-4 xl:grid-cols-[22rem_1fr]">
        <Grid caption={which === 'snapshot' ? 'Snapshot statistics' : 'Archive statistics'}>
          <thead>
            <tr>
              <Th>Statistic</Th>
              <Th className="text-right">Value</Th>
            </tr>
          </thead>
          <tbody>
            {rowsFor.map(([k, v]) => (
              <tr key={k}>
                <Td>{k}</Td>
                <Td mono className="text-right">
                  {v}
                </Td>
              </tr>
            ))}
          </tbody>
        </Grid>
        <div>
          <Grid caption="Events per hour by point" className="max-h-[26rem]">
            <thead>
              <tr>
                <Th>Tag</Th>
                <Th className="text-right">Scans/h</Th>
                <Th className="text-right">Snapshot/h</Th>
                <Th className="text-right">Archived/h</Th>
                <Th className="text-right">Kept</Th>
              </tr>
            </thead>
            <tbody>
              {stats.rates.map((r) => (
                <tr key={r.tag}>
                  <Td mono>{r.tag}</Td>
                  <Td mono className="text-right">
                    {n(r.scansPerHour)}
                  </Td>
                  <Td mono className="text-right">
                    {n(r.snapshotPerHour)}
                  </Td>
                  <Td mono className="text-right">
                    {n(r.archivedPerHour)}
                  </Td>
                  <Td mono className="text-right">
                    {r.scansPerHour
                      ? `${((100 * r.archivedPerHour) / r.scansPerHour).toFixed(1)}%`
                      : '-'}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Grid>
          <p className="mt-1 text-[11px] text-fg-muted">
            Measured over the last full hour of simulated scans.
          </p>
        </div>
      </div>
      <Note className="mt-3">
        A growing Events in Queue means the archive subsystem is not keeping up (or no archive
        covers the time); the data is not lost while queued. Unflushed events build up between
        write-cache flushes set by Archive_SecondsBetweenFlush.
      </Note>
    </div>
  );
}

/* ------------------------------------------------------------ Tuning Parameters */

export function TuningView({
  configured,
  restartPending,
  now,
  dispatch,
}: {
  configured: Readonly<Record<string, string>>;
  restartPending: readonly string[];
  now: number;
  dispatch: Dispatch<SmtAction>;
}) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const groups = [...new Set(TUNING_PARAMETERS.map((p) => p.group))];
  const save = (name: string): void => {
    const def = TUNING_PARAMETERS.find((p) => p.name === name);
    const value = (drafts[name] ?? '').trim();
    if (!def) return;
    if (def.numeric && (!/^\d+$/.test(value) || Number(value) < 0)) {
      setErrors((e) => ({ ...e, [name]: 'Enter a whole number of 0 or more.' }));
      return;
    }
    if (name === 'Archive_AutoArchiveFileSize' && (Number(value) < 256 || Number(value) > 10_240)) {
      setErrors((e) => ({
        ...e,
        [name]: 'Sizing guidance keeps archives between 256 and 10,240 MB.',
      }));
      return;
    }
    setErrors((e) => ({ ...e, [name]: '' }));
    dispatch({ type: 'setTuning', name, value, now });
    setDrafts((d) => omit(d, name));
  };
  return (
    <div>
      <ToolHeader title="Tuning Parameters">
        Data Archive settings that control subsystem behaviour. Change them only with a reason and a
        record.
      </ToolHeader>
      {restartPending.length ? (
        <div
          role="status"
          className="mb-3 space-y-2 rounded border border-warning/50 bg-warning-soft p-3 text-xs"
        >
          <p className="font-medium">
            Restart required. The new values take effect after the owning subsystem restarts:
          </p>
          <div className="flex flex-wrap gap-2">
            {restartPending.map((s) => (
              <button
                key={s}
                type="button"
                className={smallButton}
                onClick={() => dispatch({ type: 'restartDone', subsystem: s, now })}
              >
                <RefreshCw aria-hidden /> Restart {s} (simulated)
              </button>
            ))}
          </div>
          <p className="text-fg-muted">
            Which parameters need a restart is simplified here: the sandbox asks for a restart after
            every change.
          </p>
        </div>
      ) : null}
      <Tabs defaultValue="Archive">
        <TabsList aria-label="Parameter groups">
          {groups.map((g) => (
            <TabsTrigger key={g} value={g} className="text-xs">
              {g}
            </TabsTrigger>
          ))}
        </TabsList>
        {groups.map((g) => (
          <TabsContent key={g} value={g} className="mt-3">
            <Grid caption={`${g} tuning parameters`}>
              <thead>
                <tr>
                  <Th>Parameter</Th>
                  <Th>Value</Th>
                  <Th>Default (research)</Th>
                  <Th>Description</Th>
                </tr>
              </thead>
              <tbody>
                {TUNING_PARAMETERS.filter((p) => p.group === g).map((p) => {
                  const current = configured[p.name] ?? p.value;
                  const draft = drafts[p.name];
                  const id = `tp-${p.name}`;
                  return (
                    <tr key={p.name}>
                      <Td mono>
                        <label htmlFor={id}>{p.name}</label>
                      </Td>
                      <Td className="min-w-48">
                        <div className="flex gap-1">
                          <input
                            id={id}
                            className={cn(fieldClass, 'font-mono')}
                            value={draft ?? current}
                            aria-invalid={Boolean(errors[p.name])}
                            aria-describedby={errors[p.name] ? `${id}-err` : undefined}
                            onChange={(e) => setDrafts((d) => ({ ...d, [p.name]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') save(p.name);
                              if (e.key === 'Escape') setDrafts((d) => omit(d, p.name));
                            }}
                          />
                          {draft !== undefined && draft !== current ? (
                            <button
                              type="button"
                              className={smallButton}
                              onClick={() => save(p.name)}
                            >
                              Save
                            </button>
                          ) : null}
                        </div>
                        {errors[p.name] ? (
                          <p id={`${id}-err`} className="text-[11px] text-danger">
                            {errors[p.name]}
                          </p>
                        ) : null}
                      </Td>
                      <Td>
                        {p.researchDefault ?? (
                          <span className="text-fg-muted">not in research</span>
                        )}
                      </Td>
                      <Td>
                        {p.description} <span className="text-fg-muted">({p.subsystem})</span>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Grid>
          </TabsContent>
        ))}
      </Tabs>
      <Note className="mt-3">
        Values marked &quot;not in research&quot; are sandbox values. 2023 guidance: raise
        piarchss_ThreadCount only when clients can use the threads, and prefer paging large queries
        to raising ArcMaxCollect.
      </Note>
    </div>
  );
}
