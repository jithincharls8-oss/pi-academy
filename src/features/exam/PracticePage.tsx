import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Repeat, Target, Timer, TrendingUp } from 'lucide-react';
import { DOMAINS, DOMAIN_LABELS, type Domain, type Question } from '@/core/schemas';
import { MOCK_BLUEPRINT, allocate } from '@/core/exam/blueprint';
import { overallReadiness, readinessByDomain } from '@/core/exam/readiness';
import { selectMock, selectQuiz } from '@/core/exam/select';
import { topicScores } from '@/core/exam/session';
import { useApp } from '@/app/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label, Select } from '@/components/ui/input';
import { EmptyState, PageHeader, Stat } from '@/components/ui/misc';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { localDate, newId } from '@/lib/id';
import { DomainBars } from './components';
import { startSession } from './sessions';
import type { ExamMode } from '@/db/userRepo';

const MOCK_SIZE = 60;
const MODE_LABELS: Record<ExamMode, string> = {
  daily: 'Daily exam',
  quiz: 'Topic quiz',
  mock: 'Mock exam',
  review: 'Review',
  lesson: 'Lesson check',
};
const TABS = ['quiz', 'mock', 'review', 'progress'] as const;
type Tab = (typeof TABS)[number];

export function PracticePage() {
  const app = useApp();
  const { library, rev } = app;
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tabParam = params.get('tab');
  const tab: Tab = TABS.find((t) => t === tabParam) ?? 'quiz';
  const today = localDate();

  const begin = (mode: ExamMode, questions: readonly Question[], timeLimitS: number | null) => {
    if (!questions.length) return;
    const id = startSession(app, { mode, questions, seed: newId(), date: today, timeLimitS });
    navigate(`/practice/session/${id}`);
  };

  if (library.question.length === 0) {
    return (
      <div>
        <PageHeader title="Practice & Mock" />
        <EmptyState title="No questions yet">
          Questions arrive with the content packs. Add some in Admin or import a pack.
        </EmptyState>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Practice & Mock"
        description="Quiz yourself by topic, sit a timed mock exam, work through your review queue and track readiness per domain."
      />
      <Tabs value={tab} onValueChange={(v) => setParams({ tab: v }, { replace: true })}>
        <TabsList>
          <TabsTrigger value="quiz" className="flex items-center gap-1.5">
            <Target className="size-4" aria-hidden /> Topic quiz
          </TabsTrigger>
          <TabsTrigger value="mock" className="flex items-center gap-1.5">
            <Timer className="size-4" aria-hidden /> Mock exam
          </TabsTrigger>
          <TabsTrigger value="review" className="flex items-center gap-1.5">
            <Repeat className="size-4" aria-hidden /> Review queue
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-1.5">
            <TrendingUp className="size-4" aria-hidden /> Progress
          </TabsTrigger>
        </TabsList>
        <TabsContent value="quiz">
          <QuizTab onStart={(qs) => begin('quiz', qs, null)} />
        </TabsContent>
        <TabsContent value="mock">
          <MockTab onStart={(qs, limit) => begin('mock', qs, limit)} />
        </TabsContent>
        <TabsContent value="review">
          <ReviewTab rev={rev} onStart={(qs) => begin('review', qs, null)} />
        </TabsContent>
        <TabsContent value="progress">
          <ProgressTab rev={rev} onQuiz={(qs) => begin('quiz', qs, null)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function QuizTab({ onStart }: { onStart: (qs: Question[]) => void }) {
  const { library } = useApp();
  const [domain, setDomain] = useState<Domain | ''>('');
  const [coverageId, setCoverageId] = useState('');
  const [difficulty, setDifficulty] = useState<'' | '1' | '2' | '3'>('');
  const [size, setSize] = useState(10);

  const domainCounts = useMemo(() => {
    const m = new Map<Domain, number>();
    for (const q of library.question) m.set(q.domain, (m.get(q.domain) ?? 0) + 1);
    return m;
  }, [library.question]);
  const topics = useMemo(
    () =>
      library.coverage
        .filter((c) => !domain || c.domain === domain)
        .map((c) => ({
          ...c,
          n: library.question.filter((q) => q.coverage.includes(c.id)).length,
        }))
        .filter((c) => c.n > 0),
    [library.coverage, library.question, domain],
  );
  const opts = {
    seed: newId(),
    size,
    ...(domain ? { domain } : {}),
    ...(coverageId ? { coverageId } : {}),
    ...(difficulty ? { difficulty: Number(difficulty) as 1 | 2 | 3 } : {}),
  };
  const available = selectQuiz(library.question, { ...opts, size: Number.MAX_SAFE_INTEGER }).length;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Topic quiz</CardTitle>
        <CardDescription>
          Pick a domain or a single topic. You see the answer after each question.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label htmlFor="quiz-domain">Domain</Label>
          <Select
            id="quiz-domain"
            value={domain}
            onChange={(e) => {
              setDomain(e.target.value as Domain | '');
              setCoverageId('');
            }}
          >
            <option value="">All domains</option>
            {DOMAINS.filter((d) => domainCounts.has(d)).map((d) => (
              <option key={d} value={d}>
                {DOMAIN_LABELS[d]} ({domainCounts.get(d)})
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="quiz-topic">Topic</Label>
          <Select
            id="quiz-topic"
            value={coverageId}
            onChange={(e) => setCoverageId(e.target.value)}
          >
            <option value="">All topics</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} ({t.n})
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="quiz-difficulty">Difficulty</Label>
          <Select
            id="quiz-difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as '' | '1' | '2' | '3')}
          >
            <option value="">Any</option>
            <option value="1">Easy</option>
            <option value="2">Medium</option>
            <option value="3">Hard</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="quiz-size">Questions</Label>
          <Select id="quiz-size" value={size} onChange={(e) => setSize(Number(e.target.value))}>
            {[5, 10, 20, 40].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-4">
          <Button
            disabled={available === 0}
            onClick={() => onStart(selectQuiz(library.question, opts))}
          >
            Start quiz
          </Button>
          <span className="text-sm text-fg-muted">
            {available === 0
              ? 'No questions match these filters.'
              : `${Math.min(size, available)} of ${available} matching questions`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function MockTab({ onStart }: { onStart: (qs: Question[], limitS: number | null) => void }) {
  const { library } = useApp();
  const [minutes, setMinutes] = useState(90);
  const plan = allocate(MOCK_SIZE, MOCK_BLUEPRINT);
  const counts = useMemo(() => {
    const m = new Map<Domain, number>();
    for (const q of library.question) m.set(q.domain, (m.get(q.domain) ?? 0) + 1);
    return m;
  }, [library.question]);
  const total = Math.min(MOCK_SIZE, library.question.length);

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Mock exam</CardTitle>
        <CardDescription>
          {MOCK_SIZE} questions weighted by domain. Answers are hidden until you finish, then you
          get a full review. This is PI Academy&apos;s own practice format, not an official AVEVA
          exam.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Mock exam blueprint</caption>
            <thead>
              <tr className="border-b border-border text-left text-fg-muted">
                <th className="py-2 font-medium">Domain</th>
                <th className="py-2 text-right font-medium">Weight</th>
                <th className="py-2 text-right font-medium">Questions</th>
                <th className="py-2 text-right font-medium">Available</th>
              </tr>
            </thead>
            <tbody>
              {DOMAINS.filter((d) => (plan.get(d) ?? 0) > 0).map((d) => (
                <tr key={d} className="border-b border-border/60">
                  <td className="py-1.5">{DOMAIN_LABELS[d]}</td>
                  <td className="py-1.5 text-right tabular-nums">
                    {Math.round(MOCK_BLUEPRINT[d] * 100)}%
                  </td>
                  <td className="py-1.5 text-right tabular-nums">{plan.get(d) ?? 0}</td>
                  <td className="py-1.5 text-right tabular-nums">
                    {(counts.get(d) ?? 0) < (plan.get(d) ?? 0) ? (
                      <Badge tone="warning">{counts.get(d) ?? 0}</Badge>
                    ) : (
                      (counts.get(d) ?? 0)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total < MOCK_SIZE ? (
          <p className="text-sm text-warning" role="note">
            The question bank has {library.question.length} questions, so this mock uses {total}.
            Domains short of questions are filled from others.
          </p>
        ) : null}
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label htmlFor="mock-time">Time limit</Label>
            <Select
              id="mock-time"
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
            >
              <option value={0}>Untimed</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
              <option value={120}>120 minutes</option>
            </Select>
          </div>
          <Button
            onClick={() =>
              onStart(
                selectMock(library.question, newId(), MOCK_SIZE),
                minutes ? minutes * 60 : null,
              )
            }
          >
            Start mock exam
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ReviewTab({ rev, onStart }: { rev: number; onStart: (qs: Question[]) => void }) {
  const app = useApp();
  const { library } = app;
  const today = localDate();
  const byId = useMemo(() => new Map(library.question.map((q) => [q.id, q])), [library.question]);
  const cards = useMemo(() => {
    void rev;
    return app.user.srsCards();
  }, [app.user, rev]);
  const due = cards
    .filter((c) => c.due_date <= today && byId.has(c.question_id))
    .sort((a, b) => a.due_date.localeCompare(b.due_date) || a.easiness - b.easiness);
  const upcoming = cards.filter((c) => c.due_date > today).length;
  const dueQuestions = due.slice(0, 20).map((c) => byId.get(c.question_id) as Question);

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Review queue</CardTitle>
        <CardDescription>
          Questions come back on a spaced-repetition schedule (SM-2): ones you miss return tomorrow,
          ones you know well return after longer gaps.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Due now" value={due.length} />
          <Stat label="Scheduled later" value={upcoming} />
          <Stat label="Cards in total" value={cards.length} />
        </div>
        {due.length ? (
          <Button onClick={() => onStart(dueQuestions)}>
            Review {dueQuestions.length} due question{dueQuestions.length === 1 ? '' : 's'}
          </Button>
        ) : (
          <p className="text-sm text-fg-muted">
            {cards.length
              ? 'Nothing is due. Come back tomorrow, or take a topic quiz.'
              : 'Answer some questions in the daily exam, a quiz or a lesson and they appear here.'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ProgressTab({ rev, onQuiz }: { rev: number; onQuiz: (qs: Question[]) => void }) {
  const app = useApp();
  const { library } = app;
  const data = useMemo(() => {
    void rev;
    return { attempts: app.user.attempts(), sessions: app.user.sessions() };
  }, [app.user, rev]);
  const coverageById = useMemo(
    () => new Map(library.question.map((q) => [q.id, q.coverage])),
    [library.question],
  );
  const titleOf = useMemo(
    () => new Map(library.coverage.map((c) => [c.id, c.title])),
    [library.coverage],
  );
  const perDomain = readinessByDomain(data.attempts);
  const overall = overallReadiness(perDomain, MOCK_BLUEPRINT);
  const weak = topicScores(data.attempts, (id) => coverageById.get(id)).slice(0, 8);
  const practised = DOMAINS.filter((d) => perDomain[d].attempts > 0);

  const weakQuiz = (coverageId: string): void =>
    onQuiz(selectQuiz(library.question, { seed: newId(), size: 10, coverageId }));

  return (
    <div className="mt-4 grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Readiness</CardTitle>
          <CardDescription>
            Recent answers count most, and a domain needs a fair number of answers before it can
            read as ready.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Stat
            label="Overall (mock-weighted)"
            value={`${overall}%`}
            hint={`${data.attempts.length} answers`}
          />
          {practised.length ? (
            <DomainBars
              rows={practised.map((d) => ({
                domain: d,
                percent: perDomain[d].score,
                hint: `${perDomain[d].attempts} answers`,
              }))}
            />
          ) : (
            <p className="text-sm text-fg-muted">Answer a few questions to see readiness.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weakest topics</CardTitle>
          <CardDescription>Topics with at least two answers, lowest average first.</CardDescription>
        </CardHeader>
        <CardContent>
          {weak.length ? (
            <ul className="space-y-2">
              {weak.map((t) => (
                <li key={t.coverageId} className="flex items-center gap-3">
                  <span
                    className={
                      t.percent < 50
                        ? 'w-12 text-right tabular-nums text-danger'
                        : t.percent < 75
                          ? 'w-12 text-right tabular-nums text-warning'
                          : 'w-12 text-right tabular-nums text-success'
                    }
                  >
                    {t.percent}%
                  </span>
                  <span className="flex-1 text-sm">
                    {titleOf.get(t.coverageId) ?? t.coverageId}
                    <span className="text-fg-muted"> · {t.attempts} answers</span>
                  </span>
                  <Button size="sm" variant="secondary" onClick={() => weakQuiz(t.coverageId)}>
                    Practise
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-fg-muted">Not enough answers yet.</p>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {data.sessions.length ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-fg-muted">
                  <th className="py-2 font-medium">Date</th>
                  <th className="py-2 font-medium">Type</th>
                  <th className="py-2 text-right font-medium">Questions</th>
                  <th className="py-2 text-right font-medium">Score</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {data.sessions.slice(0, 30).map((s) => (
                  <tr key={s.id} className="border-b border-border/60">
                    <td className="py-1.5">{s.started_at.slice(0, 10)}</td>
                    <td className="py-1.5">{MODE_LABELS[s.mode]}</td>
                    <td className="py-1.5 text-right tabular-nums">{countIds(s.question_ids)}</td>
                    <td className="py-1.5 text-right tabular-nums">
                      {s.score === null ? <Badge>In progress</Badge> : `${Math.round(s.score)}%`}
                    </td>
                    <td className="py-1.5 text-right">
                      <Link className="text-primary underline" to={`/practice/session/${s.id}`}>
                        {s.score === null ? 'Resume' : 'Review'}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-fg-muted">No sessions yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function countIds(json: string): number {
  try {
    const v: unknown = JSON.parse(json);
    return Array.isArray(v) ? v.length : 0;
  } catch {
    return 0;
  }
}
