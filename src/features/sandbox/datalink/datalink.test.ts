import { describe, expect, it } from 'vitest';
import { FormulaError, cellKey, colName, parseAddr, parseFormula } from './formula';
import { evaluateSheet, type Cells } from './sheet';
import { display, formatDate, fromSerial, toSerial, type CellValue } from './values';
import { archiveValue, calcValue, compressedEvents, intervalMs } from './functions';
import { buildFormula, specFor, FUNCTION_SPECS } from './specs';
import { pumpReport } from './example';
import { findPoint } from '@/core/sim/plant';
import { interpolated, recorded, snapshot, summary } from '@/core/sim/data';

const NOW = new Date('2026-10-15T10:00:00').getTime();
const H = 3_600_000;

function sheet(cells: Cells) {
  const r = evaluateSheet(cells, { now: NOW });
  const at = (key: string): CellValue => {
    const a = parseAddr(key);
    if (!a) throw new Error(key);
    return r.value(a.col, a.row);
  };
  return { ...r, at, show: (key: string) => display(at(key)) };
}

const numberAt = (v: CellValue): number => {
  if (v.kind !== 'number') throw new Error(`expected number, got ${JSON.stringify(v)}`);
  return v.value;
};

describe('addresses', () => {
  it('converts columns and cells', () => {
    expect(colName(0)).toBe('A');
    expect(colName(11)).toBe('L');
    expect(colName(26)).toBe('AA');
    expect(cellKey(1, 6)).toBe('B7');
    expect(parseAddr('$C$12')).toEqual({ col: 2, row: 11 });
    expect(parseAddr('A0')).toBeNull();
    expect(parseAddr('hello')).toBeNull();
  });
});

describe('formula parser', () => {
  it('parses precedence like Excel', () => {
    const s = sheet({ A1: '=1+2*3', A2: '=-2^2', A3: '=(1+2)*3', A4: '=2^3^2', A5: '=50%' });
    expect(s.show('A1')).toBe('7');
    expect(s.show('A2')).toBe('4');
    expect(s.show('A3')).toBe('9');
    expect(s.show('A4')).toBe('64');
    expect(s.show('A5')).toBe('0.5');
  });

  it('parses strings with doubled quotes, omitted arguments and ranges', () => {
    const n = parseFormula('PICurrVal("say ""hi""",0,)');
    expect(n).toEqual({
      t: 'call',
      name: 'PICURRVAL',
      args: [{ t: 'str', v: 'say "hi"' }, { t: 'num', v: 0 }, null],
    });
    expect(parseFormula('SUM(B2:A1)')).toEqual({
      t: 'call',
      name: 'SUM',
      args: [{ t: 'range', c1: 0, r1: 0, c2: 1, r2: 1 }],
    });
  });

  it('reports syntax errors with a position', () => {
    expect(() => parseFormula('1+')).toThrow(FormulaError);
    expect(() => parseFormula('"open')).toThrow(/Unclosed/);
    expect(() => parseFormula('SUM(1,2')).toThrow(/Expected/);
    expect(() => parseFormula('hello')).toThrow(/double quotes/);
  });
});

