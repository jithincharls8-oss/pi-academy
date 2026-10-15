import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Clock, Flag } from 'lucide-react';
import type { Question } from '@/core/schemas';
import type { Answer, GradeResult } from '@/core/exam/grade';
import { formatClock, secondsLeft } from '@/core/exam/session';
import { QuestionCard } from '@/components/questions/QuestionCard';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/misc';
import { useApp } from '@/app/AppContext';
import { cn } from '@/lib/cn';
import { answerInSession, type LoadedSession } from './sessions';

/** Correct answers given within this many seconds count as "easy" for spaced repetition. */
const FAST_SECONDS = 20;

export interface ExamRunnerProps {
  loaded: LoadedSession;
  onChange: (next: LoadedSession) => void;
  onFinish: () => void;
  /** 'end' hides right/wrong until the session is finished (mock exams) */
  feedback: 'immediate' | 'end';
}

function useCountdown(startedAt: string, limit: number | null): number | null {
  const [left, setLeft] = useState(() => secondsLeft(startedAt, limit));
  useEffect(() => {
    if (limit === null) return;
    const t = window.setInterval(() => setLeft(secondsLeft(startedAt, limit)), 1000);
    return () => window.clearInterval(t);
  }, [startedAt, limit]);
  return left;
}

export function ExamRunner({ loaded, onChange, onFinish, feedback }: ExamRunnerProps) {
  const app = useApp();
  const { questions, records, session } = loaded;
  const firstOpen = questions.findIndex((q) => !records.has(q.id));
  const [index, setIndex] = useState(firstOpen === -1 ? 0 : firstOpen);
  const [confirming, setConfirming] = useState(false);
  const [flagged, setFlagged] = useState<Set<string>>(() => new Set());
  const shownAt = useRef(0);
  const left = useCountdown(session.started_at, session.time_limit_s);

  const q: Question | undefined = questions[index];
  const answered = records.size;
  const unanswered = questions.length - answered;

  useEffect(() => {
    shownAt.current = Date.now();
  }, [index]);

  const finish = useCallback(() => {
    setConfirming(false);
    onFinish();
  }, [onFinish]);

  // Time is up: submit what has been answered.
  useEffect(() => {
    if (left === 0) onFinish();
  }, [left, onFinish]);

  if (!q) return null;

  const onAnswered = (result: GradeResult, answer: Answer): void => {
    const fast = (Date.now() - shownAt.current) / 1000 < FAST_SECONDS;
    onChange(answerInSession(app, loaded, q, answer, result, fast));
  };

  const flag = (): void => {
    app.user.addFlag('question', q.id, `Flagged by the learner during a ${session.mode} session.`);
    setFlagged((s) => new Set(s).add(q.id));
  };

  const go = (i: number): void => {
    setConfirming(false);
    setIndex(Math.max(0, Math.min(questions.length - 1, i)));
  };

  const isLast = index === questions.length - 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-surface p-4">
        <div className="min-w-48 flex-1">
          <div className="mb-1 flex justify-between text-sm">
            <span>
              Question {index + 1} of {questions.length}
            </span>
            <span className="text-fg-muted">{answered} answered</span>
          </div>
          <Progress
            value={(answered / Math.max(1, questions.length)) * 100}
            label={`${answered} of ${questions.length} answered`}
          />
        </div>
        {left !== null ? (
          <div
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-sm tabular-nums',
              left < 300 ? 'bg-danger-soft text-danger' : 'bg-surface-2',
            )}
            role="timer"
            aria-label={`Time left ${formatClock(left)}`}
          >
            <Clock className="size-4" aria-hidden />
            {formatClock(left)}
          </div>
        ) : null}
      </div>

      <nav aria-label="Questions" className="flex flex-wrap gap-1.5">
        {questions.map((qq, i) => {
          const r = records.get(qq.id);
          const state = !r
            ? 'border-border bg-surface'
            : feedback === 'end'
              ? 'border-primary bg-primary-soft'
              : r.result.correct
                ? 'border-success bg-success-soft'
                : 'border-danger bg-danger-soft';
          return (
            <button
              key={qq.id}
              onClick={() => go(i)}
              aria-current={i === index ? 'step' : undefined}
              aria-label={`Question ${i + 1}${r ? ', answered' : ''}`}
              className={cn(
                'relative size-8 rounded-md border text-xs tabular-nums',
                state,
                i === index && 'ring-2 ring-ring ring-offset-1 ring-offset-bg',
              )}
            >
              {i + 1}
              {flagged.has(qq.id) ? (
                <Flag className="absolute -right-1 -top-1 size-3 text-warning" aria-hidden />
              ) : null}
            </button>
          );
        })}
      </nav>

      <QuestionCard
        key={`${session.id}|${q.id}`}
        question={q}
        label={`${index + 1} of ${questions.length}`}
        showFeedback={feedback === 'immediate'}
        initial={records.get(q.id)}
        onAnswered={onAnswered}
        onFlag={flagged.has(q.id) ? undefined : flag}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={() => go(index - 1)} disabled={index === 0}>
          <ArrowLeft className="size-4" aria-hidden /> Previous
        </Button>
        {!isLast ? (
          <Button
            variant={records.has(q.id) ? 'primary' : 'secondary'}
            onClick={() => go(index + 1)}
          >
            Next <ArrowRight className="size-4" aria-hidden />
          </Button>
        ) : null}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {confirming ? (
            <>
              <span className="text-sm" role="alert">
                {unanswered} unanswered question{unanswered === 1 ? '' : 's'} will score 0. Finish
                anyway?
              </span>
              <Button variant="secondary" onClick={() => setConfirming(false)}>
                Keep going
              </Button>
              <Button onClick={finish}>Finish</Button>
            </>
          ) : (
            <Button
              variant={unanswered === 0 ? 'primary' : 'secondary'}
              onClick={() => (unanswered === 0 ? finish() : setConfirming(true))}
            >
              Finish {session.mode === 'mock' ? 'exam' : 'session'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
