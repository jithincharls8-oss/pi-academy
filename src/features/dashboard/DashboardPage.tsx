import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronRight, Clock, Flame, FlaskConical, Lock, Star, Trophy } from 'lucide-react';
import { useApp } from '@/app/AppContext';
import { useLearner } from '@/app/useLearner';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/misc';
import { Pip } from '@/components/ui/pip';
import { DOMAIN_LABELS, type Domain, type Lesson } from '@/core/schemas';
import { XP_RULES, type Quest } from '@/core/progress/learner';
import { lessonsForPath, nextLesson } from '@/features/learn/paths';
import { cn } from '@/lib/cn';

interface Unit {
  domain: Domain;
  lessons: Lesson[];
  done: number;
}

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

/** Learner home: answers "what do I do next?" with the current unit's path, today's goals and streak. */
export function DashboardPage() {
  const { library, user, settings, rev } = useApp();
  const learner = useLearner();
  const completed = useMemo(() => {
    void rev;
    return new Set(
      user
        .lessonProgress()
        .filter((p) => p.status === 'completed')
        .map((p) => p.lesson_id),
    );
  }, [user, rev]);

  const path = useMemo(
    () => lessonsForPath(library.lesson, settings.level, settings.role),
    [library.lesson, settings.level, settings.role],
  );
  const next = nextLesson(path, completed);
  const units = useMemo(() => {
    const out: Unit[] = [];
    for (const l of path) {
      const last = out.at(-1);
      if (last && last.domain === l.domain) last.lessons.push(l);
      else out.push({ domain: l.domain, lessons: [l], done: 0 });
    }
    for (const u of out) u.done = u.lessons.filter((l) => completed.has(l.id)).length;
    return out;
  }, [path, completed]);
  const unitIndex = Math.max(
    0,
    units.findIndex((u) => next && u.domain === next.domain),
  );
  const unit = units[unitIndex];

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-8">
        <header className="flex items-center gap-4">
          <Pip mood={learner.streak > 0 ? 'cheer' : 'wave'} size={72} animate />
          <div>
            <p className="text-[15px] font-medium text-fg-muted">{greeting()}</p>
            <h1 className="text-[32px] leading-tight font-bold tracking-[-0.03em]">
              {next ? 'Ready for your next lesson?' : 'You finished your path. Brilliant.'}
            </h1>
          </div>
        </header>

        {next ? <ContinueCard lesson={next} unit={unit} unitNo={unitIndex + 1} /> : null}

        {unit ? (
          <section aria-labelledby="path-title">
            <div className="mb-2 flex items-baseline justify-between gap-4">
              <h2 id="path-title" className="text-[22px] font-bold tracking-[-0.02em]">
                Unit {unitIndex + 1}: {DOMAIN_LABELS[unit.domain]}
              </h2>
              <span className="tabular text-sm text-fg-muted">
                {unit.done} of {unit.lessons.length} lessons
              </span>
            </div>
            <LessonPath unit={unit} completed={completed} next={next} />
          </section>
        ) : null}

        <section aria-labelledby="course-title">
          <h2 id="course-title" className="mb-3 text-[22px] font-bold tracking-[-0.02em]">
            Your course
          </h2>
          <Card className="divide-y divide-border overflow-hidden">
            {units.map((u, i) => (
              <Link
                key={u.domain}
                to="/learn"
                className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-surface-2"
              >
                <span
                  className={cn(
                    'tabular grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold',
                    u.done === u.lessons.length
                      ? 'bg-success-solid text-on-solid'
                      : i === unitIndex
                        ? 'bg-primary-solid text-on-solid'
                        : 'bg-surface-3 text-fg-muted',
                  )}
                >
                  {u.done === u.lessons.length ? <Check className="size-4" aria-hidden /> : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-semibold">{DOMAIN_LABELS[u.domain]}</div>
                  <Progress
                    className="mt-1.5 h-1.5"
                    tone="success"
                    value={(u.done / u.lessons.length) * 100}
                    label={`${DOMAIN_LABELS[u.domain]} progress`}
                  />
                </div>
                <span className="tabular w-14 text-right text-sm text-fg-muted">
                  {u.done}/{u.lessons.length}
                </span>
                <ChevronRight className="size-4 text-fg-subtle" aria-hidden />
              </Link>
            ))}
          </Card>
        </section>
      </div>

      <aside className="space-y-5" aria-label="Today">
        <TodayCard quests={learner.quests} xpToday={learner.xpToday} />
        <StreakCard streak={learner.streak} doneToday={learner.dailyDoneToday} />
        <Link
          to="/sandbox/smt"
          className="group block rounded-xl bg-accent-soft p-5 ring-1 ring-accent/20 transition-shadow hover:shadow-raised"
        >
          <div className="flex items-center gap-2 text-[13px] font-semibold text-challenge-text">
            <FlaskConical className="size-4" aria-hidden /> Sandbox challenge
          </div>
          <p className="mt-2 text-[15px] leading-snug font-semibold">
            Open the Archive Editor, read the last hour of a tag, and find out why the newest value
            disappears when you press Refresh.
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-challenge-text">
            Open PI SMT{' '}
            <ChevronRight
              className="size-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </span>
        </Link>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-fg-muted">
            <Trophy className="size-4" aria-hidden /> How XP works
          </div>
          <ul className="mt-2 space-y-1 text-sm">
            <li className="flex justify-between">
              <span>Correct answer</span>
              <span className="tabular font-semibold">+{XP_RULES.correctAnswer}</span>
            </li>
            <li className="flex justify-between">
              <span>Lesson completed</span>
              <span className="tabular font-semibold">+{XP_RULES.lessonCompleted}</span>
            </li>
            <li className="flex justify-between">
              <span>Daily exam finished</span>
              <span className="tabular font-semibold">+{XP_RULES.dailyExamCompleted}</span>
            </li>
          </ul>
        </Card>
      </aside>
    </div>
  );
}

