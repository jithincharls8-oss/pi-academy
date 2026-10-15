/**
 * The simulated PISRV01 Data Archive behind the SMT mockup: archive files, snapshot and archive
 * counters, message log, tuning parameters, security and licensing. All pure functions of the
 * sandbox state and the clock, so the same moment always gives the same picture.
 *
 * Names and numbers come from research/da.md, research/dev2.md and research/adm.md where those
 * notes have them. Where research has no real figure, a value is marked as a sandbox value.
 */
import { applyCompression, applyException } from '@/core/sim/compression';
import { scans } from '@/core/sim/data';
import { hashString } from '@/core/random/prng';
import type { SandboxPoint } from './points';
import { formatStamp } from './points';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/* ------------------------------------------------------------ server profile */

/** The fictional server's sizing inputs (sandbox values, used with the research sizing rules). */
export const SERVER_PROFILE = {
  name: 'PISRV01',
  ramMB: 16_384,
  licensedPoints: 50_000,
  /** points in use on the whole server; the Riverbend points are a modelled sample of them */
  pointsInUse: 5_000,
  /** research gives 5-20 bytes per archived event; the sandbox uses 12 */
  bytesPerEvent: 12,
  cores: 8,
} as const;

/**
 * Archive file size from the sizing guideline: the smaller of RAM/3 and 3 x licensed points /
 * 1024 MB, rounded down to a power of 2, at least 256 MB and at most 10,240 MB.
 */
export function recommendedArchiveSizeMB(
  ramMB: number,
  licensedPoints: number,
): {
  byRam: number;
  byPoints: number;
  chosen: number;
} {
  const byRam = ramMB / 3;
  const byPoints = (3 * licensedPoints) / 1024;
  const smaller = Math.min(byRam, byPoints);
  const pow2 = smaller >= 1 ? 2 ** Math.floor(Math.log2(smaller)) : 0;
  return { byRam, byPoints, chosen: Math.min(10_240, Math.max(256, pow2)) };
}

/* ------------------------------------------------------------ point rates */

export interface PointRates {
  tag: string;
  scansPerHour: number;
  snapshotPerHour: number;
  archivedPerHour: number;
}

const rateCache = new Map<string, PointRates>();

function rateKey(p: SandboxPoint, hourBucket: number): string {
  return [
    p.tag,
    hourBucket,
    p.scan,
    p.excdev,
    p.excmin,
    p.excmax,
    p.compressing,
    p.compdev,
    p.compmin,
    p.compmax,
    p.pointtype,
    p.archiving,
    p.scanflag,
  ].join('|');
}

/** Scan, snapshot and archive events per hour for a point, measured over the last full hour. */
export function pointRates(p: SandboxPoint, now: number): PointRates {
  const bucket = Math.floor(now / HOUR);
  const key = rateKey(p, bucket);
  const hit = rateCache.get(key);
  if (hit) return hit;
  const end = bucket * HOUR;
  const raw = p.scanflag ? scans(p, end - HOUR, end) : [];
  const snap = applyException(raw, { excDev: p.excdev, excMin: p.excmin, excMax: p.excmax });
  const arch = p.archiving
    ? applyCompression(snap, {
        compressing: p.compressing,
        compDev: p.compdev,
        compMin: p.compmin,
        compMax: p.compmax,
      }).archived
    : [];
  const out = {
    tag: p.tag,
    scansPerHour: raw.length,
    snapshotPerHour: snap.length,
    archivedPerHour: arch.length,
  };
  if (rateCache.size > 2000) rateCache.clear();
  rateCache.set(key, out);
  return out;
}

/* ------------------------------------------------------------ statistics */

export interface ServerStats {
  sampledAt: number;
  startedAt: number;
  pointCount: number;
  snapshotsPerSec: number;
  archivedPerSec: number;
  snapshotEvents: number;
  outOfOrderSnapshots: number;
  eventsSentToQueue: number;
  eventsInQueue: number;
  queueReads: number;
  queueWrites: number;
  archivedEvents: number;
  archiveOutOfOrder: number;
  unflushedEvents: number;
  secondsSinceFlush: number;
  cacheFlushesPerSec: number;
  eventsReadPerSec: number;
  overflowQueueEvents: number;
  compressionRatio: number;
  rates: PointRates[];
}

