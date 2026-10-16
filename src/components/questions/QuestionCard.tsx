import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, Check, CheckCircle2, Flag, XCircle } from 'lucide-react';
import type { Question } from '@/core/schemas';
import { grade, type Answer, type GradeResult } from '@/core/exam/grade';
import { seededRandom, shuffle } from '@/core/random/prng';
import { XP_RULES } from '@/core/progress/learner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UnverifiedBadge } from '@/components/content/VerifyNote';
import { Textarea, Input, Select } from '@/components/ui/input';
import { Pip, type PipMood } from '@/components/ui/pip';
import { Markdown } from '@/components/content/Markdown';
import { SourceList } from '@/components/content/SourceList';
import { cn } from '@/lib/cn';

const TYPE_LABELS: Record<Question['type'], string> = {
  mcq: 'Multiple choice',
  multi: 'Select all that apply',
  ordering: 'Put in order',
  matching: 'Match the pairs',
  scenario: 'Scenario',
  fill: 'Fill in the blank',
  code: 'Write it',
};
const CODE_LABELS = {
  webapi: 'PI Web API request',
  af: 'AF analysis expression',
  pe: 'Performance Equation',
} as const;
const DIFFICULTY = { 1: 'Easy', 2: 'Medium', 3: 'Hard' } as const;

/**
 * Deterministic shuffle with no item left in its correct place, so an untouched ordering
 * question scores nothing.
 */
function derange<T>(items: readonly T[], seed: string): T[] {
  if (items.length < 2) return [...items];
  const rand = seededRandom(seed);
  for (let attempt = 0; attempt < 20; attempt++) {
    const s = shuffle(items, rand);
    if (s.every((x, i) => x !== items[i])) return s;
  }
  return [...items.slice(1), items[0]!];
}

function emptyAnswer(q: Question): Answer {
  switch (q.type) {
    case 'mcq':
    case 'scenario':
      return { type: q.type, choice: null };
    case 'multi':
      return { type: 'multi', choices: [] };
    case 'ordering':
      return { type: 'ordering', order: [] };
    case 'matching':
      return { type: 'matching', pairs: {} };
    case 'fill':
    case 'code':
      return { type: q.type, text: '' };
  }
}

function isAnswered(a: Answer, q: Question): boolean {
  switch (a.type) {
    case 'mcq':
    case 'scenario':
      return a.choice !== null;
    case 'multi':
      return a.choices.length > 0;
    case 'ordering':
      return a.order.length > 0;
    case 'matching':
      return q.type === 'matching' && Object.keys(a.pairs).length === q.pairs.length;
    case 'fill':
    case 'code':
      return a.text.trim().length > 0;
  }
}

/** True while focus sits in a control that uses the number and Enter keys itself. */
function isTypingTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  if (t.isContentEditable || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT') return true;
  return t instanceof HTMLInputElement && t.type !== 'radio' && t.type !== 'checkbox';
}

/** The right answer, spelled out for the "not quite" sheet. */
function correctAnswerOf(q: Question): ReactNode {
  switch (q.type) {
    case 'mcq':
    case 'scenario':
      return q.options.find((o) => o.id === q.answer)?.text ?? null;
    case 'multi':
      return (
        <ul className="list-disc pl-5">
          {q.options
            .filter((o) => q.answers.includes(o.id))
            .map((o) => (
              <li key={o.id}>{o.text}</li>
            ))}
        </ul>
      );
    case 'ordering':
      return (
        <ol className="list-decimal pl-5">
          {q.items.map((i) => (
            <li key={i.id}>{i.text}</li>
          ))}
        </ol>
      );
    case 'fill':
    case 'code':
      return <code className="rounded bg-surface px-1.5 py-0.5 font-mono">{q.accepted[0]}</code>;
    case 'matching':
      return null;
  }
}

