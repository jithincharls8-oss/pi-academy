import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock, Flag, Flame, X } from 'lucide-react';
import type { Question } from '@/core/schemas';
import type { Answer, GradeResult } from '@/core/exam/grade';
import { formatClock, secondsLeft } from '@/core/exam/session';
import { QuestionCard } from '@/components/questions/QuestionCard';
import { Button, buttonVariants } from '@/components/ui/button';
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
  /** where the quiet close control leads; answers are saved, so the session can be resumed */
  exitTo?: string;
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

/** Correct answers in a row, counted along the session's question order. */
function trailingRun(questions: readonly Question[], records: LoadedSession['records']): number {
  let run = 0;
  for (const q of questions) {
    const r = records.get(q.id);
    if (r) run = r.result.correct ? run + 1 : 0;
  }
  return run;
}

export function ExamRunner({
  loaded,
  onChange,
  onFinish,
  feedback,
  exitTo = '/practice',
}: ExamRunnerProps) {
  const app = useApp();
  const { questions, records, session } = loaded;
  const firstOpen = questions.findIndex((q) => !records.has(q.id));
  const [index, setIndex] = useState(firstOpen === -1 ? 0 : firstOpen);
  const [confirming, setConfirming] = useState(false);
  const [flagged, setFlagged] = useState<Set<string>>(() => new Set());
  const [combo, setCombo] = useState(() => trailingRun(questions, records));
  const shownAt = useRef(0);
  const root = useRef<HTMLDivElement>(null);
  const navigated = useRef(false);
  const left = useCountdown(session.started_at, session.time_limit_s);

  const q: Question | undefined = questions[index];
  const answered = records.size;
  const unanswered = questions.length - answered;
  const immediate = feedback === 'immediate';

  useEffect(() => {
    shownAt.current = Date.now();
    // After moving on, put focus on the new question so keyboard and screen-reader users follow.
    if (navigated.current) {
      navigated.current = false;
      root.current?.querySelector<HTMLElement>('[data-question-start]')?.focus();
    }
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
    setCombo((c) => (result.correct ? c + 1 : 0));
    onChange(answerInSession(app, loaded, q, answer, result, fast));
  };

  const flag = (): void => {
    app.user.addFlag('question', q.id, `Flagged by the learner during a ${session.mode} session.`);
    setFlagged((s) => new Set(s).add(q.id));
  };

  const go = (i: number): void => {
    setConfirming(false);
    navigated.current = true;
    setIndex(Math.max(0, Math.min(questions.length - 1, i)));
  };

  /** The next unanswered question after this one (wrapping), or -1 when none is left. */
  const nextOpen = (): number => {
    const n = questions.length;
    for (let k = 1; k < n; k++) {
      const j = (index + k) % n;
      if (!records.has(questions[j]!.id)) return j;
    }
    return -1;
  };

  const isLast = index === questions.length - 1;
  const open = nextOpen();
  const hasCurrent = records.has(q.id);

  const advance = (): void => {
    if (open !== -1) go(open);
    else finish();
  };

  const continueProps = immediate
    ? {
        onContinue: advance,
        continueLabel: open === -1 ? 'See results' : 'Continue',
      }
    : !isLast
      ? { onContinue: () => go(index + 1), continueLabel: 'Next question' }
      : {};

  return (
    <div ref={root} className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center gap-3 sm:gap-4">
        <Link
          to={exitTo}
          aria-label="Exit. Your answers are saved."
          title="Exit (your answers are saved)"
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'icon' }),
            'shrink-0 text-fg-muted hover:text-fg',
          )}
        >
          <X className="size-5" aria-hidden />
        </Link>
        <Progress
          className="h-4 flex-1"
          tone="success"
          value={(answered / Math.max(1, questions.length)) * 100}
          label={`${answered} of ${questions.length} answered`}
        />
        {immediate && combo >= 2 ? (
          <span
            key={combo}
            className="animate-pop flex shrink-0 items-center gap-1 rounded-full bg-warning-soft px-3 py-1 text-sm font-bold whitespace-nowrap text-flame-text"
          >
            <Flame className="size-4 fill-current" aria-hidden />
            {combo} in a row
          </span>
        ) : null}
        {left !== null ? (
          <div
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 font-mono text-sm tabular-nums',
              left < 300 ? 'bg-danger-soft text-danger' : 'bg-surface-3 text-fg',
            )}
            role="timer"
            aria-label={`Time left ${formatClock(left)}`}
          >
            <Clock className="size-4" aria-hidden />
            {formatClock(left)}
          </div>
        ) : null}
      </div>

      <QuestionCard
        key={`${session.id}|${q.id}`}
        question={q}
        label={`Question ${index + 1} of ${questions.length}`}
        showFeedback={immediate}
        initial={records.get(q.id)}
        onAnswered={onAnswered}
        onFlag={flagged.has(q.id) ? undefined : flag}
        onSkip={!hasCurrent && open !== -1 ? () => go(open) : undefined}
        keyboard
        {...continueProps}
      />

      <div className="flex flex-wrap items-center gap-2">
        {!immediate ? (
          <>
            <Button variant="secondary" onClick={() => go(index - 1)} disabled={index === 0}>
              <ArrowLeft className="size-4" aria-hidden /> Previous
            </Button>
            {!isLast ? (
              <Button variant="secondary" onClick={() => go(index + 1)}>
                Next <ArrowRight className="size-4" aria-hidden />
              </Button>
            ) : null}
          </>
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
              variant={unanswered === 0 ? 'primary' : 'ghost'}
              className={unanswered === 0 ? undefined : 'text-fg-muted hover:text-fg'}
              onClick={() => (unanswered === 0 ? finish() : setConfirming(true))}
            >
              Finish {session.mode === 'mock' ? 'exam' : 'session'}
            </Button>
          )}
        </div>
      </div>

      {!immediate ? (
        <details className="group rounded-xl bg-surface ring-1 ring-border/70 dark:ring-border">
          <summary className="cursor-pointer rounded-xl px-4 py-3 text-sm font-medium">
            Jump to a question
          </summary>
          <nav aria-label="Questions" className="flex flex-wrap gap-1.5 px-4 pb-4">
            {questions.map((qq, i) => {
              const r = records.get(qq.id);
              return (
                <button
                  key={qq.id}
                  onClick={() => go(i)}
                  aria-current={i === index ? 'step' : undefined}
                  aria-label={`Question ${i + 1}${r ? ', answered' : ''}${flagged.has(qq.id) ? ', flagged' : ''}`}
                  className={cn(
                    'relative size-9 rounded-lg text-xs font-semibold tabular-nums',
                    r ? 'bg-primary-soft text-primary' : 'bg-surface ring-1 ring-border-strong',
                    i === index && 'ring-2 ring-ring ring-offset-1 ring-offset-surface',
                  )}
                >
                  {i + 1}
                  {flagged.has(qq.id) ? (
                    <Flag className="absolute -top-1 -right-1 size-3 text-warning" aria-hidden />
                  ) : null}
                </button>
              );
            })}
          </nav>
        </details>
      ) : null}
    </div>
  );
}
