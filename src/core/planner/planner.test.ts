import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { makePlan, PLANNER_SOURCES, SIZE_DEFAULTS, type PlannerInput } from './plan';
import { COMPARABLES, nearestComparables } from './comparables';
import { SIZING_SOURCES } from '@/core/tools/sizing';
import { TAGNAME_SOURCES } from '@/core/tools/tagname';

const input = (size: PlannerInput['size'], extra: Partial<PlannerInput> = {}): PlannerInput => ({
  industry: 'water',
  size,
  ...SIZE_DEFAULTS[size],
  ...extra,
});

describe('deployment planner', () => {
  it('cites only sources that exist', () => {
    const dir = join(process.cwd(), 'content', 'sources');
    const ids = new Set(
      readdirSync(dir).flatMap((f) =>
        (JSON.parse(readFileSync(join(dir, f), 'utf8')) as { id: string }[]).map((s) => s.id),
      ),
    );
    const cited = [
      ...PLANNER_SOURCES,
      ...COMPARABLES.flatMap((c) => c.sources),
      ...SIZING_SOURCES,
      ...TAGNAME_SOURCES,
    ];
    for (const size of ['small', 'mid', 'large'] as const) {
      for (const industry of ['pharma', 'power', 'water'] as const) {
        const p = makePlan(input(size, { industry }));
        const claims = [
          ...p.tierWhy,
          ...p.collection,
          ...p.security,
          ...p.compliance,
          ...p.rollout.flatMap((r) => r.steps),
          ...p.servers.map((s) => s.why),
          ...p.tags.warnings,
        ];
        cited.push(...claims.flatMap((c) => c.sources));
      }
    }
    expect(cited.filter((id) => !ids.has(id))).toEqual([]);
  });

  it('keeps a small single-site company on one node', () => {
    const p = makePlan(input('small', { security: 'flat' }));
    expect(p.tier).toBe('single-node');
    expect(p.servers.map((s) => s.name)).toContain('PI Server');
    expect(p.tags.siteArchiveMb).toBe(256);
  });

  it('links the single PI Server node in the diagram', () => {
    const p = makePlan(input('small'));
    expect(p.diagram).toMatch(/control\d+ -->\|buffered\| control\d+/);
    expect(p.diagram).toContain('PI to PI');
  });

  it('splits servers once a site passes 25,000 tags', () => {
    expect(makePlan(input('small', { tagsPerSite: 30_000 })).tier).toBe('separated');
  });

  it('gives a large company site servers, HA and central aggregation', () => {
    const p = makePlan(input('large'));
    expect(p.tier).toBe('distributed');
    const da = p.servers.find((s) => s.name === 'Site PI Data Archive');
    expect(da?.hosts).toHaveLength(2);
    expect(p.tags.total).toBe(12 * 60_000);
    expect(p.tags.centralArchiveMb).toBe(4_096);
    expect(p.diagram).toContain('PI to PI');
    expect(p.rollout.map((r) => r.title)).toContain('Roll out to sites');
  });

  it('adds regulation for pharma and power', () => {
    expect(makePlan(input('mid', { industry: 'pharma' })).compliance[0]?.text).toMatch(
      /EnableAudit/,
    );
    const power = makePlan(input('mid', { industry: 'power' }));
    expect(power.compliance.some((c) => c.text.includes('NERC CIP'))).toBe(true);
    expect(power.servers.find((s) => s.name === 'PI Vision and PI Web API')?.zone).toBe('business');
  });

  it('finds comparable real deployments near the tag count', () => {
    const near = nearestComparables('water', 5_000);
    expect(near[0]?.company).toMatch(/Halifax|Compesa/);
  });
});
