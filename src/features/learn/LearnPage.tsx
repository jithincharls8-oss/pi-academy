import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ChevronRight, Circle, Clock, PlayCircle } from 'lucide-react';
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
import { SegmentedControl } from '@/components/ui/segmented';
import { lessonsForPath, nextLesson } from './paths';

const ALL_ROLES = 'all';
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
            <div className="mb-1.5 text-sm font-medium" id="level-label">
              Level
            </div>
            <SegmentedControl
              aria-labelledby="level-label"
              value={settings.level}
              onValueChange={(level: Level) => updateSettings({ level })}
              options={LEVELS.map((l) => ({
                value: l,
                label: <span className="capitalize">{l}</span>,
              }))}
            />
          </div>
          <div>
            <div className="mb-1.5 text-sm font-medium" id="role-label">
              Role path
            </div>
            <SegmentedControl
              aria-labelledby="role-label"
              value={settings.role ?? ALL_ROLES}
              onValueChange={(r) => updateSettings({ role: r === ALL_ROLES ? null : (r as Role) })}
              options={[
                { value: ALL_ROLES, label: 'All roles' },
                ...ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] })),
              ]}
            />
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
            <Card key={d} className="overflow-hidden">
              <CardHeader className="flex-row items-center justify-between gap-4 pb-2">
                <CardTitle>{DOMAIN_LABELS[d]}</CardTitle>
                <span className="tabular text-sm text-fg-muted">
                  {dDone} of {lessons.length}
                </span>
              </CardHeader>
              <Progress
                className="mx-5 mb-2 h-1.5 w-auto"
                tone="success"
                value={(dDone / lessons.length) * 100}
                label={`${DOMAIN_LABELS[d]} progress`}
              />
              <CardContent className="px-0 pb-2">
                <ul className="divide-y divide-border">
                  {lessons.map((l) => (
                    <li key={l.id}>
                      <Link
                        to={`/learn/${l.id}`}
                        className="group flex cursor-pointer items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-2"
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
                          <span className="block font-medium group-hover:text-primary">
                            {l.title}
                          </span>
                          <span className="block truncate text-sm text-fg-muted">{l.summary}</span>
                        </span>
                        <Badge className="hidden capitalize sm:inline-flex">{l.level}</Badge>
                        <span className="hidden items-center gap-1 text-xs text-fg-muted sm:flex">
                          <Clock className="size-3.5" aria-hidden /> {l.minutes} min
                        </span>
                        <ChevronRight className="size-4 shrink-0 text-fg-subtle" aria-hidden />
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
