import { useId, useMemo } from 'react';
import type { TimedValue } from '@/core/sim/compression';

export interface DoorOverlay {
  anchor: TimedValue;
  event: TimedValue;
  /** slope limits before this event arrived (value units per ms); infinite = door wide open */
  before: { anchor: TimedValue; upper: number; lower: number } | null;
  /** slope limits after the event was processed */
  after: { anchor: TimedValue; upper: number; lower: number };
  /** events held since the anchor (drawn with their ±CompDev bars) */
  held: TimedValue[];
  compDev: number;
  archivedNow: TimedValue | null;
}

export interface LabLayers {
  raw: boolean;
  sent: boolean;
  archived: boolean;
  reconstructed: boolean;
}

const W = 900;
const H = 340;
const M = { l: 56, r: 16, t: 12, b: 30 };
const PW = W - M.l - M.r;
const PH = H - M.t - M.b;

function niceTicks(lo: number, hi: number, n = 5): number[] {
  const span = hi - lo || 1;
  const raw = span / n;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-9; v += step) {
    out.push(Math.round(v / step) * step);
  }
  return out;
}

function inRange(points: TimedValue[], t0: number, t1: number): TimedValue[] {
  let a = 0;
  while (a < points.length && (points[a] as TimedValue).t < t0) a++;
  let b = points.length - 1;
  while (b >= 0 && (points[b] as TimedValue).t > t1) b--;
  return points.slice(Math.max(0, a - 1), Math.min(points.length, b + 2));
}

