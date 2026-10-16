import { Link, Navigate, useParams } from 'react-router-dom';
import { EmptyState, PageHeader } from '@/components/ui/misc';
import { localDate } from '@/lib/id';
import { ExamRunner } from './ExamRunner';
import { ExamResults } from './components';
import { useSession } from './useSession';

const TITLES = {
  daily: 'Daily exam',
  quiz: 'Topic quiz',
  mock: 'Mock exam',
  review: 'Review',
  lesson: 'Lesson check',
} as const;

export function SessionPage() {
  const { id = '' } = useParams();
  const { loaded, setLoaded, finish, summary } = useSession(id);

  if (!loaded) {
    return (
      <EmptyState
        title="That session was not found."
        mood="think"
        action={
          <Link className="text-primary underline" to="/practice">
            Back to practice
          </Link>
        }
      />
    );
  }
  const { session } = loaded;
  // Today's unfinished daily exam lives on the daily page, where the streak is shown.
  if (session.mode === 'daily' && !session.finished_at && session.date === localDate()) {
    return <Navigate to="/exam/daily" replace />;
  }

  const missingNote = loaded.missing.length ? (
    <p className="mb-4 rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning" role="note">
      {loaded.missing.length} question{loaded.missing.length === 1 ? ' was' : 's were'} removed from
      the library since this session started and {loaded.missing.length === 1 ? 'is' : 'are'} left
      out.
    </p>
  ) : null;

  if (loaded.questions.length && !summary) {
    // Focus mode while answering: the question flow only, with a quiet title.
    return (
      <div>
        <div className="mx-auto mb-4 flex max-w-3xl items-baseline justify-between gap-4">
          <h1 className="text-[22px] font-bold tracking-[-0.02em]">{TITLES[session.mode]}</h1>
          <Link className="text-sm text-primary underline" to="/practice?tab=progress">
            All sessions
          </Link>
        </div>
        <div className="mx-auto max-w-3xl">{missingNote}</div>
        <ExamRunner
          loaded={loaded}
          onChange={setLoaded}
          onFinish={finish}
          feedback={session.mode === 'mock' ? 'end' : 'immediate'}
          exitTo="/practice"
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={TITLES[session.mode]}
        description={`Started ${new Date(session.started_at).toLocaleString()}`}
        actions={
          <Link className="text-sm text-primary underline" to="/practice?tab=progress">
            All sessions
          </Link>
        }
      />
      {missingNote}
      {loaded.questions.length === 0 ? (
        <EmptyState title="None of this session's questions exist any more." mood="think" />
      ) : summary ? (
        <ExamResults summary={summary} questions={loaded.questions} records={loaded.records} />
      ) : null}
    </div>
  );
}
