import { useState } from 'react';
import { Calculator, Play, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Label, Select, Textarea } from '@/components/ui/input';
import { Switch } from '@/components/ui/misc';
import type { SimElement } from '@/core/sim/plant';
import { formatPiTime } from '@/core/sim/time';
import { TimeRangeBar, resolveRange, type TimeRange } from '../shared/TimeRangeBar';
import { TrendChart, type TrendSeries } from '../shared/TrendChart';
import {
  analysisInputs,
  blankAnalysis,
  evaluateAnalysis,
  newId,
  previewAnalysis,
  scheduleLabel,
  type AnalysisDef,
  type AnalysisRow,
  type PreviewResult,
  type RowResult,
  type Schedule,
} from './analyses';
import type { AfScope } from './afContext';
import { ANALYSIS_CATEGORIES, valueText } from './catalog';
import type { ExplorerModel } from './model';
import { ErrorAt, Note, Panel, selectableRow, Td, Th } from './ui';

export function AnalysesTab({ base, model }: { base: SimElement; model: ExplorerModel }) {
  const list = model.analysesOf(base);
  const [selectedId, setSelectedId] = useState<string | null>(list[0]?.id ?? null);
  const selected = list.find((a) => a.id === selectedId) ?? list[0] ?? null;
  const el = model.working(base);
  const scope = model.scopeOf(el);

  const save = (next: AnalysisDef): void =>
    model.setAnalyses(
      base,
      list.map((a) => (a.id === next.id ? next : a)),
    );
  const add = (): void => {
    const a = blankAnalysis(list.length + 1);
    model.setAnalyses(base, [...list, a]);
    setSelectedId(a.id);
  };
  const remove = (id: string): void => {
    const next = list.filter((a) => a.id !== id);
    model.setAnalyses(base, next);
    setSelectedId(next[0]?.id ?? null);
  };

  return (
    <div className="flex flex-col gap-3 xl:flex-row">
      <div className="flex shrink-0 flex-col gap-2 xl:w-64">
        <div className="overflow-hidden rounded border border-border bg-surface">
          <table role="grid" aria-label={`Analyses of ${el.name}`} className="w-full text-sm">
            <thead>
              <tr>
                <Th>Analysis</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {list.map((a) => (
                <tr key={a.id} {...selectableRow(selected?.id === a.id, () => setSelectedId(a.id))}>
                  <Td>
                    <div className="font-medium">{a.name}</div>
                    <div className="text-xs text-fg-muted">{scheduleLabel(a.schedule)}</div>
                  </Td>
                  <Td>
                    <Badge tone={a.enabled ? 'success' : 'neutral'}>
                      {a.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
          {!list.length ? (
            <p className="p-3 text-sm text-fg-muted">No analyses on this element yet.</p>
          ) : null}
        </div>
        <Button variant="secondary" size="sm" onClick={add}>
          <Plus /> New analysis
        </Button>
        <Note>
          The examples come with the element. Evaluate and preview freely; edits check the element
          out, and Check In is when a real Analysis Service would start running them.
        </Note>
      </div>
      <div className="min-w-0 flex-1">
        {selected ? (
          <AnalysisEditor
            key={`${base.id}:${selected.id}`}
            def={selected}
            element={el}
            scope={scope}
            now={model.now}
            onChange={save}
            onDelete={() => remove(selected.id)}
          />
        ) : (
          <Note>Select or create an analysis.</Note>
        )}
      </div>
    </div>
  );
}

function outputOptions(el: SimElement, row: AnalysisRow): { value: string; label: string }[] {
  const existing = el.attributes
    .filter((a) => a.dataReference === 'PI Point' || a.dataReference === 'None')
    .map((a) => ({ value: a.name, label: a.name }));
  const opts = [{ value: '', label: 'Not mapped' }, ...existing];
  const extra = new Set<string>();
  if (row.output && !existing.some((o) => o.value === row.output)) extra.add(row.output);
  if (row.name.trim() && !existing.some((o) => o.value === row.name.trim()))
    extra.add(row.name.trim());
  for (const x of extra) opts.push({ value: x, label: `New attribute: ${x}` });
  return opts;
}

function AnalysisEditor({
  def,
  element,
  scope,
  now,
  onChange,
  onDelete,
}: {
  def: AnalysisDef;
  element: SimElement;
  scope: AfScope;
  now: number;
  onChange: (d: AnalysisDef) => void;
  onDelete: () => void;
}) {
  const [results, setResults] = useState<{ at: number; rows: RowResult[] } | null>(null);
  const setRow = (id: string, patch: Partial<AnalysisRow>): void =>
    onChange({ ...def, rows: def.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  const evaluate = (): void => setResults({ at: now, rows: evaluateAnalysis(def, scope, now) });
  const resultFor = (i: number): RowResult | undefined => results?.rows[i];
  const idBase = `an-${def.id}`;

  return (
    <div className="flex flex-col gap-3">
      <Panel
        title="Analysis"
        actions={
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 /> Delete
          </Button>
        }
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor={`${idBase}-name`} className="text-xs">
              Name
            </Label>
            <Input
              id={`${idBase}-name`}
              className="h-8"
              value={def.name}
              onChange={(e) => onChange({ ...def, name: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor={`${idBase}-desc`} className="text-xs">
              Description
            </Label>
            <Input
              id={`${idBase}-desc`}
              className="h-8"
              value={def.description}
              onChange={(e) => onChange({ ...def, description: e.target.value })}
            />
          </div>
          <fieldset className="flex flex-col gap-1">
            <legend className="mb-1 text-xs font-medium">Analysis type</legend>
            <div className="flex flex-wrap gap-3 text-sm">
              {['Expression', 'Rollup', 'Event Frame Generation', 'SQC'].map((t) => (
                <label key={t} className="flex items-center gap-1">
                  <input
                    type="radio"
                    name={`${idBase}-type`}
                    checked={t === 'Expression'}
                    disabled={t !== 'Expression'}
                    readOnly
                  />
                  <span className={t === 'Expression' ? '' : 'text-fg-subtle'}>{t}</span>
                </label>
              ))}
            </div>
            <Note>Only Expression analyses run in this simulator.</Note>
          </fieldset>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1">
              <Label htmlFor={`${idBase}-cat`} className="text-xs">
                Category
              </Label>
              <Select
                id={`${idBase}-cat`}
                className="h-8 w-44 text-xs"
                value={def.category}
                onChange={(e) => onChange({ ...def, category: e.target.value })}
              >
                {ANALYSIS_CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </div>
            <div className="flex items-center gap-2 pb-1">
              <Switch
                id={`${idBase}-enabled`}
                checked={def.enabled}
                onCheckedChange={(v) => onChange({ ...def, enabled: v })}
              />
              <Label htmlFor={`${idBase}-enabled`} className="text-xs">
                Enabled
              </Label>
            </div>
          </div>
        </div>
      </Panel>

      <Panel
        title="Expressions"
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                onChange({
                  ...def,
                  rows: [
                    ...def.rows,
                    {
                      id: newId('row'),
                      name: `Variable${def.rows.length + 1}`,
                      expression: '',
                      output: null,
                    },
                  ],
                })
              }
            >
              <Plus /> Add a new variable
            </Button>
            <Button size="sm" onClick={evaluate}>
              <Calculator /> Evaluate
            </Button>
          </>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Expression rows">
            <thead>
              <tr>
                <Th className="w-40">Name</Th>
                <Th>Expression</Th>
                <Th className="w-40">Value at evaluation</Th>
                <Th className="w-48">Output attribute</Th>
                <Th className="w-10">
                  <span className="sr-only">Remove</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {def.rows.map((r, i) => {
                const res = resultFor(i);
                return (
                  <tr key={r.id} className="border-b border-tool-grid">
                    <Td>
                      <Input
                        aria-label={`Variable name, row ${i + 1}`}
                        className="h-8 font-mono text-xs"
                        value={r.name}
                        spellCheck={false}
                        onChange={(e) => setRow(r.id, { name: e.target.value })}
                      />
                    </Td>
                    <Td>
                      <Textarea
                        aria-label={`Expression for ${r.name}`}
                        className="min-h-9 py-1.5 font-mono text-xs"
                        rows={Math.min(4, Math.max(1, Math.ceil(r.expression.length / 60)))}
                        value={r.expression}
                        spellCheck={false}
                        onChange={(e) => setRow(r.id, { expression: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                            e.preventDefault();
                            evaluate();
                          }
                        }}
                      />
                      {res && !res.ok ? (
                        <div role="alert" className="mt-1 flex flex-col gap-0.5">
                          <span className="text-xs text-tool-alarm-hi">
                            {res.error} (at character {res.position + 1})
                          </span>
                          <ErrorAt source={r.expression} position={res.position} />
                        </div>
                      ) : null}
                    </Td>
                    <Td className="font-mono text-xs">
                      {res ? (
                        res.ok ? (
                          <span
                            className={
                              res.value.type === 'nooutput' ? 'text-fg-muted' : 'text-tool-ok'
                            }
                          >
                            {valueText(res.value)}
                          </span>
                        ) : (
                          <span className="text-tool-alarm-hi">Error</span>
                        )
                      ) : (
                        <span className="text-fg-subtle">Not evaluated</span>
                      )}
                    </Td>
                    <Td>
                      <Select
                        aria-label={`Output attribute for ${r.name}`}
                        className="h-8 text-xs"
                        value={r.output ?? ''}
                        onChange={(e) => setRow(r.id, { output: e.target.value || null })}
                      >
                        {outputOptions(element, r).map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </Select>
                    </Td>
                    <Td>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove ${r.name}`}
                        onClick={() =>
                          onChange({ ...def, rows: def.rows.filter((x) => x.id !== r.id) })
                        }
                      >
                        <Trash2 />
                      </Button>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-2 flex flex-col gap-1">
          {results ? (
            <Note>
              Evaluated at {formatPiTime(results.at)} against {element.name}.
            </Note>
          ) : null}
          <Note>
            Quote attributes (&apos;Flow&apos;), use earlier variables without quotes, and reach a
            parent element with &apos;..|Attribute&apos;. Evaluate runs against values at evaluation
            (now); Ctrl+Enter in an expression also evaluates.
          </Note>
        </div>
      </Panel>

      <ScheduleEditor def={def} scope={scope} onChange={onChange} />
      <PreviewPanel def={def} scope={scope} now={now} />
    </div>
  );
}

function ScheduleEditor({
  def,
  scope,
  onChange,
}: {
  def: AnalysisDef;
  scope: AfScope;
  onChange: (d: AnalysisDef) => void;
}) {
  const s = def.schedule;
  const inputs = analysisInputs(def, scope);
  const set = (schedule: Schedule): void => onChange({ ...def, schedule });
  const unit =
    s.kind === 'periodic' ? (s.periodS % 3600 === 0 ? 3600 : s.periodS % 60 === 0 ? 60 : 1) : 60;
  const idBase = `sch-${def.id}`;
  return (
    <Panel title="Scheduling">
      <div className="flex flex-col gap-3">
        <fieldset className="flex flex-wrap gap-4 text-sm">
          <legend className="sr-only">Schedule type</legend>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name={`${idBase}-kind`}
              checked={s.kind === 'event'}
              onChange={() => set({ kind: 'event', triggers: 'any' })}
            />
            Event-Triggered
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name={`${idBase}-kind`}
              checked={s.kind === 'periodic'}
              onChange={() => set({ kind: 'periodic', periodS: 600, offsetS: 0 })}
            />
            Periodic
          </label>
        </fieldset>
        {s.kind === 'event' ? (
          <div className="flex flex-col gap-2">
            <fieldset className="flex flex-wrap gap-4 text-sm">
              <legend className="mb-1 text-xs font-medium">Trigger on</legend>
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name={`${idBase}-trig`}
                  checked={s.triggers === 'any'}
                  onChange={() => set({ kind: 'event', triggers: 'any' })}
                />
                Any Input
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name={`${idBase}-trig`}
                  checked={s.triggers !== 'any'}
                  onChange={() => set({ kind: 'event', triggers: inputs.slice(0, 1) })}
                />
                Specific inputs
              </label>
            </fieldset>
            {s.triggers !== 'any' ? (
              <fieldset className="flex flex-wrap gap-3 text-sm">
                <legend className="sr-only">Triggering inputs</legend>
                {inputs.length ? (
                  inputs.map((name) => {
                    const list = s.triggers === 'any' ? [] : s.triggers;
                    return (
                      <label key={name} className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={list.includes(name)}
                          onChange={(e) =>
                            set({
                              kind: 'event',
                              triggers: e.target.checked
                                ? [...list, name]
                                : list.filter((x) => x !== name),
                            })
                          }
                        />
                        {name}
                      </label>
                    );
                  })
                ) : (
                  <Note>The expressions reference no attributes yet.</Note>
                )}
              </fieldset>
            ) : null}
            <Note>
              Event-triggered analyses run when an input receives a new value; the trigger time is
              that event&apos;s timestamp. &quot;Any Input&quot; on many fast inputs can run an
              analysis several times a second.
            </Note>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <Label htmlFor={`${idBase}-freq`} className="text-xs">
                  Frequency
                </Label>
                <div className="flex gap-1">
                  <Input
                    id={`${idBase}-freq`}
                    type="number"
                    min={1}
                    className="h-8 w-24"
                    value={s.periodS / unit}
                    onChange={(e) => {
                      const v = Math.max(1, Math.round(Number(e.target.value) || 1));
                      set({ ...s, periodS: v * unit });
                    }}
                  />
                  <Select
                    aria-label="Frequency unit"
                    className="h-8 w-28 text-xs"
                    value={unit}
                    onChange={(e) =>
                      set({ ...s, periodS: (s.periodS / unit) * Number(e.target.value) })
                    }
                  >
                    <option value={1}>seconds</option>
                    <option value={60}>minutes</option>
                    <option value={3600}>hours</option>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor={`${idBase}-off`} className="text-xs">
                  Offset (seconds)
                </Label>
                <Input
                  id={`${idBase}-off`}
                  type="number"
                  min={0}
                  className="h-8 w-28"
                  value={s.offsetS}
                  onChange={(e) =>
                    set({ ...s, offsetS: Math.max(0, Math.round(Number(e.target.value) || 0)) })
                  }
                />
              </div>
            </div>
            <Note>
              Periodic scheduling is clock-based: evaluations line up with midnight plus the offset,
              every {scheduleLabel(s).replace('Periodic every ', '')}.
            </Note>
          </div>
        )}
        <Note>Output timestamp: Trigger Time (the default).</Note>
      </div>
    </Panel>
  );
}

function PreviewPanel({ def, scope, now }: { def: AnalysisDef; scope: AfScope; now: number }) {
  const [range, setRange] = useState<TimeRange>({ start: '*-8h', end: '*' });
  const [preview, setPreview] = useState<(PreviewResult & { start: number; end: number }) | null>(
    null,
  );
  const r = resolveRange(range, now);
  const generate = (): void => {
    if (typeof r === 'string') return;
    setPreview({ ...previewAnalysis(def, scope, r.start, r.end, now), ...r });
  };
  const series: TrendSeries[] = [];
  if (preview) {
    def.rows.forEach((row, i) => {
      const pts = preview.times.flatMap((t, k) => {
        const res = preview.results[k]?.[i];
        return res?.ok && res.value.type === 'number' ? [{ t, v: res.value.value }] : [];
      });
      if (pts.length)
        series.push({ key: `r${i}`, label: row.name, points: pts, dots: pts.length < 60 });
    });
  }
  const errors = preview
    ? preview.results.flatMap((rs) =>
        rs.filter((x): x is Extract<RowResult, { ok: false }> => !x.ok),
      )
    : [];
  return (
    <Panel
      title="Preview Results"
      actions={
        <Button size="sm" variant="secondary" onClick={generate} disabled={typeof r === 'string'}>
          <Play /> Generate Results
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        <TimeRangeBar value={range} onChange={setRange} now={now} compact />
        <Note>
          Preview runs the analysis at each trigger time in the range ({scheduleLabel(def.schedule)}
          ), at most 150 evaluations. It runs here in your browser on archived data, while the
          Analysis Service uses snapshot data, so results can differ slightly.
        </Note>
        {preview ? (
          preview.times.length ? (
            <>
              {series.length ? (
                <TrendChart series={series} start={preview.start} end={preview.end} height={220} />
              ) : null}
              {errors.length ? (
                <p role="alert" className="text-xs text-tool-alarm-hi">
                  {errors.length} evaluation error{errors.length === 1 ? '' : 's'}, first:{' '}
                  {errors[0]?.error}
                </p>
              ) : null}
              <div className="max-h-72 overflow-auto rounded border border-border">
                <table className="w-full text-xs" aria-label="Preview results">
                  <thead className="sticky top-0">
                    <tr>
                      <Th>Trigger time</Th>
                      {def.rows.map((row) => (
                        <Th key={row.id}>{row.name}</Th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.times.map((t, k) => (
                      <tr key={t} className="border-b border-tool-grid">
                        <Td className="font-mono whitespace-nowrap">{formatPiTime(t)}</Td>
                        {def.rows.map((row, i) => {
                          const res = preview.results[k]?.[i];
                          return (
                            <Td key={row.id} className="font-mono">
                              {res ? (
                                res.ok ? (
                                  valueText(res.value)
                                ) : (
                                  <span className="text-tool-alarm-hi" title={res.error}>
                                    Error
                                  </span>
                                )
                              ) : null}
                            </Td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <Note>No trigger times fell in that range.</Note>
          )
        ) : null}
      </div>
    </Panel>
  );
}
