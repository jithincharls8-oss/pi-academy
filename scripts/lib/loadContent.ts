import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import matter from 'gray-matter';
import { z } from 'zod';
import { buildLesson } from '../../src/core/content/parseLesson';
import { parseCoverage } from '../../src/core/coverage/parse';
import {
  CaseStudySchema,
  ChallengeSchema,
  CommandRefSchema,
  DecisionTreeSchema,
  ErrorCodeSchema,
  FunctionRefSchema,
  GlossaryTermSchema,
  IndustryHubSchema,
  QuestionSchema,
  SourceSchema,
  WebApiEndpointSchema,
  type ContentBundle,
} from '../../src/core/schemas';

export const ROOT = join(import.meta.dirname, '..', '..');
export const CONTENT = join(ROOT, 'content');

export type LoadedContent = Omit<ContentBundle, 'version' | 'generatedAt'>;

function walk(dir: string, ext: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p, ext));
    else if (name.endsWith(ext)) out.push(p);
  }
  return out;
}

function formatZod(err: z.ZodError): string {
  return err.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ');
}

/** Load and schema-validate everything under /content. Collects per-file errors instead of stopping. */
export function loadContent(): { content: LoadedContent; errors: string[] } {
  const errors: string[] = [];
  const rel = (p: string): string => relative(ROOT, p);

  function readJsonArray<T>(files: string[], schema: z.ZodType<T>): T[] {
    const out: T[] = [];
    for (const f of files) {
      let raw: unknown;
      try {
        raw = JSON.parse(readFileSync(f, 'utf8'));
      } catch (e) {
        errors.push(`${rel(f)}: invalid JSON (${(e as Error).message})`);
        continue;
      }
      const list = Array.isArray(raw) ? raw : [raw];
      list.forEach((item, idx) => {
        const res = schema.safeParse(item);
        if (res.success) out.push(res.data);
        else {
          const id = typeof item === 'object' && item && 'id' in item ? String((item as { id: unknown }).id) : `#${idx}`;
          errors.push(`${rel(f)} [${id}]: ${formatZod(res.error)}`);
        }
      });
    }
    return out;
  }

  const lessons: LoadedContent['lessons'] = [];
  for (const f of walk(join(CONTENT, 'lessons'), '.md')) {
    try {
      const parsed = matter(readFileSync(f, 'utf8'));
      lessons.push(buildLesson(parsed.data as Record<string, unknown>, parsed.content));
    } catch (e) {
      errors.push(`${rel(f)}: ${e instanceof z.ZodError ? formatZod(e) : (e as Error).message}`);
    }
  }

  const ref = join(CONTENT, 'reference');
  const content: LoadedContent = {
    lessons,
    questions: readJsonArray(walk(join(CONTENT, 'questions'), '.json'), QuestionSchema),
    glossary: readJsonArray(walk(join(CONTENT, 'glossary'), '.json'), GlossaryTermSchema),
    caseStudies: readJsonArray(walk(join(CONTENT, 'case-studies'), '.json'), CaseStudySchema),
    industries: readJsonArray(walk(join(CONTENT, 'industries'), '.json'), IndustryHubSchema),
    challenges: readJsonArray(walk(join(CONTENT, 'challenges'), '.json'), ChallengeSchema),
    sources: readJsonArray(walk(join(CONTENT, 'sources'), '.json'), SourceSchema),
    reference: {
      peFunctions: readJsonArray(walk(join(ref, 'pe-functions'), '.json'), FunctionRefSchema),
      afFunctions: readJsonArray(walk(join(ref, 'af-functions'), '.json'), FunctionRefSchema),
      webApi: readJsonArray(walk(join(ref, 'web-api'), '.json'), WebApiEndpointSchema),
      commands: readJsonArray(walk(join(ref, 'commands'), '.json'), CommandRefSchema),
      errorCodes: readJsonArray(walk(join(ref, 'error-codes'), '.json'), ErrorCodeSchema),
      decisionTrees: readJsonArray(walk(join(ref, 'decision-trees'), '.json'), DecisionTreeSchema),
    },
    coverage: [],
  };

  try {
    content.coverage = parseCoverage(readFileSync(join(ROOT, 'COVERAGE.md'), 'utf8'));
  } catch (e) {
    errors.push(`COVERAGE.md: ${(e as Error).message}`);
  }
  return { content, errors };
}
