import { Link } from 'react-router-dom';
import { CheckCircle2, CircleDashed, XCircle } from 'lucide-react';
import { DOMAIN_LABELS, type Domain, type Question } from '@/core/schemas';
import type { AnswerRecord, HeatCell, SessionSummary } from '@/core/exam/session';
import { QuestionCard } from '@/components/questions/QuestionCard';
import { Progress } from '@/components/ui/misc';
import { cn } from '@/lib/cn';

const HEAT_CLASS: Record<HeatCell['level'], string> = {
  0: 'bg-heat-0',
  1: 'bg-heat-1',
  2: 'bg-heat-2',
  3: 'bg-heat-3',
  4: 'bg-heat-4',
};

const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];

/** Daily-exam calendar heatmap, one column per week. */
export function Heatmap({ columns, label }: { columns: HeatCell[][]; label: string }) {
  const done = columns.flat().filter((c) => c.score !== null).length;
  return (
    <figure aria-label={`${label}: ${done} days with a daily exam`}>
      <div className="flex gap-1">
        <div
          className="mr-1 grid grid-rows-7 gap-1 text-[10px] leading-3 text-fg-muted"
          aria-hidden
        >
          {DAY_LABELS.map((d, i) => (
            <span key={i} className="h-3">
              {d}
            </span>
          ))}
        </div>
        {columns.map((col) => (
          <div key={col[0]?.date} className="grid grid-rows-7 gap-1">
            {col.map((c) => (
              <span
                key={c.date}
                title={
                  c.future
                    ? undefined
                    : c.score === null
                      ? `${c.date}: no daily exam`
                      : `${c.date}: ${c.score}%`
                }
                className={cn(
                  'size-3 rounded-sm',
                  c.future ? 'bg-transparent' : HEAT_CLASS[c.level],
                )}
              />
            ))}
          </div>
        ))}
      </div>
      <figcaption className="mt-2 flex items-center gap-1 text-xs text-fg-muted">
        Lower
        {([1, 2, 3, 4] as const).map((l) => (
          <span key={l} className={cn('size-3 rounded-sm', HEAT_CLASS[l])} aria-hidden />
        ))}
        Higher score
      </figcaption>
    </figure>
  );
}

/** Horizontal bars of 0..100 scores per domain. */
export function DomainBars({
  rows,
}: {
  rows: { domain: Domain; percent: number; hint?: string }[];
}) {
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.domain}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
            <span>{DOMAIN_LABELS[r.domain]}</span>
            <span className="tabular-nums text-fg-muted">
              {r.percent}%{r.hint ? ` · ${r.hint}` : ''}
            </span>
          </div>
          <Progress value={r.percent} label={`${DOMAIN_LABELS[r.domain]}: ${r.percent}%`} />
        </li>
      ))}
    </ul>
  );
}

/** End-of-session results with a per-question review. */
export function ExamResults({
  summary,
  questions,
  records,
  title = 'Results',
}: {
  summary: SessionSummary;
  questions: readonly Question[];
  records: ReadonlyMap<string, AnswerRecord>;
  title?: string;
}) {
  const tone =
    summary.percent >= 80 ? 'text-success' : summary.percent >= 60 ? 'text-warning' : 'text-danger';
  return (
    <section aria-labelledby="results-title" className="space-y-6">
      <div className="rounded-lg border border-border bg-surface p-6">
        <h2 id="results-title" className="text-lg font-semibold">
          {title}
        </h2>
        <div className="mt-3 flex flex-wrap items-end gap-8">
          <div>
            <div className={cn('text-4xl font-semibold tabular-nums', tone)}>
              {summary.percent}%
            </div>
            <div className="text-sm text-fg-muted">
              {summary.correct} correct of {summary.total}
              {summary.answered < summary.total
                ? ` (${summary.total - summary.answered} unanswered)`
                : ''}
            </div>
          </div>
          {summary.byDomain.length > 1 ? (
            <div className="min-w-64 flex-1">
              <h3 className="mb-2 text-sm font-medium">By domain, weakest first</h3>
              <DomainBars
                rows={summary.byDomain.map((d) => ({
                  domain: d.domain,
                  percent: d.percent,
                  hint: `${d.total} q`,
                }))}
              />
            </div>
          ) : null}
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-medium">Review your answers</h3>
        <ol className="space-y-2">
          {questions.map((q, i) => {
            const r = records.get(q.id);
            const Icon = !r ? CircleDashed : r.result.correct ? CheckCircle2 : XCircle;
            const iconTone = !r
              ? 'text-fg-muted'
              : r.result.correct
                ? 'text-success'
                : 'text-danger';
            const status = !r ? 'Unanswered' : r.result.correct ? 'Correct' : 'Incorrect';
            return (
              <li key={q.id}>
                <details className="group rounded-md border border-border bg-surface">
                  <summary className="flex cursor-pointer items-start gap-3 p-3">
                    <Icon className={cn('mt-0.5 size-4 shrink-0', iconTone)} aria-label={status} />
                    <span className="text-sm">
                      <span className="text-fg-muted">{i + 1}. </span>
                      {q.prompt}
                    </span>
                  </summary>
                  <div className="border-t border-border p-3">
                    {r ? (
                      <QuestionCard question={q} initial={r} />
                    ) : (
                      <p className="text-sm text-fg-muted">
                        Not answered.{' '}
                        <Link
                          className="text-primary underline"
                          to={`/practice/question/${encodeURIComponent(q.id)}`}
                        >
                          Try it now
                        </Link>
                      </p>
                    )}
                  </div>
                </details>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