describe('sheet arithmetic', () => {
  it('evaluates references, ranges and Excel functions', () => {
    const s = sheet({
      A1: '2',
      A2: '3',
      A3: 'text',
      A4: '=SUM(A1:A3)',
      B1: '=A1*A2',
      B2: '=AVERAGE(A1:A2)',
      B3: '=MAX(A1:A2)+MIN(A1:A2)',
      B4: '=COUNT(A1:A3)',
      B5: '=ROUND(10/3,2)',
      B6: '=IF(A1>1,"big","small")',
      B7: '="x"&A1',
      B8: '=ABS(-4)',
      B9: '=CONCAT("a",A2)',
    });
    expect(s.show('A4')).toBe('5');
    expect(s.show('B1')).toBe('6');
    expect(s.show('B2')).toBe('2.5');
    expect(s.show('B3')).toBe('5');
    expect(s.show('B4')).toBe('2');
    expect(s.show('B5')).toBe('3.33');
    expect(s.show('B6')).toBe('big');
    expect(s.show('B7')).toBe('x2');
    expect(s.show('B8')).toBe('4');
    expect(s.show('B9')).toBe('a3');
  });

  it('shows Excel errors', () => {
    const s = sheet({
      A1: '=1/0',
      A2: '=A1+1',
      A3: '=A4',
      A4: '=A3',
      A5: '=NOPE(1)',
      A6: '="a"*2',
      A7: '=1+',
    });
    expect(s.show('A1')).toBe('#DIV/0!');
    expect(s.show('A2')).toBe('#DIV/0!');
    expect(s.show('A3')).toBe('#CIRC!');
    expect(s.show('A5')).toBe('#NAME?');
    expect(s.show('A6')).toBe('#VALUE!');
    expect(s.show('A7')).toBe('#NAME?');
  });

  it('keeps a leading apostrophe as text', () => {
    const s = sheet({ A1: "'=1+1", A2: '42', A3: 'TRUE' });
    expect(s.at('A1')).toEqual({ kind: 'string', value: '=1+1' });
    expect(s.at('A2')).toEqual({ kind: 'number', value: 42 });
    expect(s.at('A3')).toEqual({ kind: 'bool', value: true });
  });
});

describe('spilling', () => {
  it('spills arrays down and right and lets other formulas read spilled cells', () => {
    const s = sheet({
      A1: '=PISampDat("RB.P101.FLOW","*-3h","*","1h",1,)',
      D1: '=SUM(B1:B4)',
    });
    expect(s.spills).toEqual([{ anchor: 'A1', col: 0, row: 0, rows: 4, cols: 2, blocked: false }]);
    expect(s.at('A1').kind).toBe('date');
    expect(s.at('B4').kind).toBe('number');
    expect(s.spillOwner(1, 3)).toBe('A1');
    const total = [1, 2, 3, 4].reduce((a, r) => a + numberAt(s.at(`B${r}`)), 0);
    expect(numberAt(s.at('D1'))).toBeCloseTo(total, 6);
  });

  it('shows #SPILL! when typed content blocks the result, and spills again once cleared', () => {
    const blocked = sheet({ A1: '=PISampDat("RB.P101.FLOW","*-3h","*","1h",0,)', A3: 'x' });
    expect(blocked.show('A1')).toBe('#SPILL!');
    expect(blocked.spills[0]?.blocked).toBe(true);
    expect(blocked.show('A2')).toBe('');
    const free = sheet({ A1: '=PISampDat("RB.P101.FLOW","*-3h","*","1h",0,)' });
    expect(free.at('A3').kind).toBe('number');
  });

  it('blocks a later spill that overlaps an earlier one', () => {
    const s = sheet({
      A1: '=PISampDat("RB.P101.FLOW","*-3h","*","1h",0,)',
      B1: '=PISampDat("RB.P102.FLOW","*-3h","*","1h",2,)',
      A6: '=PISampDat("RB.P101.FLOW","*-3h","*","1h",2,)',
    });
    // B1 transposed spills across row 1 to E1: no conflict with column A.
    expect(s.at('E1').kind).toBe('number');
    // A6 spills across row 6, which is free.
    expect(s.at('D6').kind).toBe('number');
    // Content inside a spill area blocks the earlier formula, not the later one.
    const typed = sheet({
      A1: '=PISampDat("RB.P101.FLOW","*-3h","*","1h",1,)',
      B3: '=PISampDat("RB.P102.FLOW","*-3h","*","1h",2,)',
    });
    expect(typed.show('A1')).toBe('#SPILL!');
    expect(typed.at('E3').kind).toBe('number');
    // Two spills crossing in empty cells: the earlier anchor (row-major) wins.
    const crossing = sheet({
      B1: '=PISampDat("RB.P101.FLOW","*-2h","*","1h",0,)',
      A3: '=PISampDat("RB.P102.FLOW","*-2h","*","1h",2,)',
    });
    expect(crossing.at('B3').kind).toBe('number');
    expect(crossing.show('A3')).toBe('#SPILL!');
  });

  it('blocks a spill that would leave the sheet', () => {
    const s = sheet({ A39: '=PISampDat("RB.P101.FLOW","*-3h","*","1h",0,)' });
    expect(s.show('A39')).toBe('#SPILL!');
  });
});

