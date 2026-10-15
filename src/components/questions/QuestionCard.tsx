import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, CheckCircle2, Flag, XCircle } from 'lucide-react';
import type { Question } from '@/core/schemas';
import { grade, type Answer, type GradeResult } from '@/core/exam/grade';
import { seededRandom, shuffle } from '@/core/random/prng';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea, Input, Select } from '@/components/ui/input';
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

export interface QuestionCardProps {
  question: Question;
  /** called once when the learner submits */
  onAnswered?: (result: GradeResult, answer: Answer) => void;
  /** in timed mock exams feedback is hidden until the end */
  showFeedback?: boolean;
  /** heading prefix like "Question 3 of 10" */
  label?: string;
  onFlag?: () => void;
}

export function QuestionCard({
  question: q,
  onAnswered,
  showFeedback = true,
  label,
  onFlag,
}: QuestionCardProps) {
  const [answer, setAnswer] = useState<Answer>(() => emptyAnswer(q));
  const [result, setResult] = useState<GradeResult | null>(null);
  const shuffledItems = useMemo(
    () => (q.type === 'ordering' ? shuffle(q.items, seededRandom(`order|${q.id}`)) : []),
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

  const submit = (): void => {
    const final: Answer = answer.type === 'ordering' ? { type: 'ordering', order } : answer;
    const r = grade(q, final);
    setResult(r);
    onAnswered?.(r, final);
  };

  const optionClass = (id: string, selected: boolean): string => {
    if (!locked || !showFeedback) {
      return selected ? 'border-primary bg-primary-soft' : 'border-border hover:bg-surface-2';
    }
    const correct =
      q.type === 'mcq' || q.type === 'scenario'
        ? q.answer === id
        : q.type === 'multi'
          ? q.answers.includes(id)
          : false;
    if (correct) return 'border-success bg-success-soft';
    if (selected) return 'border-danger bg-danger-soft';
    return 'border-border opacity-70';
  };

  return (
    <article
      className="rounded-lg border border-border bg-surface p-5"
      aria-labelledby={`q-${q.id}`}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        {label ? <span className="font-medium text-fg-muted">{label}</span> : null}
        <Badge tone="primary">
          {q.type === 'code' ? CODE_LABELS[q.language] : TYPE_LABELS[q.type]}
        </Badge>
        <Badge>{DIFFICULTY[q.difficulty]}</Badge>
        {q.verify ? (
          <Badge tone="warning" title={q.verifyNote}>
            Needs verification
          </Badge>
        ) : null}
        {onFlag ? (
          <button
            onClick={onFlag}
            className="ml-auto flex items-center gap-1 text-fg-muted hover:text-fg"
            title="Flag this question for verification"
          >
            <Flag className="size-3.5" aria-hidden /> Flag
          </button>
        ) : null}
      </div>

      {q.type === 'scenario' ? (
        <div className="mb-3 rounded-md bg-surface-2 p-4 text-sm">
          <Markdown source={q.scenario} />
        </div>
      ) : null}
      <div id={`q-${q.id}`} className="font-medium">
        <Markdown source={q.prompt} />
      </div>

      <div className="mt-4">
        {(q.type === 'mcq' || q.type === 'scenario') &&
        (answer.type === 'mcq' || answer.type === 'scenario') ? (
          <fieldset className="space-y-2" disabled={locked}>
            <legend className="sr-only">Choose one answer</legend>
            {q.options.map((o) => (
              <label
                key={o.id}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-md border p-3',
                  optionClass(o.id, answer.choice === o.id),
                )}
              >
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  className="mt-1 accent-primary"
                  checked={answer.choice === o.id}
                  onChange={() => setAnswer({ ...answer, choice: o.id })}
                />
                <span>{o.text}</span>
              </label>
            ))}
          </fieldset>
        ) : null}

        {q.type === 'multi' && answer.type === 'multi' ? (
          <fieldset className="space-y-2" disabled={locked}>
            <legend className="sr-only">Choose all that apply</legend>
            {q.options.map((o) => {
              const sel = answer.choices.includes(o.id);
              return (
                <label
                  key={o.id}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-md border p-3',
                    optionClass(o.id, sel),
                  )}
                >
                  <input
                    type="checkbox"
                    className="mt-1 accent-primary"
                    checked={sel}
                    onChange={() =>
                      setAnswer({
                        type: 'multi',
                        choices: sel
                          ? answer.choices.filter((c) => c !== o.id)
                          : [...answer.choices, o.id],
                      })
                    }
                  />
                  <span>{o.text}</span>
                </label>
              );
            })}
          </fieldset>
        ) : null}

        {q.type === 'ordering' ? (
          <ol className="space-y-2" aria-label="Items to order">
            {order.map((id, i) => {
              const item = q.items.find((x) => x.id === id);
              const correctHere = locked && showFeedback && q.items[i]?.id === id;
              const move = (dir: -1 | 1): void => {
                const next = [...order];
                const j = i + dir;
                if (j < 0 || j >= next.length) return;
                [next[i], next[j]] = [next[j]!, next[i]!];
                setAnswer({ type: 'ordering', order: next });
              };
              return (
                <li
                  key={id}
                  className={cn(
                    'flex items-center gap-3 rounded-md border p-3',
                    locked && showFeedback
                      ? correctHere
                        ? 'border-success bg-success-soft'
                        : 'border-danger bg-danger-soft'
                      : 'border-border',
                  )}
                >
                  <span className="w-6 text-right font-mono text-sm text-fg-muted">{i + 1}.</span>
                  <span className="flex-1">{item?.text}</span>
                  {!locked ? (
                    <span className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => move(-1)}
                        disabled={i === 0}
                        aria-label={`Move "${item?.text}" up`}
                      >
                        <ArrowUp />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
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
        ) : null}

        {q.type === 'matching' && answer.type === 'matching' ? (
          <div className="space-y-2">
            {q.pairs.map((p) => {
              const chosen = answer.pairs[p.left] ?? '';
              const ok = locked && showFeedback ? chosen === p.right : null;
              return (
                <div
                  key={p.left}
                  className={cn(
                    'grid items-center gap-2 rounded-md border p-3 sm:grid-cols-2',
                    ok === null
                      ? 'border-border'
                      : ok
                        ? 'border-success bg-success-soft'
                        : 'border-danger bg-danger-soft',
                  )}
                >
                  <span>{p.left}</span>
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
                    <span className="text-sm text-fg-muted sm:col-span-2">Correct: {p.right}</span>
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
        <div className="mt-4 flex justify-end">
          <Button onClick={submit} disabled={!isAnswered(answer, q) && q.type !== 'ordering'}>
            Check answer
          </Button>
        </div>
      ) : null}

      {locked && showFeedback && result ? (
        <div
          role="status"
          className={cn(
            'mt-4 rounded-md border p-4',
            result.correct ? 'border-success bg-success-soft' : 'border-danger bg-danger-soft',
          )}
        >
          <div
            className={cn(
              'flex items-center gap-2 font-semibold',
              result.correct ? 'text-success' : 'text-danger',
            )}
          >
            {result.correct ? (
              <CheckCircle2 className="size-5" aria-hidden />
            ) : (
              <XCircle className="size-5" aria-hidden />
            )}
            {result.correct
              ? 'Correct'
              : result.score > 0
                ? `Partly correct (${Math.round(result.score * 100)}%)`
                : 'Not quite'}
          </div>
          {result.detail ? <p className="mt-1 text-sm">{result.detail}</p> : null}
          {(q.type === 'fill' || q.type === 'code') && !result.correct ? (
            <p className="mt-2 text-sm">
              Accepted answer:{' '}
              <code className="rounded bg-surface px-1 font-mono">{q.accepted[0]}</code>
            </p>
          ) : null}
          <div className="mt-3 text-sm">
            <Markdown source={q.explanation} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            {q.lessonId ? (
              <Link to={`/learn/${q.lessonId}`} className="text-primary underline">
                Review the lesson
              </Link>
            ) : null}
          </div>
          <SourceList ids={q.sources} compact />
        </div>
      ) : null}
    </article>
  );
}
