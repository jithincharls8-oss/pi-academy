import { z } from 'zod';

export const DOMAINS = [
  'foundations',
  'data-archive',
  'asset-framework',
  'data-collection',
  'visualisation',
  'analytics',
  'integration',
  'administration',
  'industries',
  'case-studies',
  'security',
  'glossary',
] as const;
export const DomainSchema = z.enum(DOMAINS);
export type Domain = z.infer<typeof DomainSchema>;

export const DOMAIN_LABELS: Record<Domain, string> = {
  foundations: 'Foundations',
  'data-archive': 'PI Data Archive',
  'asset-framework': 'Asset Framework',
  'data-collection': 'Data Collection',
  visualisation: 'Visualisation',
  analytics: 'Analytics',
  integration: 'Integration & Developer',
  administration: 'Administration & Operations',
  industries: 'Industries',
  'case-studies': 'Case Studies',
  security: 'Cybersecurity & Compliance',
  glossary: 'Glossary',
};

export const LEVELS = ['beginner', 'practitioner', 'expert'] as const;
export const LevelSchema = z.enum(LEVELS);
export type Level = z.infer<typeof LevelSchema>;

export const ROLES = [
  'pi-admin',
  'af-developer',
  'analyst',
  'ot-engineer',
  'data-scientist',
] as const;
export const RoleSchema = z.enum(ROLES);
export type Role = z.infer<typeof RoleSchema>;

export const ROLE_LABELS: Record<Role, string> = {
  'pi-admin': 'PI Admin',
  'af-developer': 'AF Developer',
  analyst: 'Analyst',
  'ot-engineer': 'OT Engineer',
  'data-scientist': 'Data Scientist',
};

export const INDUSTRIES = [
  'oil-gas',
  'power',
  'water',
  'chemicals',
  'pharma',
  'mining',
  'food-bev',
  'data-centres',
  'pulp-paper',
  'buildings',
  'manufacturing',
  'marine-transport',
] as const;
export const IndustrySchema = z.enum(INDUSTRIES);
export type Industry = z.infer<typeof IndustrySchema>;

export const INDUSTRY_LABELS: Record<Industry, string> = {
  'oil-gas': 'Oil & Gas',
  power: 'Power & Utilities',
  water: 'Water & Wastewater',
  chemicals: 'Chemicals',
  pharma: 'Pharma & Life Sciences',
  mining: 'Mining & Metals',
  'food-bev': 'Food & Beverage',
  'data-centres': 'Data Centres',
  'pulp-paper': 'Pulp & Paper',
  buildings: 'Smart Buildings',
  manufacturing: 'Manufacturing',
  'marine-transport': 'Marine & Transport',
};

/** kebab-case id, e.g. `compression-swinging-door`. */
export const IdSchema = z
  .string()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9]+(?:[-.][a-z0-9]+)*$/, 'ids must be lowercase kebab-case (dots allowed)');

/** COVERAGE.md item id, e.g. `da.point-attributes`. */
export const CoverageIdSchema = z
  .string()
  .regex(/^[a-z]{2,3}\.[a-z0-9-]+$/, 'coverage ids look like `da.point-attributes`');

/**
 * Fields shared by every authored content item. `verify` marks anything the author
 * could not trace to a readable primary source; `verifyNote` says what needs checking.
 */
export const ProvenanceShape = {
  sources: z.array(IdSchema).min(1, 'every item needs at least one source'),
  verify: z.boolean().default(false),
  verifyNote: z.string().min(5).optional(),
};

export function requireVerifyNote<T extends { verify: boolean; verifyNote?: string | undefined }>(
  value: T,
  ctx: z.RefinementCtx,
): void {
  if (value.verify && !value.verifyNote) {
    ctx.addIssue({
      code: 'custom',
      path: ['verifyNote'],
      message: 'verifyNote is required when verify is true',
    });
  }
}
