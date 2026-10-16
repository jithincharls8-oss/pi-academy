import {
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import { cn } from '@/lib/cn';
import { collectionRect } from './collections';
import { matchingElements } from './criteria';
import { decodePayload, DRAG_MIME, type DragPayload } from './dnd';
import { moveRects, resizeRect, type Rect } from './geometry';
import { itemLabel, SYMBOL_NAMES, type Display, type VisionSymbol } from './model';
import type { EditorAction } from './reducer';
import type { SymbolEnv } from './symbols/env';
import { hasPanel, SymbolBody } from './symbols/SymbolView';

interface DragState {
  mode: 'move' | 'resize';
  pointerId: number;
  x0: number;
  y0: number;
  orig: (Rect & { id: string })[];
  preview: (Rect & { id: string })[];
}

function describe(s: VisionSymbol): string {
  const name = SYMBOL_NAMES[s.kind];
  if (s.kind === 'text') return `${name}: ${s.text || 'empty'}`;
  if (s.kind === 'shape') return `${s.shape}`;
  if (s.kind === 'assetTable' || s.kind === 'collection') return `${name} of ${s.template}`;
  if (s.kind === 'eventTable') return `${name}: ${s.template} ${s.attribute} = ${s.state}`;
  const first = s.items[0];
  return first
    ? `${name}: ${itemLabel(first)}${s.items.length > 1 ? ` and ${s.items.length - 1} more` : ''}`
    : `${name} (no data)`;
}

/**
 * The display canvas. In design mode symbols are focusable and selectable: click (Ctrl+click
 * to add to the selection), drag to move on the grid, drag the corner handle to resize
 * (Shift keeps proportions), arrow keys move, Shift+arrow resizes, Delete removes.
 * Attributes and elements dropped here create symbols, or join the symbol under the pointer.
 */
export function Canvas({
  display,
  selection,
  design,
  env,
  dispatch,
  onDropPayload,
}: {
  display: Display;
  selection: string[];
  design: boolean;
  env: SymbolEnv;
  dispatch: Dispatch<EditorAction>;
  onDropPayload: (p: DragPayload, at: { x: number; y: number }, targetId: string | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const pointerSelect = useRef(false);
  const opts = {
    grid: display.gridSize,
    snap: display.snap,
    width: display.width,
    height: display.height,
  };

  const t = Math.min(env.end, env.now);
  const { now } = env;
  const rects = useMemo(() => {
    const m = new Map<string, Rect>();
    for (const s of display.symbols) {
      if (s.kind === 'collection') {
        m.set(
          s.id,
          collectionRect(s, matchingElements(s.template, s.root, s.filter, t, now).length),
        );
      } else m.set(s.id, { x: s.x, y: s.y, w: s.w, h: s.h });
    }
    return m;
  }, [display.symbols, t, now]);
  const rectOf = (s: VisionSymbol): Rect => {
    const p = drag?.preview.find((r) => r.id === s.id);
    return p ?? rects.get(s.id) ?? { x: s.x, y: s.y, w: s.w, h: s.h };
  };

  const startDrag = (e: PointerEvent, s: VisionSymbol, mode: DragState['mode']): void => {
    if (!design || e.button !== 0) return;
    e.stopPropagation();
    pointerSelect.current = true;
    let ids = selection;
    if (mode === 'move' && (e.ctrlKey || e.metaKey)) {
      dispatch({ type: 'toggleSelect', id: s.id });
      return;
    }
    if (!selection.includes(s.id) || mode === 'resize') {
      ids = [s.id];
      dispatch({ type: 'select', ids });
    }
    const orig = display.symbols
      .filter((x) => ids.includes(x.id))
      .map((x) => ({ id: x.id, ...(rects.get(x.id) ?? x) }));
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({ mode, pointerId: e.pointerId, x0: e.clientX, y0: e.clientY, orig, preview: orig });
  };
  const onMove = (e: PointerEvent): void => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const dx = e.clientX - drag.x0;
    const dy = e.clientY - drag.y0;
    if (drag.mode === 'move') {
      const moved = moveRects(drag.orig, dx, dy, opts);
      setDrag({ ...drag, preview: drag.orig.map((r, i) => ({ ...r, ...moved[i] })) });
    } else {
      const o = drag.orig[0];
      if (!o) return;
      setDrag({
        ...drag,
        preview: [{ ...resizeRect(o, dx, dy, { ...opts, proportional: e.shiftKey }), id: o.id }],
      });
    }
  };
  const endDrag = (e: PointerEvent): void => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    dispatch({ type: 'setRects', rects: drag.preview });
    setDrag(null);
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (!design || !selection.length) return;
    const step = display.snap ? display.gridSize : 1;
    const arrows: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const a = arrows[e.key];
    if (a) {
      e.preventDefault();
      if (e.shiftKey) {
        const s = display.symbols.find((x) => x.id === selection[0]);
        if (s && s.kind !== 'collection') {
          const r = resizeRect(s, a[0], a[1], opts);
          dispatch({ type: 'setRects', rects: [{ ...r, id: s.id }] });
        }
      } else dispatch({ type: 'nudge', dx: a[0], dy: a[1] });
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      dispatch({ type: 'remove', ids: selection });
      ref.current?.focus();
    } else if (e.key === 'Escape') {
      dispatch({ type: 'select', ids: [] });
    }
  };

  const gridStyle =
    design && display.showGrid
      ? {
          backgroundImage:
            'linear-gradient(to right, var(--tool-grid) 1px, transparent 1px), linear-gradient(to bottom, var(--tool-grid) 1px, transparent 1px)',
          backgroundSize: `${display.gridSize * 2}px ${display.gridSize * 2}px`,
        }
      : {};

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="region"
      aria-label={`Display canvas, ${display.symbols.length} symbols${design ? ', design mode' : ''}`}
      className="relative shrink-0 bg-tool-canvas outline-none"
      style={{ width: display.width, height: display.height, ...gridStyle }}
      onKeyDown={onKey}
      onPointerDown={(e) => {
        if (design && e.target === e.currentTarget) dispatch({ type: 'select', ids: [] });
      }}
      onDragOver={(e) => {
        if (!design || !e.dataTransfer.types.includes(DRAG_MIME)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        const target = (e.target as HTMLElement).closest<HTMLElement>('[data-symbol-id]');
        setDropTarget(target?.dataset['symbolId'] ?? null);
      }}
      onDragLeave={(e) => {
        if (e.target === e.currentTarget) setDropTarget(null);
      }}
      onDrop={(e) => {
        setDropTarget(null);
        if (!design) return;
        const p = decodePayload(e.dataTransfer.getData(DRAG_MIME));
        if (!p) return;
        e.preventDefault();
        const box = e.currentTarget.getBoundingClientRect();
        const target = (e.target as HTMLElement).closest<HTMLElement>('[data-symbol-id]');
        onDropPayload(
          p,
          { x: e.clientX - box.left, y: e.clientY - box.top },
          target?.dataset['symbolId'] ?? null,
        );
      }}
    >
      {display.symbols.map((s) => {
        const r = rectOf(s);
        const selected = design && selection.includes(s.id);
        return (
          <div
            key={s.id}
            data-symbol-id={s.id}
            tabIndex={design ? 0 : undefined}
            role={design ? 'group' : undefined}
            aria-roledescription={design ? 'symbol' : undefined}
            aria-label={design ? `${describe(s)}${selected ? ', selected' : ''}` : undefined}
            className={cn(
              'absolute',
              hasPanel(s) && 'overflow-hidden rounded border border-tool-grid bg-surface',
              design &&
                'cursor-move focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              selected && 'outline-2 outline-primary',
              dropTarget === s.id && 'ring-2 ring-primary',
            )}
            style={{ left: r.x, top: r.y, width: r.w, height: r.h }}
            onPointerDown={(e) => startDrag(e, s, 'move')}
            onPointerMove={onMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onFocus={() => {
              if (design && !pointerSelect.current && !selection.includes(s.id)) {
                dispatch({ type: 'select', ids: [s.id] });
              }
              pointerSelect.current = false;
            }}
          >
            <div className={cn('h-full w-full', design && 'pointer-events-none')} inert={design}>
              <SymbolBody sym={s} env={env} />
            </div>
            {selected && selection.length === 1 && s.kind !== 'collection' ? (
              <span
                aria-hidden
                className="absolute right-0 bottom-0 size-3 cursor-se-resize rounded-tl-sm bg-primary"
                onPointerDown={(e) => startDrag(e, s, 'resize')}
                onPointerMove={onMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
              />
            ) : null}
          </div>
        );
      })}
      {design && !display.symbols.length ? (
        <p className="pointer-events-none absolute inset-x-0 top-1/3 text-center text-sm text-fg-muted">
          Drag an attribute or element from the Assets or Search pane onto the display, or use its
          Add button.
        </p>
      ) : null}
    </div>
  );
}