function ContinueCard({ lesson, unit, unitNo }: { lesson: Lesson; unit?: Unit; unitNo: number }) {
  return (
    <div className="relative overflow-hidden rounded-[20px] bg-primary-solid p-6 text-on-solid shadow-raised md:p-8">
      <div className="relative z-10 max-w-xl">
        <div className="text-[13px] font-semibold">
          Unit {unitNo}
          {unit ? ` · ${DOMAIN_LABELS[unit.domain]}` : ''}
        </div>
        <h2 className="mt-1 text-[26px] leading-tight font-bold tracking-[-0.025em]">
          {lesson.title}
        </h2>
        <p className="mt-2 line-clamp-2 text-[15px] leading-relaxed">{lesson.summary}</p>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <Link
            to={`/learn/${lesson.id}`}
            className={cn(
              buttonVariants({ size: 'lg' }),
              'bg-on-solid text-primary-solid shadow-none hover:brightness-95',
            )}
          >
            Start lesson
          </Link>
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <Clock className="size-4" aria-hidden /> {lesson.minutes} min · +
            {XP_RULES.lessonCompleted} XP
          </span>
        </div>
      </div>
      <Pip
        mood="happy"
        size={150}
        className="pointer-events-none absolute -right-4 -bottom-6 hidden opacity-95 md:block"
      />
    </div>
  );
}