/** Raw scans, sent values and archived events on one time axis, with the door drawn on top. */
export function LabChart({
  raw,
  sent,
  archived,
  layers,
  domain,
  door,
  units,
}: {
  raw: TimedValue[];
  sent: TimedValue[];
  archived: TimedValue[];
  layers: LabLayers;
  domain: [number, number];
  door: DoorOverlay | null;
  units: string;
}) {
  const clip = useId();
  const [t0, t1] = domain;
  const view = useMemo(
    () => ({
      raw: inRange(raw, t0, t1),
      sent: inRange(sent, t0, t1),
      archived: inRange(archived, t0, t1),
    }),
    [raw, sent, archived, t0, t1],
  );
  const [y0, y1] = useMemo(() => {
    const vals = [...view.raw, ...view.sent, ...view.archived]
      .filter((p) => p.t >= t0 && p.t <= t1)
      .map((p) => p.v);
    if (door) {
      vals.push(door.anchor.v, door.event.v);
      for (const h of door.held) vals.push(h.v + door.compDev, h.v - door.compDev);
    }
    if (!vals.length) return [0, 1];
    let lo = Math.min(...vals);
    let hi = Math.max(...vals);
    if (hi - lo < 1e-6) {
      lo -= 1;
      hi += 1;
    }
    const pad = (hi - lo) * 0.08;
    return [lo - pad, hi + pad];
  }, [view, t0, t1, door]);

  const x = (t: number): number => M.l + ((t - t0) / (t1 - t0 || 1)) * PW;
  const y = (v: number): number => M.t + (1 - (v - y0) / (y1 - y0 || 1)) * PH;
  const line = (pts: TimedValue[]): string =>
    pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join('');
  const dots = (pts: TimedValue[], r: number): string =>
    pts
      .map(
        (p) =>
          `M${(x(p.t) - r).toFixed(1)},${y(p.v).toFixed(1)}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0`,
      )
      .join('');

  const span = t1 - t0;
  const fmt = (t: number): string =>
    new Date(t).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      ...(span < 20 * 60_000 ? { second: '2-digit' } : {}),
    });
  const xTicks = niceTicks(t0, t1, 6).filter((t) => t >= t0 && t <= t1);
  const timeTicks = (() => {
    const steps = [5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200, 14400].map(
      (s) => s * 1000,
    );
    const step = steps.find((s) => span / s <= 7) ?? span / 6;
    const out: number[] = [];
    for (let t = Math.ceil(t0 / step) * step; t <= t1; t += step) out.push(t);
    return out.length >= 2 ? out : xTicks;
  })();
  const yTicks = niceTicks(y0, y1, 5);

  const doorCone = (
    d: { anchor: TimedValue; upper: number; lower: number },
    tEnd: number,
  ): { up: [number, number]; lo: [number, number] } | null => {
    if (!Number.isFinite(d.upper) || !Number.isFinite(d.lower)) return null;
    const dt = tEnd - d.anchor.t;
    return {
      up: [x(tEnd), y(d.anchor.v + d.upper * dt)],
      lo: [x(tEnd), y(d.anchor.v + d.lower * dt)],
    };
  };
  const tEnd = door
    ? door.event.t + Math.max(0.35 * (door.event.t - door.anchor.t), span * 0.05)
    : 0;
  const before = door?.before ? doorCone(door.before, tEnd) : null;
  const after = door ? doorCone(door.after, tEnd) : null;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label={`Chart of ${view.raw.length} raw scans, ${view.sent.length} sent values and ${view.archived.length} archived events in the visible window`}
    >
      <defs>
        <clipPath id={clip}>
          <rect x={M.l} y={M.t} width={PW} height={PH} />
        </clipPath>
      </defs>
      <rect
        x={M.l}
        y={M.t}
        width={PW}
        height={PH}
        fill="var(--tool-canvas)"
        stroke="var(--tool-grid)"
      />
      {yTicks.map((v) => (
        <g key={`y${v}`}>
          <line x1={M.l} x2={M.l + PW} y1={y(v)} y2={y(v)} stroke="var(--tool-grid)" />
          <text x={M.l - 6} y={y(v) + 4} textAnchor="end" fontSize={11} fill="var(--fg-muted)">
            {Number(v.toFixed(3))}
          </text>
        </g>
      ))}
      {timeTicks.map((t) => (
        <g key={`x${t}`}>
          <line x1={x(t)} x2={x(t)} y1={M.t} y2={M.t + PH} stroke="var(--tool-grid)" />
          <text x={x(t)} y={H - 10} textAnchor="middle" fontSize={11} fill="var(--fg-muted)">
            {fmt(t)}
          </text>
        </g>
      ))}
      <text
        x={14}
        y={M.t + PH / 2}
        fontSize={11}
        fill="var(--fg-muted)"
        transform={`rotate(-90 14 ${M.t + PH / 2})`}
        textAnchor="middle"
      >
        {units}
      </text>
      <g clipPath={`url(#${clip})`}>
        {layers.raw ? (
          <path d={line(view.raw)} fill="none" stroke="var(--fg-subtle)" strokeWidth={1} />
        ) : null}
        {layers.reconstructed ? (
          <path d={line(view.archived)} fill="none" stroke="var(--chart-1)" strokeWidth={2} />
        ) : null}
        {layers.sent ? (
          <path
            d={dots(view.sent, view.sent.length > 400 ? 1.6 : 2.6)}
            fill="none"
            stroke="var(--chart-2)"
            strokeWidth={1.2}
          />
        ) : null}
        {layers.archived ? (
          <path
            d={dots(view.archived, 3.4)}
            fill="var(--chart-1)"
            stroke="var(--surface)"
            strokeWidth={1}
          />
        ) : null}
        {door ? (
          <g>
            {before ? (
              <polygon
                points={`${x(door.before?.anchor.t ?? door.anchor.t)},${y(door.before?.anchor.v ?? door.anchor.v)} ${before.up.join(',')} ${before.lo.join(',')}`}
                fill="var(--chart-4)"
                fillOpacity={0.18}
                stroke="var(--chart-4)"
                strokeWidth={1.4}
              />
            ) : null}
            {after ? (
              <g stroke="var(--chart-4)" strokeWidth={1.4} strokeDasharray="6 4">
                <line
                  x1={x(door.after.anchor.t)}
                  y1={y(door.after.anchor.v)}
                  x2={after.up[0]}
                  y2={after.up[1]}
                />
                <line
                  x1={x(door.after.anchor.t)}
                  y1={y(door.after.anchor.v)}
                  x2={after.lo[0]}
                  y2={after.lo[1]}
                />
              </g>
            ) : null}
            {door.held.map((h) => (
              <line
                key={h.t}
                x1={x(h.t)}
                x2={x(h.t)}
                y1={y(h.v + door.compDev)}
                y2={y(h.v - door.compDev)}
                stroke="var(--chart-2)"
                strokeWidth={1}
                opacity={0.7}
              />
            ))}
            <circle
              cx={x(door.anchor.t)}
              cy={y(door.anchor.v)}
              r={7}
              fill="none"
              stroke="var(--chart-1)"
              strokeWidth={2}
            />
            {door.archivedNow ? (
              <circle
                cx={x(door.archivedNow.t)}
                cy={y(door.archivedNow.v)}
                r={9}
                fill="none"
                stroke="var(--tool-alarm-warn)"
                strokeWidth={2.4}
              />
            ) : null}
            <circle
              cx={x(door.event.t)}
              cy={y(door.event.v)}
              r={5}
              fill={door.archivedNow ? 'var(--tool-alarm-warn)' : 'var(--tool-ok)'}
              stroke="var(--surface)"
              strokeWidth={1.5}
            />
          </g>
        ) : null}
      </g>
    </svg>
  );
}
