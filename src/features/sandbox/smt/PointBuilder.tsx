import { useMemo, useState, type Dispatch } from 'react';
import { Plus, RotateCcw, Search, Trash2, Check } from 'lucide-react';
import { applyCompression, applyException } from '@/core/sim/compression';
import { scans } from '@/core/sim/data';
import { DIGITAL_SETS } from '@/core/sim/plant';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { TrendChart } from '../shared/TrendChart';
import {
  getAttribute,
  LOCATION3_MEANING,
  newPoint,
  POINT_TYPES,
  SANDBOX_DEFAULTS_NOTE,
  SANDBOX_USER,
  setAttribute,
  formatStamp,
  wildcardMatch,
  withProfile,
  type SandboxPoint,
} from './points';
import { adviseSettings, validatePoint, type FieldIssue } from './validation';
import type { SmtAction } from './store';
import { Grid, Note, Td, Th, ToolHeader, fieldClass, smallButton } from './ui';
import { cn } from '@/lib/cn';

type FieldKind = 'text' | 'number' | 'bool' | 'pointtype' | 'digitalset' | 'ptclass' | 'textarea';

interface FieldDef {
  attr: string;
  label: string;
  kind: FieldKind;
  hint?: string;
}

const GENERAL: FieldDef[] = [
  { attr: 'tag', label: 'Name (tag)', kind: 'text' },
  {
    attr: 'descriptor',
    label: 'Descriptor',
    kind: 'text',
    hint: 'Free text, often used to search for points.',
  },
  {
    attr: 'exdesc',
    label: 'Extended descriptor (ExDesc)',
    kind: 'text',
    hint: 'Some interfaces read configuration from it.',
  },
  {
    attr: 'pointsource',
    label: 'Point source',
    kind: 'text',
    hint: 'Usually identifies the interface that collects the point.',
  },
  { attr: 'pointtype', label: 'Point type', kind: 'pointtype' },
  {
    attr: 'ptclassname',
    label: 'Point class',
    kind: 'ptclass',
    hint: 'Classic adds Location1-5, InstrumentTag and other interface attributes.',
  },
  {
    attr: 'digitalset',
    label: 'Digital set',
    kind: 'digitalset',
    hint: 'Used only by digital points.',
  },
  { attr: 'engunits', label: 'Engineering units', kind: 'text' },
  { attr: 'zero', label: 'Zero', kind: 'number', hint: 'Lowest value of the range.' },
  { attr: 'span', label: 'Span', kind: 'number', hint: 'Zero + Span is the highest value.' },
  {
    attr: 'typicalvalue',
    label: 'Typical value',
    kind: 'number',
    hint: 'Between Zero and Zero + Span.',
  },
  { attr: 'displaydigits', label: 'Display digits', kind: 'number' },
  {
    attr: 'step',
    label: 'Step',
    kind: 'bool',
    hint: 'On: hold values until the next event. Off: interpolate linearly.',
  },
  {
    attr: 'future',
    label: 'Future data',
    kind: 'bool',
    hint: 'Set when the point is created (believed fixed afterwards).',
  },
];

const ARCHIVE: FieldDef[] = [
  {
    attr: 'scan',
    label: 'Scan',
    kind: 'bool',
    hint: 'Interface scanning on or off. Training: should always be on.',
  },
  { attr: 'archiving', label: 'Archiving', kind: 'bool' },
  {
    attr: 'shutdown',
    label: 'Shutdown',
    kind: 'bool',
    hint: 'Write a Shutdown event when the server shuts down.',
  },
  {
    attr: 'excdev',
    label: 'ExcDev (eng. units)',
    kind: 'number',
    hint: 'Default ExcDevPercent is 0.1% of span.',
  },
  { attr: 'excmin', label: 'ExcMin (s)', kind: 'number', hint: 'Default 0. Only blocks values.' },
  { attr: 'excmax', label: 'ExcMax (s)', kind: 'number', hint: 'Default 600 s.' },
  {
    attr: 'compressing',
    label: 'Compressing',
    kind: 'bool',
    hint: 'Off archives every snapshot event.',
  },
  {
    attr: 'compdev',
    label: 'CompDev (eng. units)',
    kind: 'number',
    hint: 'Default CompDevPercent is 0.2% of span.',
  },
  { attr: 'compmin', label: 'CompMin (s)', kind: 'number', hint: 'Default 0.' },
  { attr: 'compmax', label: 'CompMax (s)', kind: 'number', hint: 'Default 28800 s (8 hours).' },
];