describe('DataLink single-value functions', () => {
  const p = findPoint('RB.P101.FLOW')!;

  it('PICurrVal returns the snapshot, with a timestamp for outcode 1', () => {
    const s = sheet({
      A1: '=PICurrVal("RB.P101.FLOW",0,)',
      A2: '=PICurrVal("RB.P101.FLOW",1,"\\\\PISRV01")',
    });
    expect(numberAt(s.at('A1'))).toBeCloseTo(snapshot(p, NOW).v, 9);
    expect(s.at('A2')).toEqual({ kind: 'date', value: snapshot(p, NOW).t });
    expect(numberAt(s.at('B2'))).toBeCloseTo(snapshot(p, NOW).v, 9);
  });

  it('PICurrVal shows digital states as text and reports unknown tags and servers', () => {
    const s = sheet({
      A1: '=PICurrVal("RB.P101.STATUS",0,)',
      A2: '=PICurrVal("NO.SUCH.TAG",0,)',
      A3: '=PICurrVal("RB.P101.FLOW",0,"OTHERSRV")',
      A4: 'RB.P102.FLOW',
      A5: '=PICurrVal(A4)',
      A6: '=PICurrVal("\\\\PISRV01\\RB.P102.FLOW")',
    });
    expect(s.at('A1').kind).toBe('string');
    expect(s.show('A2')).toMatch(/Tag not found/);
    expect(s.show('A3')).toMatch(/not known/);
    expect(s.show('A5')).toBe(s.show('A6'));
  });

  it('PIArcVal follows the retrieval modes', () => {
    const t = NOW - 2 * H + 1234;
    const ev = recorded(p, t - H, t + H);
    const prev = [...ev].reverse().find((e) => e.t <= t)!;
    const next = ev.find((e) => e.t >= t)!;
    expect(archiveValue(p, t, 'previous', NOW)).toEqual({ kind: 'number', value: prev.v });
    expect(archiveValue(p, t, 'next', NOW)).toEqual({ kind: 'number', value: next.v });
    const interp = numberAt(archiveValue(p, t, 'interpolated', NOW));
    expect(interp).toBeGreaterThanOrEqual(Math.min(prev.v, next.v) - 1e-9);
    expect(interp).toBeLessThanOrEqual(Math.max(prev.v, next.v) + 1e-9);
    expect(archiveValue(p, t, 'exact time', NOW)).toEqual({
      kind: 'error',
      code: 'PI',
      message: 'No events found',
    });
    expect(archiveValue(p, prev.t, 'exact time', NOW)).toEqual({ kind: 'number', value: prev.v });
    expect(archiveValue(p, prev.t, 'previous only', NOW).kind).toBe('number');
    const s = sheet({ A1: '=PIArcVal("RB.P101.FLOW","*-1h",0,,"sideways")' });
    expect(s.show('A1')).toBe('#VALUE!');
  });

  it('PIArcVal auto holds the previous value for step points', () => {
    const step = findPoint('RB.SITE.PRODUCTION.COUNT')!;
    const t = NOW - 3 * H + 777;
    const ev = recorded(step, t - 4 * H, t);
    expect(archiveValue(step, t, 'auto', NOW)).toEqual({
      kind: 'number',
      value: ev[ev.length - 1]!.v,
    });
  });

  it('PIExpVal evaluates a performance equation', () => {
    const s = sheet({
      A1: '=PIExpVal("\'RB.P101.FLOW\'*2","*",)',
      A2: '=PIExpVal("1+","*",)',
      A3: '=PIExpVal("\'RB.P101.STATUS\'","*")',
    });
    expect(numberAt(s.at('A1'))).toBeCloseTo(snapshot(p, NOW).v * 2, 6);
    expect(s.show('A2')).toMatch(/Expression error/);
    expect(s.at('A3').kind).toBe('string');
  });
});

