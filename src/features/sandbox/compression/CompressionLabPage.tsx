import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  Waves,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label, Select } from '@/components/ui/input';
import { Switch } from '@/components/ui/misc';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';
import { plant, type SimPoint } from '@/core/sim/plant';
import { scans } from '@/core/sim/data';
import type { CompressionSettings, ExceptionSettings, TimedValue } from '@/core/sim/compression';
import { ToolFrame } from '../shared/ToolFrame';
import { TimeRangeBar, resolveRange, type TimeRange } from '../shared/TimeRangeBar';
import { LabChart, type DoorOverlay, type LabLayers } from './LabChart';
import {
  PRESETS,
  explainStep,
  generateSignal,
  runLab,
  type Preset,
  type SignalParams,
} from './lab';

const CUSTOM = '__custom__';

function NumberField({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit,
  hint,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  unit?: string;
  hint?: string;
}) {
  return (
    <div className="grid gap-1">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="text-xs">
          {label}
        </Label>
        <span className="flex items-center gap-1">
          <input
            type="number"
            aria-label={`${label} value`}
            value={value}
            min={min}
            step={step}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (Number.isFinite(v)) onChange(Math.max(min, v));
            }}
            className="h-7 w-20 rounded border border-border bg-surface px-1 text-right font-mono text-xs focus-visible:outline-2 focus-visible:outline-ring"
          />
          {unit ? <span className="w-8 text-xs text-fg-muted">{unit}</span> : null}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={Math.max(max, value)}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-describedby={hint ? `${id}-h` : undefined}
        className="w-full accent-primary"
      />
      {hint ? (
        <p id={`${id}-h`} className="text-xs text-fg-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="grid gap-3 rounded border border-border p-3">
      <legend className="px-1 text-xs font-semibold tracking-wide text-fg-muted uppercase">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function StatBox({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'ok' | 'bad';
}) {
  return (
    <div className="rounded border border-border bg-surface px-3 py-2">
      <div className="text-[11px] font-medium tracking-wide text-fg-muted uppercase">{label}</div>
      <div
        className={cn(
          'text-lg font-semibold tabular-nums',
          tone === 'ok' && 'text-tool-ok',
          tone === 'bad' && 'text-tool-alarm-hi',
        )}
      >
        {value}
      </div>
      {hint ? <div className="text-xs text-fg-muted">{hint}</div> : null}
    </div>
  );
}

const pointSettings = (p: SimPoint): { exc: ExceptionSettings; comp: CompressionSettings } => ({
  exc: { excDev: p.excdev, excMin: p.excmin, excMax: p.excmax },
  comp: { compressing: p.compressing, compDev: p.compdev, compMin: p.compmin, compMax: p.compmax },
});

const START_PRESET = PRESETS.find((p) => p.id === 'rule-of-thumb') ?? (PRESETS[0] as Preset);

const fmt = (n: number, d = 2): string => (Number.isFinite(n) ? n.toFixed(d) : '–');

/** Interactive exception and swinging-door compression lab. */
export function CompressionLabPage() {
  const [now, setNow] = useState(() => Date.now());
  const points = useMemo(() => plant().points.filter((p) => p.pointtype !== 'Digital'), []);
  const [source, setSource] = useState<string>(CUSTOM);
  const [signal, setSignal] = useState<SignalParams>(START_PRESET.signal);
  const [range, setRange] = useState<TimeRange>({ start: '*-1h', end: '*' });
  const [exc, setExc] = useState<ExceptionSettings>(START_PRESET.exc);
  const [comp, setComp] = useState<CompressionSettings>(START_PRESET.comp);
  const [presetId, setPresetId] = useState<string | null>(START_PRESET.id);
  const [layers, setLayers] = useState<LabLayers>({
    raw: true,
    sent: true,
    archived: true,
    reconstructed: true,
  });
  const [stepIndex, setStepIndex] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(450);

  const point = source === CUSTOM ? null : (points.find((p) => p.tag === source) ?? null);
  const customStart = useMemo(
    () => Math.floor(now / 60_000) * 60_000 - signal.durationMin * 60_000,
    [now, signal.durationMin],
  );

  const {
    raw,
    window: win,
    error,
  } = useMemo((): {
    raw: TimedValue[];
    window: [number, number];
    error: string | null;
  } => {
    if (!point) {
      const r = generateSignal(signal, customStart);
      return {
        raw: r,
        window: [customStart, customStart + signal.durationMin * 60_000],
        error: null,
      };
    }
    const rr = resolveRange(range, now);
    if (typeof rr === 'string') return { raw: [], window: [now - 3_600_000, now], error: rr };
    const end = Math.min(rr.end, now);
    if (end - rr.start > 12 * 3_600_000) {
      return {
        raw: [],
        window: [rr.start, end],
        error: 'Choose a window of 12 hours or less so every scan can be drawn.',
      };
    }
    return { raw: scans(point, rr.start, end), window: [rr.start, end], error: null };
  }, [point, signal, customStart, range, now]);

  const lab = useMemo(() => runLab(raw, exc, comp), [raw, exc, comp]);
  const steps = lab.steps;
  const idx = stepIndex === null ? null : Math.min(stepIndex, Math.max(0, steps.length - 1));

  useEffect(() => {
    if (!playing || idx === null || idx >= steps.length - 1) return;
    const t = window.setTimeout(() => setStepIndex(idx + 1), speed);
    return () => window.clearTimeout(t);
  }, [playing, idx, steps.length, speed]);

  const door = useMemo((): DoorOverlay | null => {
    if (idx === null) return null;
    const step = steps[idx];
    if (!step) return null;
    const prev = idx > 0 ? steps[idx - 1] : undefined;
    const beforeAnchor = prev ? prev.anchor : (lab.sent[0] ?? step.anchor);
    const held = lab.sent.filter((e) => e.t > beforeAnchor.t && e.t < step.event.t);
    return {
      anchor: step.anchor,
      event: step.event,
      before: prev ? { anchor: prev.anchor, upper: prev.upper, lower: prev.lower } : null,
      after: { anchor: step.anchor, upper: step.upper, lower: step.lower },
      held,
      compDev: comp.compDev,
      archivedNow: step.archived,
    };
  }, [idx, steps, lab.sent, comp.compDev]);

  const domain = useMemo((): [number, number] => {
    if (!door) return win;
    const a = door.before?.anchor.t ?? door.anchor.t;
    const scanMs = raw.length > 1 ? (raw[1] as TimedValue).t - (raw[0] as TimedValue).t : 5000;
    const w = Math.max(door.event.t - a, 12 * scanMs);
    return [a - 0.1 * w, door.event.t + 0.45 * w];
  }, [door, win, raw]);

  const applyPreset = (p: Preset): void => {
    setSource(CUSTOM);
    setSignal(p.signal);
    setExc(p.exc);
    setComp(p.comp);
    setPresetId(p.id);
    setStepIndex(null);
    setPlaying(false);
  };
  const touch = (): void => setPresetId(null);

  const isPlaying = playing && idx !== null && idx < steps.length - 1;
  const verdict = idx !== null && steps[idx] ? explainStep(steps[idx], comp) : null;
  const preset = PRESETS.find((p) => p.id === presetId) ?? null;
  const units = point ? point.engunits : 'units';
  const devMax = point ? Math.max(1, point.span * 0.1) : 10;
  const devStep = point ? Math.max(0.001, devMax / 500) : 0.05;
  const s = lab.stats;
  const errTone = comp.compressing && s.maxErrorSent <= comp.compDev + 1e-9 ? 'ok' : undefined;

  const setSig = (k: keyof SignalParams) => (v: number) => {
    setSignal((x) => ({ ...x, [k]: v }));
    touch();
  };

  const toolbar = (
    <>
      <Label htmlFor="cl-source" className="text-xs">
        Signal
      </Label>
      <Select
        id="cl-source"
        value={source}
        onChange={(e) => {
          const v = e.target.value;
          setSource(v);
          setStepIndex(null);
          setPresetId(null);
          const p = points.find((x) => x.tag === v);
          if (p) {
            const ps = pointSettings(p);
            setExc(ps.exc);
            setComp(ps.comp);
          }
        }}
        className="h-8 w-56 text-xs"
      >
        <option value={CUSTOM}>Custom signal generator</option>
        <optgroup label="Plant points (raw scans)">
          {points.map((p) => (
            <option key={p.tag} value={p.tag}>
              {p.tag}
            </option>
          ))}
        </optgroup>
      </Select>
      {point ? (
        <>
          <TimeRangeBar value={range} onChange={setRange} now={now} compact />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              const ps = pointSettings(point);
              setExc(ps.exc);
              setComp(ps.comp);
            }}
          >
            <RotateCcw aria-hidden /> Point's own settings
          </Button>
        </>
      ) : null}
      <Button size="sm" variant="ghost" onClick={() => setNow(Date.now())}>
        Refresh to now
      </Button>
    </>
  );

  return (
    <ToolFrame
      title="Compression lab"
      toolbar={toolbar}
      status={
        <span>
          Exception runs in the interface before the snapshot; compression runs in the Data Archive
          before the archive. Teaching model of the published behaviour: real archive counts can
          differ slightly.
        </span>
      }
    >
      <aside
        className="w-80 shrink-0 space-y-3 overflow-y-auto border-r border-tool-grid bg-surface p-3"
        aria-label="Settings"
      >
        {!point ? (
          <Group title="Custom signal">
            <NumberField
              id="sg-base"
              label="Base"
              value={signal.base}
              onChange={setSig('base')}
              min={0}
              max={100}
              step={1}
            />
            <NumberField
              id="sg-amp"
              label="Sine amplitude"
              value={signal.sineAmp}
              onChange={setSig('sineAmp')}
              min={0}
              max={20}
              step={0.1}
            />
            <NumberField
              id="sg-per"
              label="Sine period"
              value={signal.sinePeriodMin}
              onChange={setSig('sinePeriodMin')}
              min={1}
              max={120}
              step={1}
              unit="min"
            />
            <NumberField
              id="sg-noise"
              label="Noise (±)"
              value={signal.noise}
              onChange={setSig('noise')}
              min={0}
              max={5}
              step={0.05}
            />
            <NumberField
              id="sg-stepat"
              label="Step at"
              value={signal.stepAtMin}
              onChange={setSig('stepAtMin')}
              min={0}
              max={signal.durationMin}
              step={1}
              unit="min"
            />
            <NumberField
              id="sg-step"
              label="Step size"
              value={signal.stepSize}
              onChange={(v) => {
                setSignal((x) => ({ ...x, stepSize: v }));
                touch();
              }}
              min={-20}
              max={20}
              step={0.1}
            />
            <NumberField
              id="sg-ramp"
              label="Ramp"
              value={signal.rampPerHour}
              onChange={(v) => {
                setSignal((x) => ({ ...x, rampPerHour: v }));
                touch();
              }}
              min={-20}
              max={20}
              step={0.5}
              unit="/h"
            />
            <NumberField
              id="sg-scan"
              label="Scan period"
              value={signal.scanSec}
              onChange={setSig('scanSec')}
              min={1}
              max={60}
              step={1}
              unit="s"
            />
            <NumberField
              id="sg-dur"
              label="Duration"
              value={signal.durationMin}
              onChange={setSig('durationMin')}
              min={5}
              max={240}
              step={5}
              unit="min"
            />
          </Group>
        ) : (
          <p className="rounded bg-surface-2 p-2 text-xs text-fg-muted">
            {point.descriptor}. Scan every {point.scan} s, span {point.span} {point.engunits}. Raw
            scans are regenerated for the window, then run through your settings below.
          </p>
        )}
        <Group title="Exception (interface)">
          <NumberField
            id="ex-dev"
            label="ExcDev"
            value={exc.excDev}
            onChange={(v) => {
              setExc({ ...exc, excDev: v });
              touch();
            }}
            min={0}
            max={devMax}
            step={devStep}
            unit={point?.engunits}
            hint="Send when the value differs from the last sent value by more than this."
          />
          <NumberField
            id="ex-min"
            label="ExcMin"
            value={exc.excMin}
            onChange={(v) => {
              setExc({ ...exc, excMin: v });
              touch();
            }}
            min={0}
            max={300}
            step={1}
            unit="s"
            hint="Never send sooner than this. It only blocks."
          />
          <NumberField
            id="ex-max"
            label="ExcMax"
            value={exc.excMax}
            onChange={(v) => {
              setExc({ ...exc, excMax: v });
              touch();
            }}
            min={0}
            max={3600}
            step={10}
            unit="s"
            hint="Send anyway after this long. All three 0 turns exception off."
          />
        </Group>
        <Group title="Compression (Data Archive)">
          <label className="flex items-center justify-between text-xs font-medium">
            Compressing
            <Switch
              checked={comp.compressing}
              onCheckedChange={(c) => {
                setComp({ ...comp, compressing: c });
                touch();
              }}
              aria-label="Compressing"
            />
          </label>
          <NumberField
            id="cp-dev"
            label="CompDev"
            value={comp.compDev}
            onChange={(v) => {
              setComp({ ...comp, compDev: v });
              touch();
            }}
            min={0}
            max={devMax}
            step={devStep}
            unit={point?.engunits}
            hint="The door's half-width: dropped values stay within this of the redrawn line."
          />
          <NumberField
            id="cp-min"
            label="CompMin"
            value={comp.compMin}
            onChange={(v) => {
              setComp({ ...comp, compMin: v });
              touch();
            }}
            min={0}
            max={300}
            step={1}
            unit="s"
          />
          <NumberField
            id="cp-max"
            label="CompMax"
            value={comp.compMax}
            onChange={(v) => {
              setComp({ ...comp, compMax: v });
              touch();
            }}
            min={0}
            max={28800}
            step={60}
            unit="s"
          />
        </Group>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
        {error ? (
          <p role="alert" className="rounded bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6" aria-live="polite">
          <StatBox label="Raw scans" value={String(s.raw)} />
          <StatBox
            label="Sent (after exception)"
            value={String(s.sent)}
            hint={`−${fmt(s.exceptionReduction, 1)} %`}
          />
          <StatBox
            label="Archived"
            value={String(s.archived)}
            hint={`−${fmt(s.compressionReduction, 1)} % of sent`}
          />
          <StatBox
            label="Compression ratio"
            value={`${fmt(s.ratio, 1)} : 1`}
            hint={`${fmt(s.totalReduction, 1)} % of raw dropped`}
          />
          <StatBox
            label="Max error vs sent"
            value={fmt(s.maxErrorSent, 3)}
            hint={comp.compressing ? `CompDev ${comp.compDev}` : 'compression off'}
            tone={errTone}
          />
          <StatBox
            label="Max error vs raw"
            value={fmt(s.maxErrorRaw, 3)}
            hint={`about ExcDev + CompDev = ${fmt(exc.excDev + (comp.compressing ? comp.compDev : 0), 3)}`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          {(
            [
              ['raw', 'Raw scans', 'bg-fg-subtle'],
              ['sent', 'Sent to snapshot', 'border-2 border-chart-2'],
              ['archived', 'Archived', 'bg-chart-1'],
              ['reconstructed', 'Redrawn line', 'h-0.5 w-4 rounded-none bg-chart-1'],
            ] as const
          ).map(([k, label, swatch]) => (
            <label key={k} className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={layers[k]}
                onChange={(e) => setLayers({ ...layers, [k]: e.target.checked })}
                className="accent-primary"
              />
              <span className={cn('inline-block size-2.5 rounded-full', swatch)} aria-hidden />
              {label}
            </label>
          ))}
          {door ? (
            <span className="flex items-center gap-3 text-fg-muted">
              <span className="flex items-center gap-1">
                <span
                  className="inline-block h-2.5 w-4 bg-chart-4/30 ring-1 ring-chart-4"
                  aria-hidden
                />{' '}
                door before the event
              </span>
              <span>dashed: door after</span>
              <span>bars: ±CompDev on held events</span>
            </span>
          ) : null}
        </div>

        <div className="rounded border border-tool-grid bg-tool-canvas p-1">
          <LabChart
            raw={lab.raw}
            sent={lab.sent}
            archived={lab.archived}
            layers={layers}
            domain={domain}
            door={door}
            units={units}
          />
        </div>

        <section aria-labelledby="cl-step" className="rounded border border-border bg-surface p-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="cl-step" className="mr-2 text-sm font-semibold">
              Swinging door, step by step
            </h2>
            {idx === null ? (
              <Button size="sm" onClick={() => setStepIndex(0)} disabled={steps.length === 0}>
                <Waves aria-hidden /> Start step-through
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  aria-label="First step"
                  onClick={() => setStepIndex(0)}
                >
                  <SkipBack aria-hidden />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  aria-label="Previous step"
                  onClick={() => setStepIndex(Math.max(0, idx - 1))}
                >
                  <ChevronLeft aria-hidden />
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    if (!isPlaying && idx >= steps.length - 1) setStepIndex(0);
                    setPlaying(!isPlaying);
                  }}
                  aria-pressed={isPlaying}
                >
                  {isPlaying ? <Pause aria-hidden /> : <Play aria-hidden />}{' '}
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  aria-label="Next step"
                  onClick={() => setStepIndex(Math.min(steps.length - 1, idx + 1))}
                >
                  <ChevronRight aria-hidden />
                </Button>
                <label htmlFor="cl-idx" className="sr-only">
                  Step number
                </label>
                <input
                  id="cl-idx"
                  type="range"
                  min={0}
                  max={Math.max(0, steps.length - 1)}
                  value={idx}
                  onChange={(e) => setStepIndex(Number(e.target.value))}
                  className="w-48 accent-primary"
                />
                <span className="text-xs tabular-nums text-fg-muted">
                  event {idx + 2} of {lab.sent.length}
                </span>
                <Label htmlFor="cl-speed" className="sr-only">
                  Speed
                </Label>
                <Select
                  id="cl-speed"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="h-8 w-24 text-xs"
                >
                  <option value={900}>Slow</option>
                  <option value={450}>Normal</option>
                  <option value={150}>Fast</option>
                </Select>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setStepIndex(null);
                    setPlaying(false);
                  }}
                >
                  Show whole window
                </Button>
              </>
            )}
          </div>
          {verdict && idx !== null && steps[idx] ? (
            <div className="mt-2 flex items-start gap-2 text-sm" aria-live="polite">
              <Badge
                tone={
                  verdict.kind === 'held' || verdict.kind === 'compmin'
                    ? 'success'
                    : verdict.kind === 'kept-all'
                      ? 'info'
                      : 'warning'
                }
              >
                {verdict.kind === 'held' || verdict.kind === 'compmin' ? 'Held' : 'Archived'}
              </Badge>
              <p>
                <span className="font-mono text-xs">
                  {new Date(steps[idx].event.t).toLocaleTimeString()} value{' '}
                  {fmt(steps[idx].event.v, 3)}
                </span>
                {' — '}
                {verdict.text}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-xs text-fg-muted">
              Walk through the snapshot events one at a time. The ring marks the anchor (the last
              archived event); the shaded wedge is the door the next event is tested against.
            </p>
          )}
        </section>

        <section
          aria-labelledby="cl-presets"
          className="rounded border border-border bg-surface p-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="cl-presets" className="text-sm font-semibold">
              Pitfall presets
            </h2>
            <Link
              to="/learn/exception-and-compression"
              className="inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
            >
              <BookOpen className="size-3.5" aria-hidden /> Lesson: Exception and compression
            </Link>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Button
                key={p.id}
                size="sm"
                variant={presetId === p.id ? 'primary' : 'secondary'}
                aria-pressed={presetId === p.id}
                onClick={() => applyPreset(p)}
              >
                {p.title}
              </Button>
            ))}
          </div>
          {preset ? (
            <div className="mt-3 grid gap-1 text-sm">
              <p>{preset.lesson}</p>
              <p className="text-xs text-fg-muted">
                <strong>Lesson fact:</strong> {preset.fact}{' '}
                <Link to="/learn/exception-and-compression" className="text-primary underline">
                  Read more
                </Link>
              </p>
            </div>
          ) : (
            <p className="mt-2 text-xs text-fg-muted">
              Settings changed by hand. Pick a preset to reload a teaching example.
            </p>
          )}
        </section>
      </div>
    </ToolFrame>
  );
}