/** The snapshot subsystem last started six days before today's midnight (sandbox narrative). */
export function serverStart(now: number): number {
  return Math.floor(now / DAY) * DAY - 6 * DAY + 4 * HOUR + 12 * 60_000;
}

export function serverStats(
  points: readonly SandboxPoint[],
  now: number,
  opts: { secondsBetweenFlush: number; outOfOrderEdits: number },
): ServerStats {
  const startedAt = serverStart(now);
  const rates = points.map((p) => pointRates(p, now));
  const snapPerHour = rates.reduce((a, r) => a + r.snapshotPerHour, 0);
  const archPerHour = rates.reduce((a, r) => a + r.archivedPerHour, 0);
  const elapsedS = Math.max(1, (now - startedAt) / 1000);
  const snapshotsPerSec = snapPerHour / 3600;
  const archivedPerSec = archPerHour / 3600;
  const snapshotEvents = Math.round(snapshotsPerSec * elapsedS);
  const tick = Math.floor(now / 5000);
  const eventsInQueue = hashString(`queue|${tick}`) % 12;
  const archivedEvents = Math.round(archivedPerSec * elapsedS) + opts.outOfOrderEdits;
  const flush = Math.max(1, opts.secondsBetweenFlush);
  const secondsSinceFlush = Math.floor(elapsedS % flush);
  const queueWrites = Math.round(archivedPerSec * elapsedS) + opts.outOfOrderEdits;
  return {
    sampledAt: now,
    startedAt,
    pointCount: points.length,
    snapshotsPerSec,
    archivedPerSec,
    snapshotEvents,
    outOfOrderSnapshots: opts.outOfOrderEdits,
    eventsSentToQueue: queueWrites,
    eventsInQueue,
    queueReads: Math.max(0, queueWrites - eventsInQueue),
    queueWrites,
    archivedEvents,
    archiveOutOfOrder: opts.outOfOrderEdits,
    unflushedEvents: Math.round(archivedPerSec * secondsSinceFlush),
    secondsSinceFlush,
    cacheFlushesPerSec: 1 / flush,
    eventsReadPerSec: Math.round(40 + (hashString(`reads|${tick}`) % 160)),
    overflowQueueEvents: 0,
    compressionRatio: archPerHour > 0 ? snapPerHour / archPerHour : 0,
    rates,
  };
}

/* ------------------------------------------------------------ archives */

export interface ArchiveShift {
  t: number;
  /** size of the primary archive the shift created */
  sizeMB: number;
}

export interface ArchiveFile {
  index: number;
  path: string;
  start: number;
  /** null for the primary archive ("Current Time") */
  end: number | null;
  sizeMB: number;
  usedPct: number;
  events: number;
  type: 'Fixed' | 'Dynamic';
  state: 'Primary' | 'Historic';
  registered: boolean;
  forced: boolean;
}

export interface ArchiveModel {
  archives: ArchiveFile[];
  fillBytesPerSec: number;
  fileDurationMs: number;
  nextShift: number;
  hiddenOlder: number;
}

export const HISTORIC_SHOWN = 20;

function archiveDuration(sizeMB: number, bytesPerSec: number): number {
  return ((sizeMB * 1024 * 1024 * 0.98) / Math.max(1, bytesPerSec)) * 1000;
}

function archivePath(root: string, start: number): string {
  return `${root}${formatStamp(start).replace(' ', '_').replace(/:/g, '-')}.arc`;
}

/**
 * Server-wide archive fill rate in bytes per second: the Riverbend points' average archived
 * events per point x points in use x bytes per event.
 */
export function fillRate(points: readonly SandboxPoint[], at: number): number {
  const rates = points.map((p) => pointRates(p, at));
  const perPointPerHour = rates.length
    ? rates.reduce((a, r) => a + r.archivedPerHour, 0) / rates.length
    : 0;
  return (perPointPerHour / 3600) * SERVER_PROFILE.pointsInUse * SERVER_PROFILE.bytesPerEvent;
}

