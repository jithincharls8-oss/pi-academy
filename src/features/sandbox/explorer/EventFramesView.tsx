import { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Label, Select } from '@/components/ui/input';
import { plotValues } from '@/core/sim/data';
import { allElements, findPoint } from '@/core/sim/plant';
import { formatPiTime } from '@/core/sim/time';
import { TimeRangeBar, resolveRange, type TimeRange } from '../shared/TimeRangeBar';
import { TrendChart } from '../shared/TrendChart';
import {
  EVENT_FRAME_TEMPLATES,
  eventFrameAttributes,
  formatDuration,
  frameDuration,
  searchEventFrames,
  type EventFrame,
} from './eventFrames';
import { Note, Panel, Prop, selectableRow, Td, Th } from './ui';

export interface EfCriteria {
  range: TimeRange;
  template: string;
  elementName: string;
  name: string;
}

export interface EfSearchResult {
  frames: EventFrame[];
  start: number;
  end: number;
}

export const EF_PRESETS: { label: string; criteria: EfCriteria }[] = [
  {
    label: 'Pump trips, last 30 days',
    criteria: {
      range: { start: '*-30d', end: '*' },
      template: 'Pump Trip',
      elementName: '*',
      name: '*',
    },
  },
  {
    label: 'Compressor trips, last 7 days',
    criteria: {
      range: { start: '*-7d', end: '*' },
      template: 'Compressor Trip',
      elementName: '*',
      name: '*',
    },
  },
  {
    label: 'All trips on P-101, last 30 days',
    criteria: {
      range: { start: '*-30d', end: '*' },
      template: '',
      elementName: 'P-101',
      name: '*',
    },
  },
];

export function runEfSearch(c: EfCriteria, now: number): EfSearchResult | string {
  const r = resolveRange(c.range, now);
  if (typeof r === 'string') return r;
  return {
    frames: searchEventFrames({
      start: r.start,
      end: r.end,
      now,
      template: c.template || null,
      elementName: c.elementName,
      name: c.name,
      elements: allElements(),
    }),
    ...r,
  };
}

