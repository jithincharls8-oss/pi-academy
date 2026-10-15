/**
 * Real PI deployments with sizes stated in their sources (research/ind.md, "Deployment planner
 * data"). Only figures the source states; `tags` is the number used to compare, and is left
 * null when the source gives no point count.
 */
import type { Industry } from '@/core/schemas/common';

export interface Comparable {
  company: string;
  industry: Industry;
  tags: number | null;
  stated: string;
  sources: string[];
}

export const COMPARABLES: Comparable[] = [
  {
    company: 'Cargill feed mills, grain elevators and ships',
    industry: 'food-bev',
    tags: null,
    stated:
      '"Only a few hundred data streams" per site, with Edge Data Store forwarding to a central PI Server',
    sources: ['ind-ss-cargill'],
  },
  {
    company: 'Biotech start-up (E Tech Group)',
    industry: 'pharma',
    tags: 3_000,
    stated: '3,000-tag licence designed to grow to 100,000; 4 VMs; 26 skids',
    sources: ['ind-etech-biotech'],
  },
  {
    company: 'Halifax Water (2013)',
    industry: 'water',
    tags: 5_000,
    stated: 'Single PI 2010 server, 5,000 tags, 10 OPC interfaces',
    sources: ['ind-pres-halifax-2013'],
  },
  {
    company: 'Compesa (2020)',
    industry: 'water',
    tags: 5_300,
    stated:
      '5,300 telemetered variables from 238 sources, 200 wells, 234 pumping stations, 500 treatment stations and 519 reservoirs',
    sources: ['ind-webinar-compesa-2020'],
  },
  {
    company: 'Equinix (2011)',
    industry: 'data-centres',
    tags: 15_000,
    stated: '15,000 tags, 108 controllers, 1 PI server',
    sources: ['ind-pres-equinix-2011'],
  },
  {
    company: 'Pfizer PCMM',
    industry: 'pharma',
    tags: 2_000,
    stated: 'Over 2,000 tags on one machine',
    sources: ['ind-ss-pfizer'],
  },
  {
    company: 'Longannet Power Station',
    industry: 'power',
    tags: 22_739,
    stated: '22,739 tags, within a roughly 50,000-tag, 10-station collective',
    sources: ['ind-pres-longannet-2014'],
  },
  {
    company: 'Genentech',
    industry: 'pharma',
    tags: 27_000,
    stated: '27,000 tags and 130 billion events migrated',
    sources: ['ind-ss-genentech'],
  },
  {
    company: 'Bruce Power',
    industry: 'power',
    tags: 40_000,
    stated: '40,000 PI tags',
    sources: ['ind-ss-bruce-power'],
  },
  {
    company: 'Syensqo',
    industry: 'chemicals',
    tags: 60_000,
    stated: '4,000+ elements, 600 templates, 60,000 data points',
    sources: ['ind-ss-syensqo'],
  },
  {
    company: 'Cameron LNG',
    industry: 'oil-gas',
    tags: 70_000,
    stated: 'About 70,000 tags and 5,000+ AF elements',
    sources: ['ind-ss-cameron-lng'],
  },
  {
    company: 'Klabin',
    industry: 'pulp-paper',
    tags: 85_000,
    stated: '85,000 variables and 25,000+ assets',
    sources: ['ind-ss-klabin'],
  },
  {
    company: 'ArcelorMittal Mining Canada',
    industry: 'mining',
    tags: 140_000,
    stated: 'About 140,000 points on 2 PI Servers, 50+ interface instances',
    sources: ['ind-pres-ammc-2019'],
  },
  {
    company: 'Dominion Energy',
    industry: 'power',
    tags: null,
    stated: 'About 28,000 AF elements and 135,000+ analyses',
    sources: ['ind-ss-dominion'],
  },
  {
    company: 'Enbridge',
    industry: 'oil-gas',
    tags: 350_000,
    stated: '350,000+ tags on a pipeline SCADA',
    sources: ['ind-ss-enbridge'],
  },
  {
    company: 'Covestro',
    industry: 'chemicals',
    tags: 1_000_000,
    stated: 'More than one million real-time data streams',
    sources: ['ind-ss-covestro'],
  },
  {
    company: 'Gulf of Mexico offshore operator (2015)',
    industry: 'oil-gas',
    tags: 3_000_000,
    stated: '3+ million tags from 29 DCS historians and 650 assets',
    sources: ['ind-uc15-og-chem'],
  },
  {
    company: 'eBay',
    industry: 'data-centres',
    tags: 3_000_000,
    stated: '3 million data points',
    sources: ['ind-ss-ebay'],
  },
  {
    company: 'Cargill (enterprise)',
    industry: 'food-bev',
    tags: null,
    stated: 'PI at "over 200 plants globally"',
    sources: ['ind-ss-cargill'],
  },
  {
    company: 'Novartis',
    industry: 'pharma',
    tags: null,
    stated: '25 manufacturing sites',
    sources: ['ind-osisoft-overview'],
  },
  {
    company: 'Coop',
    industry: 'food-bev',
    tags: null,
    stated: '"Over 3,000 sources"',
    sources: ['ind-ss-coop'],
  },
];

/** Up to `n` deployments closest in size (log scale), same industry first among near ties. */
export function nearestComparables(industry: Industry, tags: number, n = 3): Comparable[] {
  const scored = COMPARABLES.filter((c) => c.tags !== null).map((c) => {
    const d = Math.abs(Math.log10(c.tags as number) - Math.log10(Math.max(1, tags)));
    return { c, score: d - (c.industry === industry ? 0.3 : 0) };
  });
  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, n).map((s) => s.c);
}