/** Time a fixed archive of `sizeMB` takes to reach about 98% at a fill rate. */
export function archiveLifetimeMs(sizeMB: number, bytesPerSec: number): number {
  return archiveDuration(sizeMB, bytesPerSec);
}

export function archiveModel(opts: {
  now: number;
  fillBytesPerSec: number;
  shifts: readonly ArchiveShift[];
  baseSizeMB: number;
  root: string;
}): ArchiveModel {
  const { now, fillBytesPerSec, shifts, baseSizeMB, root } = opts;
  const baseDur = archiveDuration(baseSizeMB, fillBytesPerSec);
  // Anchor the history on a fixed grid so it does not jump as the clock ticks.
  const firstShift = shifts[0]?.t ?? now;
  const anchor =
    Math.floor(Math.min(firstShift, now) / baseDur) * baseDur - (HISTORIC_SHOWN + 4) * baseDur;

  const files: Omit<ArchiveFile, 'index'>[] = [];
  let t = anchor;
  let size = baseSizeMB;
  let forced = false;
  const pending = [...shifts].sort((a, b) => a.t - b.t);
  for (let guard = 0; guard < 10_000; guard++) {
    const natural = t + archiveDuration(size, fillBytesPerSec);
    const next = pending[0];
    if (next && next.t <= now && next.t < natural) {
      files.push(historic(t, next.t, size, true));
      t = next.t;
      size = next.sizeMB;
      forced = true;
      pending.shift();
      continue;
    }
    if (natural <= now) {
      files.push(historic(t, natural, size, false));
      t = natural;
      forced = false;
      continue;
    }
    const used = Math.min(98, ((now - t) / archiveDuration(size, fillBytesPerSec)) * 98);
    files.push({
      path: archivePath(root, t),
      start: t,
      end: null,
      sizeMB: size,
      usedPct: used,
      events: Math.round(((used / 100) * size * 1024 * 1024) / SERVER_PROFILE.bytesPerEvent),
      type: 'Fixed',
      state: 'Primary',
      registered: true,
      forced,
    });
    break;
  }

  function historic(
    start: number,
    end: number,
    sizeMB: number,
    wasForced: boolean,
  ): Omit<ArchiveFile, 'index'> {
    const full = archiveDuration(sizeMB, fillBytesPerSec);
    const used = Math.min(98, ((end - start) / full) * 98);
    return {
      path: archivePath(root, start),
      start,
      end,
      sizeMB,
      usedPct: used,
      events: Math.round(((used / 100) * sizeMB * 1024 * 1024) / SERVER_PROFILE.bytesPerEvent),
      type: 'Fixed',
      state: 'Historic',
      registered: true,
      forced: wasForced,
    };
  }

  /* Archive files: a new primary is initialised when the current one is about 98% full. */
  const primary = files[files.length - 1] as Omit<ArchiveFile, 'index'>;
  const shown = files.slice(-(HISTORIC_SHOWN + 1));
  const archives = shown.reverse().map((f, i) => ({ ...f, index: i }));
  return {
    archives,
    fillBytesPerSec,
    fileDurationMs: baseDur,
    nextShift: primary.start + archiveDuration(primary.sizeMB, fillBytesPerSec),
    hiddenOlder: files.length - shown.length,
  };
}

/* ------------------------------------------------------------ message log */

export type Severity = 'Debug' | 'Informational' | 'Warning' | 'Error' | 'Critical';
export const SEVERITIES: readonly Severity[] = [
  'Debug',
  'Informational',
  'Warning',
  'Error',
  'Critical',
];

export interface LogEntry {
  id: string;
  t: number;
  severity: Severity;
  /** process name, e.g. pibasess */
  program: string;
  source: string;
  message: string;
  /** message ID, only where research confirms one */
  messageId: string;
}

