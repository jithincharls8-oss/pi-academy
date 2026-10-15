import type { Dispatch } from 'react';
import { ArrowDownToLine, ArrowUpToLine, Group, Trash2, Ungroup, X } from 'lucide-react';
import { allElements, plant } from '@/core/sim/plant';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { seriesColor } from '../colors';
import { commonElement, fromCollection, toCollection } from '../collections';
import { digitalAttributes } from '../eventData';
import { removeItemAt } from '../factory';
import {
  elementName,
  isRelative,
  itemLabel,
  parseItem,
  SYMBOL_NAMES,
  type Display,
  type MultiState,
  type TimeRangeValue,
  type VisionSymbol,
} from '../model';
import type { EditorAction } from '../reducer';
import { elementsOfTemplate, resolveItem } from '../values';
import { ColorField, NumberField, Section, SelectField, TextField, ToggleField } from './fields';
import { MultiStateEditor } from './MultiStateEditor';

const TEMPLATES = (): { value: string; label: string }[] =>
  plant()
    .templates.filter((t) => t.name !== 'Equipment' && t.name !== 'Area')
    .map((t) => ({ value: t.name, label: t.name }));

const ROOTS = (): { value: string; label: string }[] =>
  allElements()
    .filter((e) => e.id === 'SITE' || e.template === 'Area')
    .map((e) => ({ value: e.path, label: e.id === 'SITE' ? `${e.name} (all)` : e.name }));

function templateAttributes(template: string): string[] {
  return elementsOfTemplate(template)[0]?.attributes.map((a) => a.name) ?? [];
}

/**
 * Right pane in design mode: format and configure the selected symbol, arrange or collect a
 * multi-selection, or edit the display settings when nothing is selected.
 */
export function ConfigPane({
  display,
  selection,
  dispatch,
}: {
  display: Display;
  selection: string[];
  dispatch: Dispatch<EditorAction>;
}) {
  const selected = display.symbols.filter((s) => selection.includes(s.id));
  if (selected.length === 0) return <DisplaySettings display={display} dispatch={dispatch} />;
  if (selected.length > 1)
    return <MultiSelection display={display} symbols={selected} dispatch={dispatch} />;
  const s = selected[0];
  if (!s) return null;
  return <SymbolConfig key={s.id} s={s} display={display} dispatch={dispatch} />;
}

function Header({ title, onDelete }: { title: string; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-between px-3 py-2">
      <h2 className="text-sm font-semibold">{title}</h2>
      <Button variant="ghost" size="sm" onClick={onDelete} aria-label="Delete selected symbols">
        <Trash2 /> Delete
      </Button>
    </div>
  );
}