export interface QuestionCardProps {
  question: Question;
  /** called once when the learner submits */
  onAnswered?: (result: GradeResult, answer: Answer) => void;
  /** in timed mock exams feedback is hidden until the end */
  showFeedback?: boolean;
  /** heading prefix like "Question 3 of 10" */
  label?: string;
  onFlag?: () => void;
  /** a saved answer to show (resuming or reviewing a session); the card starts locked */
  initial?: { answer: Answer; result: GradeResult } | undefined;
  /** shows a full-width Continue button in the feedback sheet (question flows) */
  onContinue?: () => void;
  continueLabel?: string;
  /** shows a quiet Skip button next to Check */
  onSkip?: () => void;
  /**
   * Page-level shortcuts: number keys pick an option, Enter checks or continues. Only one card
   * on a page should turn this on.
   */
  keyboard?: boolean;
}

export function QuestionCard({
  question: q,
  onAnswered,
  showFeedback = true,
  label,
  onFlag,
  initial,
  onContinue,
  continueLabel = 'Continue',
  onSkip,
  keyboard = false,
}: QuestionCardProps) {
  const [answer, setAnswer] = useState<Answer>(() => initial?.answer ?? emptyAnswer(q));
  const [result, setResult] = useState<GradeResult | null>(() => initial?.result ?? null);
  /** answered in this card just now (not a saved answer being shown again) */
  const [fresh, setFresh] = useState(false);
  const shuffledItems = useMemo(
    () => (q.type === 'ordering' ? derange(q.items, `order|${q.id}`) : []),
    [q],
  );
  const rightSide = useMemo(
    () =>
      q.type === 'matching'
        ? shuffle(
            q.pairs.map((p) => p.right),
            seededRandom(`match|${q.id}`),
          )
        : [],
    [q],
  );
  const order =
    answer.type === 'ordering' && answer.order.length
      ? answer.order
      : shuffledItems.map((i) => i.id);
  const locked = result !== null;
  const orderList = useRef<HTMLOListElement>(null);
  const continueBtn = useRef<HTMLButtonElement>(null);
  const [moved, setMoved] = useState<{ id: string; dir: -1 | 1; text: string } | null>(null);

  // Keep keyboard focus on the item that was moved, and announce its new position.
  useEffect(() => {
    if (!moved || !orderList.current) return;
    const btn =
      orderList.current.querySelector<HTMLButtonElement>(
        `button[data-move="${moved.dir}"][data-item="${CSS.escape(moved.id)}"]:not(:disabled)`,
      ) ??
      orderList.current.querySelector<HTMLButtonElement>(
        `button[data-item="${CSS.escape(moved.id)}"]:not(:disabled)`,
      );
    btn?.focus();
  }, [moved, order]);

  // After Check, the Continue button takes focus so Enter (or Space) moves on.
  useEffect(() => {
    if (fresh) continueBtn.current?.focus({ preventScroll: false });
  }, [fresh]);

  const submit = (): void => {
    const final: Answer = answer.type === 'ordering' ? { type: 'ordering', order } : answer;
    const r = grade(q, final);
    setResult(r);
    setFresh(true);
    onAnswered?.(r, final);
  };

  const choose = (id: string): void => {
    if (answer.type === 'mcq' || answer.type === 'scenario') setAnswer({ ...answer, choice: id });
    else if (answer.type === 'multi')
      setAnswer({
        type: 'multi',
        choices: answer.choices.includes(id)
          ? answer.choices.filter((c) => c !== id)
          : [...answer.choices, id],
      });
  };

  // Number keys pick an option, Enter checks the answer or continues. Re-subscribes each render
  // so the handler always sees the current answer.
  useEffect(() => {
    if (!keyboard) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      if (isTypingTarget(e.target)) return;
      if (/^[1-9]$/.test(e.key) && !locked && 'options' in q) {
        const o = q.options[Number(e.key) - 1];
        if (o) {
          e.preventDefault();
          choose(o.id);
        }
        return;
      }
      if (e.key !== 'Enter') return;
      const t = e.target;
      if (t instanceof HTMLElement && t.closest('button, a, summary')) return;
      if (!locked && isAnswered(answer, q)) {
        e.preventDefault();
        submit();
      } else if (locked && onContinue) {
        e.preventDefault();
        onContinue();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const isCorrectOption = (id: string): boolean =>
    q.type === 'mcq' || q.type === 'scenario'
      ? q.answer === id
      : q.type === 'multi'
        ? q.answers.includes(id)
        : false;

  const reveal = locked && showFeedback;

  const tile = (
    o: { id: string; text: string },
    n: number,
    selected: boolean,
    input: ReactNode,
  ) => {
    const right = reveal && isCorrectOption(o.id);
    const wrong = reveal && selected && !right;
    return (
      <label
        key={o.id}
        className={cn(
          'relative flex min-h-14 items-center gap-3 rounded-xl px-4 py-3 text-left transition-[background-color,box-shadow] duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
          !locked && 'cursor-pointer active:scale-[0.99]',
          right
            ? 'bg-success-soft ring-2 ring-success'
            : wrong
              ? 'bg-danger-soft ring-2 ring-danger'
              : selected
                ? 'bg-primary-soft ring-2 ring-primary'
                : cn(
                    'bg-surface ring-1 ring-border-strong/70',
                    !locked && 'hover:bg-surface-2',
                    reveal && 'text-fg-muted',
                  ),
        )}
      >
        {input}
        <kbd
          aria-hidden
          className={cn(
            'grid size-7 shrink-0 place-items-center rounded-md font-sans text-xs font-semibold ring-1',
            right
              ? 'text-success ring-success'
              : wrong
                ? 'text-danger ring-danger'
                : selected
                  ? 'text-primary ring-primary'
                  : 'text-fg-muted ring-border-strong',
          )}
        >
          {n}
        </kbd>
        <span className="flex-1 text-[15px] leading-snug">{o.text}</span>
        {right ? (
          <CheckCircle2 className="size-5 shrink-0 text-success" aria-label="Correct answer" />
        ) : wrong ? (
          <XCircle className="size-5 shrink-0 text-danger" aria-label="Your answer" />
        ) : selected && !locked ? (
          <Check className="size-5 shrink-0 text-primary" aria-hidden />
        ) : null}
      </label>
    );
  };

  // Hidden native input stretched over the tile: keeps radio/checkbox semantics and arrow keys.
  const inputClass = 'absolute inset-0 z-10 size-full cursor-pointer appearance-none opacity-0';

  return (
    <article
      className="rounded-xl bg-surface p-5 shadow-card ring-1 ring-border/70 sm:p-6 dark:ring-border"
      aria-labelledby={`q-${q.id}`}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        {label ? <span className="font-semibold text-fg-muted">{label}</span> : null}
        <Badge tone="primary">
          {q.type === 'code' ? CODE_LABELS[q.language] : TYPE_LABELS[q.type]}
        </Badge>
        <Badge>{DIFFICULTY[q.difficulty]}</Badge>
        {q.verify ? <UnverifiedBadge note={q.verifyNote} /> : null}
        {onFlag ? (
          <button
            onClick={onFlag}
            className="ml-auto flex items-center gap-1 rounded-full px-2 py-1 text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
            title="Flag this question for verification"
          >
            <Flag className="size-3.5" aria-hidden /> Flag
          </button>
        ) : null}
      </div>

      {q.type === 'scenario' ? (
        <div className="mb-4 rounded-lg bg-surface-2 p-4 text-sm">
          <Markdown source={q.scenario} />
        </div>
      ) : null}
      <div
        id={`q-${q.id}`}
        data-question-start
        tabIndex={-1}
        className="text-[19px] leading-snug font-semibold tracking-[-0.015em] focus:outline-none"
      >
        <Markdown source={q.prompt} />
      </div>

      <div className="mt-5">
        {(q.type === 'mcq' || q.type === 'scenario') &&
        (answer.type === 'mcq' || answer.type === 'scenario') ? (
          <fieldset className="grid gap-2.5" disabled={locked}>
            <legend className="sr-only">Choose one answer</legend>
            {q.options.map((o, i) =>
              tile(
                o,
                i + 1,
                answer.choice === o.id,
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  className={inputClass}
                  checked={answer.choice === o.id}
                  onChange={() => choose(o.id)}
                />,
              ),
            )}
          </fieldset>
        ) : null}

        {q.type === 'multi' && answer.type === 'multi' ? (
          <fieldset className="grid gap-2.5" disabled={locked}>
            <legend className="sr-only">Choose all that apply</legend>
            {q.options.map((o, i) => {
              const sel = answer.choices.includes(o.id);
              return tile(
                o,
                i + 1,
                sel,
                <input
                  type="checkbox"
                  className={inputClass}
                  checked={sel}
                  onChange={() => choose(o.id)}
                />,
              );
            })}
          </fieldset>
        ) : null}

        {q.type === 'ordering' ? (
          <>
            <p className="sr-only" aria-live="polite">
              {moved ? `${moved.text} moved to position ${order.indexOf(moved.id) + 1}` : ''}
            </p>
            <ol ref={orderList} className="grid gap-2.5" aria-label="Items to order">
              {order.map((id, i) => {
                const item = q.items.find((x) => x.id === id);
                const correctHere = reveal && q.items[i]?.id === id;
                const move = (dir: -1 | 1): void => {
                  const next = [...order];
                  const j = i + dir;
                  if (j < 0 || j >= next.length) return;
                  [next[i], next[j]] = [next[j]!, next[i]!];
                  setAnswer({ type: 'ordering', order: next });
                  setMoved({ id, dir, text: item?.text ?? '' });
                };
                return (
                  <li
                    key={id}
                    className={cn(
                      'flex min-h-14 items-center gap-3 rounded-xl px-4 py-2',
                      reveal
                        ? correctHere
                          ? 'bg-success-soft ring-2 ring-success'
                          : 'bg-danger-soft ring-2 ring-danger'
                        : 'bg-surface ring-1 ring-border-strong/70',
                    )}
                  >
                    <span className="grid size-7 shrink-0 place-items-center rounded-md text-xs font-semibold text-fg-muted ring-1 ring-border-strong">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-[15px] leading-snug">{item?.text}</span>
                    {!locked ? (
                      <span className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          data-item={id}
                          data-move="-1"
                          onClick={() => move(-1)}
                          disabled={i === 0}
                          aria-label={`Move "${item?.text}" up`}
                        >
                          <ArrowUp />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          data-item={id}
                          data-move="1"
                          onClick={() => move(1)}
                          disabled={i === order.length - 1}
                          aria-label={`Move "${item?.text}" down`}
                        >
                          <ArrowDown />
                        </Button>
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </>
        ) : null}

        {q.type === 'matching' && answer.type === 'matching' ? (
          <div className="grid gap-2.5">
            {q.pairs.map((p) => {
              const chosen = answer.pairs[p.left] ?? '';
              const ok = reveal ? chosen === p.right : null;
              return (
                <div
                  key={p.left}
                  className={cn(
                    'grid items-center gap-2 rounded-xl px-4 py-3 sm:grid-cols-2',
                    ok === null
                      ? 'bg-surface ring-1 ring-border-strong/70'
                      : ok
                        ? 'bg-success-soft ring-2 ring-success'
                        : 'bg-danger-soft ring-2 ring-danger',
                  )}
                >
                  <span className="text-[15px] font-medium">{p.left}</span>
                  <Select
                    aria-label={`Match for ${p.left}`}
                    value={chosen}
                    disabled={locked}
                    onChange={(e) =>
                      setAnswer({
                        type: 'matching',
                        pairs: { ...answer.pairs, [p.left]: e.target.value },
                      })
                    }
                  >
                    <option value="">Choose…</option>
                    {rightSide.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </Select>
                  {ok === false ? (
                    <span className="text-sm font-medium sm:col-span-2">Correct: {p.right}</span>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}

        {q.type === 'fill' && answer.type === 'fill' ? (
          <Input
            aria-label="Your answer"
            value={answer.text}
            disabled={locked}
            onChange={(e) => setAnswer({ type: 'fill', text: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && answer.text.trim()) submit();
            }}
          />
        ) : null}

        {q.type === 'code' && answer.type === 'code' ? (
          <Textarea
            aria-label="Your answer"
            spellCheck={false}
            className="font-mono"
            placeholder={
              q.placeholder ??
              (q.language === 'webapi' ? 'GET /piwebapi/…' : "TagAvg('…', '*-1h', '*')")
            }
            value={answer.text}
            disabled={locked}
            onChange={(e) => setAnswer({ type: 'code', text: e.target.value })}
          />
        ) : null}
      </div>

      {!locked ? (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {keyboard && 'options' in q ? (
            <p className="hidden text-xs text-fg-subtle md:block">
              Press 1–{q.options.length} to choose, Enter to check.
            </p>
          ) : null}
          <div className="ml-auto flex items-center gap-2">
            {onSkip ? (
              <Button variant="ghost" size="lg" onClick={onSkip}>
                Skip
              </Button>
            ) : null}
            <Button
              size="lg"
              className="min-w-40"
              onClick={submit}
              disabled={!isAnswered(answer, q)}
            >
              {showFeedback ? 'Check answer' : 'Save answer'}
            </Button>
          </div>
        </div>
      ) : null}

      {locked && !showFeedback ? (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <p
            role="status"
            className="flex flex-1 items-center gap-2 rounded-xl bg-surface-2 px-4 py-3 text-sm text-fg-muted"
          >
            <Check className="size-4 shrink-0" aria-hidden />
            Answer saved. Results are shown when you finish.
          </p>
          {onContinue ? (
            <Button ref={continueBtn} size="lg" onClick={onContinue}>
              {continueLabel}
            </Button>
          ) : null}
        </div>
      ) : null}

      {reveal && result ? (
        <FeedbackSheet
          q={q}
          result={result}
          fresh={fresh}
          onContinue={onContinue}
          continueLabel={continueLabel}
          continueRef={continueBtn}
        />
      ) : null}
    </article>
  );
}

/** Duolingo-style verdict sheet that slides up under the question after Check. */
function FeedbackSheet({
  q,
  result,
  fresh,
  onContinue,
  continueLabel,
  continueRef,
}: {
  q: Question;
  result: GradeResult;
  fresh: boolean;
  onContinue?: () => void;
  continueLabel: string;
  continueRef: RefObject<HTMLButtonElement | null>;
}) {
  const ok = result.correct;
  const partial = !ok && result.score > 0;
  const mood: PipMood = ok ? 'cheer' : partial ? 'think' : 'sad';
  const answerText = ok ? null : correctAnswerOf(q);
  return (
    <div
      role="status"
      className={cn(
        'animate-pop sticky bottom-3 z-20 mt-6 max-h-[min(60vh,40rem)] overflow-y-auto rounded-xl p-4 shadow-raised ring-1 sm:p-5',
        ok ? 'bg-success-soft ring-success/40' : 'bg-danger-soft ring-danger/40',
      )}
    >
      <div className="flex items-center gap-4">
        <Pip mood={mood} size={64} />
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'flex items-center gap-2 text-[20px] font-bold tracking-[-0.02em]',
              ok ? 'text-success' : 'text-danger',
            )}
          >
            {ok ? (
              <CheckCircle2 className="size-6" aria-hidden />
            ) : (
              <XCircle className="size-6" aria-hidden />
            )}
            {ok
              ? 'Correct! Nice work.'
              : partial
                ? `Partly correct (${Math.round(result.score * 100)}%)`
                : 'Not quite'}
          </p>
          {ok && fresh ? (
            <Badge tone="xp" className="mt-1 text-[13px]">
              +{XP_RULES.correctAnswer} XP
            </Badge>
          ) : null}
          {result.detail ? <p className="mt-1 text-sm">{result.detail}</p> : null}
        </div>
      </div>

      {answerText ? (
        <div className="mt-3 text-[15px]">
          <span className="font-semibold text-danger">Correct answer: </span>
          {typeof answerText === 'string' ? (
            <span className="font-medium">{answerText}</span>
          ) : (
            <div className="mt-1 font-medium">{answerText}</div>
          )}
        </div>
      ) : null}

      <div className="mt-4 rounded-lg bg-surface p-4 text-sm">
        <div className="mb-1 text-[13px] font-semibold text-fg-muted">Why</div>
        <Markdown source={q.explanation} />
        {q.lessonId ? (
          <Link
            to={`/learn/${q.lessonId}`}
            className="mt-2 inline-block font-medium text-primary underline underline-offset-2"
          >
            Review the lesson
          </Link>
        ) : null}
        <SourceList ids={q.sources} compact />
      </div>

      {onContinue ? (
        <Button
          ref={continueRef}
          size="lg"
          variant={ok ? 'success' : 'danger'}
          className="mt-4 w-full"
          onClick={onContinue}
        >
          {continueLabel}
        </Button>
      ) : null}
    </div>
  );
}