/** Client connections seen by pinetmgr (fictional hosts and service accounts). */
const CLIENTS = [
  {
    app: 'PI Vision',
    host: 'PIVISION01',
    account: 'RIVERBEND\\SVC-PIVISION$',
    identity: 'PIOperators',
  },
  {
    app: 'PI Analysis Service',
    host: 'AFSRV01',
    account: 'RIVERBEND\\SVC-PIANALYSIS$',
    identity: 'PI Analysis',
  },
  { app: 'pibufss', host: 'PIINT01', account: 'RIVERBEND\\SVC-PIBUFFER$', identity: 'PI Buffer' },
  { app: 'PI DataLink', host: 'ENG-WS07', account: 'RIVERBEND\\a.patel', identity: 'PIEngineers' },
  {
    app: 'PI System Explorer',
    host: 'ENG-WS03',
    account: 'RIVERBEND\\m.okafor',
    identity: 'PIEngineers',
  },
];

/** Generated system messages in a time range (deterministic per hour). */
export function systemMessages(
  start: number,
  end: number,
  archives: readonly ArchiveFile[],
): LogEntry[] {
  const out: LogEntry[] = [];
  const firstHour = Math.floor(start / HOUR);
  const lastHour = Math.floor(end / HOUR);
  for (let h = Math.max(firstHour, lastHour - 24 * 40); h <= lastHour; h++) {
    const base = h * HOUR;
    CLIENTS.forEach((c, i) => {
      const r = hashString(`conn|${c.app}|${h}`);
      if (r % 5 < 2) {
        const t = base + (r % 3_500_000);
        out.push({
          id: `c${h}-${i}`,
          t,
          severity: 'Informational',
          program: 'pinetmgr',
          source: c.host,
          message: `New PI connection: application "${c.app}", host ${c.host}, user ${c.account}, Identity List: ${c.identity}`,
          messageId: '',
        });
        if (r % 7 === 0) {
          out.push({
            id: `d${h}-${i}`,
            t: t + 600_000 + (r % 900_000),
            severity: 'Informational',
            program: 'pinetmgr',
            source: c.host,
            message: `Connection to "${c.app}" on ${c.host} closed by the client`,
            messageId: '',
          });
        }
      }
    });
    const q = hashString(`arcmax|${h}`);
    if (q % 41 === 0) {
      out.push({
        id: `q${h}`,
        t: base + (q % 3_000_000),
        severity: 'Warning',
        program: 'piarchss',
        source: 'ENG-WS07',
        message:
          '[-11091] Event collection exceeded the maximum allowed. Query from PI DataLink for RB.B100.FUEL.FLOW, *-400d to *',
        messageId: '-11091',
      });
    }
    if (q % 53 === 1) {
      out.push({
        id: `x${h}`,
        t: base + (q % 2_500_000),
        severity: 'Warning',
        program: 'piarchss',
        source: 'PIVISION01',
        message: '[-11140] Archive query exceeded maximum execution time',
        messageId: '-11140',
      });
    }
    if (h % 24 === 3) {
      out.push({
        id: `l${h}`,
        t: base + 120_000,
        severity: 'Informational',
        program: 'pilicmgr',
        source: 'PISRV01',
        message: `License check: ${SERVER_PROFILE.pointsInUse.toLocaleString('en-US')} of ${SERVER_PROFILE.licensedPoints.toLocaleString('en-US')} licensed points in use`,
        messageId: '',
      });
    }
    if (h % 24 === 1) {
      out.push({
        id: `b${h}`,
        t: base + 300_000,
        severity: 'Informational',
        program: 'pibackup',
        source: 'PISRV01',
        message: 'Scheduled backup completed (incremental, local backup folder)',
        messageId: '',
      });
    }
    if (h % 6 === 0) {
      out.push({
        id: `g${h}`,
        t: base + 45_000,
        severity: 'Debug',
        program: 'piarchss',
        source: 'PISRV01',
        message: 'Archive write cache flushed',
        messageId: '',
      });
    }
  }
  for (const a of archives) {
    if (a.state === 'Historic' && a.end !== null && a.end >= start && a.end <= end) {
      out.push({
        id: `s${a.end}`,
        t: a.end,
        severity: 'Informational',
        program: 'piarchss',
        source: 'PISRV01',
        message: `${a.forced ? 'Forced archive shift' : 'Archive shift'}: primary archive is now the file created at ${formatStamp(a.end)}; ${a.path} is now historic`,
        messageId: '',
      });
    }
  }
  return out.filter((e) => e.t >= start && e.t <= end);
}

