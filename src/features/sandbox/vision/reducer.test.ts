import { describe, expect, it } from 'vitest';
import { editorReducer, HISTORY_LIMIT, initEditor, type EditorState } from './reducer';
import { createDataSymbol, createShape, createText } from './factory';
import { emptyDisplay, makeItem, type VisionSymbol } from './model';

const P101 = '\\\\AFSRV01\\Riverbend\\Riverbend Plant\\Process\\P-101';
const P102 = '\\\\AFSRV01\\Riverbend\\Riverbend Plant\\Process\\P-102';

function start(): EditorState {
  return initEditor(emptyDisplay('Test'), null);
}
const text = (id: string, x = 20, y = 20): VisionSymbol => createText({ id, x, y });

describe('editor reducer', () => {
  it('adds and selects, marking the display dirty', () => {
    const s = editorReducer(start(), { type: 'add', symbols: [text('a')] });
    expect(s.display.symbols).toHaveLength(1);
    expect(s.selection).toEqual(['a']);
    expect(s.dirty).toBe(true);
  });

  it('undoes and redoes edits', () => {
    let s = editorReducer(start(), { type: 'add', symbols: [text('a')] });
    s = editorReducer(s, { type: 'remove', ids: ['a'] });
    expect(s.display.symbols).toHaveLength(0);
    s = editorReducer(s, { type: 'undo' });
    expect(s.display.symbols.map((x) => x.id)).toEqual(['a']);
    s = editorReducer(s, { type: 'redo' });
    expect(s.display.symbols).toHaveLength(0);
    s = editorReducer(s, { type: 'redo' });
    expect(s.display.symbols).toHaveLength(0);
  });

  it('caps the history', () => {
    let s = start();
    for (let i = 0; i < HISTORY_LIMIT + 10; i++)
      s = editorReducer(s, { type: 'add', symbols: [text(`t${i}`)] });
    expect(s.past).toHaveLength(HISTORY_LIMIT);
  });

  it('nudges the selection on the grid and clamps to the canvas', () => {
    let s = editorReducer(start(), {
      type: 'add',
      symbols: [text('a', 20, 20), text('b', 300, 40)],
    });
    s = editorReducer(s, { type: 'nudge', dx: 10, dy: 0 });
    expect(s.display.symbols.map((x) => [x.x, x.y])).toEqual([
      [30, 20],
      [310, 40],
    ]);
    s = editorReducer(s, { type: 'nudge', dx: -1000, dy: -1000 });
    expect(s.display.symbols.map((x) => [x.x, x.y])).toEqual([
      [0, 0],
      [280, 20],
    ]);
  });

  it('commits drag results as one undo step and ignores no-op drags', () => {
    let s = editorReducer(start(), { type: 'add', symbols: [text('a')] });
    const before = s.past.length;
    s = editorReducer(s, { type: 'setRects', rects: [{ id: 'a', x: 20, y: 20, w: 200, h: 40 }] });
    expect(s.past.length).toBe(before);
    s = editorReducer(s, { type: 'setRects', rects: [{ id: 'a', x: 100, y: 60, w: 240, h: 40 }] });
    expect(s.past.length).toBe(before + 1);
    expect(s.display.symbols[0]).toMatchObject({ x: 100, y: 60, w: 240 });
  });

  it('copies, pastes with an offset and fresh ids, and cuts', () => {
    let s = editorReducer(start(), { type: 'add', symbols: [text('a')] });
    s = editorReducer(s, { type: 'copy' });
    s = editorReducer(s, { type: 'paste' });
    expect(s.display.symbols).toHaveLength(2);
    const copy = s.display.symbols[1];
    expect(copy?.id).not.toBe('a');
    expect(copy).toMatchObject({ x: 40, y: 40 });
    expect(s.selection).toEqual([copy?.id]);
    s = editorReducer(s, { type: 'cut' });
    expect(s.display.symbols.map((x) => x.id)).toEqual(['a']);
    s = editorReducer(s, { type: 'paste' });
    expect(s.display.symbols).toHaveLength(2);
  });

  it('brings to front and sends to back', () => {
    let s = editorReducer(start(), { type: 'add', symbols: [text('a'), text('b'), text('c')] });
    s = editorReducer(s, { type: 'select', ids: ['a'] });
    s = editorReducer(s, { type: 'arrange', to: 'front' });
    expect(s.display.symbols.map((x) => x.id)).toEqual(['b', 'c', 'a']);
    s = editorReducer(s, { type: 'arrange', to: 'back' });
    expect(s.display.symbols.map((x) => x.id)).toEqual(['a', 'b', 'c']);
  });

  it('toggles selection and selects all', () => {
    let s = editorReducer(start(), {
      type: 'add',
      symbols: [text('a'), createShape({ id: 'b', x: 0, y: 0 }, 'ellipse')],
    });
    s = editorReducer(s, { type: 'toggleSelect', id: 'a' });
    expect(s.selection).toEqual(['b']);
    s = editorReducer(s, { type: 'selectAll' });
    expect(s.selection).toEqual(['a', 'b']);
    s = editorReducer(s, { type: 'select', ids: ['zz'] });
    expect(s.selection).toEqual([]);
  });

  it('changes time and asset without creating undo steps', () => {
    let s = initEditor(
      {
        ...emptyDisplay('x'),
        context: { template: 'Pump', element: P101 },
        symbols: [createDataSymbol('value', { id: 'v', x: 0, y: 0 }, [makeItem(P101, 'Flow')])],
      },
      'saved1',
    );
    s = editorReducer(s, { type: 'setTime', timeRange: { start: '*-1h', end: '*' } });
    s = editorReducer(s, { type: 'swapAsset', element: P102 });
    expect(s.past).toHaveLength(0);
    expect(s.dirty).toBe(false);
    const v = s.display.symbols[0];
    expect(v && 'items' in v ? v.items : []).toEqual([makeItem(P102, 'Flow')]);
    expect(s.display.timeRange.start).toBe('*-1h');
  });

  it('keeps the current time range on undo', () => {
    let s = editorReducer(start(), { type: 'add', symbols: [text('a')] });
    s = editorReducer(s, { type: 'setTime', timeRange: { start: 't', end: '*' } });
    s = editorReducer(s, { type: 'undo' });
    expect(s.display.timeRange.start).toBe('t');
  });

  it('records a save', () => {
    let s = editorReducer(start(), { type: 'add', symbols: [text('a')] });
    s = editorReducer(s, { type: 'saved', id: 'd_1', name: 'Mine' });
    expect(s).toMatchObject({ savedId: 'd_1', dirty: false });
    expect(s.display.name).toBe('Mine');
  });
});
