import { describe, expect, it } from 'vitest';
import {
  executeLine,
  executeScript,
  newSession,
  resolveCommand,
  splitFields,
  type PiconfigSession,
} from './piconfig';
import { initialPoints, type SandboxPoint } from './points';

const ctx = { now: Date.UTC(2026, 9, 15, 12, 0, 0), user: 'RIVERBEND\\learner' };

function run(
  script: string,
  points: SandboxPoint[] = initialPoints(),
  session: PiconfigSession = newSession(),
) {
  return executeScript(session, script, points, ctx);
}

describe('resolveCommand', () => {
  it('accepts full names, four-letter abbreviations and aliases', () => {
    expect(resolveCommand('table')).toBe('table');
    expect(resolveCommand('tabl')).toBe('table');
    expect(resolveCommand('sele')).toBe('select');
    expect(resolveCommand('select')).toBe('select');
    expect(resolveCommand('istr')).toBe('istructure');
    expect(resolveCommand('ostructure')).toBe('ostructure');
    expect(resolveCommand('ends')).toBe('endsection');
    expect(resolveCommand('BYE')).toBe('bye');
    expect(resolveCommand('mode')).toBe('mode');
    expect(resolveCommand('ta')).toBeNull();
    expect(resolveCommand('frobnicate')).toBeNull();
  });
});

describe('splitFields', () => {
  it('splits on the delimiter and honours quotes', () => {
    expect(splitFields('a, b ,c', ',')).toEqual(['a', 'b', 'c']);
    expect(splitFields('RB.X,"Flow, main line",m3/h', ',')).toEqual([
      'RB.X',
      'Flow, main line',
      'm3/h',
    ]);
    expect(splitFields('a;b', ';')).toEqual(['a', 'b']);
    expect(splitFields('"say ""hi"""', ',')).toEqual(['say "hi"']);
  });
});

describe('list mode', () => {
  it('lists with @select and @ends', () => {
    const r = run(
      '@table pipoint\n@mode list\n@ostr tag,pointtype\n@select tag=RB.P10*.STATUS\n@ends',
    );
    expect(r.output).toEqual([
      'RB.P101.STATUS,Digital',
      'RB.P102.STATUS,Digital',
      'RB.P103.STATUS,Digital',
    ]);
  });

  it('ANDs attributes within one @select', () => {
    const r = run('@tabl pipoint\n@ostr tag\n@sele tag=RB.P101*,pointtype=digital\n@ends');
    expect(r.output).toEqual(['RB.P101.STATUS']);
  });

  it('lists by pointid like the research example', () => {
    const r = run(
      '@table pipoint\n@mode list\n@ostr pointid,tag\n@sele tag=*,pointid=1\n@ends\n@bye',
    );
    expect(r.output).toEqual(['1,RB.SITE.AMBIENT.TEMP']);
    expect(r.exit).toBe(true);
  });

  it('defaults the output structure to tag and supports data-line selection', () => {
    const r = run('@table pipoint\n@istr tag\nRB.K100.*');
    expect(r.output).toEqual(['RB.K100.STATUS', 'RB.K100.PRESS', 'RB.K100.KW']);
  });

  it('prints booleans as 0/1 and derived percentages', () => {
    const r = run(
      '@table pipoint\n@ostr tag,compressing,step,compdev,compdevpercent\n@select tag=RB.P101.FLOW\n@ends',
    );
    expect(r.output).toEqual(['RB.P101.FLOW,1,0,1,0.5']);
  });

  it('quotes values that contain the delimiter', () => {
    const r = run(
      '@table pipoint\n@mode edit\n@istr tag,descriptor\nRB.P101.FLOW,"Discharge flow, line A"\n@mode list\n@ostr descriptor\n@select tag=RB.P101.FLOW\n@ends',
    );
    expect(r.output.at(-1)).toBe('"Discharge flow, line A"');
  });

  it('reports no matches', () => {
    const r = run('@table pipoint\n@select tag=NOPE*\n@ends');
    expect(r.output).toEqual(['* No points matched the selection']);
  });
});