export interface LogFilter {
  start: number;
  end: number;
  minSeverity: Severity;
  text: string;
  program: string;
}

/** Filter like pigetmsg: minimum severity, time window, and a *wildcard* message filter. */
export function filterMessages(entries: readonly LogEntry[], f: LogFilter): LogEntry[] {
  const min = SEVERITIES.indexOf(f.minSeverity);
  const pattern = f.text.trim();
  const re = pattern
    ? new RegExp(
        pattern
          .replace(/[.+^${}()|[\]\\]/g, '\\$&')
          .replace(/\*/g, '.*')
          .replace(/\?/g, '.'),
        'i',
      )
    : null;
  return entries
    .filter(
      (e) =>
        e.t >= f.start &&
        e.t <= f.end &&
        SEVERITIES.indexOf(e.severity) >= min &&
        (!f.program || e.program === f.program) &&
        (!re || re.test(e.message) || re.test(e.source)),
    )
    .sort((a, b) => b.t - a.t);
}

/* ------------------------------------------------------------ tuning parameters */

export interface TuningParameter {
  name: string;
  group: 'Archive' | 'Snapshot' | 'Base' | 'Network' | 'Message';
  value: string;
  /** default stated in research, or null when research has none */
  researchDefault: string | null;
  description: string;
  subsystem: string;
  numeric: boolean;
}

export const TUNING_PARAMETERS: readonly TuningParameter[] = [
  {
    name: 'Archive_SecondsBetweenFlush',
    group: 'Archive',
    value: '300',
    researchDefault: '300 (5 minutes)',
    description: 'How often the archive write cache is flushed to the archive files, in seconds.',
    subsystem: 'PI Archive Subsystem',
    numeric: true,
  },
  {
    name: 'ArcMaxCollect',
    group: 'Archive',
    value: '1500000',
    researchDefault: '1.5 million',
    description: 'Maximum compressed events one query may return. Hitting it logs [-11091].',
    subsystem: 'PI Archive Subsystem',
    numeric: true,
  },
  {
    name: 'Archive_MaxQueryExecutionSec',
    group: 'Archive',
    value: '260',
    researchDefault: '260',
    description: 'Maximum run time of one archive query, in seconds. Exceeding it logs [-11140].',
    subsystem: 'PI Archive Subsystem',
    numeric: true,
  },
  {
    name: 'piarchss_ThreadCount',
    group: 'Archive',
    value: String(SERVER_PROFILE.cores - 1),
    researchDefault: null,
    description: 'Concurrent archive RPC threads. 2023 guidance: cores minus 1 for standard use.',
    subsystem: 'PI Archive Subsystem',
    numeric: true,
  },
  {
    name: 'Archive_ReprocessThreadCount',
    group: 'Archive',
    value: '1',
    researchDefault: null,
    description:
      'Threads used when reprocessing archives. 2023 guidance: 1 for 2018 SP2 and later.',
    subsystem: 'PI Archive Subsystem',
    numeric: true,
  },
  {
    name: 'Archive_AutoArchiveFileRoot',
    group: 'Archive',
    value: 'D:\\PI\\arc\\PISRV01_',
    researchDefault: null,
    description:
      'Location and name root of auto-created archives. Clearing it disables automatic creation.',
    subsystem: 'PI Archive Subsystem',
    numeric: false,
  },
  {
    name: 'Archive_AutoArchiveFileSize',
    group: 'Archive',
    value: '256',
    researchDefault: null,
    description: 'Size in MB of the next auto-created primary archive.',
    subsystem: 'PI Archive Subsystem',
    numeric: true,
  },
  {
    name: 'Archive_LowDiskSpaceMB',
    group: 'Archive',
    value: '2048',
    researchDefault: null,
    description: 'Low disk space threshold, in MB (sandbox value).',
    subsystem: 'PI Archive Subsystem',
    numeric: true,
  },
  {
    name: 'Snapshot_EventQueuePath',
    group: 'Snapshot',
    value: 'E:\\PI\\queue\\',
    researchDefault: null,
    description:
      'Where the event queue (pimq0000.dat) lives. Keep it on a different volume from the archives.',
    subsystem: 'PI Snapshot Subsystem',
    numeric: false,
  },
  {
    name: 'Snapshot_EventQueueSize',
    group: 'Snapshot',
    value: '64',
    researchDefault: null,
    description: 'Event queue file size in MB (a 2012 benchmark called 64 MB the default; verify).',
    subsystem: 'PI Snapshot Subsystem',
    numeric: true,
  },
  {
    name: 'EnableAudit',
    group: 'Base',
    value: '0',
    researchDefault: null,
    description: 'Turns auditing on (1) or off (0).',
    subsystem: 'PI Base Subsystem',
    numeric: true,
  },
  {
    name: 'AutoTrustConfig',
    group: 'Network',
    value: '0',
    researchDefault: null,
    description: 'Automatic trust configuration. 2010 guidance recommends 0.',
    subsystem: 'PI Network Manager',
    numeric: true,
  },
  {
    name: 'MaxConnIdleTime',
    group: 'Network',
    value: '7200',
    researchDefault: null,
    description: 'Seconds an idle connection may stay open (sandbox value).',
    subsystem: 'PI Network Manager',
    numeric: true,
  },
  {
    name: 'MessageLog_DayLimit',
    group: 'Message',
    value: '35',
    researchDefault: '35 days',
    description: 'How many days of message logs are kept.',
    subsystem: 'PI Message Subsystem',
    numeric: true,
  },
];

