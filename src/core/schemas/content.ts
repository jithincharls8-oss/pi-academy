import { z } from 'zod';
import {
  CoverageIdSchema,
  DomainSchema,
  IdSchema,
  IndustrySchema,
  LevelSchema,
  ProvenanceShape,
  RoleSchema,
  requireVerifyNote,
} from './common';

/* ------------------------------------------------------------------ Source */

export const SOURCE_KINDS = [
  'docs',
  'pisquare',
  'release-notes',
  'case-study',
  'presentation',
  'whitepaper',
  'standard',
  'github',
  'other',
] as const;

export const SourceSchema = z.object({
  id: IdSchema,
  title: z.string().min(3),
  url: z.url({ protocol: /^https?$/ }),
  publisher: z.string().min(2),
  kind: z.enum(SOURCE_KINDS),
  accessed: z.iso.date(),
  /** true when the page/PDF text was actually read; false when only located (e.g. JS-only docs pages). */
  readable: z.boolean(),
  notes: z.string().optional(),
});
export type Source = z.infer<typeof SourceSchema>;

/* ------------------------------------------------------------------ Lesson */

export const LESSON_SECTIONS = [
  'plainEnglish',
  'deepDive',
  'workedExample',
  'diagram',
  'commonMistakes',
  'realWorldScenario',
] as const;
export type LessonSectionKey = (typeof LESSON_SECTIONS)[number];

export const LESSON_SECTION_TITLES: Record<LessonSectionKey, string> = {
  plainEnglish: 'Plain English',
  deepDive: 'Deep Dive',
  workedExample: 'Worked Example',
  diagram: 'Diagram',
  commonMistakes: 'Common Mistakes',
  realWorldScenario: 'Real-World Scenario',
};

const SectionText = z.string().trim().min(40, 'lesson sections need real content');

export const LessonSchema = z
  .object({
    id: IdSchema,
    title: z.string().min(3),
    summary: z.string().min(20),
    domain: DomainSchema,
    coverage: z.array(CoverageIdSchema).min(1),
    level: LevelSchema,
    roles: z.array(RoleSchema).min(1),
    minutes: z.number().int().min(2).max(90),
    order: z.number().int().min(0).default(100),
    objectives: z.array(z.string().min(5)).min(2),
    keyTerms: z.array(IdSchema).min(1),
    knowledgeCheck: z
      .array(IdSchema)
      .length(3, 'each lesson has exactly 3 knowledge-check questions'),
    related: z.array(IdSchema).default([]),
    sections: z.object({
      plainEnglish: SectionText,
      deepDive: SectionText,
      workedExample: SectionText,
      diagram: SectionText.refine((s) => s.includes('```mermaid'), {
        message: 'the Diagram section must contain a ```mermaid block',
      }),
      commonMistakes: SectionText,
      realWorldScenario: SectionText,
    }),
    ...ProvenanceShape,
  })
  .superRefine(requireVerifyNote);
export type Lesson = z.infer<typeof LessonSchema>;

/* ------------------------------------------------------------------ Questions */

const OptionSchema = z.object({ id: z.string().regex(/^[a-z0-9]+$/), text: z.string().min(1) });

const QuestionBase = {
  id: IdSchema,
  domain: DomainSchema,
  coverage: z.array(CoverageIdSchema).min(1),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  prompt: z.string().min(10),
  explanation: z.string().min(20),
  lessonId: IdSchema.optional(),
  tags: z.array(z.string()).default([]),
  ...ProvenanceShape,
};

function uniqueIds(options: { id: string }[]): boolean {
  return new Set(options.map((o) => o.id)).size === options.length;
}

export const McqQuestionSchema = z.object({
  ...QuestionBase,
  type: z.literal('mcq'),
  options: z.array(OptionSchema).min(2).max(6).refine(uniqueIds, 'option ids must be unique'),
  answer: z.string(),
});

export const MultiQuestionSchema = z.object({
  ...QuestionBase,
  type: z.literal('multi'),
  options: z.array(OptionSchema).min(3).max(8).refine(uniqueIds, 'option ids must be unique'),
  answers: z.array(z.string()).min(2),
});

