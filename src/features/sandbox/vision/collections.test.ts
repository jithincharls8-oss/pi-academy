import { describe, expect, it } from 'vitest';
import {
  cellSize,
  collectionRect,
  commonElement,
  fromCollection,
  membersFor,
  passesFilter,
  toCollection,
} from './collections';
import { createDataSymbol, createText } from './factory';
import { makeItem } from './model';

const P101 = '\\\\AFSRV01\\Riverbend\\Riverbend Plant\\Process\\P-101';
const P102 = '\\\\AFSRV01\\Riverbend\\Riverbend Plant\\Process\\P-102';

const flow = createDataSymbol('value', { id: 'v1', x: 100, y: 200 }, [makeItem(P101, 'Flow')]);
const vib = createDataSymbol('value', { id: 'v2', x: 300, y: 200 }, [makeItem(P101, 'Vibration')]);

describe('collections', () => {
  it('finds the single element shared by a selection', () => {
    expect(commonElement([flow, vib, createText({ id: 't', x: 0, y: 0 })])).toBe(P101);
    const other = createDataSymbol('value', { id: 'v3', x: 0, y: 0 }, [makeItem(P102, 'Flow')]);
    expect(commonElement([flow, other])).toBeNull();
  });

  it('converts to a collection with relative member positions and back', () => {
    const c = toCollection([flow, vib], P101, 'Pump', '\\\\AFSRV01');
    expect(c).not.toBeNull();
    if (!c) return;
    expect(c).toMatchObject({ x: 100, y: 200, source: P101 });
    expect(c.members.map((m) => [m.x, m.y])).toEqual([
      [0, 0],
      [200, 0],
    ]);
    const back = fromCollection(c);
    expect(back.map((m) => [m.x, m.y])).toEqual([
      [100, 200],
      [300, 200],
    ]);
  });

  it('lays copies out in a grid and rebinds them to each element', () => {
    const c = toCollection([flow, vib], P101, 'Pump', '');
    if (!c) throw new Error('no collection');
    const cell = cellSize(c);
    expect(cell).toEqual({ w: 200 + 180 + 20, h: 60 + 20 });
    const second = membersFor({ ...c, columns: 1 }, P102, 1);
    expect(second[0]).toMatchObject({ x: 0, y: cell.h, items: [makeItem(P102, 'Flow')] });
    expect(collectionRect({ ...c, columns: 2 }, 3)).toMatchObject({ w: 2 * cell.w, h: 2 * cell.h });
  });

  it('filters by attribute value', () => {
    expect(passesFilter(60, '>', '50')).toBe(true);
    expect(passesFilter(40, '>', '50')).toBe(false);
    expect(passesFilter(40, '<', '50')).toBe(true);
    expect(passesFilter('Running', '=', 'running')).toBe(true);
    expect(passesFilter(null, '=', '1')).toBe(false);
  });
});
