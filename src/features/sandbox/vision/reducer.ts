/**
 * Editor state for one display: the display itself, the selection, undo/redo history and the
 * unsaved-changes flag. Pure, so every editing rule is unit tested.
 */
import { clampRect, moveRects, type Rect } from './geometry';
import { cloneSymbols } from './factory';
import { swapAsset, type Display, type VisionSymbol } from './model';

export const HISTORY_LIMIT = 50;

export interface EditorState {
  display: Display;
  /** saved display id, or null for a new or example display */
  savedId: string | null;
  selection: string[];
  past: Display[];
  future: Display[];
  dirty: boolean;
  clipboard: VisionSymbol[];
}

export type EditorAction =
  | { type: 'load'; display: Display; savedId: string | null }
  | { type: 'add'; symbols: VisionSymbol[] }
  | { type: 'replace'; symbol: VisionSymbol }
  | { type: 'replaceMany'; remove: string[]; add: VisionSymbol[] }
  | { type: 'remove'; ids: string[] }
  | { type: 'select'; ids: string[] }
  | { type: 'toggleSelect'; id: string }
  | { type: 'selectAll' }
  | { type: 'nudge'; dx: number; dy: number }
  | { type: 'setRects'; rects: (Rect & { id: string })[] }
  | { type: 'arrange'; to: 'front' | 'back' }
  | { type: 'copy' }
  | { type: 'cut' }
  | { type: 'paste' }
  | {
      type: 'settings';
      patch: Partial<
        Pick<Display, 'name' | 'context' | 'gridSize' | 'snap' | 'showGrid' | 'width' | 'height'>
      >;
    }
  | { type: 'setTime'; timeRange: Display['timeRange'] }
  | { type: 'swapAsset'; element: string }
  | { type: 'saved'; id: string; name: string }
  | { type: 'undo' }
  | { type: 'redo' };

export function initEditor(display: Display, savedId: string | null): EditorState {
  return { display, savedId, selection: [], past: [], future: [], dirty: false, clipboard: [] };
}

/** Apply an undoable change to the display. */
function commit(s: EditorState, next: Display, selection = s.selection): EditorState {
  if (next === s.display) return { ...s, selection };
  return {
    ...s,
    display: next,
    selection,
    past: [...s.past, s.display].slice(-HISTORY_LIMIT),
    future: [],
    dirty: true,
  };
}

function withSymbols(d: Display, symbols: VisionSymbol[]): Display {
  return { ...d, symbols };
}

