import type { z } from 'zod';
import {
  CaseStudySchema,
  ChallengeSchema,
  CommandRefSchema,
  ContentBundleSchema,
  CoverageItemSchema,
  DecisionTreeSchema,
  ErrorCodeSchema,
  FunctionRefSchema,
  GlossaryTermSchema,
  IndustryHubSchema,
  LessonSchema,
  QuestionSchema,
  SourceSchema,
  WebApiEndpointSchema,
  type ContentBundle,
  type CoverageItem,
} from '@/core/schemas';
import type { AppDatabase } from './database';

/** Every editable content kind, with its schema and where it lives in the bundle. */
export const CONTENT_KINDS = {
  lesson: { schema: LessonSchema, label: 'Lessons' },
  question: { schema: QuestionSchema, label: 'Questions' },
  glossary: { schema: GlossaryTermSchema, label: 'Glossary terms' },
  caseStudy: { schema: CaseStudySchema, label: 'Case studies' },
  industry: { schema: IndustryHubSchema, label: 'Industry hubs' },
  challenge: { schema: ChallengeSchema, label: 'Challenges' },
  source: { schema: SourceSchema, label: 'Sources' },
  peFunction: { schema: FunctionRefSchema, label: 'PE functions' },
  afFunction: { schema: FunctionRefSchema, label: 'AF functions' },
  webApi: { schema: WebApiEndpointSchema, label: 'Web API endpoints' },
  command: { schema: CommandRefSchema, label: 'Commands' },
  errorCode: { schema: ErrorCodeSchema, label: 'Error codes' },
  decisionTree: { schema: DecisionTreeSchema, label: 'Decision trees' },
} as const;
export type ContentKind = keyof typeof CONTENT_KINDS;
export type ContentOf<K extends ContentKind> = z.infer<(typeof CONTENT_KINDS)[K]['schema']>;

export type Library = { [K in ContentKind]: ContentOf<K>[] } & {
  coverage: CoverageItem[];
  version: string;
};

function bundleLists(b: ContentBundle): { [K in ContentKind]: { id: string }[] } {
  return {
    lesson: b.lessons,
    question: b.questions,
    glossary: b.glossary,
    caseStudy: b.caseStudies,
    industry: b.industries,
    challenge: b.challenges,
    source: b.sources,
    peFunction: b.reference.peFunctions,
    afFunction: b.reference.afFunctions,
    webApi: b.reference.webApi,
    command: b.reference.commands,
    errorCode: b.reference.errorCodes,
    decisionTree: b.reference.decisionTrees,
  };
}

export class ContentRepo {
  constructor(private readonly db: AppDatabase) {}

  currentVersion(): string | null {
    return (
      this.db.get<{ value: string }>("SELECT value FROM meta WHERE key = 'content_version'")
        ?.value ?? null
    );
  }

  /**
   * Seed bundle content. Runs on first launch and whenever the bundle version changes.
   * User-authored rows (origin='user') are never touched.
   */
  seed(bundle: ContentBundle): boolean {
    if (this.currentVersion() === bundle.version) return false;
    const now = new Date().toISOString();
    this.db.transaction(() => {
      this.db.run("DELETE FROM content_items WHERE origin = 'bundle'");
      for (const [kind, items] of Object.entries(bundleLists(bundle))) {
        for (const item of items) {
          this.db.run(
            "INSERT INTO content_items (kind, id, origin, data, deleted, updated_at) VALUES (?, ?, 'bundle', ?, 0, ?)",
            [kind, item.id, JSON.stringify(item), now],
          );
        }
      }
      this.setMeta('content_version', bundle.version);
      this.setMeta('coverage', JSON.stringify(bundle.coverage));
      if (!this.getMeta('first_launch_at')) this.setMeta('first_launch_at', now);
    });
    return true;
  }

  getMeta(key: string): string | null {
    return (
      this.db.get<{ value: string }>('SELECT value FROM meta WHERE key = ?', [key])?.value ?? null
    );
  }

  setMeta(key: string, value: string): void {
    this.db.run(
      'INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      [key, value],
    );
  }