describe('DataLink multiple-value functions', () => {
  const p = findPoint('RB.P101.FLOW')!;

  it('PICompDat returns recorded values, a count unless hidden, and timestamps on bit 1', () => {
    const rec = recorded(p, NOW - 600_000, NOW);
    const s = sheet({ A1: '=PICompDat("RB.P101.FLOW","*-10m","*",0,,"inside")' });
    expect(s.at('A1')).toEqual({ kind: 'number', value: rec.length });
    expect(numberAt(s.at('A2'))).toBe(rec[0]!.v);
    const t = sheet({ A1: '=PICompDat("RB.P101.FLOW","*-10m","*",9,,)' });
    expect(t.at('A1')).toEqual({ kind: 'date', value: rec[0]!.t });
    expect(numberAt(t.at('B1'))).toBe(rec[0]!.v);
    expect(t.spills[0]?.rows).toBe(rec.length);
  });

  it('PICompDat with row orientation spills to the right', () => {
    const s = sheet({ A1: '=PICompDat("RB.P101.FLOW","*-2m","*",10,,)' });
    expect(s.spills[0]?.rows).toBe(1);
    expect(s.at('A1').kind).toBe('number');
  });

  it('compressedEvents honours boundary types and reverse order', () => {
    const s = NOW - 2 * H + 500;
    const e = NOW - H + 500;
    const inside = compressedEvents(p, s, e, 'inside', NOW);
    expect(inside.every((x) => x.t >= s && x.t <= e)).toBe(true);
    const outside = compressedEvents(p, s, e, 'outside', NOW);
    expect(outside[0]!.t).toBeLessThan(s);
    expect(outside[outside.length - 1]!.t).toBeGreaterThan(e);
    const interp = compressedEvents(p, s, e, 'interpolated', NOW);
    expect(interp[0]!.t).toBe(s);
    expect(interp[interp.length - 1]!.t).toBe(e);
    const reversed = compressedEvents(p, e, s, 'inside', NOW);
    expect(reversed.map((x) => x.t)).toEqual(inside.map((x) => x.t).reverse());
  });

  it('PINCompDat counts forward and backward', () => {
    const s = sheet({
      A1: '=PINCompDat("RB.P101.FLOW","*-2h",5,8,,)',
      B1: '=PINCompDat("RB.P101.FLOW","*",-5,9,,)',
    });
    expect(s.spills.map((x) => x.rows)).toEqual([5, 5]);
    const b1 = s.at('B1');
    const b2 = s.at('B2');
    if (b1.kind !== 'date' || b2.kind !== 'date') throw new Error('dates expected');
    expect(b1.value).toBeGreaterThan(b2.value);
  });

  it('PISampDat matches interpolated values and its four outcodes', () => {
    const vals = interpolated(p, NOW - 2 * H, NOW, H, NOW);
    const s = sheet({
      A1: '=PISampDat("RB.P101.FLOW","*-2h","*","1h",0,)',
      C1: '=PISampDat("RB.P101.FLOW","*-2h","*","1h",1,)',
      A10: '=PISampDat("RB.P101.FLOW","*-2h","*","1h",2,)',
      A12: '=PISampDat("RB.P101.FLOW","*-2h","*","1h",3,)',
      A20: '=PISampDat("RB.P101.FLOW","*-2h","*","1h",4,)',
    });
    expect(vals).toHaveLength(3);
    expect(numberAt(s.at('A3'))).toBeCloseTo(vals[2]!.v, 9);
    expect(s.at('C1')).toEqual({ kind: 'date', value: vals[0]!.t });
    expect(numberAt(s.at('C10'))).toBeCloseTo(vals[2]!.v, 9);
    expect(s.at('A12').kind).toBe('date');
    expect(s.at('A13').kind).toBe('number');
    expect(s.show('A20')).toBe('#VALUE!');
  });

  it('PITimeDat reads values at the timestamps in a range, in its orientation', () => {
    const s = sheet({
      A1: '=PISampDat("RB.P101.FLOW","*-2h","*","1h",1,)',
      D1: '=PITimeDat("RB.P101.FLOW",A1:A3,,"interpolated")',
      A6: '*-90m',
      B6: '*-30m',
      A7: '=PITimeDat("RB.P101.FLOW",A6:B6)',
      A9: '=PITimeDat("RB.P101.FLOW",A1:A3,,"exact time")',
    });
    for (const r of [1, 2, 3])
      expect(numberAt(s.at(`D${r}`))).toBeCloseTo(numberAt(s.at(`B${r}`)), 6);
    expect(s.spills.find((x) => x.anchor === 'A7')).toMatchObject({ rows: 1, cols: 2 });
    expect(s.show('A9')).toBe('No events found');
  });
});

