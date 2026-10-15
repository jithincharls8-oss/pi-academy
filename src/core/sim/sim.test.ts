import { describe, expect, it } from 'vitest';
import { seededRandom } from '../random/prng';
import {
  applyCompression,
  applyException,
  interpolate,
  maxReconstructionError,
  type TimedValue,
} from './compression';
import { parsePiTime, parseTimeRange, TimeParseError } from './time';

const series = (vals: number[], stepS = 10): TimedValue[] =>
  vals.map((v, i) => ({ t: i * stepS * 1000, v }));

const COMP = { compressing: true, compDev: 0.5, compMin: 0, compMax: 28800 };

describe('exception', () => {
  it('sends only changes beyond ExcDev, plus the held previous value', () => {
    const out = applyException(series([10, 10.1, 10.2, 12, 12.1]), {
      excDev: 1,
      excMin: 0,
      excMax: 600,
    });
    expect(out.map((p) => p.v)).toEqual([10, 10.2, 12]);
  });
  it('forces a value after ExcMax even inside the deadband', () => {
    const out = applyException(series([5, 5, 5, 5], 300), { excDev: 1, excMin: 0, excMax: 600 });
    expect(out.map((p) => p.t / 1000)).toEqual([0, 300, 600]);
  });
  it('ExcMin blocks values and never forces one', () => {
    const quiet = applyException(series([0, 0, 0], 10), { excDev: 1, excMin: 15, excMax: 0 });
    expect(quiet.map((p) => p.v)).toEqual([0]);
    // 5 arrives too soon and is held; it is sent later only as the previous value of 10.
    const out = applyException(series([0, 5, 10], 10), { excDev: 1, excMin: 15, excMax: 0 });
    expect(out.map((p) => p.t / 1000)).toEqual([0, 10, 20]);
  });
  it('all zero settings disable exception', () => {
    const s = series([1, 1, 1]);
    expect(applyException(s, { excDev: 0, excMin: 0, excMax: 0 })).toHaveLength(3);
  });
});

describe('swinging-door compression', () => {
  it('drops identical values even with CompDev = 0', () => {
    const { archived } = applyCompression(series(Array(50).fill(42)), { ...COMP, compDev: 0 });
    expect(archived.length).toBeLessThanOrEqual(2);
  });
  it('keeps a straight ramp as its two ends', () => {
    const { archived } = applyCompression(series(Array.from({ length: 100 }, (_, i) => i)), COMP);
    expect(archived).toHaveLength(2);
  });
  it('keeps the corner of a step change', () => {
    const vals = [...Array(20).fill(0), ...Array(20).fill(10)];
    const { archived } = applyCompression(series(vals), COMP);
    expect(archived.map((p) => p.v)).toEqual([0, 0, 10, 10]);
  });
  it('Compressing = 0 archives every event', () => {
    const s = series([1, 1, 1, 1]);
    expect(applyCompression(s, { ...COMP, compressing: false }).archived).toHaveLength(4);
  });
  it('CompMax forces an archived value', () => {
    const { archived } = applyCompression(series(Array(100).fill(1), 60), {
      ...COMP,
      compMax: 600,
    });
    expect(archived.length).toBeGreaterThanOrEqual(10);
  });
  it('redraws noisy data within CompDev and stores far fewer events', () => {
    const rand = seededRandom('noise');
    const vals = Array.from(
      { length: 2000 },
      (_, i) => 50 + 10 * Math.sin(i / 100) + (rand() - 0.5) * 0.5,
    );
    const raw = series(vals);
    const { archived } = applyCompression(raw, COMP);
    expect(archived.length).toBeLessThan(raw.length / 3);
    expect(maxReconstructionError(raw, archived)).toBeLessThanOrEqual(COMP.compDev + 1e-9);
  });
  it('interpolates between archived events', () => {
    expect(interpolate(series([0, 10]), 5000)).toBe(5);
    expect(interpolate(series([0, 10]), 5000, true)).toBe(0);
    expect(interpolate(series([0, 10]), -1)).toBeNull();
  });
});

