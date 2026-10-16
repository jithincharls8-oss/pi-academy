import { LESSON_SECTIONS, LESSON_SECTION_TITLES, LessonSchema, type Lesson, type LessonSectionKey } from '../schemas';

const TITLE_TO_KEY = new Map<string, LessonSectionKey>(
  LESSON_SECTIONS.map((k) => [LESSON_SECTION_TITLES[k].toLowerCase(), k]),
);

/**
 * Split a lesson body into its required `## Section` blocks.
 * Unknown `##` headings are an error so authors cannot silently drop a section.
 */
export function splitLessonSections(body: string): Record<LessonSectionKey, string> {
  const out: Partial<Record<LessonSectionKey, string>> = {};
  let current: LessonSectionKey | null = null;
  let buffer: string[] = [];
  let inFence = false;

  const flush = (): void => {
    if (current) out[current] = buffer.join('\n').trim();
    buffer = [];
  };

  for (const line of body.split(/\r?\n/)) {
    if (/^\s*```/.test(line)) inFence = !inFence;
    const m = !inFence ? /^##\s+(.+?)\s*$/.exec(line) : null;
    if (m) {
      flush();
      const key = TITLE_TO_KEY.get((m[1] ?? '').toLowerCase());
      if (!key) {
        throw new Error(
          `unknown lesson section "## ${m[1]}". Allowed: ${LESSON_SECTIONS.map((k) => LESSON_SECTION_TITLES[k]).join(', ')}`,
        );
      }
      if (out[key] !== undefined) throw new Error(`duplicate lesson section "## ${m[1]}"`);
      current = key;
      continue;
    }
    if (current) buffer.push(line);
    else if (line.trim() !== '') throw new Error('lesson body text must sit under a ## section heading');
  }
  flush();

  const missing = LESSON_SECTIONS.filter((k) => !out[k]);
  if (missing.length > 0) {
    throw new Error(`missing lesson sections: ${missing.map((k) => LESSON_SECTION_TITLES[k]).join(', ')}`);
  }
  return out as Record<LessonSectionKey, string>;
}

/** Build a validated Lesson from parsed front matter and the Markdown body. */
export function buildLesson(frontMatter: Record<string, unknown>, body: string): Lesson {
  return LessonSchema.parse({ ...frontMatter, sections: splitLessonSections(body) });
}