const CLASSIC: FieldDef[] = [
  {
    attr: 'instrumenttag',
    label: 'Instrument tag',
    kind: 'text',
    hint: 'Source address, e.g. the OPC ItemID. Must match exactly; often case-sensitive.',
  },
  { attr: 'location1', label: 'Location1', kind: 'number', hint: 'Interface instance ID.' },
  { attr: 'location2', label: 'Location2', kind: 'number' },
  {
    attr: 'location3',
    label: 'Location3',
    kind: 'number',
    hint: 'OPC DA: 0 polled/event, 1 advise, 2 output.',
  },
  { attr: 'location4', label: 'Location4', kind: 'number', hint: 'Scan class number.' },
  { attr: 'location5', label: 'Location5', kind: 'number' },
  {
    attr: 'sourcetag',
    label: 'Source tag',
    kind: 'text',
    hint: 'Point whose data feeds this one, e.g. for outputs.',
  },
  { attr: 'userint1', label: 'UserInt1', kind: 'number' },
  { attr: 'userint2', label: 'UserInt2', kind: 'number' },
  { attr: 'userreal1', label: 'UserReal1', kind: 'number' },
  { attr: 'userreal2', label: 'UserReal2', kind: 'number' },
  { attr: 'squareroot', label: 'SquareRoot', kind: 'number' },
  { attr: 'totalcode', label: 'TotalCode', kind: 'number' },
  { attr: 'convers', label: 'Convers', kind: 'number' },
  { attr: 'filtercode', label: 'FilterCode', kind: 'number' },
  { attr: 'srcptid', label: 'SrcPtID', kind: 'number' },
];

const SECURITY: FieldDef[] = [
  {
    attr: 'ptsecurity',
    label: 'PtSecurity',
    kind: 'textarea',
    hint: 'Who can view and edit the point configuration.',
  },
  {
    attr: 'datasecurity',
    label: 'DataSecurity',
    kind: 'textarea',
    hint: 'Who can read and write the point values.',
  },
];

const ALL_FIELDS = [...GENERAL, ...ARCHIVE, ...CLASSIC, ...SECURITY];

type Form = Record<string, string>;

function toForm(p: SandboxPoint): Form {
  return Object.fromEntries(ALL_FIELDS.map((f) => [f.attr, getAttribute(p, f.attr)]));
}

/** Build the edited point from the form: type errors first, then the zod rules. */
function buildPoint(
  base: SandboxPoint,
  form: Form,
  others: readonly SandboxPoint[],
): { point: SandboxPoint | null; issues: FieldIssue[] } {
  const issues: FieldIssue[] = [];
  let p = base;
  for (const f of ALL_FIELDS) {
    const raw = form[f.attr] ?? '';
    if (raw === getAttribute(base, f.attr)) continue;
    const r = setAttribute(p, f.attr, raw);
    if (r.ok) p = r.point;
    else issues.push({ field: f.attr, message: r.error });
  }
  if (p.pointtype !== 'Digital') p = { ...p, digitalset: '' };
  p = withProfile(p);
  const v = validatePoint(p, others);
  if (!v.ok) issues.push(...v.issues.filter((i) => !issues.some((x) => x.field === i.field)));
  return { point: issues.length ? null : p, issues };
}

