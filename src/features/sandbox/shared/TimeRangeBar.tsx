import { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { parseTimeRange, formatPiTime, TimeParseError } from '@/core/sim/time';
import { cn } from '@/lib/cn';

export interface TimeRange {
  start: string;
  end: string;
}

/** Resolve a PI-style time range, or return the error message. */
export function resolveRange(r: TimeRange, now: number): { start: number; end: number } | string {
  try {
    const out = parseTimeRange(r.start, r.end, now);
    if (out.end <= out.start) return 'The end time must be after the start time.';
    return out;
  } catch (e) {
    return e instanceof TimeParseError ? e.message : 'Invalid time.';
  }
}

/**
 * PI Vision style time bar: start and end accept PI time expressions (`*-8h`, `t`, `y+6h`),
 * arrows shift the window by its own length, and "Now" snaps the end to `*`.
 */
export function TimeRangeBar({
  value,
  onChange,
  now,
  compact,
}: {
  value: TimeRange;
  onChange: (r: TimeRange) => void;
  now: number;
  compact?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  const [synced, setSynced] = useState(value);
  if (synced !== value) {
    setSynced(value);
    setDraft(value);
  }
  const resolved = resolveRange(draft, now);
  const error = typeof resolved === 'string' ? resolved : null;

  const apply = (r: TimeRange): void => {
    setDraft(r);
    if (typeof resolveRange(r, now) !== 'string') onChange(r);
  };
  const shift = (dir: -1 | 1): void => {
    const cur = resolveRange(value, now);
    if (typeof cur === 'string') return;
    const len = cur.end - cur.start;
    apply({ start: formatPiTime(cur.start + dir * len), end: formatPiTime(cur.end + dir * len) });
  };
  const field = 'h-8 rounded border border-border bg-surface px-2 font-mono text-xs';
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Time range">
      <Clock className="size-4 text-fg-muted" aria-hidden />
      <button
        type="button"
        className="rounded p-1 hover:bg-surface-2"
        aria-label="Shift back"
        onClick={() => shift(-1)}
      >
        <ChevronLeft className="size-4" />
      </button>
      <label className="sr-only" htmlFor="tr-start">
        Start time
      </label>
      <input
        id="tr-start"
        className={cn(field, compact ? 'w-28' : 'w-40', error && 'border-danger')}
        value={draft.start}
        onChange={(e) => setDraft({ ...draft, start: e.target.value })}
        onBlur={() => apply(draft)}
        onKeyDown={(e) => e.key === 'Enter' && apply(draft)}
        aria-invalid={Boolean(error)}
      />
      <span className="text-xs text-fg-muted">to</span>
      <label className="sr-only" htmlFor="tr-end">
        End time
      </label>
      <input
        id="tr-end"
        className={cn(field, compact ? 'w-28' : 'w-40', error && 'border-danger')}
        value={draft.end}
        onChange={(e) => setDraft({ ...draft, end: e.target.value })}
        onBlur={() => apply(draft)}
        onKeyDown={(e) => e.key === 'Enter' && apply(draft)}
        aria-invalid={Boolean(error)}
      />
      <button
        type="button"
        className="rounded p-1 hover:bg-surface-2"
        aria-label="Shift forward"
        onClick={() => shift(1)}
      >
        <ChevronRight className="size-4" />
      </button>
      <button
        type="button"
        className="rounded border border-border px-2 py-1 text-xs hover:bg-surface-2"
        onClick={() =>
          apply({ start: value.start.startsWith('*') ? value.start : '*-8h', end: '*' })
        }
      >
        Now
      </button>
      {error ? (
        <span role="alert" className="text-xs text-danger">
          {error}
        </span>
      ) : null}
    </div>
  );
}
