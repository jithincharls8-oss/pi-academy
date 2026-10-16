import type { Domain } from '../schemas';

/**
 * Mock-exam domain weights (sum = 1). This is PI Academy's own blueprint, weighted toward
 * the core server products; AVEVA does not publish an equivalent weighting.
 */
export const MOCK_BLUEPRINT: Readonly<Record<Domain, number>> = {
  foundations: 0.06,
  'data-archive': 0.2,
  'asset-framework': 0.18,
  'data-collection': 0.1,
  visualisation: 0.08,
  analytics: 0.12,
  integration: 0.1,
  administration: 0.08,
  security: 0.04,
  industries: 0.02,
  'case-studies': 0.01,
  glossary: 0.01,
};

/** Split `total` questions across domains by weight using the largest-remainder method. */
export function allocate(
  total: number,
  weights: Readonly<Partial<Record<Domain, number>>>,
): Map<Domain, number> {
  const entries = (Object.entries(weights) as [Domain, number][]).filter(([, w]) => w > 0);
  const sum = entries.reduce((s, [, w]) => s + w, 0);
  if (sum <= 0 || total <= 0) return new Map();
  const raw = entries.map(([d, w]) => ({ d, exact: (w / sum) * total }));
  const result = new Map<Domain, number>(raw.map((r) => [r.d, Math.floor(r.exact)]));
  let remaining = total - [...result.values()].reduce((s, n) => s + n, 0);
  const byRemainder = [...raw].sort(
    (a, b) =>
      b.exact - Math.floor(b.exact) - (a.exact - Math.floor(a.exact)) || a.d.localeCompare(b.d),
  );
  for (const r of byRemainder) {
    if (remaining <= 0) break;
    result.set(r.d, (result.get(r.d) ?? 0) + 1);
    remaining -= 1;
  }
  return result;
}