export function EventFramesView({
  criteria,
  onCriteria,
  result,
  onSearch,
  now,
}: {
  criteria: EfCriteria;
  onCriteria: (c: EfCriteria) => void;
  result: EfSearchResult | string | null;
  onSearch: () => void;
  now: number;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const frames = result && typeof result !== 'string' ? result.frames : [];
  const frame = frames.find((f) => f.id === selected) ?? null;
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Event Frame Search</h2>
      <Panel title="Search criteria">
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setSelected(null);
            onSearch();
          }}
        >
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium">Overlapping the time range</span>
            <TimeRangeBar
              value={criteria.range}
              onChange={(range) => onCriteria({ ...criteria, range })}
              now={now}
            />
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="ef-template" className="text-xs">
                Template
              </Label>
              <Select
                id="ef-template"
                className="h-8 w-48 text-xs"
                value={criteria.template}
                onChange={(e) => onCriteria({ ...criteria, template: e.target.value })}
              >
                <option value="">All templates</option>
                {EVENT_FRAME_TEMPLATES.map((t) => (
                  <option key={t.name}>{t.name}</option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="ef-element" className="text-xs">
                Element name
              </Label>
              <Input
                id="ef-element"
                className="h-8 w-36 text-xs"
                value={criteria.elementName}
                onChange={(e) => onCriteria({ ...criteria, elementName: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="ef-name" className="text-xs">
                Event frame name
              </Label>
              <Input
                id="ef-name"
                className="h-8 w-56 text-xs"
                value={criteria.name}
                onChange={(e) => onCriteria({ ...criteria, name: e.target.value })}
              />
            </div>
            <Button type="submit" size="sm">
              <Search /> Search
            </Button>
          </div>
          <Note>
            Names accept wildcards (* and ?). Frames come from scanning each unit&apos;s archived
            Status for Tripped periods, as an Event Frame Generation analysis with the start trigger
            &apos;Status&apos; = &quot;Tripped&quot; would.
          </Note>
        </form>
      </Panel>
      {typeof result === 'string' ? (
        <p role="alert" className="text-sm text-tool-alarm-hi">
          {result}
        </p>
      ) : result ? (
        <Panel title={`Results (${frames.length})`}>
          {frames.length ? (
            <div className="max-h-80 overflow-auto rounded border border-border">
              <table role="grid" aria-label="Event frames" className="w-full text-sm">
                <thead className="sticky top-0">
                  <tr>
                    <Th>Name</Th>
                    <Th>Start</Th>
                    <Th>End</Th>
                    <Th>Duration</Th>
                    <Th>Primary element</Th>
                    <Th>Severity</Th>
                  </tr>
                </thead>
                <tbody>
                  {frames.map((f) => (
                    <tr key={f.id} {...selectableRow(selected === f.id, () => setSelected(f.id))}>
                      <Td className="whitespace-nowrap">{f.name}</Td>
                      <Td className="font-mono text-xs whitespace-nowrap">
                        {formatPiTime(f.start)}
                      </Td>
                      <Td className="font-mono text-xs whitespace-nowrap">
                        {f.end ? formatPiTime(f.end) : <Badge tone="warning">In progress</Badge>}
                      </Td>
                      <Td className="font-mono text-xs">{formatDuration(frameDuration(f, now))}</Td>
                      <Td>{f.element.name}</Td>
                      <Td>
                        <Badge tone={f.severity === 'Major' ? 'danger' : 'warning'}>
                          {f.severity}
                        </Badge>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Note>
              No event frames match. Trips are occasional in the simulated plant: widen the time
              range (for example *-30d) or clear the template filter.
            </Note>
          )}
        </Panel>
      ) : null}
      {frame ? <FrameDetails key={frame.id} frame={frame} now={now} /> : null}
    </div>
  );
}

function FrameDetails({ frame, now }: { frame: EventFrame; now: number }) {
  const end = frame.end ?? now;
  const pad = Math.max(30 * 60_000, (end - frame.start) / 2);
  const start = frame.start - pad;
  const stop = Math.min(now, end + pad);
  const tags = ['Status', 'Flow', 'Power']
    .map((n) => frame.element.attributes.find((a) => a.name === n))
    .flatMap((a) => (a?.tag && findPoint(a.tag) ? [{ name: a.name, tag: a.tag, uom: a.uom }] : []));
  const tpl = EVENT_FRAME_TEMPLATES.find((t) => t.name === frame.template);
  return (
    <Panel title={frame.name}>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <dl>
            <Prop label="Template">{frame.template}</Prop>
            <Prop label="Primary element">{frame.element.path}</Prop>
            <Prop label="Start time">{formatPiTime(frame.start)}</Prop>
            <Prop label="End time">
              {frame.end ? formatPiTime(frame.end) : 'In progress (no end time yet)'}
            </Prop>
            <Prop label="Duration">{formatDuration(frameDuration(frame, now))}</Prop>
            <Prop label="Severity">{frame.severity}</Prop>
            <Prop label="Start trigger">
              <code className="font-mono text-xs">{tpl?.startTrigger}</code>
            </Prop>
          </dl>
          <table className="w-full text-sm" aria-label="Event frame attributes">
            <thead>
              <tr>
                <Th>Attribute</Th>
                <Th>Value</Th>
                <Th>Config string</Th>
              </tr>
            </thead>
            <tbody>
              {eventFrameAttributes(frame, now).map((a) => (
                <tr key={a.name} className="border-b border-tool-grid">
                  <Td>{a.name}</Td>
                  <Td className="font-mono whitespace-nowrap">
                    {a.value} {a.uom}
                  </Td>
                  <Td className="font-mono text-xs break-all text-fg-muted">{a.configString}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-2">
          {tags.map((t, i) => (
            <div key={t.tag}>
              <p className="text-xs text-fg-muted">
                {frame.element.name}|{t.name} {t.uom ? `(${t.uom})` : '(state code)'}
              </p>
              <TrendChart
                series={[
                  {
                    key: 'v',
                    label: t.name,
                    points: plotValues(t.tag, start, stop, 200),
                    step: t.name === 'Status',
                    color: `var(--chart-${i + 1})`,
                  },
                ]}
                start={start}
                end={stop}
                height={140}
                ariaLabel={`${t.name} around the event frame`}
              />
            </div>
          ))}
          <Note>
            Trends show the event frame with a margin either side: the {frame.element.name} Status
            steps to code 2 (Tripped) for the duration.
          </Note>
        </div>
      </div>
    </Panel>
  );
}
