import { useMemo, useReducer, useState } from 'react';
import {
  Activity,
  Archive,
  BarChart3,
  Database,
  FileText,
  Gauge,
  KeyRound,
  ListTree,
  PenSquare,
  RotateCcw,
  Server,
  Settings2,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/misc';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToolFrame } from '../shared/ToolFrame';
import { useSimClock } from '../shared/useSimClock';
import { initialPoints, SANDBOX_USER } from './points';
import { archiveModel, fillRate, serverStats, systemMessages, tuningValue } from './server';
import { initialState, outOfOrderCount, smtReducer } from './store';
import { PointBuilder } from './PointBuilder';
import { CurrentValues, DigitalStates } from './DataTools';
import { ArchiveEditor } from './ArchiveEditor';
import { ArchivesView, MessageLogs, StatisticsView, TuningView } from './OperationTools';
import { IdentitiesView, LicensingView, MappingsView } from './SecurityTools';
import { CommandConsole } from './Console';
import { smallButton } from './ui';
import { cn } from '@/lib/cn';

type ToolId =
  | 'archive-editor'
  | 'current-values'
  | 'digital-states'
  | 'point-builder'
  | 'archives'
  | 'message-logs'
  | 'statistics'
  | 'tuning'
  | 'identities'
  | 'mappings'
  | 'licensing';

const TOOL_GROUPS: { group: string; tools: { id: ToolId; label: string; icon: LucideIcon }[] }[] = [
  {
    group: 'Data',
    tools: [
      { id: 'archive-editor', label: 'Archive Editor', icon: PenSquare },
      { id: 'current-values', label: 'Current Values', icon: Activity },
      { id: 'digital-states', label: 'Digital States', icon: ListTree },
      { id: 'point-builder', label: 'Point Builder', icon: Database },
    ],
  },
  {
    group: 'Operation',
    tools: [
      { id: 'archives', label: 'Archives', icon: Archive },
      { id: 'message-logs', label: 'Message Logs', icon: FileText },
      { id: 'statistics', label: 'Snapshot and Archive Statistics', icon: BarChart3 },
      { id: 'tuning', label: 'Tuning Parameters', icon: Settings2 },
    ],
  },
  {
    group: 'Security',
    tools: [
      { id: 'identities', label: 'Identities, Users, & Groups', icon: Users },
      { id: 'mappings', label: 'Mappings & Trusts', icon: ShieldCheck },
    ],
  },
  { group: 'IT', tools: [{ id: 'licensing', label: 'Licensing', icon: KeyRound }] },
];

const DAY = 86_400_000;

/** PI System Management Tools style sandbox with a piconfig / piartool command prompt. */
export function SmtPage() {
  const { now, paused, setPaused } = useSimClock(5000);
  const [state, dispatch] = useReducer(smtReducer, undefined, initialState);
  const [tool, setTool] = useState<ToolId>('point-builder');
  const [connected, setConnected] = useState(true);
  const [view, setView] = useState('smt');

  const effective = (name: string): string => tuningValue(state.applied, name);
  const flushSec = Number(effective('Archive_SecondsBetweenFlush')) || 300;
  const autoSize = Number(effective('Archive_AutoArchiveFileSize')) || 256;
  const dayLimit = Math.min(40, Math.max(1, Number(effective('MessageLog_DayLimit')) || 35));
  const root = effective('Archive_AutoArchiveFileRoot') || 'D:\\PI\\arc\\PISRV01_';

  // Historic fill rate: the original Riverbend settings, measured once per day, so history is stable.
  const day = Math.floor(now / DAY) * DAY;
  const historicFill = useMemo(() => fillRate(initialPoints(), day), [day]);
  const projectedFill = useMemo(() => fillRate(state.points, now), [state.points, now]);
  const archives = useMemo(
    () =>
      archiveModel({
        now,
        fillBytesPerSec: historicFill,
        shifts: state.shifts,
        baseSizeMB: 256,
        root,
      }),
    [now, historicFill, state.shifts, root],
  );
  const stats = useMemo(
    () =>
      serverStats(state.points, now, {
        secondsBetweenFlush: flushSec,
        outOfOrderEdits: outOfOrderCount(state.archiveEdits),
      }),
    [state.points, now, flushSec, state.archiveEdits],
  );
  const messages = useMemo(
    () => [...systemMessages(now - dayLimit * DAY, now, archives.archives), ...state.userLog],
    [now, dayLimit, archives.archives, state.userLog],
  );

  const changed = state.userLog.length > 0;
  const current = TOOL_GROUPS.flatMap((g) => g.tools).find((t) => t.id === tool);

  const renderTool = () => {
    if (!connected)
      return (
        <p className="text-sm text-fg-muted">
          No server selected. Tick PISRV01 in the Systems pane to connect the tools to it.
        </p>
      );
    switch (tool) {
      case 'point-builder':
        return <PointBuilder points={state.points} now={now} dispatch={dispatch} />;
      case 'current-values':
        return (
          <CurrentValues points={state.points} now={now} paused={paused} setPaused={setPaused} />
        );
      case 'archive-editor':
        return (
          <ArchiveEditor
            points={state.points}
            edits={state.archiveEdits}
            now={now}
            dispatch={dispatch}
          />
        );
      case 'digital-states':
        return <DigitalStates />;
      case 'archives':
        return (
          <ArchivesView
            model={archives}
            projectedFill={projectedFill}
            now={now}
            nextSizeMB={autoSize}
            dispatch={dispatch}
          />
        );
      case 'message-logs':
        return <MessageLogs entries={messages} now={now} />;
      case 'statistics':
        return <StatisticsView stats={stats} />;
      case 'tuning':
        return (
          <TuningView
            configured={state.tuning}
            restartPending={state.restartPending}
            now={now}
            dispatch={dispatch}
          />
        );
      case 'identities':
        return <IdentitiesView />;
      case 'mappings':
        return <MappingsView />;
      case 'licensing':
        return <LicensingView pointCount={state.points.length} />;
    }
  };

  const resetButton = (
    <button
      type="button"
      className={smallButton}
      onClick={() => dispatch({ type: 'reset' })}
      disabled={!changed}
    >
      <RotateCcw aria-hidden /> Reset sandbox
    </button>
  );

  return (
    <div className="mx-auto max-w-[120rem]">
      <PageHeader
        title="System Management Tools sandbox"
        description="Play with a PI Data Archive administration console on the fictional Riverbend plant: build and edit points, edit archived values, watch statistics, shift archives, tune parameters and run piconfig and piartool. Nothing here touches a real server, and every change lives only in this page until you reset or leave."
        actions={resetButton}
      />
      <Tabs value={view} onValueChange={setView}>
        <TabsList aria-label="Sandbox views">
          <TabsTrigger value="smt">System Management Tools</TabsTrigger>
          <TabsTrigger value="console">Command prompt (piconfig, piartool)</TabsTrigger>
        </TabsList>
        <TabsContent value="smt">
          <ToolFrame
            title="PI System Management Tools (mockup)"
            menu={['File', 'Edit', 'View', 'Tools', 'Help']}
            status={
              <span className="flex flex-wrap gap-x-4">
                <span>
                  {connected
                    ? `Connected to PISRV01 as ${SANDBOX_USER} (sandbox)`
                    : 'Not connected'}
                </span>
                <span>{state.points.length} points</span>
                <span>{paused ? 'Clock paused' : 'Live'}</span>
              </span>
            }
          >
            <aside
              className="flex w-60 shrink-0 flex-col border-r border-tool-grid bg-surface text-sm"
              aria-label="SMT navigation"
            >
              <section className="border-b border-tool-grid p-2">
                <h2 className="mb-1 text-xs font-semibold text-fg-muted uppercase">Systems</h2>
                <label className="flex items-center gap-2 rounded px-1 py-0.5 hover:bg-surface-2">
                  <input
                    type="checkbox"
                    checked={connected}
                    onChange={(e) => setConnected(e.target.checked)}
                  />
                  <Server className="size-3.5 text-fg-muted" aria-hidden />
                  <span className="font-mono text-xs">PISRV01</span>
                  <span
                    className={cn(
                      'ml-auto size-2 rounded-full',
                      connected ? 'bg-tool-ok' : 'bg-fg-subtle',
                    )}
                    aria-hidden
                  />
                </label>
              </section>
              <nav className="flex-1 overflow-auto p-2" aria-label="Tools">
                {TOOL_GROUPS.map((g) => (
                  <div key={g.group} className="mb-2">
                    <h3 className="flex items-center gap-1 px-1 text-xs font-semibold text-fg-muted">
                      <Gauge className="size-3" aria-hidden /> {g.group}
                    </h3>
                    <ul>
                      {g.tools.map((t) => (
                        <li key={t.id}>
                          <button
                            type="button"
                            aria-current={tool === t.id ? 'page' : undefined}
                            onClick={() => setTool(t.id)}
                            className={cn(
                              'flex w-full items-center gap-2 rounded py-1 pr-1 pl-4 text-left text-xs focus-visible:outline-2 focus-visible:outline-ring',
                              tool === t.id ? 'bg-tool-select' : 'hover:bg-surface-2',
                            )}
                          >
                            <t.icon className="size-3.5 shrink-0 text-fg-muted" aria-hidden />
                            {t.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>
            </aside>
            <section
              className="min-w-0 flex-1 overflow-auto bg-tool-canvas p-4"
              aria-label={current?.label ?? 'Tool'}
            >
              {renderTool()}
            </section>
          </ToolFrame>
        </TabsContent>
        <TabsContent value="console">
          <ToolFrame title="Command prompt: PISRV01 (mockup)">
            <div className="min-w-0 flex-1">
              <CommandConsole
                points={state.points}
                stats={stats}
                archives={archives}
                now={now}
                dispatch={dispatch}
              />
            </div>
          </ToolFrame>
        </TabsContent>
      </Tabs>
    </div>
  );
}
