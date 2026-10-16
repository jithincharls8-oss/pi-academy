import { useMemo, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TrendChart, type TrendSeries } from '@/features/sandbox/shared/TrendChart';
import { colorVar, seriesColor } from './colors';
import { formatReading, limitsOf, readAt, resolveItem, seriesOf } from './values';

const SPANS = [
  { label: '1 h', ms: 3_600_000 },
  { label: '8 h', ms: 8 * 3_600_000 },
  { label: '1 d', ms: 86_400_000 },
  { label: '7 d', ms: 7 * 86_400_000 },
];

/**
 * Ad hoc trend: a temporary trend of the chosen data items, opened by clicking a value (or
 * double-clicking a trend). It is not saved with the display.
 */
export function AdHocTrend({
  open,
  items,
  title,
  start,
  end,
  now,
  onClose,
}: {
  open: boolean;
  items: string[];
  title: string;
  start: number;
  end: number;
  now: number;
  onClose: () => void;
}) {
  const [span, setSpan] = useState<number | null>(null);
  const s = span ? Math.min(end, now) - span : start;
  const e = span ? Math.min(end, now) : end;
  const resolved = useMemo(() => items.map((i) => resolveItem(i)), [items]);
  const series = useMemo<TrendSeries[]>(
    () =>
      resolved.flatMap((r, i) =>
        r
          ? [
              {
                key: `a${i}`,
                label: r.label,
                points: seriesOf(r, s, e, now, 400),
                step: Boolean(r.digitalStates),
                units: r.units,
                color: colorVar(seriesColor(i)),
              },
            ]
          : [],
      ),
    [resolved, s, e, now],
  );
  const limits = useMemo(
    () => resolved.flatMap((r) => (r && resolved.length === 1 ? limitsOf(r) : [])),
    [resolved],
  );
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        title={`Ad hoc trend: ${title}`}
        description="A temporary display of the selected data items. It is not saved."
        className="w-[min(56rem,calc(100vw-2rem))]"
      >
        <div
          className="mb-2 flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Trend duration"
        >
          <Button
            variant={span === null ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSpan(null)}
          >
            Display range
          </Button>
          {SPANS.map((x) => (
            <Button
              key={x.label}
              variant={span === x.ms ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setSpan(x.ms)}
            >
              Last {x.label}
            </Button>
          ))}
        </div>
        <TrendChart series={series} start={s} end={e} height={320} limits={limits} />
        <ul className="mt-3 space-y-1 text-sm">
          {resolved.map((r, i) =>
            r ? (
              <li key={r.item} className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="inline-block h-0.5 w-4"
                  style={{ background: colorVar(seriesColor(i)) }}
                />
                <span className="font-medium">{r.label}</span>
                <span className="text-fg-muted">{r.attribute.description}</span>
                <span className="ml-auto tabular-nums">
                  {formatReading(r, readAt(r, Math.min(e, now), now), { units: true })}
                </span>
              </li>
            ) : null,
          )}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
