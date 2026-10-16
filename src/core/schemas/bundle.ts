import { z } from 'zod';
import { CoverageIdSchema, DomainSchema } from './common';
import {
  CaseStudySchema,
  ChallengeSchema,
  GlossaryTermSchema,
  IndustryHubSchema,
  LessonSchema,
  QuestionSchema,
  SourceSchema,
} from './content';
import { ReferenceSchema } from './reference';

export const COVERAGE_STATUSES = ['not started', 'drafted', 'reviewed', 'verified'] as const;
export const CoverageStatusSchema = z.enum(COVERAGE_STATUSES);
export type CoverageStatus = z.infer<typeof CoverageStatusSchema>;

export const CoverageItemSchema = z.object({
  id: CoverageIdSchema,
  domain: DomainSchema,
  title: z.string(),
  status: CoverageStatusSchema,
  lessons: z.number().int().min(0),
  questions: z.number().int().min(0),
  terms: z.number().int().min(0),
});
export type CoverageItem = z.infer<typeof CoverageItemSchema>;

export const ContentBundleSchema = z.object({
  version: z.string().min(6),
  generatedAt: z.iso.datetime(),
  lessons: z.array(LessonSchema),
  questions: z.array(QuestionSchema),
  glossary: z.array(GlossaryTermSchema),
  caseStudies: z.array(CaseStudySchema),
  industries: z.array(IndustryHubSchema),
  challenges: z.array(ChallengeSchema),
  sources: z.array(SourceSchema),
  reference: ReferenceSchema,
  coverage: z.array(CoverageItemSchema),
});
export type ContentBundle = z.infer<typeof ContentBundleSchema>;
