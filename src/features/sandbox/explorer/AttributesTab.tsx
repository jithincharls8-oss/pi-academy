import { useState } from 'react';
import { CheckCircle2, LineChart, RotateCcw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Label, Select } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { TimedValue } from '@/core/sim/compression';
import { plotValues, snapshot, formatValue } from '@/core/sim/data';
import {
  DATA_SERVER,
  findPoint,
  plant,
  type SimAttribute,
  type SimElement,
} from '@/core/sim/plant';
import { TimeRangeBar, resolveRange, type TimeRange } from '../shared/TimeRangeBar';
import { TrendChart, type TrendSeries } from '../shared/TrendChart';
import { attributeValue, type AfScope } from './afContext';
import { valueText } from './catalog';
import { effectiveValue, field } from './checkout';
import { formatPiPointConfig, parseFormulaConfig, parsePiPointConfig } from './configString';
import type { ExplorerModel } from './model';
import { CheckedOutMark, Note, Panel, Prop, selectableRow, Td, Th } from './ui';

function liveText(scope: AfScope, a: SimAttribute, now: number): { text: string; error: boolean } {
  const r = attributeValue(scope, a.name, now);
  if (!r.ok) return { text: r.error, error: true };
  if (r.value.type === 'number' && a.dataReference === 'PI Point' && a.tag && findPoint(a.tag)) {
    return { text: formatValue(a.tag, r.value.value), error: false };
  }
  return { text: valueText(r.value), error: false };
}