describe('DataLink calculation functions', () => {
  const p = findPoint('RB.P101.FLOW')!;
  const start = new Date('2026-10-15T00:00:00').getTime();

  it('PIAdvCalcVal matches the time-weighted summary and applies cfactor to totals', () => {
    const s = sheet({
      A1: '=PIAdvCalcVal("RB.P101.FLOW","t","*","average","time-weighted",0,1,0,)',
      A2: '=PIAdvCalcVal("RB.P101.FLOW","t","*","total","time-weighted",0,24,0,)',
      A3: '=PIAdvCalcVal("RB.P101.FLOW","t","*","average (timeweighted)","time-weighted",0,1,0,"")',
      A4: '=PIAdvCalcVal("RB.P101.FLOW","t","*","count",,0,1,0,)',
    });
    expect(numberAt(s.at('A1'))).toBeCloseTo(summary(p, start, NOW, 'Average', NOW), 9);
    expect(numberAt(s.at('A2'))).toBeCloseTo(summary(p, start, NOW, 'Total', NOW) * 24, 6);
    expect(s.show('A3')).toBe(s.show('A1'));
    expect(numberAt(s.at('A4'))).toBe(recorded(p, start, NOW).length);
  });

  it('event-weighted and mean use the recorded events', () => {
    const ev = recorded(p, start, NOW).map((e) => e.v);
    const mean = ev.reduce((a, b) => a + b, 0) / ev.length;
    expect(calcValue(p, start, NOW, 'mean', 'time-weighted', 1, NOW)).toBeCloseTo(mean, 9);
    expect(calcValue(p, start, NOW, 'average', 'event-weighted', 1, NOW)).toBeCloseTo(mean, 9);
    expect(calcValue(p, start, NOW, 'range', 'event-weighted', 1, NOW)).toBeCloseTo(
      Math.max(...ev) - Math.min(...ev),
      9,
    );
    expect(
      calcValue(p, start, NOW, 'standard deviation', 'event-weighted', 1, NOW),
    ).toBeGreaterThan(0);
  });

  it('applies outcodes, rejecting 3, and adds percent good', () => {
    const s = sheet({
      A1: '=PIAdvCalcVal("RB.P101.FLOW","t","*","maximum","time-weighted",0,1,5,)',
      A3: '=PIAdvCalcVal("RB.P101.FLOW","t","*","maximum","time-weighted",0,1,3,)',
      A4: '=PIAdvCalcVal("RB.P101.FLOW","t","*","maximum","time-weighted",0,1,6,)',
      A7: '=PIAdvCalcVal("RB.P101.FLOW","t","*","median","time-weighted",0,1,0,)',
      A8: '=PIAdvCalcVal("RB.P101.STATUS","t","*","average","time-weighted",0,1,0,)',
      A9: '=PIAdvCalcVal("RB.P101.FLOW","t","*","average","time-weighted",101,1,0,)',
    });
    expect(s.at('A1')).toEqual({ kind: 'date', value: start });
    expect(s.at('C1')).toEqual({ kind: 'number', value: 100 });
    expect(s.show('A3')).toBe('#VALUE!');
    expect(s.at('A5')).toEqual({ kind: 'number', value: 100 });
    expect(s.show('A7')).toBe('#VALUE!');
    expect(s.show('A8')).toMatch(/digital/);
    expect(s.show('A9')).toMatch(/minpctgood/);
  });

  it('PIAdvCalcDat returns one value per interval', () => {
    const s = sheet({
      A1: '=PIAdvCalcDat("RB.P101.FLOW","*-3h","*","1h","average","time-weighted",0,1,1,)',
    });
    expect(s.spills[0]).toMatchObject({ rows: 3, cols: 2 });
    expect(s.at('A1')).toEqual({ kind: 'date', value: NOW - 3 * H });
    expect(numberAt(s.at('B2'))).toBeCloseTo(summary(p, NOW - 2 * H, NOW - H, 'Average', NOW), 9);
  });
});

