import { Link, useParams } from 'react-router-dom';
import { DOMAIN_LABELS } from '@/core/schemas';
import { QuestionCard } from '@/components/questions/QuestionCard';
import { EmptyState, PageHeader } from '@/components/ui/misc';
import { useApp } from '@/app/AppContext';
import { recordAnswer } from './recordAnswer';

/** A single question, reached from search or a "try it now" link. */
export function QuestionPage() {
  const { id = '' } = useParams();
  const app = useApp();
  const q = app.library.question.find((x) => x.id === id);
  if (!q) {
    return (
      <EmptyState
        title="That question was not found."
        action={
          <Link className="text-primary underline" to="/practice">
            Back to practice
          </Link>
        }
      />
    );
  }
  return (
    <div className="max-w-3xl">
      <PageHeader title="Practice question" description={DOMAIN_LABELS[q.domain]} />
      <QuestionCard
        key={q.id}
        question={q}
        onAnswered={(r, a) => recordAnswer(app, q, r, a, 'quiz', null)}
        onFlag={() =>
          app.user.addFlag('question', q.id, 'Flagged by the learner from the question page.')
        }
      />
    </div>
  );
}