export function AttributesTab({ base, model }: { base: SimElement; model: ExplorerModel }) {
  const el = model.working(base);
  const scope = model.scopeOf(el);
  const [selected, setSelected] = useState<string | null>(el.attributes[0]?.name ?? null);
  const [category, setCategory] = useState('');
  const [trendFor, setTrendFor] = useState<SimAttribute | null>(null);
  const categories = [...new Set(el.attributes.map((a) => a.category))];
  const rows = el.attributes.filter((a) => !category || a.category === category);
  const current = el.attributes.find((a) => a.name === selected) ?? null;

  if (!el.attributes.length) {
    return (
      <Note>
        {el.name} has no attributes. An element itself has no value; its attributes hold the data.
        Area elements here only group child elements.
      </Note>
    );
  }
  const edited = (a: SimAttribute): boolean =>
    Boolean(
      model.state.pending[base.id]?.[field.value(a.name)] !== undefined ||
      model.state.pending[base.id]?.[field.config(a.name)] !== undefined,
    );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="attr-cat" className="text-xs">
            Category
          </Label>
          <Select
            id="attr-cat"
            className="h-8 w-48 text-xs"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </div>
        <Note>Values refresh every few seconds. Select a row to see its data reference.</Note>
      </div>
      <div className="overflow-x-auto rounded border border-border bg-surface">
        <table role="grid" aria-label={`Attributes of ${el.name}`} className="w-full text-sm">
          <thead>
            <tr>
              <Th className="w-6">
                <span className="sr-only">Checked out</span>
              </Th>
              <Th>Name</Th>
              <Th>Value</Th>
              <Th>UOM</Th>
              <Th>Data Reference</Th>
              <Th>Config String</Th>
              <Th>Category</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => {
              const live = liveText(scope, a, model.now);
              return (
                <tr key={a.name} {...selectableRow(selected === a.name, () => setSelected(a.name))}>
                  <Td>{edited(a) ? <CheckedOutMark /> : null}</Td>
                  <Td className="font-medium whitespace-nowrap">{a.name}</Td>
                  <Td
                    className={
                      live.error
                        ? 'text-xs text-tool-alarm-hi'
                        : 'font-mono tabular-nums whitespace-nowrap'
                    }
                  >
                    {live.text}
                  </Td>
                  <Td className="text-fg-muted">{a.uom || '<None>'}</Td>
                  <Td className="whitespace-nowrap">
                    {a.dataReference === 'None' ? '<None>' : a.dataReference}
                  </Td>
                  <Td className="max-w-64 truncate font-mono text-xs text-fg-muted">
                    <span title={a.configString}>{a.configString}</span>
                  </Td>
                  <Td className="text-xs text-fg-muted">{a.category}</Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {current ? (
        <AttributeDetails
          key={`${base.id}:${current.name}`}
          base={base}
          attr={current}
          scope={scope}
          model={model}
          onTrend={() => setTrendFor(current)}
        />
      ) : null}
      <Dialog open={Boolean(trendFor)} onOpenChange={(o) => !o && setTrendFor(null)}>
        {trendFor ? (
          <DialogContent
            title={`Trend: ${el.name}|${trendFor.name}`}
            description={`${trendFor.dataReference === 'None' ? 'Static value' : trendFor.dataReference} · ${trendFor.uom || 'no UOM'}`}
            className="w-[min(56rem,calc(100vw-2rem))]"
          >
            <AttributeTrend scope={scope} attr={trendFor} now={model.now} />
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}

function AttributeDetails({
  base,
  attr,
  scope,
  model,
  onTrend,
}: {
  base: SimElement;
  attr: SimAttribute;
  scope: AfScope;
  model: ExplorerModel;
  onTrend: () => void;
}) {
  const baseAttr = base.attributes.find((a) => a.name === attr.name) ?? attr;
  const changedFromBase =
    baseAttr.configString !== attr.configString || baseAttr.value !== attr.value;
  return (
    <Panel
      title={`${attr.name} — attribute configuration`}
      actions={
        <Button variant="secondary" size="sm" onClick={onTrend}>
          <LineChart /> Trend
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <dl>
          <Prop label="Name">{attr.name}</Prop>
          <Prop label="Description">{attr.description}</Prop>
          <Prop label="Value Type">{attr.type}</Prop>
          <Prop label="Default UOM">{attr.uom || '<None>'}</Prop>
          <Prop label="Category">{attr.category}</Prop>
          <Prop label="Template">
            {base.template ? `${base.template} (attribute template)` : '<None>'}
          </Prop>
          <Prop label="Data Reference">
            {attr.dataReference === 'None' ? '<None> (static value)' : attr.dataReference}
          </Prop>
          {changedFromBase ? (
            <Prop label="Changed">
              <Badge tone="warning">Edited in this sandbox</Badge>
            </Prop>
          ) : null}
        </dl>
        <div>
          {attr.dataReference === 'PI Point' ? (
            <PiPointEditor key={attr.configString} base={base} attr={attr} model={model} />
          ) : attr.dataReference === 'Formula' ? (
            <FormulaView attr={attr} scope={scope} now={model.now} />
          ) : (
            <StaticValueEditor key={String(attr.value)} base={base} attr={attr} model={model} />
          )}
        </div>
      </div>
    </Panel>
  );
}

function PiPointEditor({
  base,
  attr,
  model,
}: {
  base: SimElement;
  attr: SimAttribute;
  model: ExplorerModel;
}) {
  const cfg = parsePiPointConfig(attr.configString, DATA_SERVER) ?? {
    server: DATA_SERVER,
    tag: '',
    options: [],
  };
  const [server, setServer] = useState(cfg.server);
  const [tag, setTag] = useState(cfg.tag);
  const point = findPoint(tag);
  const serverOk = server.toUpperCase() === DATA_SERVER;
  const uomMismatch = point && point.engunits !== attr.uom;
  const next = formatPiPointConfig({ server, tag: tag.trim(), options: cfg.options });
  const dirty = next !== attr.configString;
  const baseAttr = base.attributes.find((a) => a.name === attr.name);
  const listId = `tags-${base.id}-${attr.name.replace(/\W/g, '')}`;
  return (
    <form
      className="flex flex-col gap-2"
      aria-label="PI Point data reference settings"
      onSubmit={(e) => {
        e.preventDefault();
        if (!point || !serverOk || !dirty) return;
        model.dispatch({
          type: 'edit',
          object: base.id,
          field: field.config(attr.name),
          value: next,
        });
      }}
    >
      <h4 className="text-sm font-semibold">PI Point data reference settings</h4>
      <div className="grid grid-cols-[7rem_1fr] items-center gap-2">
        <Label htmlFor="pp-server" className="text-xs">
          Data server
        </Label>
        <Select
          id="pp-server"
          className="h-8 text-xs"
          value={server}
          onChange={(e) => setServer(e.target.value)}
        >
          <option value={DATA_SERVER}>{DATA_SERVER}</option>
          <option value="PISRV02">PISRV02 (not connected)</option>
        </Select>
        <Label htmlFor="pp-tag" className="text-xs">
          Tag name
        </Label>
        <Input
          id="pp-tag"
          className="h-8 font-mono text-xs"
          value={tag}
          list={listId}
          onChange={(e) => setTag(e.target.value)}
          aria-invalid={!point}
          aria-describedby="pp-tag-status"
          spellCheck={false}
        />
        <datalist id={listId}>
          {plant().points.map((p) => (
            <option key={p.tag} value={p.tag}>
              {p.descriptor}
            </option>
          ))}
        </datalist>
      </div>
      <div id="pp-tag-status" aria-live="polite" className="text-xs">
        {!serverOk ? (
          <span className="flex items-center gap-1 text-tool-alarm-hi">
            <XCircle className="size-3.5" aria-hidden /> Data server {server} is not available in
            this sandbox.
          </span>
        ) : point ? (
          <div className="flex flex-col gap-0.5">
            <span className="flex items-center gap-1 text-tool-ok">
              <CheckCircle2 className="size-3.5" aria-hidden /> Found {point.tag}:{' '}
              {point.descriptor}
            </span>
            <span className="text-fg-muted">
              Point type {point.pointtype}
              {point.digitalset ? ` (${point.digitalset})` : ''} · source units{' '}
              {point.engunits || 'none'} · snapshot{' '}
              {formatValue(point, snapshot(point, model.now).v)}
            </span>
            {uomMismatch ? (
              <span className="text-warning">
                Source units ({point.engunits || 'none'}) differ from the attribute&apos;s default
                UOM ({attr.uom || 'none'}). AF converts only between units of the same class.
              </span>
            ) : null}
          </div>
        ) : (
          <span className="flex items-center gap-1 text-tool-alarm-hi">
            <XCircle className="size-3.5" aria-hidden /> No PI point named &quot;{tag}&quot; on{' '}
            {server}. Pick one from the list.
          </span>
        )}
      </div>
      <div className="text-xs">
        <span className="text-fg-muted">Config string: </span>
        <code className="font-mono break-all">{next}</code>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={!point || !serverOk || !dirty}>
          Apply
        </Button>
        {baseAttr && baseAttr.configString !== attr.configString ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() =>
              model.dispatch({
                type: 'edit',
                object: base.id,
                field: field.config(attr.name),
                value: baseAttr.configString,
              })
            }
          >
            <RotateCcw /> Restore original tag
          </Button>
        ) : null}
      </div>
      <Note>Applying checks the element out. Check In to make the change visible to others.</Note>
    </form>
  );
}

function StaticValueEditor({
  base,
  attr,
  model,
}: {
  base: SimElement;
  attr: SimAttribute;
  model: ExplorerModel;
}) {
  const [draft, setDraft] = useState(attr.value === undefined ? '' : String(attr.value));
  const numeric = attr.type === 'Double' || attr.type === 'Int32';
  const n = Number(draft);
  const invalid =
    numeric &&
    (draft.trim() === '' || !Number.isFinite(n) || (attr.type === 'Int32' && !Number.isInteger(n)));
  const pendingValue = effectiveValue(model.state, base.id, field.value(attr.name));
  return (
    <form
      className="flex flex-col gap-2"
      aria-label="Static value"
      onSubmit={(e) => {
        e.preventDefault();
        if (invalid) return;
        model.dispatch({
          type: 'edit',
          object: base.id,
          field: field.value(attr.name),
          value: numeric ? n : draft,
        });
      }}
    >
      <h4 className="text-sm font-semibold">Value (no data reference)</h4>
      <Note>
        An attribute with a &lt;None&gt; data reference holds a static value, such as nameplate data
        or a limit.
      </Note>
      <Label htmlFor="sv-value" className="text-xs">
        Value{attr.uom ? ` (${attr.uom})` : ''}
      </Label>
      <div className="flex gap-2">
        <Input
          id="sv-value"
          className="h-8 text-sm"
          value={draft}
          inputMode={numeric ? 'decimal' : undefined}
          aria-invalid={invalid}
          aria-describedby={invalid ? 'sv-error' : undefined}
          onChange={(e) => setDraft(e.target.value)}
        />
        <Button type="submit" size="sm" disabled={invalid || draft === String(attr.value ?? '')}>
          Apply
        </Button>
      </div>
      {invalid ? (
        <span id="sv-error" role="alert" className="text-xs text-tool-alarm-hi">
          {attr.type === 'Int32' ? 'Enter a whole number.' : 'Enter a number.'}
        </span>
      ) : null}
      {pendingValue !== undefined ? (
        <Note>
          This value differs from the original model value (
          {String(base.attributes.find((a) => a.name === attr.name)?.value ?? '')}).
        </Note>
      ) : null}
    </form>
  );
}

function FormulaView({ attr, scope, now }: { attr: SimAttribute; scope: AfScope; now: number }) {
  const cfg = parseFormulaConfig(attr.configString);
  if (!cfg) return <Note>This formula has no expression.</Note>;
  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-sm font-semibold">Formula data reference settings</h4>
      <table className="w-full text-sm" aria-label="Formula variables">
        <thead>
          <tr>
            <Th>Variable</Th>
            <Th>Attribute</Th>
            <Th>Current value</Th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(cfg.vars).map(([k, path]) => {
            const v = attributeValue(scope, path, now);
            return (
              <tr key={k} className="border-b border-tool-grid">
                <Td className="font-mono">{k}</Td>
                <Td>{path}</Td>
                <Td className="font-mono">{v.ok ? valueText(v.value) : v.error}</Td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="text-sm">
        <span className="text-fg-muted">Equation: </span>
        <code className="font-mono">{cfg.expr}</code>
      </div>
      <Note>
        The Formula data reference is computed whenever a client asks for the value, and it is not
        time-weighted. Feeding Formula attributes into analyses adds that cost to every evaluation.
      </Note>
    </div>
  );
}

function limitsFor(scope: AfScope, attr: SimAttribute, now: number) {
  const names: Record<string, string[]> = {
    Vibration: ['High Vibration Limit'],
    Level: ['High Level Limit', 'Low Level Limit'],
  };
  return (names[attr.name] ?? []).flatMap((n) => {
    const v = attributeValue(scope, n, now);
    return v.ok && v.value.type === 'number'
      ? [{ value: v.value.value, label: n, tone: 'hi' as const }]
      : [];
  });
}

function sampled(scope: AfScope, attr: SimAttribute, start: number, end: number, now: number) {
  const out: TimedValue[] = [];
  const stop = Math.min(end, now);
  const step = Math.max(60_000, (stop - start) / 150);
  for (let t = start; t <= stop; t += step) {
    const v = attributeValue(scope, attr.name, now, t);
    if (v.ok && v.value.type === 'number') out.push({ t, v: v.value.value });
  }
  return out;
}

function AttributeTrend({ scope, attr, now }: { scope: AfScope; attr: SimAttribute; now: number }) {
  const [range, setRange] = useState<TimeRange>({ start: '*-8h', end: '*' });
  const r = resolveRange(range, now);
  const point = attr.dataReference === 'PI Point' && attr.tag ? findPoint(attr.tag) : undefined;
  const series = ((): TrendSeries[] | string => {
    if (typeof r === 'string') return r;
    if (attr.dataReference === 'PI Point') {
      if (!point) return `PI point "${attr.tag ?? ''}" was not found.`;
      return [
        {
          key: 'v',
          label: attr.name,
          points: plotValues(point, r.start, Math.min(r.end, now), 300),
          step: point.step,
          units: attr.uom,
        },
      ];
    }
    const pts = sampled(scope, attr, r.start, r.end, now);
    if (!pts.length) return 'This attribute has no numeric values to trend.';
    return [
      {
        key: 'v',
        label: attr.name,
        points: pts,
        units: attr.uom,
        dashed: attr.dataReference === 'None',
      },
    ];
  })();
  return (
    <div className="flex flex-col gap-3">
      <TimeRangeBar value={range} onChange={setRange} now={now} />
      {typeof series === 'string' || typeof r === 'string' ? (
        <p role="alert" className="text-sm text-tool-alarm-hi">
          {typeof series === 'string' ? series : typeof r === 'string' ? r : ''}
        </p>
      ) : (
        <>
          <TrendChart
            series={series}
            start={r.start}
            end={r.end}
            height={300}
            limits={limitsFor(scope, attr, now)}
            ariaLabel={`Trend of ${attr.name}`}
          />
          {point?.digitalset ? (
            <Note>
              Digital states are drawn by their codes:{' '}
              {(plant().digitalSets.find((d) => d.name === point.digitalset)?.states ?? [])
                .map((st, i) => `${i} ${st}`)
                .join(', ')}
              .
            </Note>
          ) : null}
          {attr.dataReference === 'Formula' ? (
            <Note>Formula values are computed at sampled times from their inputs.</Note>
          ) : null}
        </>
      )}
    </div>
  );
}