export const OrderingQuestionSchema = z.object({
  ...QuestionBase,
  type: z.literal('ordering'),
  /** listed in the correct order; the UI shuffles them deterministically. */
  items: z.array(OptionSchema).min(3).max(8).refine(uniqueIds, 'item ids must be unique'),
});

export const MatchingQuestionSchema = z.object({
  ...QuestionBase,
  type: z.literal('matching'),
  pairs: z
    .array(z.object({ left: z.string().min(1), right: z.string().min(1) }))
    .min(3)
    .max(8),
});

export const ScenarioQuestionSchema = z.object({
  ...QuestionBase,
  type: z.literal('scenario'),
  scenario: z.string().min(40),
  options: z.array(OptionSchema).min(2).max(6).refine(uniqueIds, 'option ids must be unique'),
  answer: z.string(),
});

export const FillQuestionSchema = z.object({
  ...QuestionBase,
  type: z.literal('fill'),
  /** accepted answers, compared case-insensitively after whitespace normalisation */
  accepted: z.array(z.string().min(1)).min(1),
  caseSensitive: z.boolean().default(false),
});

export const CODE_LANGUAGES = ['webapi', 'af', 'pe'] as const;

export const CodeQuestionSchema = z.object({
  ...QuestionBase,
  type: z.literal('code'),
  language: z.enum(CODE_LANGUAGES),
  /** canonical answers; matched after normalisation (case, whitespace, quote style) */
  accepted: z.array(z.string().min(1)).min(1),
  /** alternative grading: every regex must match the normalised answer */
  requiredPatterns: z.array(z.string()).default([]),
  forbiddenPatterns: z.array(z.string()).default([]),
  placeholder: z.string().optional(),
});

export const QuestionSchema = z
  .discriminatedUnion('type', [
    McqQuestionSchema,
    MultiQuestionSchema,
    OrderingQuestionSchema,
    MatchingQuestionSchema,
    ScenarioQuestionSchema,
    FillQuestionSchema,
    CodeQuestionSchema,
  ])
  .superRefine((q, ctx) => {
    requireVerifyNote(q, ctx);
    if (q.type === 'mcq' || q.type === 'scenario') {
      if (!q.options.some((o) => o.id === q.answer)) {
        ctx.addIssue({ code: 'custom', path: ['answer'], message: 'answer must be an option id' });
      }
    }
    if (q.type === 'multi') {
      const ids = new Set(q.options.map((o) => o.id));
      if (!q.answers.every((a) => ids.has(a))) {
        ctx.addIssue({ code: 'custom', path: ['answers'], message: 'answers must be option ids' });
      }
    }
    if (q.type === 'code') {
      for (const p of [...q.requiredPatterns, ...q.forbiddenPatterns]) {
        try {
          new RegExp(p, 'i');
        } catch {
          ctx.addIssue({ code: 'custom', path: ['requiredPatterns'], message: `bad regex: ${p}` });
        }
      }
    }
  });
export type Question = z.infer<typeof QuestionSchema>;
export type QuestionType = Question['type'];

/* ------------------------------------------------------------------ Glossary */

export const GlossaryTermSchema = z
  .object({
    id: IdSchema,
    term: z.string().min(1),
    aliases: z.array(z.string()).default([]),
    definition: z.string().min(20),
    domain: DomainSchema,
    coverage: z.array(CoverageIdSchema).default([]),
    related: z.array(IdSchema).default([]),
    ...ProvenanceShape,
  })
  .superRefine(requireVerifyNote);
export type GlossaryTerm = z.infer<typeof GlossaryTermSchema>;

/* ------------------------------------------------------------------ Case studies */

export const OUTCOME_CATEGORIES = [
  'efficiency',
  'cost',
  'reliability',
  'quality',
  'safety',
  'sustainability',
  'compliance',
  'visibility',
  'other',
] as const;

export const PRODUCTS = [
  'data-archive',
  'asset-framework',
  'pi-vision',
  'pi-web-api',
  'interfaces-connectors',
  'adapters',
  'pi-integrator',
  'notifications',
  'analytics',
  'datalink',
  'processbook',
  'data-hub',
  'event-frames',
  'cloud',
] as const;
export const ProductSchema = z.enum(PRODUCTS);

