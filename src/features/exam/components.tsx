import { Link } from 'react-router-dom';
import { CheckCircle2, CircleDashed, XCircle } from 'lucide-react';
import { DOMAIN_LABELS, type Domain, type Question } from '@/core/schemas';
import type { AnswerRecord, HeatCell, SessionSummary } from '@/core/exam/session';
import { QuestionCard } from '@/components/questions/QuestionCard';
import { Progress } from '@/components/ui/misc';
import { Pip, type PipMood } from '@/components/ui/pip';
import { XP_RULES } from '@/core/progress/learner';
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

function resultMood(s: SessionSummary): { mood: PipMood; headline: string } {
  if (s.answered === 0)
    return {
      mood: 'think',
      headline: 'No answers this time. Give it another go when you are ready.',
    };
  if (s.percent >= 90) return { mood: 'cheer', headline: 'Outstanding! You really know this.' };
  if (s.percent >= 80) return { mood: 'cheer', headline: 'Brilliant work!' };
  if (s.percent >= 60) return { mood: 'happy', headline: 'Good effort, you are nearly there.' };
  if (s.percent > 0)
    return { mood: 'think', headline: 'Every miss is a lesson. The explanations below show why.' };
  return { mood: 'sad', headline: 'A tough one. Review the answers below and try again.' };
}

/** End-of-session results with a per-question review. */
export function ExamResults({
  summary,
  questions,
  records,
  title = 'Results',
  bonusXp = 0,
}: {
  summary: SessionSummary;
  questions: readonly Question[];
  records: ReadonlyMap<string, AnswerRecord>;
  title?: string;
  /** extra XP this session earned on top of correct answers (the daily exam bonus) */
  bonusXp?: number;
}) {
  const tone =
    summary.percent >= 80 ? 'text-success' : summary.percent >= 60 ? 'text-warning' : 'text-danger';
  const { mood, headline } = resultMood(summary);
  const xp = summary.correct * XP_RULES.correctAnswer + bonusXp;
  return (
    <section aria-labelledby="results-title" className="space-y-6">
      <div className="animate-pop rounded-xl bg-surface p-6 shadow-card ring-1 ring-border/70 sm:p-8 dark:ring-border">
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
          <Pip mood={mood} size={112} animate />
          <div className="min-w-0 flex-1">
            <h2 id="results-title" className="text-[13px] font-semibold text-fg-muted">
              {title}
            </h2>
            <p className="mt-1 text-[26px] leading-tight font-bold tracking-[-0.025em]">
              {headline}
            </p>
            <dl className="mt-4 flex flex-wrap justify-center gap-3 sm:justify-start">
              <div className="rounded-xl bg-surface-2 px-4 py-2.5">
                <dt className="text-xs font-medium text-fg-muted">Score</dt>
                <dd className={cn('tabular text-[26px] leading-tight font-bold', tone)}>
                  {summary.percent}%
                </dd>
              </div>
              <div className="rounded-xl bg-surface-2 px-4 py-2.5">
                <dt className="text-xs font-medium text-fg-muted">Correct</dt>
                <dd className="tabular text-[26px] leading-tight font-bold">
                  {summary.correct}
                  <span className="text-base font-semibold text-fg-muted"> / {summary.total}</span>
                </dd>
              </div>
              {xp > 0 ? (
                <div className="rounded-xl bg-surface-2 px-4 py-2.5">
                  <dt className="text-xs font-medium text-fg-muted">XP earned</dt>
                  <dd className="tabular text-[26px] leading-tight font-bold text-xp-text">
                    +{xp}
                  </dd>
                </div>
              ) : null}
            </dl>
            {summary.answered < summary.total ? (
              <p className="mt-2 text-sm text-fg-muted">
                {summary.total - summary.answered} unanswered
              </p>
            ) : null}
          </div>
        </div>
        {summary.byDomain.length > 1 ? (
          <div className="mt-6 border-t border-border pt-5">
            <h3 className="mb-3 text-[15px] font-semibold">By domain, weakest first</h3>
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

      <div>
        <h3 className="mb-3 text-[17px] font-semibold tracking-[-0.02em]">Review your answers</h3>
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
                <details className="group rounded-xl bg-surface ring-1 ring-border/70 dark:ring-border">
                  <summary className="flex cursor-pointer items-start gap-3 rounded-xl px-4 py-3 hover:bg-surface-2">
                    <Icon className={cn('mt-0.5 size-5 shrink-0', iconTone)} aria-label={status} />
                    <span className="text-[15px]">
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
