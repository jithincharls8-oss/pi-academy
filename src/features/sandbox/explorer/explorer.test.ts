import { describe, expect, it } from 'vitest';
import { allElements, findElement, plant, unitState } from '@/core/sim/plant';
import {
  checkedInValue,
  checkedOutObjects,
  checkoutReducer,
  effectiveValue,
  field,
  INITIAL_CHECKOUT,
  isCheckedOut,
} from './checkout';
import {
  formatPiPointConfig,
  parseFormulaConfig,
  parsePiPointConfig,
  substitute,
} from './configString';
import { attributeValue, parentMap, resolveAttributePath, workingElement } from './afContext';
import {
  analysisInputs,
  evaluateAnalysis,
  exampleAnalyses,
  previewAnalysis,
  thin,
  triggerTimes,
  type AnalysisDef,
} from './analyses';
import {
  applyNamingPattern,
  findStateIntervals,
  formatDuration,
  searchEventFrames,
  TRIPPED,
  wildcardMatch,
} from './eventFrames';

const P101 = findElement('P101')!;
const B100 = findElement('B100')!;
const parents = parentMap(plant().root);
const scopeOf = (e = P101) => ({ element: e, parentOf: (x: typeof e) => parents.get(x.id) });
const NOW = Date.UTC(2026, 9, 15, 12, 0, 0);

describe('check-out reducer', () => {
  it('an edit checks the object out and only you see it until check-in', () => {
    const s = checkoutReducer(INITIAL_CHECKOUT, {
      type: 'edit',
      object: 'P101',
      field: field.description,
      value: 'Feed pump A (new seal)',
    });
    expect(isCheckedOut(s, 'P101')).toBe(true);
    expect(effectiveValue(s, 'P101', field.description)).toBe('Feed pump A (new seal)');
    expect(checkedInValue(s, 'P101', field.description)).toBeUndefined();
    const c = checkoutReducer(s, { type: 'checkIn', objects: ['P101'], at: 5 });
    expect(isCheckedOut(c, 'P101')).toBe(false);
    expect(checkedInValue(c, 'P101', field.description)).toBe('Feed pump A (new seal)');
    expect(c.history[0]).toEqual({ at: 5, objects: ['P101'], changes: 1 });
  });

  it('undo check out restores the last checked-in value', () => {
    let s = checkoutReducer(INITIAL_CHECKOUT, {
      type: 'edit',
      object: 'P101',
      field: field.value('Rated Flow'),
      value: 150,
    });
    s = checkoutReducer(s, { type: 'checkIn', objects: ['P101'], at: 1 });
    s = checkoutReducer(s, {
      type: 'edit',
      object: 'P101',
      field: field.value('Rated Flow'),
      value: 99,
    });
    expect(effectiveValue(s, 'P101', field.value('Rated Flow'))).toBe(99);
    s = checkoutReducer(s, { type: 'undoCheckOut', objects: ['P101'] });
    expect(effectiveValue(s, 'P101', field.value('Rated Flow'))).toBe(150);
    expect(checkedOutObjects(s)).toEqual([]);
  });

  it('check-in of an object that is not checked out changes nothing; reset clears all', () => {
    const s = checkoutReducer(INITIAL_CHECKOUT, { type: 'checkIn', objects: ['X'], at: 1 });
    expect(s).toBe(INITIAL_CHECKOUT);
    const e = checkoutReducer(s, { type: 'edit', object: 'A', field: 'f', value: 'v' });
    expect(checkoutReducer(e, { type: 'reset' })).toEqual(INITIAL_CHECKOUT);
  });
});

describe('config strings', () => {
  it('parses and formats PI Point config strings', () => {
    const c = parsePiPointConfig('\\\\PISRV01\\RB.P101.FLOW;ReadOnly=False');
    expect(c).toEqual({ server: 'PISRV01', tag: 'RB.P101.FLOW', options: ['ReadOnly=False'] });
    expect(formatPiPointConfig(c!)).toBe('\\\\PISRV01\\RB.P101.FLOW;ReadOnly=False');
    expect(parsePiPointConfig('RB.P101.FLOW', 'PISRV01')?.server).toBe('PISRV01');
    expect(parsePiPointConfig('')).toBeNull();
  });

  it('parses Formula config strings', () => {
    expect(parseFormulaConfig('A=Flow;B=Rated Flow;[A/B*100]')).toEqual({
      vars: { A: 'Flow', B: 'Rated Flow' },
      expr: 'A/B*100',
    });
    expect(parseFormulaConfig('A=Flow')).toBeNull();
  });

  it('substitutes template parameters for an element', () => {
    const r = substitute('\\\\%Server%\\%Database%.%..\\Element%.%Element%.%Attribute%;%Nope%', {
      server: 'PISRV01',
      database: 'Riverbend',
      element: P101,
      parent: parents.get(P101.id) ?? null,
      attribute: 'Flow',
    });
    expect(r.text).toBe('\\\\PISRV01\\Riverbend.Process.P-101.Flow;%Nope%');
    expect(r.unresolved).toEqual(['%Nope%']);
  });

  it('substitutes attribute values with %@Name% and %@..\\|Name%', () => {
    const site = plant().root;
    const process = parents.get(P101.id)!;
    const r = substitute('%@Model%-%@|Model%-%@..\\|Name%', {
      server: 'S',
      database: 'D',
      element: P101,
      parent: process,
      attribute: 'X',
      attributeText: (el, name) =>
        name === 'Name' ? el.name : String(el.attributes.find((a) => a.name === name)?.value),
    });
    expect(r.text).toBe('GP-150-GP-150-Process');
    expect(site.name).toBe('Riverbend Plant');
  });
});