describe('edit mode', () => {
  it('edits attributes and records the change', () => {
    const r = run('@table pipoint\n@mode edit\n@istr tag,compdev,excdev\nRB.P101.FLOW,2,1');
    const p = r.points.find((x) => x.tag === 'RB.P101.FLOW');
    expect(p?.compdev).toBe(2);
    expect(p?.excdev).toBe(1);
    expect(p?.changer).toBe(ctx.user);
    expect(r.changes).toEqual([
      { kind: 'edit', tag: 'RB.P101.FLOW', attributes: ['compdev', 'excdev'] },
    ]);
  });

  it('sets CompDev from CompDevPercent using the new span', () => {
    const r = run('@table pipoint\n@mode edit\n@istr tag,compdevpercent,span\nRB.P101.FLOW,1,300');
    expect(r.points.find((x) => x.tag === 'RB.P101.FLOW')?.compdev).toBe(3);
  });

  it('rejects invalid values with validation messages', () => {
    const r = run('@table pipoint\n@mode edit\n@istr tag,compdev\nRB.P101.FLOW,-1');
    expect(r.output[0]).toMatch(/CompDev cannot be negative/);
    expect(r.changes).toHaveLength(0);
    const r2 = run('@table pipoint\n@mode edit\n@istr tag,compmin,compmax\nRB.P101.FLOW,600,60');
    expect(r2.output[0]).toMatch(/CompMax must be at least CompMin/);
  });

  it('rejects read-only, unknown and badly typed attributes', () => {
    expect(run('@table pipoint\n@istr tag,pointid').output).toEqual([]);
    expect(run('@table pipoint\n@mode edit\n@istr tag,pointid\nRB.P101.FLOW,9').output[0]).toMatch(
      /read-only/,
    );
    expect(run('@table pipoint\n@istr tag,colour').output[0]).toMatch(/unknown attribute/);
    expect(run('@table pipoint\n@mode edit\n@istr tag,step\nRB.P101.FLOW,maybe').output[0]).toMatch(
      /0 or 1/,
    );
  });

  it('errors on a missing point and on the wrong number of fields', () => {
    expect(run('@table pipoint\n@mode edit\n@istr tag,compdev\nRB.NOPE,1').output[0]).toMatch(
      /not found/,
    );
    expect(run('@table pipoint\n@mode edit\n@istr tag,compdev\nRB.P101.FLOW').output[0]).toMatch(
      /expected 2 field/,
    );
  });

  it('requires a digital set when changing a point to Digital', () => {
    const bad = run('@table pipoint\n@mode edit\n@istr tag,pointtype\nRB.P101.FLOW,Digital');
    expect(bad.output[0]).toMatch(/digital set/);
    const ok = run(
      '@table pipoint\n@mode edit\n@istr tag,pointtype,digitalset\nRB.P101.FLOW,Digital,PumpStatus',
    );
    const p = ok.points.find((x) => x.tag === 'RB.P101.FLOW');
    expect(p?.pointtype).toBe('Digital');
    expect(p?.profile.kind).toBe('state');
  });

  it('changes the point class as in the research example', () => {
    const r = run('@tabl pipoint\n@mode edit\n@istr tag,ptclassname\nRB.P101.FLOW,base');
    expect(r.points.find((x) => x.tag === 'RB.P101.FLOW')?.ptclassname).toBe('base');
  });
});