function preview(p: SandboxPoint, now: number) {
  const end = Math.floor(now / 1000) * 1000;
  const start = end - 3_600_000;
  const raw = p.scanflag ? scans(p, start, end) : [];
  const sent = applyException(raw, { excDev: p.excdev, excMin: p.excmin, excMax: p.excmax });
  const archived = p.archiving
    ? applyCompression(sent, {
        compressing: p.compressing,
        compDev: p.compdev,
        compMin: p.compmin,
        compMax: p.compmax,
      }).archived
    : [];
  return { start, end, raw, sent, archived };
}

function FieldInput({
  def,
  value,
  onChange,
  issue,
  disabled,
  extraHint,
}: {
  def: FieldDef;
  value: string;
  onChange: (v: string) => void;
  issue?: string;
  disabled?: boolean;
  extraHint?: string;
}) {
  const id = `pb-${def.attr}`;
  const hintId = `${id}-hint`;
  const errId = `${id}-err`;
  const described =
    [def.hint || extraHint ? hintId : null, issue ? errId : null].filter(Boolean).join(' ') ||
    undefined;
  const common = { id, 'aria-invalid': Boolean(issue), 'aria-describedby': described, disabled };
  let control;
  if (def.kind === 'bool') {
    control = (
      <input
        type="checkbox"
        {...common}
        className="size-4 accent-primary"
        checked={value === '1'}
        onChange={(e) => onChange(e.target.checked ? '1' : '0')}
      />
    );
  } else if (def.kind === 'pointtype' || def.kind === 'digitalset' || def.kind === 'ptclass') {
    const options =
      def.kind === 'pointtype'
        ? POINT_TYPES.map((t) => [t, t])
        : def.kind === 'ptclass'
          ? [
              ['classic', 'classic'],
              ['base', 'base'],
            ]
          : [['', '(none)'], ...DIGITAL_SETS.map((d) => [d.name, d.name])];
    control = (
      <select
        {...common}
        className={fieldClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    );
  } else if (def.kind === 'textarea') {
    control = (
      <textarea
        {...common}
        rows={2}
        className={cn(fieldClass, 'h-auto py-1 font-mono')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  } else {
    control = (
      <input
        {...common}
        inputMode={def.kind === 'number' ? 'decimal' : undefined}
        className={cn(fieldClass, def.kind === 'number' && 'font-mono')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  return (
    <div
      className={cn(
        def.kind === 'bool' ? 'flex items-start gap-2' : 'space-y-1',
        def.kind === 'textarea' && 'sm:col-span-2',
      )}
    >
      {def.kind === 'bool' ? (
        <>
          <div className="pt-0.5">{control}</div>
          <div>
            <label htmlFor={id} className="text-xs font-medium">
              {def.label}
            </label>
            {def.hint || extraHint ? (
              <p id={hintId} className="text-[11px] text-fg-muted">
                {[def.hint, extraHint].filter(Boolean).join(' ')}
              </p>
            ) : null}
          </div>
        </>
      ) : (
        <>
          <label htmlFor={id} className="block text-xs font-medium">
            {def.label}
          </label>
          {control}
          {def.hint || extraHint ? (
            <p id={hintId} className="text-[11px] text-fg-muted">
              {[def.hint, extraHint].filter(Boolean).join(' ')}
            </p>
          ) : null}
        </>
      )}
      {issue ? (
        <p id={errId} className="text-[11px] text-danger">
          {issue}
        </p>
      ) : null}
    </div>
  );
}

function PointEditor({
  original,
  base,
  points,
  now,
  dispatch,
  onSaved,
}: {
  original: string | null;
  base: SandboxPoint;
  points: readonly SandboxPoint[];
  now: number;
  dispatch: Dispatch<SmtAction>;
  onSaved: (tag: string) => void;
}) {
  const [form, setForm] = useState<Form>(() => toForm(base));
  const [tab, setTab] = useState('general');
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const others = useMemo(
    () =>
      original === null
        ? points
        : points.filter((p) => p.tag.toUpperCase() !== original.toUpperCase()),
    [points, original],
  );
  const { point, issues } = useMemo(() => buildPoint(base, form, others), [base, form, others]);
  const dirty = ALL_FIELDS.some((f) => form[f.attr] !== getAttribute(base, f.attr));
  const issueFor = (attr: string): string | undefined =>
    issues.find((i) => i.field === attr)?.message;
  const tabOf = (attr: string): string =>
    GENERAL.some((f) => f.attr === attr)
      ? 'General'
      : ARCHIVE.some((f) => f.attr === attr)
        ? 'Archive'
        : CLASSIC.some((f) => f.attr === attr)
          ? 'Classic'
          : 'Security';

  // Preview uses the edited settings when they are valid, else the saved ones.
  const shown = point ?? base;
  const pv = useMemo(() => preview(shown, now), [shown, now]);
  const advice = adviseSettings(shown);
  const set = (attr: string) => (v: string) => {
    setSavedAt(null);
    setForm((f) => ({ ...f, [attr]: v }));
  };

  const apply = (): void => {
    if (!point) return;
    const saved: SandboxPoint = { ...point, changer: SANDBOX_USER, changedate: formatStamp(now) };
    dispatch({ type: 'savePoint', original, point: saved, now });
    setSavedAt(now);
    onSaved(saved.tag);
  };

  const pct = (dev: string): string => {
    const span = Number(form['span']);
    const d = Number(dev);
    return Number.isFinite(span) && span > 0 && Number.isFinite(d)
      ? `= ${((d * 100) / span).toFixed(3)}% of span.`
      : '';
  };

  const renderFields = (defs: FieldDef[]) => (
    <div className="grid gap-3 sm:grid-cols-2">
      {defs.map((d) => (
        <FieldInput
          key={d.attr}
          def={d}
          value={form[d.attr] ?? ''}
          onChange={set(d.attr)}
          issue={issueFor(d.attr)}
          disabled={
            (d.attr === 'future' && original !== null) ||
            (d.attr === 'digitalset' && form['pointtype'] !== 'Digital')
          }
          extraHint={
            d.attr === 'compdev' || d.attr === 'excdev'
              ? pct(form[d.attr] ?? '')
              : d.attr === 'location3'
                ? LOCATION3_MEANING[Number(form['location3'])]
                  ? `Now: ${LOCATION3_MEANING[Number(form['location3'])]}.`
                  : undefined
                : undefined
          }
        />
      ))}
    </div>
  );

  const digital = shown.pointtype === 'Digital';
  const series = [
    {
      key: 'raw',
      label: `Scans (${pv.raw.length})`,
      points: pv.raw,
      step: digital,
      color: 'var(--fg-subtle)',
    },
    {
      key: 'sent',
      label: `Sent after exception (${pv.sent.length})`,
      points: pv.sent,
      step: digital,
      dots: true,
      dashed: true,
      color: 'var(--chart-2)',
    },
    {
      key: 'arch',
      label: `Archived (${pv.archived.length})`,
      points: pv.archived,
      step: digital,
      dots: true,
      color: 'var(--chart-1)',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="mr-auto font-mono text-sm font-semibold">{original ?? 'New point'}</h3>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setForm(toForm(base))}
          disabled={!dirty}
        >
          <RotateCcw /> Revert
        </Button>
        <Button size="sm" onClick={apply} disabled={!point || (!dirty && original !== null)}>
          <Check /> {original === null ? 'Create' : 'Apply'}
        </Button>
      </div>
      <div aria-live="polite" className="text-xs">
        {savedAt !== null && !dirty ? (
          <span className="text-tool-ok">
            Saved to the sandbox at {formatStamp(savedAt)}. The change is in the message log.
          </span>
        ) : issues.length ? (
          <span className="text-danger">
            {issues.length} problem{issues.length > 1 ? 's' : ''} to fix before applying:{' '}
            {[...new Set(issues.map((i) => tabOf(i.field)))].join(', ')} tab.
          </span>
        ) : dirty ? (
          <span className="text-fg-muted">Unsaved changes.</span>
        ) : null}
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList aria-label="Point attribute groups">
          {[
            ['general', 'General'],
            ['archive', 'Archive'],
            ['classic', 'Classic'],
            ['security', 'Security'],
          ].map(([v, l]) => (
            <TabsTrigger key={v} value={v as string} className="text-xs">
              {l}
              {issues.some((i) => tabOf(i.field) === l) ? (
                <span className="ml-1 text-danger">
                  <span aria-hidden>●</span>
                  <span className="sr-only">(has errors)</span>
                </span>
              ) : null}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="general" className="mt-3">
          {renderFields(GENERAL)}
        </TabsContent>
        <TabsContent value="archive" className="mt-3 space-y-3">
          {renderFields(ARCHIVE)}
        </TabsContent>
        <TabsContent value="classic" className="mt-3 space-y-3">
          <Note>
            Classic-class attributes used by PI interfaces. The simulated scan period of this point
            is {shown.scan} s. Connectors ignore Point source and Location attributes.
          </Note>
          {renderFields(CLASSIC)}
        </TabsContent>
        <TabsContent value="security" className="mt-3 space-y-3">
          <Note>
            Access strings list identities with A(r,w), A(r), A(w) or A() for no access. Grant the
            least access each role needs: operators read, the PI Buffer identity writes data, only
            administrators and engineers edit configuration.
          </Note>
          {renderFields(SECURITY)}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-3">
            {(['pointid', 'creationdate', 'creator', 'changedate', 'changer'] as const).map((a) => (
              <div key={a}>
                <dt className="text-fg-muted">{a}</dt>
                <dd className="font-mono">{getAttribute(base, a)}</dd>
              </div>
            ))}
          </dl>
        </TabsContent>
      </Tabs>

      <section
        aria-label="Exception and compression preview"
        className="rounded border border-tool-grid bg-surface p-3"
      >
        <div className="mb-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs">
          <h4 className="font-semibold">
            Preview: last hour with {point ? 'these' : 'the saved'} settings
          </h4>
          <span>
            {pv.raw.length} scans → {pv.sent.length} sent (
            {pv.raw.length
              ? Math.round((100 * (pv.raw.length - pv.sent.length)) / pv.raw.length)
              : 0}
            % filtered by exception) → {pv.archived.length} archived
            {pv.archived.length
              ? ` (compression ratio ${(pv.sent.length / pv.archived.length).toFixed(1)}:1)`
              : ''}
          </span>
        </div>
        <TrendChart
          series={series}
          start={pv.start}
          end={pv.end}
          height={200}
          ariaLabel={`Preview of scans, exception and archived values for ${shown.tag}`}
        />
        <div className="mt-1 flex flex-wrap gap-4 text-[11px] text-fg-muted" aria-hidden>
          {series.map((s) => (
            <span key={s.key} className="flex items-center gap-1">
              <span className="inline-block h-0.5 w-4" style={{ background: s.color }} /> {s.label}
            </span>
          ))}
        </div>
        {advice.length ? (
          <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-fg-muted">
            {advice.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}

export function PointBuilder({
  points,
  now,
  dispatch,
}: {
  points: readonly SandboxPoint[];
  now: number;
  dispatch: Dispatch<SmtAction>;
}) {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selected, setSelected] = useState<string | null>(points[0]?.tag ?? null);
  const [creating, setCreating] = useState<SandboxPoint | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const filtered = points.filter((p) => {
    if (typeFilter && p.pointtype !== typeFilter) return false;
    const q = query.trim();
    if (!q) return true;
    if (/[*?]/.test(q)) return wildcardMatch(q, p.tag) || wildcardMatch(q, p.descriptor);
    const l = q.toLowerCase();
    return p.tag.toLowerCase().includes(l) || p.descriptor.toLowerCase().includes(l);
  });
  const current = creating ?? points.find((p) => p.tag === selected) ?? null;

  const startNew = (): void => {
    const id = points.reduce((m, p) => Math.max(m, p.pointid), 0) + 1;
    setCreating(newPoint('RB.NEW.POINT', id, now));
    setConfirmDelete(false);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ToolHeader
        title="Point Builder"
        actions={
          <>
            <button type="button" className={smallButton} onClick={startNew}>
              <Plus aria-hidden /> New point
            </button>
            {current && !creating ? (
              confirmDelete ? (
                <span className="flex items-center gap-1 text-xs">
                  Delete {current.tag}?
                  <button
                    type="button"
                    className={cn(smallButton, 'border-danger text-danger')}
                    onClick={() => {
                      dispatch({ type: 'deletePoint', tag: current.tag, now });
                      setSelected(points.find((p) => p.tag !== current.tag)?.tag ?? null);
                      setConfirmDelete(false);
                    }}
                  >
                    Yes, delete
                  </button>
                  <button
                    type="button"
                    className={smallButton}
                    onClick={() => setConfirmDelete(false)}
                  >
                    Cancel
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  className={smallButton}
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 aria-hidden /> Delete
                </button>
              )
            ) : null}
          </>
        }
      >
        Create and edit PI points. Changes stay in this sandbox. {SANDBOX_DEFAULTS_NOTE}
      </ToolHeader>
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(16rem,22rem)_1fr]">
        <div className="flex min-h-0 flex-col gap-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <label htmlFor="pb-search" className="sr-only">
                Search points by tag or descriptor
              </label>
              <Search
                className="pointer-events-none absolute top-2 left-2 size-4 text-fg-muted"
                aria-hidden
              />
              <input
                id="pb-search"
                className={cn(fieldClass, 'pl-7')}
                placeholder="Tag or descriptor, e.g. RB.P10*"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <label htmlFor="pb-type" className="sr-only">
              Filter by point type
            </label>
            <select
              id="pb-type"
              className={cn(fieldClass, 'w-28')}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All types</option>
              {POINT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <Grid caption="PI points" className="max-h-[32rem] min-h-0 flex-1">
            <thead>
              <tr>
                <Th>Tag</Th>
                <Th>Type</Th>
                <Th>Descriptor</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const isSel = !creating && p.tag === selected;
                return (
                  <tr
                    key={p.tag}
                    className={cn(
                      'cursor-pointer',
                      isSel ? 'bg-tool-select' : 'hover:bg-surface-2',
                    )}
                    onClick={() => {
                      setSelected(p.tag);
                      setCreating(null);
                      setConfirmDelete(false);
                    }}
                  >
                    <Td mono>
                      <button
                        type="button"
                        className="text-left focus-visible:outline-2 focus-visible:outline-ring"
                        aria-current={isSel ? 'true' : undefined}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(p.tag);
                          setCreating(null);
                          setConfirmDelete(false);
                        }}
                      >
                        {p.tag}
                      </button>
                    </Td>
                    <Td>{p.pointtype}</Td>
                    <Td className="text-fg-muted">{p.descriptor}</Td>
                  </tr>
                );
              })}
              {!filtered.length ? (
                <tr>
                  <Td className="text-fg-muted">No points match.</Td>
                  <Td />
                  <Td />
                </tr>
              ) : null}
            </tbody>
          </Grid>
          <p className="text-[11px] text-fg-muted">
            {filtered.length} of {points.length} points
          </p>
        </div>
        <div className="min-w-0">
          {current ? (
            <PointEditor
              key={creating ? `new-${creating.pointid}` : current.tag}
              original={creating ? null : current.tag}
              base={current}
              points={points}
              now={now}
              dispatch={dispatch}
              onSaved={(tag) => {
                setCreating(null);
                setSelected(tag);
              }}
            />
          ) : (
            <p className="text-sm text-fg-muted">Select a point, or create a new one.</p>
          )}
        </div>
      </div>
    </div>
  );
}