describe('AF context', () => {
  it('resolves attribute paths including parent references', () => {
    expect(resolveAttributePath(scopeOf(), 'Flow')?.attribute.name).toBe('Flow');
    expect(resolveAttributePath(scopeOf(), '|rated flow')?.attribute.name).toBe('Rated Flow');
    expect(resolveAttributePath(scopeOf(B100), '..\\..|Ambient Temperature')?.element.id).toBe(
      'SITE',
    );
    expect(resolveAttributePath(scopeOf(B100), '..|Ambient Temperature')).toBeNull();
    expect(resolveAttributePath(scopeOf(), 'Nope')).toBeNull();
  });

  it('computes Formula attributes from their variables', () => {
    const flow = attributeValue(scopeOf(), 'Flow', NOW);
    const eff = attributeValue(scopeOf(), 'Flow Efficiency', NOW);
    expect(flow.ok && eff.ok).toBe(true);
    if (flow.ok && eff.ok && flow.value.type === 'number' && eff.value.type === 'number') {
      expect(eff.value.value).toBeCloseTo((flow.value.value / 140) * 100, 6);
    }
  });

  it('applies edits in the working copy: static values and a re-pointed PI Point', () => {
    let s = checkoutReducer(INITIAL_CHECKOUT, {
      type: 'edit',
      object: 'P101',
      field: field.value('Rated Flow'),
      value: 280,
    });
    s = checkoutReducer(s, {
      type: 'edit',
      object: 'P101',
      field: field.config('Flow'),
      value: '\\\\PISRV01\\RB.P102.FLOW;ReadOnly=False',
    });
    const w = workingElement(P101, s);
    expect(w.attributes.find((a) => a.name === 'Flow')?.tag).toBe('RB.P102.FLOW');
    const scope = { element: w, parentOf: (x: typeof w) => parents.get(x.id) };
    const flow = attributeValue(scope, 'Flow', NOW);
    const p102 = attributeValue(scopeOf(findElement('P102')!), 'Flow', NOW);
    expect(flow).toEqual(p102);
    expect(attributeValue(scope, 'Rated Flow', NOW)).toEqual({
      ok: true,
      value: { type: 'number', value: 280 },
    });
  });

  it('reports a missing PI point as an attribute error', () => {
    const s = checkoutReducer(INITIAL_CHECKOUT, {
      type: 'edit',
      object: 'P101',
      field: field.config('Flow'),
      value: '\\\\PISRV01\\RB.NOPE;ReadOnly=False',
    });
    const w = workingElement(P101, s);
    const r = attributeValue({ element: w, parentOf: () => undefined }, 'Flow', NOW);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('RB.NOPE');
  });
});

