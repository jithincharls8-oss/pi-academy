import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, Flame, Lightbulb, Repeat, Sparkles, Trophy } from 'lucide-react';
import { selectDaily, DAILY_SIZE } from '@/core/exam/select';
import { heatmap } from '@/core/exam/session';
import { currentStreak, longestStreak } from '@/core/progress/streak';
import { XP_RULES } from '@/core/progress/learner';
import { useApp } from '@/app/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState, PageHeader } from '@/components/ui/misc';
import { Pip } from '@/components/ui/pip';
import { localDate } from '@/lib/id';
import { cn } from '@/lib/cn';
import { ExamRunner } from './ExamRunner';
import { ExamResults, Heatmap } from './components';
import { dailySessionFor, startSession } from './sessions';
import { useSession } from './useSession';

function formatDate(d: string): string {
  return new Date(`${d}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function shortDate(d: string): string {
  return new Date(`${d}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function DailyExamPage() {
  const app = useApp();
  const { library, rev } = app;
  const [today] = useState(() => localDate());
  const [sessionId, setSessionId] = useState<string | null>(
    () => dailySessionFor(app, today)?.id ?? null,
  );
  const { loaded, setLoaded, finish, summary } = useSession(sessionId);

  const log = useMemo(() => {
    void rev;
    return app.user.dailyLog();
  }, [app.user, rev]);
  const dates = log.filter((l) => l.completed).map((l) => l.date);
  const streak = currentStreak(dates, today);
  const best = longestStreak(dates);
  const doneToday = dates.includes(today);
  const cols = useMemo(() => heatmap(log, today, 16), [log, today]);

  const start = (): void => {
    const qs = selectDaily(library.question, today, library.version);
    setSessionId(
      startSession(app, { mode: 'daily', questions: qs, seed: library.version, date: today }),
    );
  };

  const side = (
    <aside className="space-y-4" aria-label="Your streak">
      <StreakCard streak={streak} best={best} total={dates.length} doneToday={doneToday} />
      <Card>
        <CardHeader>
          <CardTitle>Last 16 weeks</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {log.length ? (
            <Heatmap columns={cols} label="Daily exam calendar" />
          ) : (
            <p className="text-sm leading-relaxed text-fg-muted">
              Your calendar fills in here, one square per day, as you take daily exams.
            </p>
          )}
        </CardContent>
      </Card>
      {log.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Recent scores</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-sm">
              {[...log]
                .reverse()
                .slice(0, 7)
                .map((l) => (
                  <li key={l.date} className="flex justify-between gap-3">
                    <span className="text-fg-muted">{shortDate(l.date)}</span>
                    <span className="tabular font-semibold">{l.score}%</span>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </aside>
  );

  let main;
  let running = false;
  if (library.question.length === 0) {
    main = (
      <EmptyState title="No questions yet" mood="think">
        Questions arrive with the content packs. Add some in Admin or import a pack.
      </EmptyState>
    );
  } else if (!loaded) {
    const n = Math.min(DAILY_SIZE, library.question.length);
    main = (
      <Card className="overflow-hidden">
        <div className="flex flex-col items-center gap-6 p-6 text-center sm:flex-row sm:p-8 sm:text-left">
          <Pip mood={streak > 0 ? 'cheer' : 'wave'} size={120} animate />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-primary">Today&apos;s exam is ready</p>
            <h2 className="mt-1 text-[26px] leading-tight font-bold tracking-[-0.025em]">
              {streak > 0
                ? `Keep your ${streak}-day streak going`
                : dates.length
                  ? 'Start a new streak today'
                  : 'Your first exam starts your streak'}
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-fg-muted">
              {n} questions across mixed topics and difficulties. Everyone on the same content
              version gets the same set today, and a new set tomorrow.
            </p>
            <Button size="lg" className="mt-5" onClick={start}>
              Start today&apos;s exam
            </Button>
          </div>
        </div>
        <ul className="grid gap-px border-t border-border bg-border text-sm sm:grid-cols-3">
          <li className="flex items-center gap-2.5 bg-surface px-5 py-4">
            <Lightbulb className="size-5 shrink-0 text-primary" aria-hidden />
            <span>Answer and explanation after each question</span>
          </li>
          <li className="flex items-center gap-2.5 bg-surface px-5 py-4">
            <Repeat className="size-5 shrink-0 text-primary" aria-hidden />
            <span>Every answer feeds your review queue</span>
          </li>
          <li className="flex items-center gap-2.5 bg-surface px-5 py-4">
            <Sparkles className="size-5 shrink-0 text-xp-text" aria-hidden />
            <span>
              +{XP_RULES.correctAnswer} XP per correct answer, +{XP_RULES.dailyExamCompleted} XP for
              finishing
            </span>
          </li>
        </ul>
      </Card>
    );
  } else if (summary) {
    const counted = loaded.session.date === today && doneToday;
    main = (
      <div className="space-y-4">
        <ExamResults
          title="Today's result"
          summary={summary}
          questions={loaded.questions}
          records={loaded.records}
          bonusXp={counted ? XP_RULES.dailyExamCompleted : 0}
        />
        <p className="flex items-center gap-2 text-sm text-fg-muted">
          <CalendarCheck className="size-4 shrink-0" aria-hidden />
          <span>
            A new exam unlocks tomorrow. Keep practising with a{' '}
            <Link className="text-primary underline" to="/practice">
              topic quiz or your review queue
            </Link>
            .
          </span>
        </p>
      </div>
    );
  } else {
    running = true;
    main = (
      <ExamRunner
        loaded={loaded}
        onChange={setLoaded}
        onFinish={finish}
        feedback="immediate"
        exitTo="/"
      />
    );
  }

  if (running) {
    // Focus mode: just the question flow, no side panels.
    return (
      <div>
        <h1 className="sr-only">Daily Exam</h1>
        {main}
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Daily Exam" description={formatDate(today)} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0">{main}</div>
        {side}
      </div>
    </div>
  );
}

function StreakCard({
  streak,
  best,
  total,
  doneToday,
}: {
  streak: number;
  best: number;
  total: number;
  doneToday: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'grid size-14 shrink-0 place-items-center rounded-2xl',
            streak > 0 ? 'bg-warning-soft text-flame' : 'bg-surface-3 text-fg-subtle',
          )}
        >
          <Flame className={cn('size-8', streak > 0 && 'fill-current')} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'text-[17px] font-bold tracking-[-0.02em]',
              streak > 0 && 'text-flame-text',
            )}
          >
            {streak > 0 ? `${streak}-day streak` : 'No streak yet'}
          </p>
          <p className="text-sm text-fg-muted">
            {doneToday
              ? 'Done for today. See you tomorrow.'
              : streak > 0
                ? 'Finish today’s exam to keep it going.'
                : 'Your first daily exam starts your streak.'}
          </p>
        </div>
      </div>
      {total > 0 ? (
        <div className="mt-4 flex items-center gap-2 border-t border-border pt-3 text-sm text-fg-muted">
          <Trophy className="size-4 shrink-0 text-challenge-text" aria-hidden />
          <span>
            Best {best} {best === 1 ? 'day' : 'days'} · {total} {total === 1 ? 'exam' : 'exams'}{' '}
            done
          </span>
        </div>
      ) : null}
    </Card>
  );
}
