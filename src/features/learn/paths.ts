import type { Lesson, Level, Role } from '@/core/schemas';
import { DOMAINS } from '@/core/schemas';

const LEVEL_RANK: Record<Level, number> = { beginner: 0, practitioner: 1, expert: 2 };

/** Lessons for a path: everything up to the chosen level, optionally for one role, in syllabus order. */
export function lessonsForPath(
  lessons: readonly Lesson[],
  level: Level,
  role: Role | null,
): Lesson[] {
  return lessons
    .filter((l) => LEVEL_RANK[l.level] <= LEVEL_RANK[level])
    .filter((l) => !role || l.roles.includes(role))
    .sort(
      (a, b) =>
        DOMAINS.indexOf(a.domain) - DOMAINS.indexOf(b.domain) ||
        LEVEL_RANK[a.level] - LEVEL_RANK[b.level] ||
        a.order - b.order ||
        a.title.localeCompare(b.title),
    );
}

/** The first lesson in the path that is not completed. */
export function nextLesson(
  path: readonly Lesson[],
  completed: ReadonlySet<string>,
): Lesson | undefined {
  return path.find((l) => !completed.has(l.id));
}
