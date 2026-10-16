import { describe, expect, it } from 'vitest';
import {
  getAttribute,
  initialPoints,
  newPoint,
  setAttribute,
  wildcardMatch,
  withProfile,
} from './points';
import { ACL_PATTERN, adviseSettings, validatePoint } from './validation';
import {
  archiveModel,
  fillRate,
  filterMessages,
  recommendedArchiveSizeMB,
  serverStats,
  systemMessages,
  type LogEntry,
} from './server';
import { runShell } from './shell';
import { initialState, smtReducer, withEdits, outOfOrderCount } from './store';

const NOW = Date.UTC(2026, 9, 15, 12, 0, 0);
const HOUR = 3_600_000;

describe('points', () => {
  it('extends every plant point with PIPOINT attributes', () => {
    const pts = initialPoints();
    expect(pts).toHaveLength(35);
    expect(pts[0]?.pointid).toBe(1);
    expect(pts.every((p) => p.ptclassname === 'classic' && p.archiving && p.scanflag)).toBe(true);
  });

  it('gets and sets attributes with type checks', () => {
    const p = initialPoints()[3]!;
    expect(getAttribute(p, 'scan')).toBe('1');
    const r = setAttribute(p, 'scan', '0');
    expect(r.ok && r.point.scanflag).toBe(false);
    expect(setAttribute(p, 'excmax', '1.5')).toEqual({
      ok: false,
      error: 'excmax must be a whole number',
    });
    expect(setAttribute(p, 'pointtype', 'float64').ok).toBe(true);
    expect(setAttribute(p, 'ptclassname', 'fancy').ok).toBe(false);
    expect(() => getAttribute(p, 'nope')).toThrow();
  });

  it('matches wildcards case-insensitively', () => {
    expect(wildcardMatch('RB.P10*', 'rb.p101.flow')).toBe(true);
    expect(wildcardMatch('RB.P10?.FLOW', 'RB.P102.FLOW')).toBe(true);
    expect(wildcardMatch('RB.P10?', 'RB.P1022')).toBe(false);
    expect(wildcardMatch('a.b', 'aXb')).toBe(false);
  });

  it('switches the simulated profile with the point type', () => {
    const p = newPoint('RB.NEW', 99, NOW);
    const d = withProfile({ ...p, pointtype: 'Digital', digitalset: 'PumpStatus' });
    expect(d.profile.kind).toBe('state');
    expect(withProfile({ ...d, pointtype: 'Float32' }).profile.kind).toBe('wave');
  });
});

describe('validation', () => {
  const pts = initialPoints();
  const flow = pts.find((p) => p.tag === 'RB.P101.FLOW')!;
  const others = pts.filter((p) => p !== flow);

  it('accepts the starting points', () => {
    for (const p of pts)
      expect(
        validatePoint(
          p,
          pts.filter((o) => o !== p),
        ),
      ).toEqual({ ok: true });
  });

  it('applies the hard rules', () => {
    const issues = (p: typeof flow) => {
      const r = validatePoint(p, others);
      return r.ok ? [] : r.issues.map((i) => i.field);
    };
    expect(issues({ ...flow, compdev: -1 })).toContain('compdev');
    expect(issues({ ...flow, compmin: 100, compmax: 10 })).toContain('compmax');
    expect(issues({ ...flow, pointtype: 'Digital', digitalset: '' })).toContain('digitalset');
    expect(issues({ ...flow, pointtype: 'Digital', digitalset: 'Nope' })).toContain('digitalset');
    expect(issues({ ...flow, span: 0 })).toContain('span');
    expect(issues({ ...flow, typicalvalue: 999 })).toContain('typicalvalue');
    expect(issues({ ...flow, tag: 'RB.P102.FLOW' })).toContain('tag');
    expect(issues({ ...flow, tag: '' })).toContain('tag');
    expect(issues({ ...flow, ptsecurity: 'everyone can' })).toContain('ptsecurity');
    expect(issues({ ...flow, excmin: 700, excmax: 600 })).toContain('excmax');
  });

  it('checks ACL strings', () => {
    expect(ACL_PATTERN.test('piadmins: A(r,w) | PIWorld: A(r)')).toBe(true);
    expect(ACL_PATTERN.test('PI Buffer: A(r,w)|x:A()')).toBe(true);
    expect(ACL_PATTERN.test('piadmins A(r)')).toBe(false);
  });

  it('gives advice without blocking', () => {
    expect(adviseSettings({ ...flow, excdev: 5 }).join(' ')).toMatch(/half of CompDev/);
    expect(adviseSettings({ ...flow, compressing: false }).join(' ')).toMatch(
      /every snapshot event/,
    );
    expect(adviseSettings(flow)).toEqual([]);
  });
});

