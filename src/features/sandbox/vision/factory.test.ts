import { describe, expect, it } from 'vitest';
import { findElement } from '@/core/sim/plant';
import { addItemTo, createDataSymbol, removeItemAt, symbolForElement } from './factory';
import { makeItem } from './model';

const pump = findElement('P101');
const P = pump?.path ?? '';

describe('symbolForElement', () => {
  it('creates a table of the element attributes by default', () => {
    if (!pump) throw new Error('missing P-101');
    const { symbol, note } = symbolForElement('value', pump, { id: 'x', x: 0, y: 0 });
    expect(symbol.kind).toBe('table');
    expect('items' in symbol && symbol.items).toContain(makeItem(P, 'Flow Efficiency'));
    expect(note).toMatch(/Table of 7 attributes of P-101/);
  });
  it('creates a trend of numeric attributes when Trend is the default', () => {
    if (!pump) throw new Error('missing P-101');
    const { symbol } = symbolForElement('trend', pump, { id: 'x', x: 0, y: 0 });
    expect(symbol.kind).toBe('trend');
    expect('items' in symbol ? symbol.items : []).toHaveLength(4);
    expect('items' in symbol ? symbol.items : []).not.toContain(makeItem(P, 'Status'));
  });
  it('creates template-based tables', () => {
    if (!pump) throw new Error('missing P-101');
    const at = { id: 'x', x: 0, y: 0 };
    const cmp = symbolForElement('assetTable', pump, at).symbol;
    expect(cmp).toMatchObject({ kind: 'assetTable', template: 'Pump' });
    const ev = symbolForElement('eventTable', pump, at, {
      attribute: 'Status',
      state: 'Tripped',
    }).symbol;
    expect(ev).toMatchObject({ kind: 'eventTable', attribute: 'Status', state: 'Tripped' });
  });
});

describe('addItemTo', () => {
  const flow = makeItem(P, 'Flow');
  const amps = makeItem(P, 'Motor Current');
  it('adds a trace with the next series colour', () => {
    const t = createDataSymbol('trend', { id: 't', x: 0, y: 0 }, [flow]);
    const out = addItemTo(t, amps);
    expect(out?.kind === 'trend' && out.traceColors).toEqual(['chart-1', 'chart-2']);
    expect(out && addItemTo(out, amps)).toBeNull();
  });
  it('replaces the item on single-item symbols and sets Y on XY plots', () => {
    const v = createDataSymbol('value', { id: 'v', x: 0, y: 0 }, [flow]);
    expect(addItemTo(v, amps)).toMatchObject({ items: [amps] });
    const xy = createDataSymbol('xy', { id: 'x', x: 0, y: 0 }, [flow, flow]);
    expect(addItemTo(xy, amps)).toMatchObject({ items: [flow, amps] });
  });
  it('cannot add to text or comparison tables', () => {
    const a = createDataSymbol('assetTable', { id: 'a', x: 0, y: 0 }, [], {
      template: 'Pump',
      root: '',
    });
    expect(addItemTo(a, flow)).toBeNull();
  });
  it('removes items and keeps trace colours aligned', () => {
    const t = createDataSymbol('trend', { id: 't', x: 0, y: 0 }, [flow, amps]);
    const out = removeItemAt(t, 0);
    expect(out).toMatchObject({ items: [amps], traceColors: ['chart-2'] });
  });
});