describe('PI time expressions', () => {
  const now = new Date(2026, 9, 15, 14, 30, 0).getTime(); // Thu 15 Oct 2026 14:30 local
  const at = (y: number, mo: number, d: number, h = 0, mi = 0) =>
    new Date(y, mo - 1, d, h, mi).getTime();
  it('reads reference times and offsets', () => {
    expect(parsePiTime('*', now)).toBe(now);
    expect(parsePiTime('*-8h', now)).toBe(now - 8 * 3600_000);
    expect(parsePiTime('t', now)).toBe(at(2026, 10, 15));
    expect(parsePiTime('t+8h', now)).toBe(at(2026, 10, 15, 8));
    expect(parsePiTime('y-8h', now)).toBe(at(2026, 10, 13, 16));
    expect(parsePiTime('Yesterday', now)).toBe(at(2026, 10, 14));
    expect(parsePiTime('mon+8h', now)).toBe(at(2026, 10, 12, 8));
    expect(parsePiTime('*-1mo', now)).toBe(at(2026, 9, 15, 14, 30));
    expect(parsePiTime('2026-10-01 06:00', now)).toBe(at(2026, 10, 1, 6));
    expect(parsePiTime('*-1h -30m', now)).toBe(now - 90 * 60_000);
    expect(parsePiTime('', now)).toBe(now);
  });
  it('treats a bare interval as relative to the other end of a range', () => {
    expect(parseTimeRange('-1d', 't', now)).toEqual({
      start: at(2026, 10, 14),
      end: at(2026, 10, 15),
    });
    expect(parseTimeRange('t', '+6h', now)).toEqual({
      start: at(2026, 10, 15),
      end: at(2026, 10, 15, 6),
    });
  });
  it('rejects fractional days and unknown text', () => {
    expect(() => parsePiTime('*-1.5d', now)).toThrow(TimeParseError);
    expect(() => parsePiTime('*-2 fortnights', now)).toThrow(TimeParseError);
    expect(() => parsePiTime('soon', now)).toThrow(TimeParseError);
    expect(parsePiTime('*-1.5h', now)).toBe(now - 90 * 60_000);
  });
});

describe('synthetic plant', () => {
  it('builds a hierarchy whose PI Point attributes all resolve', async () => {
    const { plant, allElements, findPoint } = await import('./plant');
    const m = plant();
    const els = allElements();
    expect(els.length).toBeGreaterThanOrEqual(10);
    const tags = els.flatMap((e) => e.attributes.filter((a) => a.tag).map((a) => a.tag as string));
    expect(tags.length).toBe(m.points.length);
    expect(new Set(tags).size).toBe(tags.length);
    for (const t of tags) expect(findPoint(t.toLowerCase())).toBeDefined();
    expect(els.filter((e) => e.template === 'Pump')).toHaveLength(3);
  });
  it('is deterministic and compresses realistically', async () => {
    const { recorded, scans, snapshot, summary, formatValue } = await import('./data');
    const end = Date.UTC(2026, 9, 15, 12);
    const start = end - 8 * 3_600_000;
    const raw = scans('RB.P101.FLOW', start, end);
    const arc = recorded('RB.P101.FLOW', start, end);
    expect(raw.length).toBe(5761);
    expect(arc.length).toBeGreaterThan(10);
    expect(arc.length).toBeLessThan(raw.length / 2);
    expect(snapshot('RB.P101.FLOW', end)).toEqual(snapshot('RB.P101.FLOW', end));
    const avg = summary('RB.P101.FLOW', start, end, 'Average', end);
    const mn = summary('RB.P101.FLOW', start, end, 'Minimum', end);
    const mx = summary('RB.P101.FLOW', start, end, 'Maximum', end);
    expect(avg).toBeGreaterThanOrEqual(mn);
    expect(avg).toBeLessThanOrEqual(mx);
    expect(['Stopped', 'Running', 'Tripped']).toContain(
      formatValue('RB.P101.STATUS', snapshot('RB.P101.STATUS', end).v),
    );
  });
  it('rejects unknown tags', async () => {
    const { snapshot, UnknownPointError } = await import('./data');
    expect(() => snapshot('NOPE', 0)).toThrow(UnknownPointError);
  });
});