describe('server model', () => {
  const pts = initialPoints();

  it('sizes archives by the research rule', () => {
    expect(recommendedArchiveSizeMB(16_384, 200_000).chosen).toBe(512);
    expect(recommendedArchiveSizeMB(16_384, 50_000).chosen).toBe(256);
    expect(recommendedArchiveSizeMB(1_000_000, 10_000_000).chosen).toBe(10_240);
  });

  it('derives statistics from the points', () => {
    const s = serverStats(pts, NOW, { secondsBetweenFlush: 300, outOfOrderEdits: 2 });
    expect(s.pointCount).toBe(35);
    expect(s.snapshotsPerSec).toBeGreaterThan(s.archivedPerSec);
    expect(s.compressionRatio).toBeGreaterThan(1);
    expect(s.queueReads).toBeLessThanOrEqual(s.queueWrites);
    expect(s.unflushedEvents).toBeGreaterThanOrEqual(0);
    expect(s.archiveOutOfOrder).toBe(2);
  });

  it('builds a primary and historic archives, and a forced shift moves the primary', () => {
    const rate = fillRate(pts, NOW);
    expect(rate).toBeGreaterThan(0);
    const base = {
      now: NOW,
      fillBytesPerSec: rate,
      baseSizeMB: 256,
      root: 'D:\\PI\\arc\\PISRV01_',
    };
    const m = archiveModel({ ...base, shifts: [] });
    expect(m.archives[0]?.state).toBe('Primary');
    expect(m.archives[0]?.end).toBeNull();
    expect(m.archives.filter((a) => a.state === 'Historic')).toHaveLength(20);
    for (let i = 1; i < m.archives.length; i++) {
      expect(m.archives[i]?.end).toBe(m.archives[i - 1]?.start);
    }
    const shifted = archiveModel({ ...base, now: NOW + 1000, shifts: [{ t: NOW, sizeMB: 512 }] });
    expect(shifted.archives[0]?.start).toBe(NOW);
    expect(shifted.archives[0]?.sizeMB).toBe(512);
    expect(shifted.archives[1]?.end).toBe(NOW);
    expect(shifted.archives[1]?.forced).toBe(true);
  });

  it('generates and filters messages', () => {
    const m = archiveModel({
      now: NOW,
      fillBytesPerSec: fillRate(pts, NOW),
      baseSizeMB: 256,
      root: 'X_',
      shifts: [],
    });
    const msgs = systemMessages(NOW - 48 * HOUR, NOW, m.archives);
    expect(msgs.length).toBeGreaterThan(20);
    expect(msgs.some((e) => e.program === 'pinetmgr')).toBe(true);
    expect(msgs.some((e) => /Archive shift/.test(e.message))).toBe(true);
    expect(systemMessages(NOW - 48 * HOUR, NOW, m.archives)).toEqual(msgs);
    const extra: LogEntry = {
      id: 'x',
      t: NOW - 10,
      severity: 'Error',
      program: 'pibasess',
      source: 's',
      message: 'Boom here',
      messageId: '',
    };
    const all = [...msgs, extra];
    const filtered = filterMessages(all, {
      start: NOW - HOUR,
      end: NOW,
      minSeverity: 'Error',
      text: '',
      program: '',
    });
    expect(filtered).toEqual([extra]);
    expect(
      filterMessages(all, {
        start: 0,
        end: NOW,
        minSeverity: 'Debug',
        text: '*boom*',
        program: '',
      }),
    ).toEqual([extra]);
    expect(
      filterMessages(all, {
        start: 0,
        end: NOW,
        minSeverity: 'Debug',
        text: '',
        program: 'pilicmgr',
      }).every((e) => e.program === 'pilicmgr'),
    ).toBe(true);
  });
});

