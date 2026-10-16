import { useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { formatValue, snapshot } from '@/core/sim/data';
import { DIGITAL_SETS } from '@/core/sim/plant';
import { formatStamp, wildcardMatch, type SandboxPoint } from './points';
import { Grid, Note, Td, Th, ToolHeader, fieldClass, smallButton } from './ui';
import { cn } from '@/lib/cn';

function matchesQuery(p: SandboxPoint, q: string): boolean {
  const s = q.trim();
  if (!s) return true;
  if (/[*?]/.test(s)) return wildcardMatch(s, p.tag);
  return (
    p.tag.toLowerCase().includes(s.toLowerCase()) ||
    p.descriptor.toLowerCase().includes(s.toLowerCase())
  );
}

function display(p: SandboxPoint, v: number): string {
  return formatValue(p, v);
}

/* ------------------------------------------------------------ Current Values */

export function CurrentValues({
  points,
  now,
  paused,
  setPaused,
}: {
  points: readonly SandboxPoint[];
  now: number;
  paused: boolean;
  setPaused: (p: boolean) => void;
}) {
  const [query, setQuery] = useState('RB.*');
  const rows = points.filter((p) => matchesQuery(p, query));
  return (
    <div>
      <ToolHeader
        title="Current Values"
        actions={
          <button
            type="button"
            className={smallButton}
            onClick={() => setPaused(!paused)}
            aria-pressed={!paused}
          >
            {paused ? <Play aria-hidden /> : <Pause aria-hidden />}{' '}
            {paused ? 'Resume auto refresh' : 'Pause auto refresh'}
          </button>
        }
      >
        Snapshot values: the latest event for each point, before compression decides whether it is
        archived. Refreshes every 5 seconds.
      </ToolHeader>
      <div className="mb-2 flex items-center gap-2">
        <label htmlFor="cv-search" className="text-xs font-medium">
          Tag mask
        </label>
        <input
          id="cv-search"
          className={cn(fieldClass, 'max-w-xs font-mono')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="RB.P101*"
        />
        <span className="text-xs text-fg-muted" aria-live="polite">
          {rows.length} points · {paused ? 'paused' : 'live'} · {formatStamp(now)}
        </span>
      </div>
      <Grid caption="Current values" className="max-h-[34rem]">
        <thead>
          <tr>
            <Th>Tag</Th>
            <Th className="text-right">Value</Th>
            <Th>Units</Th>
            <Th>Timestamp</Th>
            <Th>Descriptor</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const snap = snapshot(p, now);
            return (
              <tr key={p.tag} className="hover:bg-surface-2">
                <Td mono>{p.tag}</Td>
                <Td mono className="text-right">
                  {p.scanflag ? (
                    display(p, snap.v)
                  ) : (
                    <span className="text-fg-muted italic">Scan off</span>
                  )}
                </Td>
                <Td>{p.engunits}</Td>
                <Td mono>{formatStamp(snap.t)}</Td>
                <Td className="text-fg-muted">{p.descriptor}</Td>
              </tr>
            );
          })}
        </tbody>
      </Grid>
    </div>
  );
}

/* ------------------------------------------------------------ Digital States */

export function DigitalStates() {
  const [selected, setSelected] = useState(DIGITAL_SETS[0]?.name ?? '');
  const set = DIGITAL_SETS.find((d) => d.name === selected);
  return (
    <div>
      <ToolHeader title="Digital States">
        Digital state sets map a digital point&apos;s stored integers to state names. The PI Base
        Subsystem keeps the Digital State Table.
      </ToolHeader>
      <div className="grid gap-4 md:grid-cols-[14rem_1fr]">
        <div>
          <h3 className="mb-1 text-xs font-medium text-fg-muted">State sets</h3>
          <ul className="space-y-1 text-sm" aria-label="Digital state sets">
            {[...DIGITAL_SETS.map((d) => d.name), 'SYSTEM'].map((n) => (
              <li key={n}>
                <button
                  type="button"
                  aria-current={n === selected ? 'true' : undefined}
                  onClick={() => setSelected(n)}
                  className={cn(
                    'w-full rounded px-2 py-1 text-left',
                    n === selected ? 'bg-tool-select' : 'hover:bg-surface-2',
                  )}
                >
                  {n}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-3">
          {set ? (
            <Grid caption={`States in ${set.name}`}>
              <thead>
                <tr>
                  <Th>Code</Th>
                  <Th>State</Th>
                </tr>
              </thead>
              <tbody>
                {set.states.map((s, i) => (
                  <tr key={s}>
                    <Td mono>{i}</Td>
                    <Td>{s}</Td>
                  </tr>
                ))}
              </tbody>
            </Grid>
          ) : (
            <>
              <Grid caption="Some SYSTEM states">
                <thead>
                  <tr>
                    <Th>State</Th>
                    <Th>Meaning</Th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <Td>Shutdown</Td>
                    <Td>Written when the server shuts down, for points with Shutdown on.</Td>
                  </tr>
                  <tr>
                    <Td>Intf Shut</Td>
                    <Td>The interface was shut down.</Td>
                  </tr>
                  <tr>
                    <Td>I/O Timeout</Td>
                    <Td>The interface lost communication with the source.</Td>
                  </tr>
                </tbody>
              </Grid>
              <Note>
                SYSTEM is the global set every point can use. Only three of its states are confirmed
                in the research notes, so the sandbox lists those and no codes.
              </Note>
            </>
          )}
          <Note tone="warn">
            Only append new states to a set. Never renumber an existing state: archive records store
            the set ID, so history would be read with the wrong names until archives are
            reprocessed.
          </Note>
        </div>
      </div>
    </div>
  );
}
