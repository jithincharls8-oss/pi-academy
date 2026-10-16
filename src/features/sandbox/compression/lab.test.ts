import { describe, expect, it } from 'vitest';
import { DEFAULT_SIGNAL, PRESETS, explainStep, generateSignal, runLab } from './lab';

const START = new Date('2026-10-15T08:00:00').getTime();
const preset = (id: string) => {
  const p = PRESETS.find((x) => x.id === id);
  if (!p) throw new Error(id);
  return { p, r: runLab(generateSignal(p.signal, START), p.exc, p.comp) };
};

describe('generateSignal', () => {
  it('is deterministic and sampled at the scan rate', () => {
    const a = generateSignal(DEFAULT_SIGNAL, START);
    const b = generateSignal(DEFAULT_SIGNAL, START);
    expect(a).toEqual(b);
    expect(a).toHaveLength(60 * 12 + 1);
    expect(a[1]!.t - a[0]!.t).toBe(5000);
  });

  it('applies the step and the ramp', () => {
    const s = generateSignal(
      { ...DEFAULT_SIGNAL, sineAmp: 0, noise: 0, stepAtMin: 10, stepSize: 5, rampPerHour: 6 },
      START,
    );
    expect(s[0]!.v).toBe(50);
    const at10 = s.find((x) => x.t === START + 600_000)!;
    expect(at10.v).toBeCloseTo(50 + 5 + 1, 6);
    expect(s[s.length - 1]!.v).toBeCloseTo(50 + 5 + 6, 6);
  });
});

describe('presets teach the pitfalls', () => {
  it('CompDev = 0 still drops flat lines', () => {
    const { r } = preset('compdev-zero');
    expect(r.stats.sent).toBe(r.stats.raw);
    expect(r.stats.archived).toBeLessThanOrEqual(5);
    expect(r.stats.maxErrorRaw).toBe(0);
  });

  it('Compressing = 0 keeps everything', () => {
    const { r } = preset('compressing-off');
    expect(r.stats.archived).toBe(r.stats.raw);
    expect(r.stats.totalReduction).toBe(0);
    expect(r.stats.ratio).toBe(1);
  });

  it('ExcMin only blocks values and never forces one', () => {
    const { p, r } = preset('excmin-blocks');
    expect(r.stats.sent).toBeLessThan(r.stats.raw / 2);
    // ExcMin never forces a value: a flat signal with ExcMin set sends only its first value.
    const flatRaw = generateSignal({ ...p.signal, sineAmp: 0, noise: 0, stepSize: 0 }, START);
    const flatRun = runLab(flatRaw, { excDev: 1, excMin: 30, excMax: 0 }, p.comp);
    expect(flatRun.stats.sent).toBe(1);
    const noExcMin = runLab(r.raw, { ...p.exc, excMin: 0 }, p.comp);
    expect(noExcMin.stats.sent).toBeGreaterThan(r.stats.sent);
  });

  it('CompMax forces a value on a flat line', () => {
    const { r } = preset('compmax-forces');
    // 60 minutes / 5 minutes = 12 forced events, plus the first and the final snapshot.
    expect(r.stats.archived).toBeGreaterThanOrEqual(12);
    expect(r.stats.archived).toBeLessThanOrEqual(14);
    const gaps = r.archived.slice(1).map((e, i) => e.t - r.archived[i]!.t);
    expect(Math.max(...gaps)).toBeLessThanOrEqual(300_000);
  });

  it('A too-wide deadband hides a real change', () => {
    const { p, r } = preset('too-wide');
    expect(r.stats.maxErrorRaw).toBeGreaterThan(p.signal.stepSize / 2);
    const tight = runLab(
      r.raw,
      { excDev: 0.1, excMin: 0, excMax: 600 },
      { ...p.comp, compDev: 0.2 },
    );
    expect(tight.stats.maxErrorRaw).toBeLessThan(r.stats.maxErrorRaw);
  });

  it('keeps the reconstruction within CompDev of the sent events', () => {
    for (const p of PRESETS) {
      const r = runLab(generateSignal(p.signal, START), p.exc, p.comp);
      if (p.comp.compressing)
        expect(r.stats.maxErrorSent).toBeLessThanOrEqual(p.comp.compDev + 1e-9);
      expect(r.stats.archived).toBeLessThanOrEqual(r.stats.sent);
      expect(r.stats.sent).toBeLessThanOrEqual(r.stats.raw);
    }
  });
});

describe('explainStep', () => {
  it('names held, door-broken, CompMax, CompMin and compression-off steps', () => {
    const { p, r } = preset('rule-of-thumb');
    const kinds = new Set(r.steps.map((s) => explainStep(s, p.comp).kind));
    expect(kinds.has('held')).toBe(true);
    expect(kinds.has('door-broken')).toBe(true);
    const cm = preset('compmax-forces');
    expect(cm.r.steps.some((s) => explainStep(s, cm.p.comp).kind === 'compmax')).toBe(true);
    const off = preset('compressing-off');
    expect(explainStep(off.r.steps[0]!, off.p.comp).kind).toBe('kept-all');
    const withMin = { ...p.comp, compMin: 60 };
    const rm = runLab(r.raw, p.exc, withMin);
    expect(rm.steps.some((s) => explainStep(s, withMin).kind === 'compmin')).toBe(true);
  });
});
