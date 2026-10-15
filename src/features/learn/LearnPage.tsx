import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, Clock, PlayCircle } from 'lucide-react';
import { useApp } from '@/app/AppContext';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState, PageHeader, Progress } from '@/components/ui/misc';
import {
  DOMAIN_LABELS,
  DOMAINS,
  LEVELS,
  ROLE_LABELS,
  ROLES,
  type Level,
  type Role,
} from '@/core/schemas';
import { lessonsForPath, nextLesson } from './paths';
import { cn } from '@/lib/cn';

export function LearnPage() {
  const { library, user, settings, updateSettings, rev } = useApp();
  const progress = useMemo(() => {
    void rev;
    return user.lessonProgress();
  }, [user, rev]);
  const completed = useMemo(
    () => new Set(progress.filter((p) => p.status === 'completed').map((p) => p.lesson_id)),
    [progress],
  );
  const started = useMemo(() => new Set(progress.map((p) => p.lesson_id)), [progress]);
  const path = useMemo(
    () => lessonsForPath(library.lesson, settings.level, settings.role),
    [library.lesson, settings.level, settings.role],
  );
  const next = nextLesson(path, completed);
  const done = path.filter((l) => completed.has(l.id)).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Learn"
        description="Follow a course path by level, or a role path. Each lesson ends with a three-question knowledge check."
      />

      <Card>
        <CardContent className="flex flex-wrap items-end gap-6 pt-5">
          <div>
            <div className="mb-1 text-sm font-medium" id="level-label">
              Level
            </div>
            <div
              className="inline-flex rounded-md border border-border p-1"
              role="radiogroup"
              aria-labelledby="level-label"
            >
              {LEVELS.map((l: Level) => (
                <button
                  key={l}
                  role="radio"
                  aria-checked={settings.level === l}
                  onClick={() => updateSettings({ level: l })}
                  className={cn(
                    'rounded px-3 py-1.5 text-sm capitalize',
                    settings.level === l ? 'bg-primary text-primary-fg' : 'hover:bg-surface-2',
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1 text-sm font-medium" id="role-label">
              Role path
            </div>
            <div className="flex flex-wrap gap-1" role="radiogroup" aria-labelledby="role-label">
              <button
                role="radio"
                aria-checked={settings.role === null}
                onClick={() => updateSettings({ role: null })}
                className={cn(
                  'rounded-full border px-3 py-1 text-sm',
                  settings.role === null
                    ? 'border-primary bg-primary-soft text-primary'
                    : 'border-border',
                )}
              >
                All roles
              </button>
              {ROLES.map((r: Role) => (
                <button
                  key={r}
                  role="radio"
                  aria-checked={settings.role === r}
                  onClick={() => updateSettings({ role: r })}
                  className={cn(
                    'rounded-full border px-3 py-1 text-sm',
                    settings.role === r
                      ? 'border-primary bg-primary-soft text-primary'
                      : 'border-border',
                  )}
                >
                  {ROLE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>
          <div className="ml-auto min-w-56 flex-1 sm:flex-none">
            <div className="mb-1 text-sm text-fg-muted">
              {done} of {path.length} lessons complete
            </div>
            <Progress value={path.length ? (done / path.length) * 100 : 0} label="Path progress" />
          </div>
          {next ? (
            <Link to={`/learn/${next.id}`} className={buttonVariants()}>
              <PlayCircle /> {started.has(next.id) ? 'Continue' : 'Start'}: {next.title}
            </Link>
          ) : null}
        </CardContent>
      </Card>

      {path.length === 0 ? (
        <EmptyState title="No lessons match this path yet.">
          Try a higher level or “All roles”.
        </EmptyState>
      ) : (
        DOMAINS.map((d) => {
          const lessons = path.filter((l) => l.domain === d);
          if (lessons.length === 0) return null;
          const dDone = lessons.filter((l) => completed.has(l.id)).length;
          return (
            <Card key={d}>
              <CardHeader className="flex-row items-center justify-between gap-4">
                <CardTitle>{DOMAIN_LABELS[d]}</CardTitle>
                <span className="text-sm text-fg-muted">
                  {dDone}/{lessons.length}
                </span>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border">
                  {lessons.map((l) => (
                    <li key={l.id}>
                      <Link
                        to={`/learn/${l.id}`}
                        className="flex items-center gap-3 py-3 hover:text-primary"
                      >
                        {completed.has(l.id) ? (
                          <CheckCircle2
                            className="size-5 shrink-0 text-success"
                            aria-label="Completed"
                          />
                        ) : (
                          <Circle
                            className={cn(
                              'size-5 shrink-0',
                              started.has(l.id) ? 'text-primary' : 'text-fg-subtle',
                            )}
                            aria-label={started.has(l.id) ? 'Started' : 'Not started'}
                          />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium">{l.title}</span>
                          <span className="block truncate text-sm text-fg-muted">{l.summary}</span>
                        </span>
                        <Badge className="hidden capitalize sm:inline-flex">{l.level}</Badge>
                        <span className="hidden items-center gap-1 text-xs text-fg-muted sm:flex">
                          <Clock className="size-3.5" aria-hidden /> {l.minutes} min
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