describe('analyses', () => {
  const examples = exampleAnalyses(P101);
  const byName = (n: string): AnalysisDef => examples.find((a) => a.name === n)!;

  it('every example analysis evaluates without errors on its element', () => {
    for (const e of allElements()) {
      for (const a of exampleAnalyses(e)) {
        const res = evaluateAnalysis(a, scopeOf(e), NOW);
        for (const r of res) expect(r.ok, `${e.name} / ${a.name}: ${JSON.stringify(r)}`).toBe(true);
      }
    }
  });

  it('later rows use earlier variables', () => {
    const res = evaluateAnalysis(byName('Running Hours Today'), scopeOf(), NOW);
    const [sec, hrs] = res;
    if (sec?.ok && hrs?.ok && sec.value.type === 'number' && hrs.value.type === 'number') {
      expect(hrs.value.value).toBeCloseTo(sec.value.value / 3600, 9);
    } else throw new Error('expected numbers');
  });

  it('reports syntax and reference errors with positions', () => {
    const def: AnalysisDef = {
      ...byName('Flow Efficiency'),
      rows: [
        { id: 'a', name: 'A', expression: "'Flow' * ", output: null },
        { id: 'b', name: 'B', expression: "'Missing' + 1", output: null },
        { id: 'c', name: '2bad', expression: '1', output: null },
        { id: 'd', name: 'A', expression: '1', output: null },
      ],
    };
    const [a, b, c, d] = evaluateAnalysis(def, scopeOf(), NOW);
    expect(a).toMatchObject({ ok: false, position: 9 });
    expect(b).toMatchObject({ ok: false, position: 0 });
    expect(c?.ok).toBe(false);
    expect(d).toMatchObject({ ok: false, error: 'Variable "A" is defined twice' });
  });

  it('finds inputs and trigger times', () => {
    const eff = byName('Flow Efficiency');
    expect(analysisInputs(eff, scopeOf()).sort()).toEqual(['Flow', 'Rated Flow', 'Status']);
    const periodic = byName('Running Hours Today');
    const start = NOW - 3_600_000;
    const times = triggerTimes(periodic, scopeOf(), start, NOW, NOW);
    expect(times).toHaveLength(7);
    for (const t of times) expect(t % 600_000).toBe(0);
    const ev = triggerTimes(eff, scopeOf(), start, NOW, NOW, 40);
    expect(ev.length).toBeGreaterThan(0);
    expect(ev.length).toBeLessThanOrEqual(40);
  });

  it('previews results over a range', () => {
    const p = previewAnalysis(
      byName('Hourly Average Flow'),
      scopeOf(),
      NOW - 4 * 3_600_000,
      NOW,
      NOW,
    );
    expect(p.times).toHaveLength(5);
    expect(p.results.every((r) => r[0]?.ok)).toBe(true);
  });

  it('thins long time lists evenly, keeping the ends', () => {
    const t = Array.from({ length: 1000 }, (_, i) => i);
    const out = thin(t, 10);
    expect(out[0]).toBe(0);
    expect(out[out.length - 1]).toBe(999);
    expect(out.length).toBeLessThanOrEqual(10);
  });
});

describe('event frames', () => {
  it('finds state intervals, including an open one', () => {
    const v = [
      { t: 0, v: 1 },
      { t: 10, v: 2 },
      { t: 20, v: 2 },
      { t: 30, v: 1 },
      { t: 40, v: 2 },
    ];
    expect(findStateIntervals(v, TRIPPED)).toEqual([
      { start: 10, end: 30 },
      { start: 40, end: null },
    ]);
  });

  it('matches wildcards and applies naming patterns', () => {
    expect(wildcardMatch('P-10*', 'P-101')).toBe(true);
    expect(wildcardMatch('p-10?', 'P-102')).toBe(true);
    expect(wildcardMatch('K*', 'P-101')).toBe(false);
    expect(wildcardMatch('', 'anything')).toBe(true);
    const start = new Date(2026, 9, 15, 3, 4, 5).getTime();
    expect(
      applyNamingPattern('%TEMPLATE% - %ELEMENT% - %STARTTIME:yyyy-MM-dd HH:mm:ss%', {
        template: 'Pump Trip',
        element: 'P-101',
        start,
      }),
    ).toBe('Pump Trip - P-101 - 2026-10-15 03:04:05');
    expect(formatDuration(3_725_000)).toBe('1:02:05');
  });

  it('pump trip frames match the simulated pump state', () => {
    const start = NOW - 30 * 86_400_000;
    const frames = searchEventFrames({
      start,
      end: NOW,
      now: NOW,
      template: 'Pump Trip',
      elementName: '*',
      name: '*',
      elements: allElements(),
    });
    expect(frames.length).toBeGreaterThan(0);
    for (const f of frames) {
      expect(f.element.template).toBe('Pump');
      const unit = f.element.id;
      const end = f.end ?? NOW;
      expect(unitState(unit, Math.round((f.start + end) / 2))).toBe(2);
      // the trip lasts 20 to 50 minutes in the plant model (allowing for scan coarsening)
      if (f.end) {
        const mins = (f.end - f.start) / 60_000;
        expect(mins).toBeGreaterThan(18);
        expect(mins).toBeLessThan(52);
      }
    }
    const sorted = [...frames].sort((a, b) => b.start - a.start);
    expect(frames).toEqual(sorted);
  });

  it('filters by element name', () => {
    const frames = searchEventFrames({
      start: NOW - 30 * 86_400_000,
      end: NOW,
      now: NOW,
      template: null,
      elementName: 'K-*',
      name: '*',
      elements: allElements(),
    });
    expect(frames.length).toBeGreaterThan(0);
    for (const f of frames) expect(f.template).toBe('Compressor Trip');
  });
});