describe('create and delete', () => {
  it('creates points with research defaults', () => {
    const r = run(
      '@table pipoint\n@ptclass classic\n@mode create, t\n@istr tag,instrumenttag,descriptor,pointsource,pointtype,compressing,location1,location4\nRB.T103.LEVEL,ns=2;s=Riverbend.T103.LEVEL,T-103 level,OPC,Float32,1,1,2',
    );
    expect(r.output[0]).toMatch(/unverified/);
    const p = r.points.find((x) => x.tag === 'RB.T103.LEVEL');
    expect(p).toBeDefined();
    expect(p?.excmax).toBe(600);
    expect(p?.compmax).toBe(28800);
    expect(p?.span).toBe(100);
    expect(p?.pointid).toBe(36);
    expect(r.changes[0]?.kind).toBe('create');
  });

  it('refuses to create a duplicate without ", t" and edits with it', () => {
    expect(run('@table pipoint\n@mode create\n@istr tag\nRB.P101.FLOW').output[0]).toMatch(
      /already exists/,
    );
    const r = run('@table pipoint\n@mode create,t\n@istr tag,descriptor\nrb.p101.flow,Changed');
    expect(r.changes[0]?.kind).toBe('edit');
    expect(r.points.find((x) => x.tag === 'RB.P101.FLOW')?.descriptor).toBe('Changed');
  });

  it('validates new tag names', () => {
    expect(run('@table pipoint\n@mode create\n@istr tag\nBAD*NAME').output[0]).toMatch(
      /cannot contain/,
    );
    expect(run('@table pipoint\n@mode create\n@istr tag\n-LEADING').output[0]).toMatch(
      /must start/,
    );
  });

  it('deletes points', () => {
    const r = run('@tabl pipoint,classic\n@mode delete\n@istr tag\nRB.K100.KW\nRB.NOPE');
    expect(r.points.some((p) => p.tag === 'RB.K100.KW')).toBe(false);
    expect(r.points).toHaveLength(34);
    expect(r.output).toEqual(['* Deleted RB.K100.KW', 'Error: point RB.NOPE not found']);
  });

  it('uses a custom delimiter', () => {
    const r = run(
      '@table pipoint\n@delimiter ;\n@mode edit\n@istr tag;descriptor\nRB.P101.FLOW;Flow, with comma',
    );
    expect(r.points.find((x) => x.tag === 'RB.P101.FLOW')?.descriptor).toBe('Flow, with comma');
  });
});

describe('session handling', () => {
  it('ignores comments and blank lines', () => {
    expect(run('* a comment\n\n   ').output).toEqual([]);
  });

  it('needs a table before data and structures', () => {
    expect(run('RB.P101.FLOW').output[0]).toMatch(/no table/);
    expect(run('@ostr tag').output[0]).toMatch(/no table/);
    expect(run('?atr').output[0]).toMatch(/no table/);
  });

  it('reports unsupported tables and commands', () => {
    expect(run('@table piarc').output[0]).toMatch(/Archive Editor/);
    expect(run('@table pifoo').output[0]).toMatch(/unknown table/);
    expect(run('@frob').output[0]).toMatch(/unknown command/);
    expect(run('@table pipoint\n@mode replace').output[0]).toMatch(/mode must be/);
    expect(run('@output c:\\x.txt').output[0]).toMatch(/not available/);
  });

  it('answers ?tbl and ?atr', () => {
    expect(run('?tbl').output[0]).toMatch(/pipoint/);
    const atr = run('@table pipoint\n?atr').output;
    expect(atr).toContain('  compdev');
    expect(atr).toContain('  compdevpercent');
  });

  it('stops at @exit and keeps the points immutable', () => {
    const points = initialPoints();
    const r = run('@table pipoint\n@exit\n@mode edit', points);
    expect(r.exit).toBe(true);
    expect(r.session.mode).toBe('list');
    const e = executeLine(newSession(), '@table pipoint', points, ctx);
    expect(e.points).not.toBe(points);
    expect(e.points).toEqual(points);
  });

  it('allows only list mode with @select', () => {
    const r = run('@table pipoint\n@mode edit\n@select tag=*\n@ends');
    expect(r.output[0]).toMatch(/list mode only/);
  });
});

describe('names inherited from Object are not attributes or commands', () => {
  it('rejects constructor and __proto__ instead of crashing', () => {
    expect(resolveCommand('constructor')).toBeNull();
    for (const attr of ['constructor', '__proto__']) {
      const r = run(`@table pipoint\n@mode edit\n@istr tag,${attr}\nRB.SITE.AMBIENT.TEMP,1`);
      expect(r.output.join('\n')).toMatch(/Error/);
    }
  });
});