export function tuningValue(overrides: Readonly<Record<string, string>>, name: string): string {
  return overrides[name] ?? TUNING_PARAMETERS.find((p) => p.name === name)?.value ?? '';
}

/* ------------------------------------------------------------ security */

export interface Identity {
  name: string;
  description: string;
  enabled: boolean;
  builtIn: boolean;
  canDelete: boolean;
}

export const IDENTITIES: readonly Identity[] = [
  {
    name: 'piadmins',
    description: 'Administrators. Map admin AD groups here instead of using piadmin.',
    enabled: true,
    builtIn: true,
    canDelete: false,
  },
  {
    name: 'PIWorld',
    description:
      'Everyone. Disabled here, as hardening guidance recommends once mappings are in place.',
    enabled: false,
    builtIn: true,
    canDelete: false,
  },
  {
    name: 'PIOperators',
    description: 'Control room operators: read process data.',
    enabled: true,
    builtIn: false,
    canDelete: true,
  },
  {
    name: 'PIEngineers',
    description: 'Process engineers: read data, edit point configuration.',
    enabled: true,
    builtIn: false,
    canDelete: true,
  },
  {
    name: 'PISupervisors',
    description: 'Shift supervisors: read data.',
    enabled: true,
    builtIn: false,
    canDelete: true,
  },
  {
    name: 'PI Interfaces',
    description: 'Interface service accounts: read PIPOINT and point security.',
    enabled: true,
    builtIn: false,
    canDelete: true,
  },
  {
    name: 'PI Buffer',
    description: 'PI Buffer Subsystem: write on DataSecurity.',
    enabled: true,
    builtIn: false,
    canDelete: true,
  },
  {
    name: 'PI Analysis',
    description: 'AF analysis service: writes analysis output points.',
    enabled: true,
    builtIn: false,
    canDelete: true,
  },
];

export interface Mapping {
  name: string;
  principal: string;
  type: 'AD group' | 'gMSA' | 'AD user';
  identity: string;
}