describe('PE / AF expression evaluator', () => {
  const now = Date.UTC(2026, 9, 15, 12);
  const ctx = async () => (await import('./expr')).peContext(now);
  it('handles arithmetic, precedence, comparisons and IF', async () => {
    const { run } = await import('./expr');
    const c = await ctx();
    const v = (s: string) => {
      const r = run(s, c);
      if (!r.ok) throw new Error(r.error);
      return r.value;
    };
    expect(v('1 + 2 * 3 ^ 2')).toEqual({ type: 'number', value: 19 });
    expect(v('-2 ^ 2')).toEqual({ type: 'number', value: -4 });
    expect(v('if 3 > 2 and not (1 = 2) then "yes" else "no"')).toEqual({
      type: 'string',
      value: 'yes',
    });
    expect(v('if 1 > 2 then 1 else if 2 > 1 then 2 else 3')).toEqual({ type: 'number', value: 2 });
    expect(v('Curve(5, (0,0) (10,100))')).toEqual({ type: 'number', value: 50 });
    expect(v('Poly(2, 1, 0.5, 0.25)')).toEqual({ type: 'number', value: 3 });
    expect(v('Concat("P-", 101)')).toEqual({ type: 'string', value: 'P-101' });
    expect(v('NoOutput()')).toEqual({ type: 'nooutput' });
  });
  it('reads plant data with tag functions', async () => {
    const { run } = await import('./expr');
    const c = await ctx();
    const avg = run("TagAvg('RB.P101.FLOW', '*-1h', '*')", c);
    const mx = run("TagMax('RB.P101.FLOW', '*-1h', '*')", c);
    expect(avg.ok && mx.ok).toBe(true);
    if (avg.ok && mx.ok && avg.value.type === 'number' && mx.value.type === 'number') {
      expect(avg.value.value).toBeLessThanOrEqual(mx.value.value);
    }
    const status = run("TagVal('RB.P101.STATUS')", c);
    expect(status.ok && status.value.type).toBe('string');
    const hours = run("TimeEq('RB.P101.STATUS', 't', '*', \"Running\") / 3600", c);
    expect(hours.ok).toBe(true);
    if (hours.ok && hours.value.type === 'number')
      expect(hours.value.value).toBeLessThanOrEqual(24);
  });
  it('reports errors with positions instead of throwing', async () => {
    const { run } = await import('./expr');
    const c = await ctx();
    const r1 = run("TagAvg('NOPE', '*-1h', '*')", c);
    expect(r1).toMatchObject({ ok: false, position: 7 });
    expect(run('1 +', c)).toMatchObject({ ok: false });
    expect(run('Foo(1)', c)).toMatchObject({ ok: false });
    expect(run('1/0', c)).toMatchObject({ ok: false, error: 'Division by zero' });
    expect(run("TagAvg('RB.P101.FLOW', '*-1.5d', '*')", c)).toMatchObject({ ok: false });
  });
});

describe('simulated PI Web API', () => {
  const now = Date.UTC(2026, 9, 15, 12);
  it('navigates from a path to values', async () => {
    const { handle, webId } = await import('./webapi');
    const pt = handle(
      { method: 'GET', url: '/piwebapi/points?path=\\\\PISRV01\\RB.P101.FLOW' },
      now,
    );
    expect(pt.status).toBe(200);
    const body = pt.body as { WebId: string; Name: string };
    expect(body.Name).toBe('RB.P101.FLOW');
    expect(body.WebId).toBe(webId('DP', '\\\\PISRV01\\RB.P101.FLOW'));
    expect(body.WebId.startsWith('P1DP')).toBe(true);
    const rec = handle(
      {
        method: 'GET',
        url: `/piwebapi/streams/${body.WebId}/recorded?startTime=*-1h&endTime=*&maxCount=5`,
      },
      now,
    );
    expect((rec.body as { Items: unknown[] }).Items).toHaveLength(5);
    const sum = handle(
      {
        method: 'GET',
        url: `/piwebapi/streams/${body.WebId}/summary?startTime=*-1h&summaryType=Average&summaryType=Maximum`,
      },
      now,
    );
    expect((sum.body as { Items: { Type: string }[] }).Items.map((i) => i.Type)).toEqual([
      'Average',
      'Maximum',
    ]);
  });
  it('supports elements, attributes, selectedFields and stream sets', async () => {
    const { handle, exampleRequests } = await import('./webapi');
    for (const ex of exampleRequests()) {
      const r = handle({ method: 'GET', url: ex.url }, now);
      expect(r.status, ex.label).toBe(200);
    }
    const names = handle({ method: 'GET', url: exampleRequests()[8]!.url }, now).body as {
      Items: Record<string, unknown>[];
    };
    expect(Object.keys(names.Items[0]!)).toEqual(['Name', 'WebId']);
  });
  it('returns PI Web API style errors', async () => {
    const { handle } = await import('./webapi');
    expect(handle({ method: 'GET', url: '/piwebapi/streams/garbage/value' }, now).status).toBe(400);
    expect(
      handle({ method: 'GET', url: '/piwebapi/points?path=\\\\PISRV01\\NOPE' }, now).status,
    ).toBe(404);
    expect(handle({ method: 'DELETE', url: '/piwebapi/points' }, now).status).toBe(405);
    const bad = handle({ method: 'GET', url: '/nope' }, now);
    expect(bad.body).toMatchObject({ Errors: [expect.any(String)] });
  });
});
