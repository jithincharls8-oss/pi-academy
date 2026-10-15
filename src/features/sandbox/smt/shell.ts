/**
 * The sandbox command prompt in %PISERVER%\adm: piconfig (see piconfig.ts), piartool and
 * pidiag -e. Pure functions; the console component keeps the session.
 *
 * The piartool options and their purpose are from research (-ss snapshot, -qs event queue,
 * -as archive statistics, -al archive list, -lic usage). Research does not record the real
 * output layout, so every piartool printout starts with a "simplified output" header line.
 */
import type { ArchiveModel, ServerStats } from './server';
import { ERROR_CODES, LICENSE } from './server';
import { formatStamp } from './points';

export const PROMPT = 'D:\\PI\\adm>';
export const SIMPLIFIED =
  '[Sandbox: simplified output. The counters are real concepts; the layout is not the real tool layout.]';

export interface ShellContext {
  stats: ServerStats;
  archives: ArchiveModel;
}

export type ShellResult =
  { kind: 'output'; lines: string[] } | { kind: 'clear' } | { kind: 'piconfig'; lines: string[] };

function n(v: number): string {
  return Math.round(v).toLocaleString('en-US');
}

function row(label: string, value: string | number): string {
  return `  ${label.padEnd(34, ' ')}${typeof value === 'number' ? n(value) : value}`;
}

export function snapshotStats(s: ServerStats): string[] {
  return [
    SIMPLIFIED,
    `PI Snapshot Statistics  ${formatStamp(s.sampledAt)}  (the real tool repeats every 5 s until Ctrl+C)`,
    row('Point Count', s.pointCount),
    row('Snapshot Events', s.snapshotEvents),
    row('Out of Order Snapshot Events', s.outOfOrderSnapshots),
    row('Events Sent to Queue', s.eventsSentToQueue),
    row('Events in Queue', s.eventsInQueue),
    row('Snapshots/sec', s.snapshotsPerSec.toFixed(2)),
    row('Compression ratio (snapshot:archive)', `${s.compressionRatio.toFixed(1)}:1`),
  ];
}

export function queueStats(s: ServerStats): string[] {
  return [
    SIMPLIFIED,
    `PI Event Queue Statistics  ${formatStamp(s.sampledAt)}  (the real tool repeats every 5 s until Ctrl+C)`,
    row('Event queue file', 'E:\\PI\\queue\\pimq0000.dat'),
    row('Number of queue files', 1),
    row('Total Event Writes', s.queueWrites),
    row('Total Event Reads', s.queueReads),
    row('Events in Queue', s.eventsInQueue),
    row('Events in Overflow Queues', s.overflowQueueEvents),
    '  Reads and writes rising together means the archive subsystem is keeping up.',
  ];
}

export function archiveStats(s: ServerStats): string[] {
  return [
    SIMPLIFIED,
    `PI Archive Statistics  ${formatStamp(s.sampledAt)}  (the real tool repeats every 5 s until Ctrl+C)`,
    row('Archiving Flag', '3 (historic and future; healthy on 2015 and later)'),
    row('Archived Events', s.archivedEvents),
    row('Archived Events/sec', s.archivedPerSec.toFixed(2)),
    row('Out of Order Events', s.archiveOutOfOrder),
    row('Total Unflushed Events', s.unflushedEvents),
    row('Seconds since last flush', s.secondsSinceFlush),
    row('Cache Flush Operations/sec', s.cacheFlushesPerSec.toFixed(4)),
    row('Events Read/sec', s.eventsReadPerSec),
  ];
}

