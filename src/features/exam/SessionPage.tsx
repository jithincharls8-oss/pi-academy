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
      {loaded.missing.length ? (
        <p className="mb-4 text-sm text-warning" role="note">
          {loaded.missing.length} question{loaded.missing.length === 1 ? ' was' : 's were'} removed
          from the library since this session started and{' '}
          {loaded.missing.length === 1 ? 'is' : 'are'} left out.
        </p>
      ) : null}
      {loaded.questions.length === 0 ? (
        <EmptyState title="None of this session's questions exist any more." />
      ) : summary ? (
        <ExamResults summary={summary} questions={loaded.questions} records={loaded.records} />
      ) : (
        <ExamRunner
          loaded={loaded}
          onChange={setLoaded}
          onFinish={finish}
          feedback={session.mode === 'mock' ? 'end' : 'immediate'}
        />
      )}
    </div>
  );
}