describe('time and value helpers', () => {
  it('round-trips Excel serial dates and formats like DataLink', () => {
    const t = new Date('2026-10-15T08:30:15').getTime();
    expect(fromSerial(toSerial(t))).toBeCloseTo(t, -1);
    expect(formatDate(t)).toBe('15-Oct-26 08:30:15');
    const s = sheet({
      A1: '=PIArcVal("RB.P101.FLOW",A2,0,,"auto")',
      A2: String(toSerial(NOW - H)),
    });
    expect(s.at('A1').kind).toBe('number');
  });

  it('parses intervals', () => {
    expect(intervalMs({ kind: 'string', value: '15m' })).toBe(900_000);
    expect(intervalMs({ kind: 'string', value: '2 hours' })).toBe(2 * H);
    expect(() => intervalMs({ kind: 'string', value: 'soon' })).toThrow();
  });
});

describe('function wizard specs', () => {
  it('lists the required DataLink functions with real argument order', () => {
    expect(specFor('PICompDat')?.args.map((a) => a.name)).toEqual([
      'tagname',
      'stime',
      'etime',
      'outcode',
      'PIServer',
      'mode',
    ]);
    expect(specFor('PIAdvCalcDat')?.args.map((a) => a.name)).toEqual([
      'tagname',
      'stime',
      'etime',
      'interval',
      'mode',
      'calcbasis',
      'minpctgood',
      'cfactor',
      'outcode',
      'PIServer',
    ]);
    for (const n of ['PICurrVal', 'PIArcVal', 'PISampDat', 'PIAdvCalcVal', 'PITimeDat', 'PIExpVal'])
      expect(FUNCTION_SPECS.some((f) => f.name === n)).toBe(true);
  });

  it('builds formulas, quoting text but not references', () => {
    const spec = specFor('PICompDat')!;
    expect(buildFormula(spec, ['A2', '*-1h', '*', '0', '\\\\PISRV01', ''])).toBe(
      '=PICompDat(A2,"*-1h","*",0,"\\\\PISRV01")',
    );
    expect(buildFormula(specFor('PICurrVal')!, ['say "x"', '0', ''])).toBe(
      '=PICurrVal("say ""x""",0)',
    );
  });
});

describe('example pump report', () => {
  it('evaluates without errors', () => {
    const r = evaluateSheet(pumpReport(), { now: NOW });
    const errors: string[] = [];
    for (let row = 0; row < 40; row++)
      for (let col = 0; col < 12; col++) {
        const v = r.value(col, row);
        if (v.kind === 'error') errors.push(`${cellKey(col, row)} ${v.message}`);
      }
    expect(errors).toEqual([]);
    expect(r.spills.every((s) => !s.blocked)).toBe(true);
  });
});
