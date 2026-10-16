import { useReducer, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import {
  ChartBar,
  ChartLine,
  ChartScatter,
  Circle,
  ClipboardPaste,
  Copy,
  Eye,
  Gauge,
  Grid3x3,
  Hash,
  House,
  ListChecks,
  Minus,
  Pause,
  PencilRuler,
  Play,
  Redo2,
  Rows3,
  Save,
  Scissors,
  Square,
  Table,
  Trash2,
  Type,
  Undo2,
} from 'lucide-react';
import { useApp } from '@/app/AppContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input, Select } from '@/components/ui/input';
import { findElement } from '@/core/sim/plant';
import { formatPiTime } from '@/core/sim/time';
import { TimeRangeBar, resolveRange } from '@/features/sandbox/shared/TimeRangeBar';
import { ToolFrame } from '@/features/sandbox/shared/ToolFrame';
import { useSimClock } from '@/features/sandbox/shared/useSimClock';
import { cn } from '@/lib/cn';
import { AdHocTrend } from './AdHocTrend';
import { Canvas } from './Canvas';
import type { DragPayload } from './dnd';
import { digitalAttributes } from './eventData';
import {
  addItemTo,
  createDataSymbol,
  createShape,
  createText,
  DATA_KINDS,
  DEFAULT_SIZE,
  newId,
  symbolForElement,
  type DataKind,
} from './factory';
import { clampRect, freeSpot, snap } from './geometry';
import {
  itemLabel,
  parseItem,
  serializeDisplay,
  SYMBOL_NAMES,
  VISION_TOOL,
  type Display,
  type VisionSymbol,
} from './model';
import { editorReducer, initEditor } from './reducer';
import { AssetPane } from './panes/AssetPane';
import { ConfigPane } from './panes/ConfigPane';
import type { SymbolEnv } from './symbols/env';
import { elementsOfTemplate } from './values';

const KIND_ICONS: Record<DataKind, ReactNode> = {
  trend: <ChartLine />,
  value: <Hash />,
  table: <Table />,
  bar: <ChartBar />,
  gauge: <Gauge />,
  xy: <ChartScatter />,
  assetTable: <Rows3 />,
  eventTable: <ListChecks />,
};

function ToolButton({
  label,
  onClick,
  children,
  disabled,
  pressed,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
  pressed?: boolean;
}) {
  return (
    <Button
      variant={pressed ? 'primary' : 'ghost'}
      size="icon"
      className="h-8 w-8"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

const Divider = () => <span aria-hidden className="mx-1 h-6 w-px bg-tool-grid" />;

/**
 * One open display: design mode (orange border, palette, Assets/Search and configure panes) or
 * view mode (interactive symbols). The time bar drives every symbol; with an end time of `*`
 * the display updates live.
 */
export function DisplayEditor({
  initial,
  savedId,
  startInDesign,
  onHome,
}: {
  initial: Display;
  savedId: string | null;
  startInDesign: boolean;
  onHome: () => void;
}) {
  const { user, flush } = useApp();
  const [state, dispatch] = useReducer(editorReducer, null, () => initEditor(initial, savedId));
  const [design, setDesign] = useState(startInDesign);
  const [kind, setKind] = useState<DataKind>('trend');
  const [adHoc, setAdHoc] = useState<{ items: string[]; title: string } | null>(null);
  const [saveDialog, setSaveDialog] = useState<{ asNew: boolean; name: string } | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [status, setStatus] = useState('');
  const savedTime = useRef(initial.timeRange);
  const { now, paused, setPaused } = useSimClock(5000);

  const d = state.display;
  const resolved = resolveRange(d.timeRange, now);
  const range = typeof resolved === 'string' ? { start: now - 8 * 3_600_000, end: now } : resolved;
  const live = /^\s*\*/.test(d.timeRange.end) && !paused;
  const ctx = d.context;
  const swapTargets = ctx ? elementsOfTemplate(ctx.template) : [];

  const env: SymbolEnv = {
    now,
    start: range.start,
    end: range.end,
    design,
    onAdHoc: (items, title) => setAdHoc({ items, title }),
    onApplyTime: (start, end) => {
      dispatch({
        type: 'setTime',
        timeRange: { start: formatPiTime(start), end: formatPiTime(end) },
      });
      setStatus(`Time range set to ${formatPiTime(start)} – ${formatPiTime(end)}`);
    },
    onSwitchAsset: ctx
      ? (path) => {
          if (findElement(path)?.template === ctx.template)
            dispatch({ type: 'swapAsset', element: path });
        }
      : null,
  };

  /* ------------------------------------------------------------ adding symbols */

  const position = (size: { w: number; h: number }, at: { x: number; y: number } | null) => {
    const raw = at
      ? { x: snap(at.x - 10, d.gridSize, d.snap), y: snap(at.y - 10, d.gridSize, d.snap) }
      : freeSpot(size, d.symbols, { grid: d.gridSize, width: d.width, height: d.height });
    return clampRect({ ...raw, ...size }, d.width, d.height);
  };

  const ensureContext = (elementPath: string): void => {
    if (d.context) return;
    const e = findElement(elementPath);
    if (e?.template && e.template !== 'Area') {
      dispatch({ type: 'settings', patch: { context: { template: e.template, element: e.path } } });
    }
  };

  const addSymbol = (s: VisionSymbol, note: string): void => {
    const r = position({ w: s.w, h: s.h }, null);
    dispatch({ type: 'add', symbols: [{ ...s, ...r }] });
    setStatus(note);
  };

  const place = (
    p: DragPayload,
    at: { x: number; y: number } | null,
    targetId: string | null,
  ): void => {
    if (!design) setDesign(true);
    const sel = state.selection.length === 1 ? state.selection[0] : undefined;
    const target = d.symbols.find((x) => x.id === (targetId ?? (at ? undefined : sel)));
    if (p.type === 'attribute') {
      const parsed = parseItem(p.item);
      if (!parsed) return;
      if (target) {
        const next = addItemTo(target, p.item);
        if (next) {
          dispatch({ type: 'replace', symbol: next });
          setStatus(`Added ${itemLabel(p.item)} to the ${SYMBOL_NAMES[target.kind].toLowerCase()}`);
          ensureContext(parsed.element);
          return;
        }
      }
      const el = findElement(parsed.element);
      let s: VisionSymbol;
      const size = DEFAULT_SIZE[kind];
      const r = position(size, at);
      const pl = { id: newId(), x: r.x, y: r.y };
      if (
        (kind === 'assetTable' || kind === 'eventTable') &&
        el?.template &&
        el.template !== 'Area'
      ) {
        const root = el.path.slice(0, el.path.lastIndexOf('\\'));
        const digital = digitalAttributes(el.template).find((x) => x.name === parsed.attribute);
        if (kind === 'eventTable' && digital) {
          const state = digital.states.includes('Tripped')
            ? 'Tripped'
            : (digital.states[digital.states.length - 1] ?? '');
          s = createDataSymbol(kind, pl, [], {
            template: el.template,
            root,
            digital: { attribute: digital.name, state },
          });
        } else if (kind === 'assetTable') {
          s = createDataSymbol(kind, pl, [], {
            template: el.template,
            root,
            attributes: [parsed.attribute],
          });
        } else s = createDataSymbol('value', pl, [p.item]);
      } else s = createDataSymbol(kind, pl, [p.item]);
      const c = clampRect(s, d.width, d.height);
      dispatch({ type: 'add', symbols: [{ ...s, ...c }] });
      setStatus(`Created ${SYMBOL_NAMES[s.kind].toLowerCase()} for ${itemLabel(p.item)}`);
      ensureContext(parsed.element);
      return;
    }
    const el = findElement(p.path);
    if (!el) return;
    const digital = el.template ? digitalAttributes(el.template)[0] : undefined;
    const pick = digital
      ? {
          attribute: digital.name,
          state: digital.states.includes('Tripped') ? 'Tripped' : (digital.states[0] ?? ''),
        }
      : undefined;
    const draft = symbolForElement(kind, el, { id: newId(), x: 0, y: 0 }, pick);
    const r = position({ w: draft.symbol.w, h: draft.symbol.h }, at);
    dispatch({ type: 'add', symbols: [{ ...draft.symbol, ...r }] });
    setStatus(draft.note);
    if (draft.symbol.kind !== 'assetTable' && draft.symbol.kind !== 'eventTable')
      ensureContext(el.path);
  };

  /* ------------------------------------------------------------ saving */

  const write = (name: string, asNew: boolean): void => {
    const clean = name.trim() || 'Untitled display';
    const json = serializeDisplay({ ...d, name: clean });
    const id = user.saveDisplay(
      VISION_TOOL,
      clean,
      json,
      asNew ? undefined : (state.savedId ?? undefined),
    );
    void flush();
    const first = !state.savedId || asNew;
    dispatch({ type: 'saved', id, name: clean });
    savedTime.current = d.timeRange;
    setStatus(`Saved "${clean}"`);
    // The first save of a display leaves design mode, as in PI Vision.
    if (first) setDesign(false);
  };
  const save = (): void => {
    if (state.savedId) write(d.name, false);
    else setSaveDialog({ asNew: false, name: d.name });
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>): void => {
    const tag = (e.target as HTMLElement).tagName;
    const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
    if (!(e.ctrlKey || e.metaKey)) return;
    const k = e.key.toLowerCase();
    if (k === 's') {
      e.preventDefault();
      save();
      return;
    }
    if (typing || !design) return;
    const map: Record<string, () => void> = {
      z: () => dispatch({ type: e.shiftKey ? 'redo' : 'undo' }),
      y: () => dispatch({ type: 'redo' }),
      c: () => dispatch({ type: 'copy' }),
      x: () => dispatch({ type: 'cut' }),
      v: () => dispatch({ type: 'paste' }),
      a: () => dispatch({ type: 'selectAll' }),
    };
    const fn = map[k];
    if (fn) {
      e.preventDefault();
      fn();
    }
  };

  const hasSel = state.selection.length > 0;
  const title = `${d.name || 'Click Save Icon'}${state.dirty ? ' *' : ''}`;

  const toolbar = (
    <>
      <ToolButton
        label="Home: all displays"
        onClick={() => (state.dirty ? setLeaving(true) : onHome())}
      >
        <House />
      </ToolButton>
      <h2 className="max-w-56 truncate text-sm font-semibold" title={title}>
        {title}
      </h2>
      <Button
        variant={design ? 'primary' : 'secondary'}
        size="sm"
        aria-pressed={design}
        onClick={() => {
          setDesign(!design);
          dispatch({ type: 'select', ids: [] });
        }}
      >
        {design ? <PencilRuler /> : <Eye />}
        {design ? 'Design mode' : 'View mode'}
      </Button>
      <ToolButton label="Save (Ctrl+S)" onClick={save}>
        <Save />
      </ToolButton>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setSaveDialog({ asNew: true, name: d.name ? `${d.name} (copy)` : '' })}
      >
        Save as
      </Button>
      {design ? (
        <>
          <Divider />
          <ToolButton
            label="Undo (Ctrl+Z)"
            onClick={() => dispatch({ type: 'undo' })}
            disabled={!state.past.length}
          >
            <Undo2 />
          </ToolButton>
          <ToolButton
            label="Redo (Ctrl+Y)"
            onClick={() => dispatch({ type: 'redo' })}
            disabled={!state.future.length}
          >
            <Redo2 />
          </ToolButton>
          <ToolButton
            label="Cut (Ctrl+X)"
            onClick={() => dispatch({ type: 'cut' })}
            disabled={!hasSel}
          >
            <Scissors />
          </ToolButton>
          <ToolButton
            label="Copy (Ctrl+C)"
            onClick={() => dispatch({ type: 'copy' })}
            disabled={!hasSel}
          >
            <Copy />
          </ToolButton>
          <ToolButton
            label="Paste (Ctrl+V)"
            onClick={() => dispatch({ type: 'paste' })}
            disabled={!state.clipboard.length}
          >
            <ClipboardPaste />
          </ToolButton>
          <ToolButton
            label="Delete (Delete key)"
            onClick={() => dispatch({ type: 'remove', ids: state.selection })}
            disabled={!hasSel}
          >
            <Trash2 />
          </ToolButton>
          <ToolButton
            label={d.showGrid ? 'Hide grid' : 'Show grid'}
            pressed={d.showGrid}
            onClick={() => dispatch({ type: 'settings', patch: { showGrid: !d.showGrid } })}
          >
            <Grid3x3 />
          </ToolButton>
          <Divider />
          <div
            role="radiogroup"
            aria-label="Default symbol for drops"
            className="flex items-center gap-0.5"
          >
            {DATA_KINDS.map((k) => (
              <Button
                key={k}
                role="radio"
                aria-checked={kind === k}
                variant={kind === k ? 'primary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                aria-label={SYMBOL_NAMES[k]}
                title={`${SYMBOL_NAMES[k]} (default symbol for drops)`}
                onClick={() => setKind(k)}
              >
                {KIND_ICONS[k]}
              </Button>
            ))}
          </div>
          <Divider />
          <ToolButton
            label="Add text"
            onClick={() => addSymbol(createText({ id: newId(), x: 0, y: 0 }), 'Added text')}
          >
            <Type />
          </ToolButton>
          <ToolButton
            label="Add rectangle"
            onClick={() =>
              addSymbol(createShape({ id: newId(), x: 0, y: 0 }, 'rectangle'), 'Added rectangle')
            }
          >
            <Square />
          </ToolButton>
          <ToolButton
            label="Add ellipse"
            onClick={() =>
              addSymbol(createShape({ id: newId(), x: 0, y: 0 }, 'ellipse'), 'Added ellipse')
            }
          >
            <Circle />
          </ToolButton>
          <ToolButton
            label="Add line"
            onClick={() =>
              addSymbol(createShape({ id: newId(), x: 0, y: 0 }, 'line'), 'Added line')
            }
          >
            <Minus />
          </ToolButton>
        </>
      ) : null}
      {ctx ? (
        <div className="ml-auto flex items-center gap-1.5">
          <label htmlFor="vision-switch-asset" className="text-xs text-fg-muted">
            Switch asset
          </label>
          <Select
            id="vision-switch-asset"
            className="h-8 w-36 px-2 text-xs"
            value={ctx.element}
            onChange={(e) => dispatch({ type: 'swapAsset', element: e.target.value })}
          >
            {swapTargets.map((e) => (
              <option key={e.id} value={e.path}>
                {e.name} ({e.description})
              </option>
            ))}
          </Select>
        </div>
      ) : null}
    </>
  );

  return (
    <div onKeyDown={onKey}>
      <ToolFrame
        title="PI Vision style display (mockup)"
        toolbar={toolbar}
        className={cn('h-[calc(100vh-9rem)] min-h-[40rem]', design && 'border-2 border-warning')}
        status={
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <TimeRangeBar
              value={d.timeRange}
              now={now}
              onChange={(timeRange) => dispatch({ type: 'setTime', timeRange })}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dispatch({ type: 'setTime', timeRange: savedTime.current })}
              title="Revert display to its saved time range"
            >
              Revert
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPaused(!paused)}
              aria-pressed={paused}
            >
              {paused ? <Play /> : <Pause />}
              {paused ? 'Resume updates' : 'Pause updates'}
            </Button>
            <span>
              {live ? 'Live: updates every 5 s' : paused ? 'Updates paused' : 'Fixed time range'} ·{' '}
              {formatPiTime(range.start)} to {formatPiTime(range.end)}
            </span>
            <span role="status" aria-live="polite" className="text-fg">
              {status}
            </span>
          </div>
        }
      >
        {design ? (
          <aside
            aria-label="Assets and search"
            className="flex w-64 shrink-0 flex-col border-r border-tool-grid bg-surface"
          >
            <AssetPane onAdd={(p) => place(p, null, null)} />
          </aside>
        ) : null}
        <div className="min-w-0 flex-1 overflow-auto p-3">
          <Canvas
            display={d}
            selection={state.selection}
            design={design}
            env={env}
            dispatch={dispatch}
            onDropPayload={place}
          />
        </div>
        {design ? (
          <aside
            aria-label="Configure"
            className="w-72 shrink-0 overflow-y-auto border-l border-tool-grid bg-surface"
          >
            <ConfigPane display={d} selection={state.selection} dispatch={dispatch} />
          </aside>
        ) : null}
      </ToolFrame>

      {adHoc ? (
        <AdHocTrend
          open
          items={adHoc.items}
          title={adHoc.title}
          start={range.start}
          end={range.end}
          now={now}
          onClose={() => setAdHoc(null)}
        />
      ) : null}

      <Dialog open={Boolean(saveDialog)} onOpenChange={(o) => !o && setSaveDialog(null)}>
        <DialogContent
          title={saveDialog?.asNew ? 'Save display as' : 'Save display'}
          description="Displays are saved in this app on this device."
        >
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!saveDialog) return;
              write(saveDialog.name, saveDialog.asNew);
              setSaveDialog(null);
            }}
          >
            <label htmlFor="vision-save-name" className="text-sm font-medium">
              Display name
            </label>
            <Input
              id="vision-save-name"
              autoFocus
              required
              value={saveDialog?.name ?? ''}
              onChange={(e) => setSaveDialog((s) => (s ? { ...s, name: e.target.value } : s))}
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setSaveDialog(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!saveDialog?.name.trim()}>
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={leaving} onOpenChange={setLeaving}>
        <DialogContent
          title="Leave without saving?"
          description="This display has unsaved changes."
        >
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setLeaving(false)}>
              Keep editing
            </Button>
            <Button variant="danger" onClick={onHome}>
              Discard changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