export const CaseStudySchema = z
  .object({
    id: IdSchema,
    company: z.string().min(2),
    title: z.string().min(5),
    industry: IndustrySchema,
    products: z.array(ProductSchema).min(1),
    region: z.string().optional(),
    year: z.number().int().min(1990).max(2100).optional(),
    summary: z.string().min(40),
    challenge: z.string().min(20),
    solution: z.string().min(20),
    outcomes: z
      .array(
        z.object({
          category: z.enum(OUTCOME_CATEGORIES),
          text: z.string().min(5),
          /** who reported the figure; rendered as "reported by <reportedBy>" */
          reportedBy: z.string().min(2),
        }),
      )
      .min(1),
    coverage: z.array(CoverageIdSchema).default(['cs.library']),
    ...ProvenanceShape,
  })
  .superRefine(requireVerifyNote);
export type CaseStudy = z.infer<typeof CaseStudySchema>;

/* ------------------------------------------------------------------ Industry hubs */

export const IndustryHubSchema = z
  .object({
    id: IndustrySchema,
    title: z.string().min(3),
    summary: z.string().min(40),
    hierarchy: z
      .string()
      .refine((s) => s.includes('```mermaid'), 'hierarchy must be a mermaid block'),
    tags: z
      .array(z.object({ name: z.string(), description: z.string(), uom: z.string().optional() }))
      .min(3),
    templates: z
      .array(
        z.object({
          name: z.string(),
          description: z.string(),
          attributes: z.array(z.string()).min(1),
        }),
      )
      .min(1),
    calculations: z
      .array(z.object({ name: z.string(), expression: z.string(), description: z.string() }))
      .min(1),
    eventFrames: z.array(z.object({ name: z.string(), trigger: z.string() })).min(1),
    kpis: z.array(z.object({ name: z.string(), definition: z.string() })).min(2),
    regulation: z.array(z.object({ name: z.string(), summary: z.string() })).default([]),
    pitfalls: z.array(z.string()).min(2),
    caseStudies: z.array(IdSchema).default([]),
    coverage: z.array(CoverageIdSchema).min(1),
    ...ProvenanceShape,
  })
  .superRefine(requireVerifyNote);
export type IndustryHub = z.infer<typeof IndustryHubSchema>;

/* ------------------------------------------------------------------ Challenges */

export const ChallengeCheckSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('compression'),
    scenarioId: z.string(),
    /** stored events must be at most this fraction of raw events */
    maxStoredRatio: z.number().gt(0).lte(1),
    /** max absolute reconstruction error, in engineering units */
    maxError: z.number().gt(0),
  }),
  z.object({
    kind: z.literal('point-attributes'),
    pointName: z.string(),
    expected: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  }),
  z.object({
    kind: z.literal('pe-expression'),
    expected: z.union([z.number(), z.string()]),
    tolerance: z.number().min(0).default(0),
    language: z.enum(['pe', 'af']),
  }),
  z.object({
    kind: z.literal('webapi-request'),
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
    pathPattern: z.string(),
    expectStatus: z.number().int(),
  }),
  z.object({ kind: z.literal('af-find'), targetPath: z.string() }),
  z.object({
    kind: z.literal('display-symbols'),
    required: z
      .array(z.object({ symbol: z.string(), attributePath: z.string().optional() }))
      .min(1),
  }),
]);
export type ChallengeCheck = z.infer<typeof ChallengeCheckSchema>;

export const ChallengeSchema = z
  .object({
    id: IdSchema,
    title: z.string().min(3),
    tool: z.enum(['af-tree', 'point-editor', 'compression', 'display', 'pe', 'webapi']),
    level: LevelSchema,
    brief: z.string().min(20),
    hints: z.array(z.string()).min(1),
    solution: z.string().min(10),
    check: ChallengeCheckSchema,
    coverage: z.array(CoverageIdSchema).min(1),
    ...ProvenanceShape,
  })
  .superRefine(requireVerifyNote);
export type Challenge = z.infer<typeof ChallengeSchema>;