function DisplaySettings({
  display,
  dispatch,
}: {
  display: Display;
  dispatch: Dispatch<EditorAction>;
}) {
  const used = new Set<string>();
  for (const s of display.symbols) {
    if (!('items' in s)) continue;
    for (const i of s.items) {
      const t = resolveItem(i)?.element.template;
      if (t && t !== 'Area') used.add(t);
    }
  }
  const ctx = display.context;
  const tplOptions = [
    { value: '', label: 'No asset switching' },
    ...[...used].map((t) => ({ value: t, label: t })),
  ];
  return (
    <div>
      <h2 className="px-3 py-2 text-sm font-semibold">Display settings</h2>
      <Section title="Display">
        <TextField
          label="Display name"
          value={display.name}
          placeholder="Unnamed display"
          onChange={(name) => dispatch({ type: 'settings', patch: { name } })}
        />
      </Section>
      <Section title="Context switching">
        <SelectField
          label="Asset type"
          value={ctx?.template ?? ''}
          options={tplOptions}
          onChange={(template) => {
            if (!template) return dispatch({ type: 'settings', patch: { context: null } });
            // Use the element of that type the display already shows most.
            const counts = new Map<string, number>();
            for (const s of display.symbols) {
              if (!('items' in s)) continue;
              for (const i of s.items) {
                const r = resolveItem(i);
                if (r?.element.template === template)
                  counts.set(r.element.path, (counts.get(r.element.path) ?? 0) + 1);
              }
            }
            const element = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
            if (element) dispatch({ type: 'settings', patch: { context: { template, element } } });
          }}
        />
        <p className="text-[11px] text-fg-muted">
          {ctx
            ? `Symbols bound to ${elementName(ctx.element)} follow Switch Asset to other ${ctx.template} elements.`
            : 'Add attributes of a templated element (for example a pump) to enable switching.'}
        </p>
      </Section>
      <Section title="Grid and canvas">
        <ToggleField
          label="Show grid"
          checked={display.showGrid}
          onChange={(showGrid) => dispatch({ type: 'settings', patch: { showGrid } })}
        />
        <ToggleField
          label="Snap to grid"
          checked={display.snap}
          onChange={(snap) => dispatch({ type: 'settings', patch: { snap } })}
        />
        <div className="grid grid-cols-3 gap-2">
          <NumberField
            label="Grid"
            value={display.gridSize}
            min={2}
            max={100}
            onChange={(v) =>
              v &&
              v >= 2 &&
              v <= 100 &&
              dispatch({ type: 'settings', patch: { gridSize: Math.round(v) } })
            }
          />
          <NumberField
            label="Width"
            value={display.width}
            min={200}
            max={4000}
            onChange={(v) =>
              v && v >= 200 && v <= 4000 && dispatch({ type: 'settings', patch: { width: v } })
            }
          />
          <NumberField
            label="Height"
            value={display.height}
            min={200}
            max={4000}
            onChange={(v) =>
              v && v >= 200 && v <= 4000 && dispatch({ type: 'settings', patch: { height: v } })
            }
          />
        </div>
      </Section>
      <Section title="Keyboard">
        <ul className="space-y-0.5 text-[11px] text-fg-muted">
          <li>Arrow keys: move the selection one grid step</li>
          <li>Shift+arrow: resize; Shift+drag corner: keep proportions</li>
          <li>Delete or Backspace: delete; Escape: clear selection</li>
          <li>Ctrl+click: add to selection; Ctrl+A: select all</li>
          <li>Ctrl+C / Ctrl+X / Ctrl+V: copy, cut, paste</li>
          <li>Ctrl+Z / Ctrl+Y: undo, redo; Ctrl+S: save</li>
        </ul>
      </Section>
    </div>
  );
}

function MultiSelection({
  display,
  symbols,
  dispatch,
}: {
  display: Display;
  symbols: VisionSymbol[];
  dispatch: Dispatch<EditorAction>;
}) {
  const source = commonElement(symbols);
  const el = source ? resolveElementTemplate(source) : null;
  return (
    <div>
      <Header
        title={`${symbols.length} symbols selected`}
        onDelete={() => dispatch({ type: 'remove', ids: symbols.map((s) => s.id) })}
      />
      <Section title="Arrange">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => dispatch({ type: 'arrange', to: 'front' })}
          >
            <ArrowUpToLine /> Bring to front
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => dispatch({ type: 'arrange', to: 'back' })}
          >
            <ArrowDownToLine /> Send to back
          </Button>
        </div>
      </Section>
      <Section title="Collection">
        {source && el ? (
          <>
            <p className="text-[11px] text-fg-muted">
              These symbols show {elementName(source)}. Convert them to a collection to repeat them
              for every {el.template} element.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const root = el.path.slice(0, el.path.lastIndexOf('\\'));
                const c = toCollection(symbols, source, el.template, root);
                if (c)
                  dispatch({ type: 'replaceMany', remove: symbols.map((s) => s.id), add: [c] });
              }}
            >
              <Group /> Convert to collection
            </Button>
          </>
        ) : (
          <p className="text-[11px] text-fg-muted">
            To make a collection, select symbols that are all bound to one templated element (text
            and shapes may be included).
          </p>
        )}
        <p className="text-[11px] text-fg-muted">Display has {display.symbols.length} symbols.</p>
      </Section>
    </div>
  );
}