describe('shell', () => {
  const pts = initialPoints();
  const stats = serverStats(pts, NOW, { secondsBetweenFlush: 300, outOfOrderEdits: 0 });
  const archives = archiveModel({
    now: NOW,
    fillBytesPerSec: fillRate(pts, NOW),
    baseSizeMB: 256,
    root: 'X_',
    shifts: [],
  });
  const ctx = { stats, archives };
  const lines = (cmd: string): string[] => {
    const r = runShell(cmd, ctx);
    return r.kind === 'clear' ? [] : r.lines;
  };

  it('prints piartool statistics with a simplified header', () => {
    for (const opt of ['-ss', '-qs', '-as', '-al'])
      expect(lines(`piartool ${opt}`)[0]).toMatch(/simplified/);
    expect(lines('piartool -ss').join('\n')).toMatch(/Point Count\s+35/);
    expect(lines('piartool -qs').join('\n')).toMatch(/Total Event Reads/);
    expect(lines('piartool -as').join('\n')).toMatch(/Archiving Flag\s+3/);
    expect(lines('piartool -al').join('\n')).toMatch(/Current Time/);
    expect(lines('PIARTOOL.EXE -lic usage').join('\n')).toMatch(/Licensed point count\s+50,000/);
    expect(lines('piartool -zz')[0]).toMatch(/not available/);
  });

  it('handles pidiag, piconfig, cls and unknown commands', () => {
    expect(lines('pidiag -e -11091')[0]).toMatch(/ArcMaxCollect/);
    expect(lines('pidiag -e 10401')[0]).toMatch(/no write access/);
    expect(lines('pidiag -e -1')[0]).toMatch(/not in the sandbox/);
    expect(runShell('piconfig', ctx).kind).toBe('piconfig');
    expect(runShell('cls', ctx).kind).toBe('clear');
    expect(lines('dir')[0]).toMatch(/not recognized/);
    expect(lines('help').length).toBeGreaterThan(5);
    expect(lines('   ')).toEqual([]);
  });
});

describe('store', () => {
  it('saves, creates and deletes points and logs them', () => {
    let s = initialState();
    const flow = s.points.find((p) => p.tag === 'RB.P101.FLOW')!;
    s = smtReducer(s, {
      type: 'savePoint',
      original: flow.tag,
      point: { ...flow, compdev: 3 },
      now: NOW,
    });
    expect(s.points.find((p) => p.tag === 'RB.P101.FLOW')?.compdev).toBe(3);
    expect(s.userLog.at(-1)?.message).toMatch(/Point edited: RB.P101.FLOW \[compdev\]/);
    s = smtReducer(s, {
      type: 'savePoint',
      original: null,
      point: newPoint('RB.NEW', 36, NOW),
      now: NOW,
    });
    expect(s.userLog.at(-1)?.messageId).toBe('6079');
    s = smtReducer(s, { type: 'deletePoint', tag: 'rb.new', now: NOW });
    expect(s.points).toHaveLength(35);
    expect(smtReducer(s, { type: 'reset' }).userLog).toEqual([]);
  });

  it('tracks tuning changes needing a restart', () => {
    let s = smtReducer(initialState(), {
      type: 'setTuning',
      name: 'ArcMaxCollect',
      value: '2000000',
      now: NOW,
    });
    expect(s.tuning['ArcMaxCollect']).toBe('2000000');
    expect(s.restartPending).toEqual(['PI Archive Subsystem']);
    expect(smtReducer(s, { type: 'setTuning', name: 'Nope', value: '1', now: NOW })).toBe(s);
    expect(s.applied['ArcMaxCollect']).toBeUndefined();
    s = smtReducer(s, { type: 'restartDone', subsystem: 'PI Archive Subsystem', now: NOW });
    expect(s.restartPending).toEqual([]);
    expect(s.applied['ArcMaxCollect']).toBe('2000000');
  });

  it('applies archive edits in order and can undo them', () => {
    let s = initialState();
    s = smtReducer(s, {
      type: 'archiveEdit',
      tag: 'RB.X',
      edit: { op: 'replace', t: 2000, v: 9, note: 'cal' },
      now: NOW,
    });
    s = smtReducer(s, {
      type: 'archiveEdit',
      tag: 'RB.X',
      edit: { op: 'add', t: 1500, v: 4, note: '' },
      now: NOW,
    });
    s = smtReducer(s, {
      type: 'archiveEdit',
      tag: 'RB.X',
      edit: { op: 'delete', t: 3000, v: 0, note: '' },
      now: NOW,
    });
    const rows = withEdits(
      [
        { t: 1000, v: 1 },
        { t: 2000, v: 2 },
        { t: 3000, v: 3 },
      ],
      s.archiveEdits['RB.X'] ?? [],
      0,
      5000,
    );
    expect(rows).toEqual([
      { t: 1000, v: 1, status: 'original', note: '' },
      { t: 1500, v: 4, status: 'added', note: '' },
      { t: 2000, v: 9, status: 'replaced', note: 'cal' },
    ]);
    expect(outOfOrderCount(s.archiveEdits)).toBe(2);
    const id = s.archiveEdits['RB.X']?.[0]?.id ?? '';
    s = smtReducer(s, { type: 'undoArchiveEdit', tag: 'RB.X', id });
    expect(s.archiveEdits['RB.X']).toHaveLength(2);
  });

  it('forces an archive shift', () => {
    const s = smtReducer(initialState(), { type: 'forceShift', now: NOW, sizeMB: 256 });
    expect(s.shifts).toEqual([{ t: NOW, sizeMB: 256 }]);
    expect(s.userLog[0]?.program).toBe('piarchss');
  });
});