export const MAPPINGS: readonly Mapping[] = [
  { name: 'PI Admins', principal: 'RIVERBEND\\PI-Admins', type: 'AD group', identity: 'piadmins' },
  {
    name: 'Engineers',
    principal: 'RIVERBEND\\PI-Engineers',
    type: 'AD group',
    identity: 'PIEngineers',
  },
  {
    name: 'Operators',
    principal: 'RIVERBEND\\PI-Operators',
    type: 'AD group',
    identity: 'PIOperators',
  },
  {
    name: 'Supervisors',
    principal: 'RIVERBEND\\PI-Supervisors',
    type: 'AD group',
    identity: 'PISupervisors',
  },
  {
    name: 'Interface service',
    principal: 'RIVERBEND\\SVC-PIINT$',
    type: 'gMSA',
    identity: 'PI Interfaces',
  },
  {
    name: 'Buffer service',
    principal: 'RIVERBEND\\SVC-PIBUFFER$',
    type: 'gMSA',
    identity: 'PI Buffer',
  },
  {
    name: 'Analysis service',
    principal: 'RIVERBEND\\SVC-PIANALYSIS$',
    type: 'gMSA',
    identity: 'PI Analysis',
  },
  {
    name: 'PI Vision service',
    principal: 'RIVERBEND\\SVC-PIVISION$',
    type: 'gMSA',
    identity: 'PIOperators',
  },
];

export interface Trust {
  name: string;
  application: string;
  ip: string;
  netmask: string;
  host: string;
  identity: string;
  finding: string;
  ok: boolean;
}

export const TRUSTS: readonly Trust[] = [
  {
    name: 'Legacy OPC interface',
    application: 'OPCpE',
    ip: '10.20.4.15',
    netmask: '255.255.255.255',
    host: 'PIINT02',
    identity: 'PI Interfaces',
    finding:
      'Meets the 2+ rule (application plus IP and host). Retire once PI API for WIS is in use.',
    ok: true,
  },
  {
    name: 'Old historian link',
    application: '',
    ip: '',
    netmask: '',
    host: 'PISRV01',
    identity: 'piadmins',
    finding:
      'Open trust (server name only) mapped to an admin identity: a major vulnerability. Kept here to show what to look for.',
    ok: false,
  },
];

export interface PiUser {
  name: string;
  description: string;
  passwordSet: boolean;
  disabled: boolean;
}

export const PI_USERS: readonly PiUser[] = [
  {
    name: 'piadmin',
    description: 'Built-in superuser. Has a password; not used day to day.',
    passwordSet: true,
    disabled: false,
  },
  {
    name: 'pidemo',
    description: 'Read-only demo user with no password. Disabled.',
    passwordSet: false,
    disabled: true,
  },
];

export const PI_GROUPS: readonly { name: string; description: string }[] = [
  { name: 'piadmin', description: 'Legacy group kept for backward compatibility.' },
  { name: 'piuser', description: 'Legacy group kept for backward compatibility.' },
];

/* ------------------------------------------------------------ licensing and error codes */

export const LICENSE = {
  file: '%PISERVER%\\dat (copied there by setup)',
  pointLimit: SERVER_PROFILE.licensedPoints,
  pointsInUse: SERVER_PROFILE.pointsInUse,
  applications: [
    { name: 'PI Data Archive', note: 'Core server licence' },
    { name: 'PI Vision', note: 'Display clients through PIVISION01' },
    { name: 'PI Analysis Service', note: 'Runs on AFSRV01' },
    { name: 'PI Interface for OPC DA', note: 'Interface node PIINT01' },
  ],
};

/** Error codes with meanings recorded in research (adm.md, da.md, dev2.md). */
export const ERROR_CODES: Readonly<Record<string, string>> = {
  '-10400': 'PI_XS_NOREAD: no read access',
  '-10401': 'PI_XS_NOWRITE: no write access',
  '-10402': 'Malformed access string',
  '-10407': 'No read or write access',
  '-10411': 'Security or trust mismatch',
  '-10412': 'Trusts not supported',
  '-10413': 'PI_XS_NOTRUST: no trust relation for this request',
  '-10415': 'IP address and net mask both required',
  '-10416': 'Trust has no specifications',
  '-10417': 'Operation requires piadmin',
  '-10418': 'Database security not initialised',
  '-10727': 'PINET RPC is non-existent (the target subsystem is not running)',
  '-10767': 'Client exceeded maximum concurrent queries',
  '-11091': 'Event collection exceeded the maximum allowed (ArcMaxCollect)',
  '-11140': 'Archive query exceeded maximum execution time',
  '-10005': 'Value too small or subscript out of range',
};