export function archiveList(a: ArchiveModel, now: number): string[] {
  const out = [SIMPLIFIED, `Archive list  ${formatStamp(now)}`];
  for (const f of a.archives) {
    out.push(`  [${f.index}] ${f.path}`);
    out.push(
      `       Start: ${formatStamp(f.start)}   End: ${f.end === null ? 'Current Time' : formatStamp(f.end)}   ${f.state}, ${f.type}, ${f.sizeMB} MB, ${f.usedPct.toFixed(1)}% used`,
    );
  }
  if (a.hiddenOlder) out.push(`  (${a.hiddenOlder} older archives not listed in the sandbox)`);
  out.push(
    `  Shift progress: next archive shift expected about ${formatStamp(a.nextShift)} (sandbox estimate)`,
  );
  return out;
}

export function licenseUsage(): string[] {
  return [
    SIMPLIFIED,
    'License usage (PI License Manager, pilicmgr)',
    row('Licensed point count', LICENSE.pointLimit),
    row('Points in use', LICENSE.pointsInUse),
    row('Points available', LICENSE.pointLimit - LICENSE.pointsInUse),
    ...LICENSE.applications.map((x) => row(x.name, 'licensed')),
  ];
}

export const SHELL_HELP = [
  'Sandbox commands:',
  '  piconfig              start piconfig (PIPOINT table; @exit, @quit or @bye to leave)',
  '  piartool -ss          snapshot statistics',
  '  piartool -qs          event queue statistics',
  '  piartool -as          archive statistics',
  '  piartool -al          list archives and shift progress',
  '  piartool -lic usage   licence usage',
  '  pidiag -e <code>      translate an error code, e.g. pidiag -e -11091',
  '  cls                   clear the screen',
  '  help                  this list',
];

export function runShell(line: string, ctx: ShellContext): ShellResult {
  const words = line.trim().split(/\s+/).filter(Boolean);
  const cmd = (words[0] ?? '').toLowerCase().replace(/\.exe$/, '');
  const args = words.slice(1).map((w) => w.toLowerCase());
  if (!cmd) return { kind: 'output', lines: [] };
  switch (cmd) {
    case 'help':
    case '?':
      return { kind: 'output', lines: SHELL_HELP };
    case 'cls':
    case 'clear':
      return { kind: 'clear' };
    case 'piconfig':
      return {
        kind: 'piconfig',
        lines: [
          'Sandbox piconfig: PIPOINT table only. Commands start with @, comments with *.',
          'Try: @table pipoint / @mode list / @ostr tag,descriptor,compdev / @select tag=RB.P10* / @ends',
        ],
      };
    case 'piartool': {
      const opt = args[0];
      if (opt === '-ss') return { kind: 'output', lines: snapshotStats(ctx.stats) };
      if (opt === '-qs') return { kind: 'output', lines: queueStats(ctx.stats) };
      if (opt === '-as') return { kind: 'output', lines: archiveStats(ctx.stats) };
      if (opt === '-al')
        return { kind: 'output', lines: archiveList(ctx.archives, ctx.stats.sampledAt) };
      if (opt === '-lic') {
        if (args[1] === 'usage') return { kind: 'output', lines: licenseUsage() };
        return {
          kind: 'output',
          lines: ['Only "piartool -lic usage" is available in the sandbox.'],
        };
      }
      return {
        kind: 'output',
        lines: [
          `piartool option "${opt ?? ''}" is not available in the sandbox.`,
          ...SHELL_HELP.slice(2, 7),
        ],
      };
    }
    case 'pidiag': {
      if (args[0] === '-e' && args[1]) {
        const code =
          args[1].startsWith('-') || args[1].startsWith('[')
            ? args[1].replace(/[[\]]/g, '')
            : `-${args[1]}`;
        const meaning = ERROR_CODES[code];
        return {
          kind: 'output',
          lines: [
            meaning
              ? `[${code}] ${meaning}`
              : `[${code}] not in the sandbox's list of researched error codes`,
          ],
        };
      }
      return { kind: 'output', lines: ['Only "pidiag -e <code>" is available in the sandbox.'] };
    }
    default:
      return {
        kind: 'output',
        lines: [
          `'${words[0]}' is not recognized in this sandbox. Type help for the list of commands.`,
        ],
      };
  }
}
