import { describe, expect, it } from 'vitest';
import { archiveFileSize, diskEstimates, tableSize } from './sizing';
import { afPattern, buildTag, checkTagName } from './tagname';

describe('archive sizing', () => {
  it('reproduces the workbook exercise (16 GB RAM, 200,000 points → 512 MB)', () => {
    const s = archiveFileSize(16_384, 200_000);
    expect(Math.round(s.byMemoryMb)).toBe(5461);
    expect(Math.round(s.byPointsMb)).toBe(586);
    expect(s).toMatchObject({ recommendedMb: 512, limitedBy: 'points' });
    expect(tableSize(200_000)).toBe(1024);
  });
  it('clamps to 256 and 10,240 MB', () => {
    expect(archiveFileSize(64_000, 1_000).recommendedMb).toBe(256);
    expect(archiveFileSize(1_000_000, 50_000_000).recommendedMb).toBe(10_240);
    expect(archiveFileSize(4_096, 1_000_000)).toMatchObject({
      recommendedMb: 1024,
      limitedBy: 'memory',
    });
  });
  it('agrees with the course table at its boundaries', () => {
    expect(tableSize(87_381)).toBe(256);
    expect(tableSize(87_382)).toBe(512);
    expect(tableSize(3_000_000)).toBe(10_240);
  });
  it('estimates disk per 1,000 points', () => {
    expect(diskEstimates(20_000).map((d) => d.mb)).toEqual([200, 100, 221, 10]);
  });
});

describe('tag names', () => {
  it('rejects forbidden characters and control characters', () => {
    expect(checkTagName('RB.P101.FLOW').ok).toBe(true);
    const bad = checkTagName('RB|P101;FLOW');
    expect(bad.ok).toBe(false);
    expect(bad.errors[0]).toContain('|');
    expect(checkTagName('A\tB').ok).toBe(false);
    expect(checkTagName('').ok).toBe(false);
  });
  it('warns about _ and %', () => {
    const c = checkTagName('RB_P101%');
    expect(c.ok).toBe(true);
    expect(c.warnings).toHaveLength(1);
  });
  it('builds tags and AF substitution patterns', () => {
    const p = {
      site: 'rb',
      area: '',
      unit: 'P101',
      measurement: 'flow',
      suffix: 'PV',
      separator: '.' as const,
      upper: true,
    };
    expect(buildTag(p)).toBe('RB.P101.FLOW.PV');
    expect(afPattern(p)).toBe('\\\\%Server%\\RB.%Element%.FLOW.PV');
  });
});