function resolveElementTemplate(path: string): { template: string; path: string } | null {
  const e = allElements().find((x) => x.path.toLowerCase() === path.toLowerCase());
  return e?.template && e.template !== 'Area' ? { template: e.template, path: e.path } : null;
}

function TimeOverride({
  value,
  onChange,
}: {
  value: TimeRangeValue | null;
  onChange: (v: TimeRangeValue | null) => void;
}) {
  return (
    <>
      <SelectField
        label="Time range"
        value={value ? 'custom' : 'display'}
        options={[
          { value: 'display', label: 'Display time range' },
          { value: 'custom', label: 'Use custom time range' },
        ]}
        onChange={(m) => onChange(m === 'custom' ? { start: '*-1d', end: '*' } : null)}
      />
      {value ? (
        <div className="grid grid-cols-2 gap-2">
          <TextField
            label="Start time"
            value={value.start}
            onChange={(start) => onChange({ ...value, start: start || '*' })}
          />
          <TextField
            label="End time"
            value={value.end}
            onChange={(end) => onChange({ ...value, end: end || '*' })}
          />
        </div>
      ) : null}
    </>
  );
}

function SymbolConfig({
  s,
  display,
  dispatch,
}: {
  s: VisionSymbol;
  display: Display;
  dispatch: Dispatch<EditorAction>;
}) {
  const set = (next: VisionSymbol): void => dispatch({ type: 'replace', symbol: next });
  const first = 'items' in s && s.items[0] ? resolveItem(s.items[0]) : null;
  const rect = s.kind === 'collection' ? null : s;
  return (
    <div>
      <Header
        title={SYMBOL_NAMES[s.kind]}
        onDelete={() => dispatch({ type: 'remove', ids: [s.id] })}
      />
      <Section title="Position and size">
        <div className="grid grid-cols-4 gap-1.5">
          <NumberField
            label="X"
            value={s.x}
            onChange={(v) =>
              v !== null &&
              dispatch({ type: 'setRects', rects: [{ id: s.id, x: v, y: s.y, w: s.w, h: s.h }] })
            }
          />
          <NumberField
            label="Y"
            value={s.y}
            onChange={(v) =>
              v !== null &&
              dispatch({ type: 'setRects', rects: [{ id: s.id, x: s.x, y: v, w: s.w, h: s.h }] })
            }
          />
          {rect ? (
            <>
              <NumberField
                label="W"
                value={rect.w}
                onChange={(v) =>
                  v &&
                  dispatch({
                    type: 'setRects',
                    rects: [{ id: s.id, x: s.x, y: s.y, w: v, h: s.h }],
                  })
                }
              />
              <NumberField
                label="H"
                value={rect.h}
                onChange={(v) =>
                  v &&
                  dispatch({
                    type: 'setRects',
                    rects: [{ id: s.id, x: s.x, y: s.y, w: s.w, h: v }],
                  })
                }
              />
            </>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dispatch({ type: 'arrange', to: 'front' })}
          >
            <ArrowUpToLine /> Front
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dispatch({ type: 'arrange', to: 'back' })}
          >
            <ArrowDownToLine /> Back
          </Button>
        </div>
      </Section>
      {'items' in s ? (
        <Section title={s.kind === 'xy' ? 'Data items (X first, then Y)' : 'Data items'}>
          <ul className="space-y-1">
            {s.items.map((item, i) => (
              <li key={`${item}-${i}`} className="flex items-center gap-1 text-xs">
                <span className="min-w-0 flex-1 truncate" title={item}>
                  {s.kind === 'xy' ? (i === 0 ? 'X: ' : 'Y: ') : ''}
                  {itemLabel(item)}
                </span>
                {!resolveItem(item) ? <Badge tone="danger">Not found</Badge> : null}
                {isRelative(item, display) ? <Badge tone="primary">Asset-relative</Badge> : null}
                <button
                  type="button"
                  className="rounded p-0.5 text-fg-muted hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-ring"
                  aria-label={`Remove ${itemLabel(item)}`}
                  onClick={() => set(removeItemAt(s, i))}
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-fg-muted">
            {s.items.length
              ? 'Drop attributes on this symbol to add or replace data items.'
              : 'Drop an attribute on this symbol to bind it.'}
          </p>
        </Section>
      ) : null}
      <KindConfig s={s} set={set} first={first} dispatch={dispatch} />
    </div>
  );
}

function KindConfig({
  s,
  set,
  first,
  dispatch,
}: {
  s: VisionSymbol;
  set: (s: VisionSymbol) => void;
  first: ReturnType<typeof resolveItem>;
  dispatch: Dispatch<EditorAction>;
}) {
  const ms = (m: MultiState | null): void => {
    if ('multiState' in s) set({ ...s, multiState: m });
  };
  switch (s.kind) {
    case 'value':
      return (
        <>
          <Section title="Format value">
            <TextField
              label="Label (empty for default)"
              value={s.label ?? ''}
              placeholder={first?.label}
              onChange={(v) => set({ ...s, label: v || null })}
            />
            <div className="grid grid-cols-2 gap-2">
              <NumberField
                label="Font size"
                value={s.fontSize}
                min={8}
                max={72}
                onChange={(v) => v && v >= 8 && v <= 72 && set({ ...s, fontSize: v })}
              />
              <NumberField
                label="Decimals"
                value={s.decimals}
                min={0}
                max={6}
                placeholder="Auto"
                onChange={(v) =>
                  set({
                    ...s,
                    decimals: v === null ? null : Math.max(0, Math.min(6, Math.round(v))),
                  })
                }
              />
            </div>
            <ToggleField
              label="Show label"
              checked={s.showLabel}
              onChange={(v) => set({ ...s, showLabel: v })}
            />
            <ToggleField
              label="Show units"
              checked={s.showUnits}
              onChange={(v) => set({ ...s, showUnits: v })}
            />
            <ToggleField
              label="Show timestamp"
              checked={s.showTimestamp}
              onChange={(v) => set({ ...s, showTimestamp: v })}
            />
            <ColorField
              label="Value colour"
              value={s.color}
              onChange={(c) => c && set({ ...s, color: c })}
            />
          </Section>
          <Section title="Multi-state">
            <MultiStateEditor value={s.multiState} onChange={ms} item={first} />
          </Section>
        </>
      );
    case 'trend':
      return (
        <Section title="Configure trend">
          <TextField
            label="Title"
            value={s.title}
            placeholder="Trace names"
            onChange={(title) => set({ ...s, title })}
          />
          <SelectField
            label="Scale range"
            value={s.scale}
            options={[
              { value: 'auto', label: 'Autorange of dynamic values' },
              { value: 'span', label: 'Use PI point zero and span' },
            ]}
            onChange={(scale) => set({ ...s, scale })}
          />
          <ToggleField
            label="Grid lines"
            checked={s.gridLines}
            onChange={(gridLines) => set({ ...s, gridLines })}
          />
          <ToggleField
            label="Show limits from AF"
            checked={s.showLimits}
            onChange={(showLimits) => set({ ...s, showLimits })}
          />
          {s.items.map((item, i) => (
            <ColorField
              key={`${item}-${i}`}
              label={`Trace colour: ${itemLabel(item)}`}
              value={s.traceColors[i] ?? seriesColor(i)}
              onChange={(c) => {
                if (!c) return;
                const traceColors = s.items.map((_, j) =>
                  j === i ? c : (s.traceColors[j] ?? seriesColor(j)),
                );
                set({ ...s, traceColors });
              }}
            />
          ))}
          <TimeOverride value={s.timeRange} onChange={(timeRange) => set({ ...s, timeRange })} />
        </Section>
      );
    case 'table':
      return (
        <Section title="Configure table">
          <TextField label="Title" value={s.title} onChange={(title) => set({ ...s, title })} />
          {(['description', 'units', 'minimum', 'maximum', 'average', 'trend'] as const).map(
            (k) => (
              <ToggleField
                key={k}
                label={`Show ${k} column`}
                checked={s.columns[k]}
                onChange={(v) => set({ ...s, columns: { ...s.columns, [k]: v } })}
              />
            ),
          )}
        </Section>
      );
    case 'bar':
      return (
        <>
          <Section title="Format bar chart">
            <TextField label="Title" value={s.title} onChange={(title) => set({ ...s, title })} />
            <SelectField
              label="Orientation"
              value={s.orientation}
              options={[
                { value: 'vertical', label: 'Vertical' },
                { value: 'horizontal', label: 'Horizontal' },
              ]}
              onChange={(orientation) => set({ ...s, orientation })}
            />
            <SelectField
              label="Scale"
              value={s.scale}
              options={[
                { value: 'span', label: 'Each bar: PI point zero and span' },
                { value: 'auto', label: 'Shared, from values' },
              ]}
              onChange={(scale) => set({ ...s, scale })}
            />
            <ToggleField
              label="Show bar values"
              checked={s.showValues}
              onChange={(showValues) => set({ ...s, showValues })}
            />
            <ColorField
              label="Bar colour"
              value={s.color}
              onChange={(c) => c && set({ ...s, color: c })}
            />
          </Section>
          <Section title="Multi-state">
            <MultiStateEditor value={s.multiState} onChange={ms} item={first} />
            <p className="text-[11px] text-fg-muted">
              Each bar is coloured from its own value; limit attributes are read per element.
            </p>
          </Section>
        </>
      );
    case 'gauge':
      return (
        <>
          <Section title="Format gauge">
            <SelectField
              label="Style"
              value={s.style}
              options={[
                { value: 'radial', label: 'Radial (arc)' },
                { value: 'vertical', label: 'Vertical' },
                { value: 'horizontal', label: 'Horizontal' },
              ]}
              onChange={(style) => set({ ...s, style })}
            />
            <NumberField
              label="Decimals"
              value={s.decimals}
              min={0}
              max={6}
              placeholder="Auto"
              onChange={(v) =>
                set({ ...s, decimals: v === null ? null : Math.max(0, Math.min(6, Math.round(v))) })
              }
            />
            <ToggleField
              label="Show label"
              checked={s.showLabel}
              onChange={(showLabel) => set({ ...s, showLabel })}
            />
            <ToggleField
              label="Show scale"
              checked={s.showScale}
              onChange={(showScale) => set({ ...s, showScale })}
            />
            <ToggleField
              label="Show units"
              checked={s.showUnits}
              onChange={(showUnits) => set({ ...s, showUnits })}
            />
            <ColorField
              label="Value colour"
              value={s.color}
              onChange={(c) => c && set({ ...s, color: c })}
            />
          </Section>
          <Section title="Multi-state">
            <MultiStateEditor value={s.multiState} onChange={ms} item={first} />
          </Section>
        </>
      );
    case 'xy':
      return (
        <Section title="Configure XY plot">
          <TextField label="Title" value={s.title} onChange={(title) => set({ ...s, title })} />
          <ToggleField
            label="Regression line"
            checked={s.regression}
            onChange={(regression) => set({ ...s, regression })}
          />
          <ToggleField
            label="Correlation coefficient"
            checked={s.correlation}
            onChange={(correlation) => set({ ...s, correlation })}
          />
        </Section>
      );
    case 'assetTable':
      return <AssetTableConfig s={s} set={set} />;
    case 'eventTable': {
      const digital = digitalAttributes(s.template);
      const states = digital.find((d) => d.name === s.attribute)?.states ?? [];
      const templates = TEMPLATES().filter((t) => digitalAttributes(t.value).length);
      return (
        <Section title="Configure event table">
          <TextField label="Title" value={s.title} onChange={(title) => set({ ...s, title })} />
          <SelectField
            label="Asset type"
            value={s.template}
            options={templates}
            onChange={(template) => {
              const d = digitalAttributes(template)[0];
              set({
                ...s,
                template,
                attribute: d?.name ?? s.attribute,
                state: d?.states.includes(s.state) ? s.state : (d?.states[0] ?? s.state),
              });
            }}
          />
          <SelectField
            label="Search root"
            value={s.root}
            options={ROOTS()}
            onChange={(root) => set({ ...s, root })}
          />
          <SelectField
            label="Digital attribute"
            value={s.attribute}
            options={digital.map((d) => ({ value: d.name, label: d.name }))}
            onChange={(attribute) => set({ ...s, attribute })}
          />
          <SelectField
            label="Event state"
            value={s.state}
            options={states.map((x) => ({ value: x, label: x }))}
            onChange={(state) => set({ ...s, state })}
          />
          <TimeOverride value={s.timeRange} onChange={(timeRange) => set({ ...s, timeRange })} />
        </Section>
      );
    }
    case 'text':
      return (
        <Section title="Format text">
          <TextField label="Text" value={s.text} onChange={(text) => set({ ...s, text })} />
          <NumberField
            label="Font size"
            value={s.fontSize}
            min={8}
            max={72}
            onChange={(v) => v && v >= 8 && v <= 72 && set({ ...s, fontSize: v })}
          />
          <ToggleField label="Bold" checked={s.bold} onChange={(bold) => set({ ...s, bold })} />
          <ColorField
            label="Text colour"
            value={s.color}
            onChange={(c) => c && set({ ...s, color: c })}
          />
          <ColorField
            label="Fill"
            value={s.fill}
            allowNone
            onChange={(fill) => set({ ...s, fill })}
          />
        </Section>
      );
    case 'shape':
      return (
        <>
          <Section title={s.shape === 'line' ? 'Format line' : 'Format shape'}>
            {s.shape === 'line' ? (
              <SelectField
                label="Direction"
                value={s.line}
                options={[
                  { value: 'horizontal', label: 'Horizontal' },
                  { value: 'vertical', label: 'Vertical' },
                  { value: 'diagonal-down', label: 'Diagonal down' },
                  { value: 'diagonal-up', label: 'Diagonal up' },
                ]}
                onChange={(line) => set({ ...s, line })}
              />
            ) : (
              <ColorField
                label="Fill"
                value={s.fill}
                allowNone
                onChange={(fill) => set({ ...s, fill })}
              />
            )}
            <ColorField
              label={s.shape === 'line' ? 'Line colour' : 'Outline colour'}
              value={s.stroke}
              onChange={(c) => c && set({ ...s, stroke: c })}
            />
            <NumberField
              label="Line width"
              value={s.strokeWidth}
              min={0}
              max={12}
              onChange={(v) => v !== null && v >= 0 && v <= 12 && set({ ...s, strokeWidth: v })}
            />
          </Section>
          <Section title="Multi-state">
            {s.items.length ? (
              <MultiStateEditor value={s.multiState} onChange={ms} item={first} />
            ) : (
              <p className="text-[11px] text-fg-muted">
                Drop an attribute on the shape to colour it by value (for example a pump Status).
              </p>
            )}
          </Section>
        </>
      );
    case 'collection':
      return <CollectionConfig s={s} set={set} dispatch={dispatch} />;
  }
}

function AssetTableConfig({
  s,
  set,
}: {
  s: Extract<VisionSymbol, { kind: 'assetTable' }>;
  set: (s: VisionSymbol) => void;
}) {
  const attrs = templateAttributes(s.template);
  const sample = elementsOfTemplate(s.template, s.root || undefined)[0];
  return (
    <>
      <Section title="Configure table">
        <TextField label="Title" value={s.title} onChange={(title) => set({ ...s, title })} />
        <SelectField
          label="Asset type"
          value={s.template}
          options={TEMPLATES()}
          onChange={(template) => {
            const keep = templateAttributes(template);
            set({
              ...s,
              template,
              filter: null,
              columns: s.columns.filter((c) => keep.includes(c.attribute)),
            });
          }}
        />
        <SelectField
          label="Search root"
          value={s.root}
          options={ROOTS()}
          onChange={(root) => set({ ...s, root })}
        />
        <FilterEditor value={s.filter} attrs={attrs} onChange={(filter) => set({ ...s, filter })} />
      </Section>
      <Section title="Columns">
        {attrs.map((a) => {
          const col = s.columns.find((c) => c.attribute === a);
          return (
            <div key={a} className="space-y-1">
              <ToggleField
                label={a}
                checked={Boolean(col)}
                onChange={(on) =>
                  set({
                    ...s,
                    columns: on
                      ? attrs
                          .filter((x) => x === a || s.columns.some((c) => c.attribute === x))
                          .map(
                            (x) =>
                              s.columns.find((c) => c.attribute === x) ?? {
                                attribute: x,
                                multiState: null,
                              },
                          )
                      : s.columns.filter((c) => c.attribute !== a),
                  })
                }
              />
              {col ? (
                <div className="ml-3 border-l border-tool-grid pl-2">
                  <MultiStateEditor
                    title={`Multi-state for ${a}`}
                    value={col.multiState}
                    item={sample ? resolveItem(`${sample.path}|${a}`) : null}
                    onChange={(m) =>
                      set({
                        ...s,
                        columns: s.columns.map((c) =>
                          c.attribute === a ? { ...c, multiState: m } : c,
                        ),
                      })
                    }
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </Section>
    </>
  );
}

function FilterEditor({
  value,
  attrs,
  onChange,
}: {
  value: Extract<VisionSymbol, { kind: 'assetTable' }>['filter'];
  attrs: string[];
  onChange: (f: Extract<VisionSymbol, { kind: 'assetTable' }>['filter']) => void;
}) {
  return (
    <div className="space-y-2">
      <ToggleField
        label="Filter by attribute value"
        checked={Boolean(value)}
        onChange={(on) => onChange(on ? { attribute: attrs[0] ?? '', op: '>', value: '0' } : null)}
      />
      {value ? (
        <div className="grid grid-cols-[1fr_4rem_5rem] gap-1.5">
          <SelectField
            label="Attribute"
            value={value.attribute}
            options={attrs.map((a) => ({ value: a, label: a }))}
            onChange={(attribute) => onChange({ ...value, attribute })}
          />
          <SelectField
            label="Operator"
            value={value.op}
            options={[
              { value: '>', label: '>' },
              { value: '<', label: '<' },
              { value: '=', label: '=' },
            ]}
            onChange={(op) => onChange({ ...value, op })}
          />
          <TextField
            label="Value"
            value={value.value}
            onChange={(v) => onChange({ ...value, value: v })}
          />
        </div>
      ) : null}
    </div>
  );
}

function CollectionConfig({
  s,
  set,
  dispatch,
}: {
  s: Extract<VisionSymbol, { kind: 'collection' }>;
  set: (s: VisionSymbol) => void;
  dispatch: Dispatch<EditorAction>;
}) {
  const attrs = templateAttributes(s.template);
  return (
    <>
      <Section title="Edit collection criteria">
        <p className="text-[11px] text-fg-muted">
          Asset type <strong>{s.template}</strong>; built from {elementName(s.source)}. The
          collection updates as elements and values change.
        </p>
        <SelectField
          label="Search root"
          value={s.root}
          options={ROOTS()}
          onChange={(root) => set({ ...s, root })}
        />
        <FilterEditor value={s.filter} attrs={attrs} onChange={(filter) => set({ ...s, filter })} />
        <NumberField
          label="Columns"
          value={s.columns}
          min={1}
          max={12}
          onChange={(v) => v && v >= 1 && v <= 12 && set({ ...s, columns: Math.round(v) })}
        />
      </Section>
      <Section title="Members">
        <ul className="text-xs text-fg-muted">
          {s.members.map((m) => (
            <li key={m.id}>
              {SYMBOL_NAMES[m.kind]}
              {'items' in m && m.items[0] ? `: ${parseItem(m.items[0])?.attribute ?? ''}` : ''}
            </li>
          ))}
        </ul>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => dispatch({ type: 'replaceMany', remove: [s.id], add: fromCollection(s) })}
        >
          <Ungroup /> Convert back to symbols
        </Button>
      </Section>
    </>
  );
}