/** A winding path of lesson nodes, Duolingo-style, in a calm Apple finish. */
function LessonPath({
  unit,
  completed,
  next,
}: {
  unit: Unit;
  completed: ReadonlySet<string>;
  next?: Lesson;
}) {
  const OFFSETS = [0, 52, 76, 52, 0, -52, -76, -52];
  return (
    <ol className="relative flex flex-col items-center gap-5 py-6">
      {unit.lessons.map((l, i) => {
        const done = completed.has(l.id);
        const current = next?.id === l.id;
        const dx = OFFSETS[i % OFFSETS.length] ?? 0;
        return (
          <li key={l.id} className="relative" style={{ transform: `translateX(${dx}px)` }}>
            {current ? (
              <span className="animate-pop absolute -top-11 left-1/2 -translate-x-1/2 rounded-xl bg-surface px-3 py-1.5 text-[13px] font-bold whitespace-nowrap text-primary shadow-raised ring-1 ring-border">
                Start
                <span
                  aria-hidden
                  className="absolute -bottom-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 bg-surface ring-1 ring-border [clip-path:polygon(100%_0,100%_100%,0_100%)]"
                />
              </span>
            ) : null}
            <Link
              to={`/learn/${l.id}`}
              aria-label={`${l.title}${done ? ' (completed)' : current ? ' (next)' : ''}`}
              title={l.title}
              className={cn(
                'grid place-items-center rounded-full transition-transform hover:scale-105 active:scale-95',
                current
                  ? 'size-[76px] bg-path-current text-on-solid shadow-raised ring-[6px] ring-primary-soft'
                  : 'size-16',
                done && 'bg-path-done text-on-solid shadow-card',
                !done && !current && 'bg-path-locked text-fg-subtle',
              )}
            >
              {done ? (
                <Check className="size-7" strokeWidth={3} aria-hidden />
              ) : current ? (
                <Star className="size-8 fill-current" aria-hidden />
              ) : (
                <Lock className="size-6" aria-hidden />
              )}
            </Link>
          </li>
        );
      })}
      <li className="relative" style={{ transform: 'translateX(0px)' }}>
        <Link
          to={`/practice?tab=quiz`}
          aria-label={`Unit check: quiz on ${DOMAIN_LABELS[unit.domain]}`}
          title="Unit check"
          className="grid size-16 place-items-center rounded-2xl bg-challenge text-on-solid shadow-card transition-transform hover:scale-105"
        >
          <Trophy className="size-7" aria-hidden />
        </Link>
      </li>
    </ol>
  );
}

function Ring({ r, value, className }: { r: number; value: number; className: string }) {
  const c = 2 * Math.PI * r;
  return (
    <>
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        strokeWidth="11"
        className={cn(className, 'opacity-20')}
        stroke="currentColor"
      />
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        strokeWidth="11"
        strokeLinecap="round"
        stroke="currentColor"
        className={cn(className, 'transition-[stroke-dashoffset] duration-700')}
        strokeDasharray={c}
        strokeDashoffset={c * (1 - Math.max(0.001, Math.min(1, value)))}
        transform="rotate(-90 60 60)"
      />
    </>
  );
}

function TodayCard({ quests, xpToday }: { quests: Quest[]; xpToday: number }) {
  const colours = ['text-ring-learn', 'text-ring-practice', 'text-ring-review'];
  return (
    <Card className="p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[17px] font-bold tracking-[-0.02em]">Today</h2>
        <span className="tabular text-sm font-semibold text-xp-text">+{xpToday} XP</span>
      </div>
      <div className="mt-3 flex items-center gap-5">
        <svg viewBox="0 0 120 120" className="size-[112px] shrink-0" aria-hidden>
          {quests.map((q, i) => (
            <Ring key={q.id} r={50 - i * 14} value={q.done / q.goal} className={colours[i] ?? ''} />
          ))}
        </svg>
        <ul className="min-w-0 flex-1 space-y-2.5">
          {quests.map((q, i) => (
            <li key={q.id}>
              <div className="flex items-center gap-2 text-sm">
                <span aria-hidden className={cn('size-2.5 rounded-full bg-current', colours[i])} />
                <span className={cn('flex-1', q.done >= q.goal && 'text-fg-muted line-through')}>
                  {q.label}
                </span>
              </div>
              <div className="tabular pl-[18px] text-xs text-fg-muted">
                {q.done} / {q.goal}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

function StreakCard({ streak, doneToday }: { streak: number; doneToday: boolean }) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <div
        className={cn(
          'grid size-14 shrink-0 place-items-center rounded-2xl',
          streak > 0 ? 'bg-warning-soft text-flame' : 'bg-surface-3 text-fg-subtle',
        )}
      >
        <Flame className="size-8" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[17px] font-bold tracking-[-0.02em]">
          {streak > 0 ? `${streak}-day streak` : 'Start a streak'}
        </div>
        <p className="text-sm text-fg-muted">
          {doneToday
            ? 'Today’s exam is done. See you tomorrow.'
            : streak > 0
              ? 'Take today’s 10-question exam to keep it going.'
              : 'Your first daily exam starts your streak.'}
        </p>
      </div>
      {doneToday ? null : (
        <Link to="/exam/daily" className={buttonVariants({ size: 'sm' })}>
          Go
        </Link>
      )}
    </Card>
  );
}
