import { Link, useNavigate, useParams } from 'react-router-dom';
import { DOMAIN_LABELS } from '@/core/schemas';
import { QuestionCard } from '@/components/questions/QuestionCard';
import { EmptyState, PageHeader } from '@/components/ui/misc';
import { useApp } from '@/app/AppContext';
import { recordAnswer } from './recordAnswer';

/** A single question, reached from search or a "try it now" link. */
export function QuestionPage() {
  const { id = '' } = useParams();
  const app = useApp();
  const navigate = useNavigate();
  const q = app.library.question.find((x) => x.id === id);
  if (!q) {
    return (
      <EmptyState
        title="That question was not found."
        mood="think"
        action={
          <Link className="text-primary underline" to="/practice">
            Back to practice
          </Link>
        }
      />
    );
  }
  // Another question from the same domain keeps the flow going.
  const others = app.library.question.filter((x) => x.domain === q.domain && x.id !== q.id);
  const next = (): void => {
    const pick = others[Math.floor(Math.random() * others.length)];
    navigate(pick ? `/practice/question/${encodeURIComponent(pick.id)}` : '/practice');
  };
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Practice question" description={DOMAIN_LABELS[q.domain]} />
      <QuestionCard
        key={q.id}
        question={q}
        keyboard
        onAnswered={(r, a) => recordAnswer(app, q, r, a, 'quiz', null)}
        onFlag={() =>
          app.user.addFlag('question', q.id, 'Flagged by the learner from the question page.')
        }
        onContinue={next}
        continueLabel={others.length ? 'Next question' : 'Back to practice'}
      />
    </div>
  );
}
