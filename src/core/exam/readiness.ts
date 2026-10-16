import { DOMAINS, type Domain } from '../schemas';

export interface AttemptLike {
  domain: string;
  score: number;
  answered_at: string;
}

/**
 * Readiness per domain, 0..100. Uses the last 50 attempts in the domain, weights recent
 * answers more (half-life of 20 attempts) and shrinks toward 0 with few attempts
 * (confidence factor n / (n + 10)), so three lucky answers do not read as "ready".
 */
export function readinessByDomain(
  attempts: readonly AttemptLike[],
): Record<Domain, { score: number; attempts: number }> {
  const out = Object.fromEntries(DOMAINS.map((d) => [d, { score: 0, attempts: 0 }])) as Record<
    Domain,
    { score: number; attempts: number }
  >;
  const byDomain = new Map<string, AttemptLike[]>();
  for (const a of attempts) {
    const list = byDomain.get(a.domain) ?? [];
    list.push(a);
    byDomain.set(a.domain, list);
  }
  const PRIOR_WEIGHT = 10;
  const HALF_LIFE = 20;
  for (const d of DOMAINS) {
    const list = (byDomain.get(d) ?? [])
      .sort((a, b) => b.answered_at.localeCompare(a.answered_at))
      .slice(0, 50);
    let wSum = 0;
    let sSum = 0;
    list.forEach((a, i) => {
      const w = Math.pow(0.5, i / HALF_LIFE);
      wSum += w;
      sSum += w * a.score;
    });
    const mean = wSum === 0 ? 0 : sSum / wSum;
    const confidence = list.length / (list.length + PRIOR_WEIGHT);
    const score = mean * confidence * 100;
    out[d] = { score: Math.round(Math.min(100, score)), attempts: list.length };
  }
  return out;
}

/** Overall readiness weighted by the mock blueprint. */
export function overallReadiness(
  perDomain: Record<Domain, { score: number }>,
  weights: Readonly<Record<Domain, number>>,
): number {
  let s = 0;
  let w = 0;
  for (const d of DOMAINS) {
    s += perDomain[d].score * weights[d];
    w += weights[d];
  }
  return w === 0 ? 0 : Math.round(s / w);
}
