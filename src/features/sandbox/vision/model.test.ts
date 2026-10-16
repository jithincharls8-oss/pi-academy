import { describe, expect, it } from 'vitest';
import {
  emptyDisplay,
  isRelative,
  itemLabel,
  makeItem,
  parseDisplay,
  parseItem,
  serializeDisplay,
  swapAsset,
  swapPath,
  type Display,
} from './model';
import { createDataSymbol, createText } from './factory';
import { EXAMPLES } from './examples';

const P101 = '\\\\AFSRV01\\Riverbend\\Riverbend Plant\\Process\\P-101';
const P102 = '\\\\AFSRV01\\Riverbend\\Riverbend Plant\\Process\\P-102';

describe('data items', () => {
  it('round-trips element path and attribute', () => {
    const item = makeItem(P101, 'Flow');
    expect(parseItem(item)).toEqual({ element: P101, attribute: 'Flow' });
    expect(itemLabel(item)).toBe('P-101 Flow');
  });
  it('rejects malformed items', () => {
    expect(parseItem('no-bar')).toBeNull();
    expect(parseItem('|Flow')).toBeNull();
    expect(parseItem(`${P101}|`)).toBeNull();
  });
});

describe('asset swap path rewriting', () => {
  it('swaps the element and paths below it, case-insensitively', () => {
    expect(swapPath(P101, P101, P102)).toBe(P102);
    expect(swapPath(`${P101}\\Motor`, P101.toLowerCase(), P102)).toBe(`${P102}\\Motor`);
  });
  it('leaves sibling elements with a shared prefix alone', () => {
    expect(swapPath(`${P101}0`, P101, P102)).toBe(`${P101}0`);
  });
  it('rewrites only symbols bound to the context element', () => {
    const d: Display = {
      ...emptyDisplay('t'),
      context: { template: 'Pump', element: P101 },
      symbols: [
        createDataSymbol('trend', { id: 'a', x: 0, y: 0 }, [
          makeItem(P101, 'Flow'),
          makeItem(P102, 'Flow'),
        ]),
        createText({ id: 'b', x: 0, y: 0 }),
      ],
    };
    const out = swapAsset(d, P102);
    expect(out.context?.element).toBe(P102);
    const trend = out.symbols[0];
    expect(trend && 'items' in trend ? trend.items : []).toEqual([
      makeItem(P102, 'Flow'),
      makeItem(P102, 'Flow'),
    ]);
    expect(out.symbols[1]).toBe(d.symbols[1]);
    expect(isRelative(makeItem(P102, 'Flow'), out)).toBe(true);
  });
  it('is a no-op without a context or for the same element', () => {
    const d = emptyDisplay('x');
    expect(swapAsset(d, P102)).toBe(d);
    const c = { ...d, context: { template: 'Pump', element: P101 } };
    expect(swapAsset(c, P101)).toBe(c);
  });
});

describe('saved display validation', () => {
  it('accepts a serialised display', () => {
    const d = EXAMPLES[0]?.build();
    expect(d).toBeDefined();
    if (!d) return;
    const r = parseDisplay(serializeDisplay(d));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.display).toEqual(d);
  });
  it('rejects invalid JSON and wrong shapes with a message', () => {
    expect(parseDisplay('{oops')).toEqual({
      ok: false,
      error: 'The saved display is not valid JSON.',
    });
    const bad = parseDisplay(
      JSON.stringify({ ...emptyDisplay('x'), symbols: [{ kind: 'value', id: 'a' }] }),
    );
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.error).toMatch(/symbols\.0/);
    const ver = parseDisplay(JSON.stringify({ ...emptyDisplay('x'), version: 9 }));
    expect(ver.ok).toBe(false);
  });
  it('rejects colours outside the token palette', () => {
    const d = emptyDisplay('x');
    const text = { ...createText({ id: 't', x: 0, y: 0 }), color: 'hotpink' };
    expect(parseDisplay(JSON.stringify({ ...d, symbols: [text] })).ok).toBe(false);
  });
});