  /** Effective items: a user row overrides the bundle row with the same id; deleted user rows hide it. */
  list<K extends ContentKind>(kind: K): ContentOf<K>[] {
    const rows = this.db.all<{ id: string; origin: string; data: string; deleted: number }>(
      'SELECT id, origin, data, deleted FROM content_items WHERE kind = ? ORDER BY id',
      [kind],
    );
    const byId = new Map<string, { origin: string; data: string; deleted: number }>();
    for (const r of rows) {
      const prev = byId.get(r.id);
      if (!prev || r.origin === 'user') byId.set(r.id, r);
    }
    const schema = CONTENT_KINDS[kind].schema;
    const out: ContentOf<K>[] = [];
    for (const r of byId.values()) {
      if (r.deleted) continue;
      let json: unknown;
      try {
        json = JSON.parse(r.data);
      } catch {
        continue; // e.g. a restored backup row with malformed data; skip rather than crash
      }
      const parsed = schema.safeParse(json);
      if (parsed.success) out.push(parsed.data as ContentOf<K>);
    }
    return out;
  }

  origin(kind: ContentKind, id: string): 'bundle' | 'user' | 'both' | null {
    const rows = this.db.all<{ origin: string }>(
      'SELECT origin FROM content_items WHERE kind = ? AND id = ?',
      [kind, id],
    );
    if (rows.length === 0) return null;
    if (rows.length > 1) return 'both';
    return rows[0]!.origin === 'user' ? 'user' : 'bundle';
  }

  /** Create or replace a user-authored item after validating it. Returns zod issues on failure. */
  upsert<K extends ContentKind>(
    kind: K,
    value: unknown,
  ): { ok: true; item: ContentOf<K> } | { ok: false; errors: string[] } {
    const parsed = CONTENT_KINDS[kind].schema.safeParse(value);
    if (!parsed.success) {
      return {
        ok: false,
        errors: parsed.error.issues.map((i) => `${i.path.join('.') || 'item'}: ${i.message}`),
      };
    }
    const item = parsed.data as ContentOf<K> & { id: string };
    this.db.run(
      `INSERT INTO content_items (kind, id, origin, data, deleted, updated_at) VALUES (?, ?, 'user', ?, 0, ?)
       ON CONFLICT(kind, id, origin) DO UPDATE SET data = excluded.data, deleted = 0, updated_at = excluded.updated_at`,
      [kind, item.id, JSON.stringify(item), new Date().toISOString()],
    );
    return { ok: true, item };
  }

  /** Delete: a user-only item is removed; a bundle item is hidden by a deleted user row. */
  remove(kind: ContentKind, id: string): void {
    const hasBundle = this.db.get(
      "SELECT 1 AS x FROM content_items WHERE kind = ? AND id = ? AND origin = 'bundle'",
      [kind, id],
    );
    if (hasBundle) {
      this.db.run(
        `INSERT INTO content_items (kind, id, origin, data, deleted, updated_at) VALUES (?, ?, 'user', '{}', 1, ?)
         ON CONFLICT(kind, id, origin) DO UPDATE SET deleted = 1, updated_at = excluded.updated_at`,
        [kind, id, new Date().toISOString()],
      );
    } else {
      this.db.run("DELETE FROM content_items WHERE kind = ? AND id = ? AND origin = 'user'", [
        kind,
        id,
      ]);
    }
  }

  /** Drop the user override so the bundled version shows again. */
  revert(kind: ContentKind, id: string): void {
    this.db.run("DELETE FROM content_items WHERE kind = ? AND id = ? AND origin = 'user'", [
      kind,
      id,
    ]);
  }

  userItems(): { kind: ContentKind; id: string; data: string; deleted: number }[] {
    return this.db.all(
      "SELECT kind, id, data, deleted FROM content_items WHERE origin = 'user' ORDER BY kind, id",
    );
  }

  coverage(): CoverageItem[] {
    const raw = this.getMeta('coverage');
    if (!raw) return [];
    const parsed = CoverageItemSchema.array().safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  }

  library(): Library {
    const lib = Object.fromEntries(
      (Object.keys(CONTENT_KINDS) as ContentKind[]).map((k) => [k, this.list(k)]),
    ) as { [K in ContentKind]: ContentOf<K>[] };
    return { ...lib, coverage: this.coverage(), version: this.currentVersion() ?? 'none' };
  }
}

export { ContentBundleSchema };
