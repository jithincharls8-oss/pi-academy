import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, Flame, Trophy } from 'lucide-react';
import { selectDaily, DAILY_SIZE } from '@/core/exam/select';
import { heatmap } from '@/core/exam/session';
import { currentStreak, longestStreak } from '@/core/progress/streak';
import { useApp } from '@/app/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState, PageHeader, Stat } from '@/components/ui/misc';
import { localDate } from '@/lib/id';
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
  const cols = useMemo(() => heatmap(log, today, 16), [log, today]);

  const start = (): void => {
    const qs = selectDaily(library.question, today, library.version);
    setSessionId(
      startSession(app, { mode: 'daily', questions: qs, seed: library.version, date: today }),
    );
  };

  const side = (
    <aside className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Stat
          label="Streak"
          value={
            <span className="flex items-center gap-1.5">
              <Flame className="size-5 text-warning" aria-hidden /> {streak}
            </span>
          }
          hint={streak === 1 ? 'day' : 'days'}
        />
        <Stat
          label="Best"
          value={
            <span className="flex items-center gap-1.5">
              <Trophy className="size-5 text-accent" aria-hidden /> {best}
            </span>
          }
          hint={`${dates.length} exams done`}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Last 16 weeks</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Heatmap columns={cols} label="Daily exam calendar" />
        </CardContent>
      </Card>
      {log.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Recent scores</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {[...log]
                .reverse()
                .slice(0, 7)
                .map((l) => (
                  <li key={l.date} className="flex justify-between">
                    <span>{l.date}</span>
                    <span className="tabular-nums">{l.score}%</span>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </aside>
  );

  let main;
  if (library.question.length === 0) {
    main = (
      <EmptyState title="No questions yet">
        Questions arrive with the content packs. Add some in Admin or import a pack.
      </EmptyState>
    );
  } else if (!loaded) {
    const n = Math.min(DAILY_SIZE, library.question.length);
    main = (
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-3">
            <CalendarCheck className="size-8 text-primary" aria-hidden />
            <div>
              <h2 className="text-lg font-semibold">Today&apos;s exam is ready</h2>
              <p className="text-sm text-fg-muted">
                {n} questions across mixed topics and difficulties. Everyone on the same content
                version gets the same set today, and a new set tomorrow.
              </p>
            </div>
          </div>
          <ul className="list-inside list-disc text-sm text-fg-muted">
            <li>You see the answer and explanation after each question.</li>
            <li>Every answer feeds your review queue (spaced repetition).</li>
            <li>Finish it to keep your streak going.</li>
          </ul>
          <Button size="lg" onClick={start}>
            Start today&apos;s exam
          </Button>
        </CardContent>
      </Card>
    );
  } else if (summary) {
    main = (
      <div className="space-y-4">
        <ExamResults
          title="Today's result"
          summary={summary}
          questions={loaded.questions}
          records={loaded.records}
        />
        <p className="text-sm text-fg-muted">
          A new exam unlocks tomorrow. Keep practising with a{' '}
          <Link className="text-primary underline" to="/practice">
            topic quiz or your review queue
          </Link>
          .
        </p>
      </div>
    );
  } else {
    main = (
      <ExamRunner loaded={loaded} onChange={setLoaded} onFinish={finish} feedback="immediate" />
    );
  }

  return (
    <div>
      <PageHeader title="Daily Exam" description={formatDate(today)} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div>{main}</div>
        {side}
      </div>
    </div>
  );
}