export function editorReducer(s: EditorState, a: EditorAction): EditorState {
  const d = s.display;
  switch (a.type) {
    case 'load':
      return { ...initEditor(a.display, a.savedId), clipboard: s.clipboard };
    case 'add': {
      if (!a.symbols.length) return s;
      const next = withSymbols(d, [...d.symbols, ...a.symbols]);
      return commit(
        s,
        next,
        a.symbols.map((x) => x.id),
      );
    }
    case 'replace': {
      if (!d.symbols.some((x) => x.id === a.symbol.id)) return s;
      return commit(
        s,
        withSymbols(
          d,
          d.symbols.map((x) => (x.id === a.symbol.id ? a.symbol : x)),
        ),
      );
    }
    case 'replaceMany': {
      const gone = new Set(a.remove);
      const next = withSymbols(d, [...d.symbols.filter((x) => !gone.has(x.id)), ...a.add]);
      return commit(
        s,
        next,
        a.add.map((x) => x.id),
      );
    }
    case 'remove': {
      const gone = new Set(a.ids);
      if (!d.symbols.some((x) => gone.has(x.id))) return s;
      return commit(
        s,
        withSymbols(
          d,
          d.symbols.filter((x) => !gone.has(x.id)),
        ),
        s.selection.filter((id) => !gone.has(id)),
      );
    }
    case 'select':
      return { ...s, selection: a.ids.filter((id) => d.symbols.some((x) => x.id === id)) };
    case 'toggleSelect':
      return {
        ...s,
        selection: s.selection.includes(a.id)
          ? s.selection.filter((x) => x !== a.id)
          : [...s.selection, a.id],
      };
    case 'selectAll':
      return { ...s, selection: d.symbols.map((x) => x.id) };
    case 'nudge': {
      const sel = d.symbols.filter((x) => s.selection.includes(x.id));
      if (!sel.length) return s;
      const moved = moveRects(sel, a.dx, a.dy, {
        grid: d.gridSize,
        snap: d.snap,
        width: d.width,
        height: d.height,
      });
      const byId = new Map(sel.map((x, i) => [x.id, moved[i]]));
      return commit(
        s,
        withSymbols(
          d,
          d.symbols.map((x) => {
            const r = byId.get(x.id);
            return r ? { ...x, x: r.x, y: r.y } : x;
          }),
        ),
      );
    }
    case 'setRects': {
      const byId = new Map(a.rects.map((r) => [r.id, r]));
      let changed = false;
      const symbols = d.symbols.map((x) => {
        const r = byId.get(x.id);
        if (!r) return x;
        const c =
          x.kind === 'collection' ? { ...r, w: x.w, h: x.h } : clampRect(r, d.width, d.height);
        if (c.x === x.x && c.y === x.y && c.w === x.w && c.h === x.h) return x;
        changed = true;
        return { ...x, x: c.x, y: c.y, w: c.w, h: c.h };
      });
      return changed ? commit(s, withSymbols(d, symbols)) : s;
    }
    case 'arrange': {
      const sel = d.symbols.filter((x) => s.selection.includes(x.id));
      if (!sel.length) return s;
      const rest = d.symbols.filter((x) => !s.selection.includes(x.id));
      return commit(s, withSymbols(d, a.to === 'front' ? [...rest, ...sel] : [...sel, ...rest]));
    }
    case 'copy':
      return { ...s, clipboard: d.symbols.filter((x) => s.selection.includes(x.id)) };
    case 'cut': {
      const cut = d.symbols.filter((x) => s.selection.includes(x.id));
      if (!cut.length) return s;
      return {
        ...commit(
          s,
          withSymbols(
            d,
            d.symbols.filter((x) => !s.selection.includes(x.id)),
          ),
          [],
        ),
        clipboard: cut,
      };
    }
    case 'paste': {
      if (!s.clipboard.length) return s;
      const off = d.gridSize * 2;
      const copies = cloneSymbols(s.clipboard, off, off);
      // Paste again offsets again, so repeated pastes cascade.
      return {
        ...commit(
          s,
          withSymbols(d, [...d.symbols, ...copies]),
          copies.map((x) => x.id),
        ),
        clipboard: copies,
      };
    }
    case 'settings':
      return commit(s, { ...d, ...a.patch });
    case 'setTime':
      return { ...s, display: { ...d, timeRange: a.timeRange } };
    case 'swapAsset': {
      const next = swapAsset(d, a.element);
      return next === d ? s : { ...s, display: next };
    }
    case 'saved':
      return { ...s, savedId: a.id, dirty: false, display: { ...d, name: a.name } };
    case 'undo': {
      const prev = s.past[s.past.length - 1];
      if (!prev) return s;
      return {
        ...s,
        // The time range is navigation, not an edit: undo keeps the current one.
        display: { ...prev, timeRange: d.timeRange },
        past: s.past.slice(0, -1),
        future: [d, ...s.future],
        selection: s.selection.filter((id) => prev.symbols.some((x) => x.id === id)),
        dirty: true,
      };
    }
    case 'redo': {
      const next = s.future[0];
      if (!next) return s;
      return {
        ...s,
        display: { ...next, timeRange: d.timeRange },
        past: [...s.past, d],
        future: s.future.slice(1),
        selection: s.selection.filter((id) => next.symbols.some((x) => x.id === id)),
        dirty: true,
      };
    }
  }
}
