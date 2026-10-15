import { useReducer, useState, type KeyboardEvent } from 'react';
import {
  BookOpen,
  Boxes,
  Contact as ContactIcon,
  Database,
  Pause,
  Play,
  Ruler,
  BellRing,
  RotateCcw,
  Undo2,
  Upload,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { PageHeader } from '@/components/ui/misc';
import { allElements, plant, type SimElement } from '@/core/sim/plant';
import { formatPiTime } from '@/core/sim/time';
import { cn } from '@/lib/cn';
import { AssetTree } from '../shared/AssetTree';
import { ToolFrame } from '../shared/ToolFrame';
import { useSimClock } from '../shared/useSimClock';
import { checkedOutObjects, checkoutReducer, describeField, INITIAL_CHECKOUT } from './checkout';
import { ElementViewer, type ElementTab } from './ElementViewer';
import {
  EF_PRESETS,
  EventFramesView,
  runEfSearch,
  type EfCriteria,
  type EfSearchResult,
} from './EventFramesView';
import { ContactsView, NotificationRulesView, UomView } from './InfoSections';
import { LibraryBrowser, LibraryViewer, type LibrarySel } from './LibraryView';
import { buildModel } from './model';
import { CheckedOutMark, Note } from './ui';

type Section = 'elements' | 'eventframes' | 'library' | 'uom' | 'contacts' | 'notifications';

const SECTIONS: { id: Section; label: string; icon: typeof Boxes; shortcut?: string }[] = [
  { id: 'elements', label: 'Elements', icon: Boxes, shortcut: 'Ctrl+1' },
  { id: 'eventframes', label: 'Event Frames', icon: Zap, shortcut: 'Ctrl+2' },
  { id: 'library', label: 'Library', icon: BookOpen, shortcut: 'Ctrl+3' },
  { id: 'uom', label: 'Unit of Measure', icon: Ruler },
  { id: 'contacts', label: 'Contacts', icon: ContactIcon },
  { id: 'notifications', label: 'Notification Rules', icon: BellRing },
];

/** A PI System Explorer style sandbox on the fictional Riverbend AF database. */
export function ExplorerPage() {
  const m = plant();
  const { now, paused, setPaused } = useSimClock(5000);
  const [state, dispatch] = useReducer(checkoutReducer, INITIAL_CHECKOUT);
  const [section, setSection] = useState<Section>('elements');
  const [selectedId, setSelectedId] = useState('P101');
  const [tab, setTab] = useState<ElementTab>('attributes');
  const [libSel, setLibSel] = useState<LibrarySel>({ kind: 'element-template', name: 'Pump' });
  const [efCriteria, setEfCriteria] = useState<EfCriteria>(
    () => (EF_PRESETS[0] as (typeof EF_PRESETS)[number]).criteria,
  );
  const [efResult, setEfResult] = useState<EfSearchResult | string | null>(null);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const model = buildModel(m.root, state, dispatch, now);
  const elements = allElements(m.root);
  const base = elements.find((e) => e.id === selectedId) ?? m.root;
  const out = checkedOutObjects(state);
  const nameOf = (id: string): string => elements.find((e) => e.id === id)?.name ?? id;

  const openElement = (e: SimElement): void => {
    setSection('elements');
    setSelectedId(e.id);
  };
  const runSearch = (c: EfCriteria = efCriteria): void => setEfResult(runEfSearch(c, now));
  const go = (s: Section): void => {
    setSection(s);
    if (s === 'eventframes' && efResult === null) runSearch();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (!(e.ctrlKey || e.metaKey)) return;
    if (e.key === 's' || e.key === 'S') {
      e.preventDefault();
      if (out.length) setCheckInOpen(true);
    } else if (e.key === '1' || e.key === '2' || e.key === '3') {
      e.preventDefault();
      go((['elements', 'eventframes', 'library'] as const)[Number(e.key) - 1] ?? 'elements');
    }
  };

  const browser = (() => {
    switch (section) {
      case 'elements':
        return (
          <div>
            <p className="flex items-center gap-1 px-2 pt-2 text-xs font-semibold text-fg-muted">
              <Database className="size-3.5" aria-hidden /> {m.database}
            </p>
            <AssetTree
              root={m.root}
              selected={base.id}
              onSelect={(e) => setSelectedId(e.id)}
              label="Elements"
            />
            {out.length ? (
              <div className="border-t border-tool-grid px-2 py-2">
                <p className="text-xs font-semibold text-fg-muted">Checked out</p>
                <ul className="mt-1 flex flex-col gap-0.5 text-sm">
                  {out.map((id) => (
                    <li key={id}>
                      <button
                        type="button"
                        className="flex items-center gap-1 rounded px-1 hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-ring"
                        onClick={() => setSelectedId(id)}
                      >
                        <CheckedOutMark /> {nameOf(id)}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        );
      case 'eventframes':
        return (
          <nav aria-label="Event frame searches" className="p-2">
            <p className="text-xs font-semibold text-fg-muted">Event Frame Searches</p>
            <ul className="mt-1 flex flex-col gap-0.5">
              {EF_PRESETS.map((p) => (
                <li key={p.label}>
                  <button
                    type="button"
                    className="w-full rounded px-1 py-0.5 text-left text-sm hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-ring"
                    onClick={() => {
                      setEfCriteria(p.criteria);
                      runSearch(p.criteria);
                    }}
                  >
                    {p.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        );
      case 'library':
        return <LibraryBrowser value={libSel} onChange={setLibSel} />;
      default:
        return (
          <p className="p-2 text-xs text-fg-muted">
            {SECTIONS.find((s) => s.id === section)?.label} is shown read-only in this sandbox.
          </p>
        );
    }
  })();

  const viewer = (() => {
    switch (section) {
      case 'elements':
        return (
          <ElementViewer
            key={base.id}
            base={base}
            model={model}
            tab={tab}
            onTab={setTab}
            onOpenElement={openElement}
            onOpenTemplate={(name) => {
              setLibSel({ kind: 'element-template', name });
              setSection('library');
            }}
            onCheckIn={() => setCheckInOpen(true)}
          />
        );
      case 'eventframes':
        return (
          <EventFramesView
            criteria={efCriteria}
            onCriteria={setEfCriteria}
            result={efResult}
            onSearch={() => runSearch()}
            now={now}
          />
        );
      case 'library':
        return <LibraryViewer sel={libSel} model={model} onOpenElement={openElement} />;
      case 'uom':
        return <UomView />;
      case 'contacts':
        return <ContactsView />;
      case 'notifications':
        return <NotificationRulesView />;
    }
  })();

  return (
    <div className="mx-auto max-w-[96rem] p-4 md:p-6">
      <PageHeader
        title="AF Explorer sandbox"
        description="A PI System Explorer style mockup on the fictional Riverbend database. Browse elements and live attributes, re-point a PI Point data reference, write and evaluate analyses, search event frames and inspect the Library. Edits stay in this page: check them in, undo them, or reset."
      />
      <div onKeyDown={onKeyDown}>
        <ToolFrame
          title={`AF Explorer (sandbox) - \\\\${m.afServer}\\${m.database}`}
          menu={['File', 'Edit', 'View', 'Go', 'Tools', 'Help']}
          toolbar={
            <>
              <span className="flex items-center gap-1 text-xs text-fg-muted">
                <Database className="size-3.5" aria-hidden /> Database:{' '}
                <span className="font-mono text-fg">
                  \\{m.afServer}\{m.database}
                </span>
              </span>
              <span className="mx-1 h-5 w-px bg-border" aria-hidden />
              <Button
                size="sm"
                variant="success"
                disabled={!out.length}
                onClick={() => setCheckInOpen(true)}
                title="Check In (Ctrl+S)"
              >
                <Upload /> Check In{out.length ? ` (${out.length})` : ''}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={!out.length}
                onClick={() => dispatch({ type: 'undoCheckOut', objects: out })}
              >
                <Undo2 /> Undo Check Out
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPaused(!paused)}
                aria-pressed={paused}
              >
                {paused ? <Play /> : <Pause />} {paused ? 'Resume clock' : 'Pause clock'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto"
                onClick={() => setResetOpen(true)}
              >
                <RotateCcw /> Reset sandbox
              </Button>
            </>
          }
          status={
            <span className="flex flex-wrap gap-x-4 gap-y-1">
              <span>Connected to {m.afServer} (sandbox)</span>
              <span>Data server {m.dataServer}</span>
              <span>
                {out.length
                  ? `${out.length} object${out.length === 1 ? '' : 's'} checked out`
                  : 'Nothing checked out'}
              </span>
              <span>
                {paused ? 'Clock paused at' : 'Time'} {formatPiTime(now)}
              </span>
              {state.history[0] ? (
                <span>
                  Last check-in {formatPiTime(state.history[0].at)} ({state.history[0].changes}{' '}
                  change{state.history[0].changes === 1 ? '' : 's'})
                </span>
              ) : null}
            </span>
          }
        >
          <div className="flex w-full min-w-0 flex-col md:flex-row">
            <aside className="flex shrink-0 flex-col border-b border-tool-grid bg-surface md:w-60 md:border-r md:border-b-0">
              <div className="max-h-72 min-h-40 flex-1 overflow-auto md:max-h-none">{browser}</div>
              <nav aria-label="Navigator" className="border-t border-tool-grid">
                <ul className="flex flex-wrap md:flex-col">
                  {SECTIONS.map((s) => {
                    const Icon = s.icon;
                    const active = section === s.id;
                    return (
                      <li key={s.id} className="md:w-full">
                        <button
                          type="button"
                          aria-current={active ? 'page' : undefined}
                          title={s.shortcut ? `${s.label} (${s.shortcut})` : s.label}
                          onClick={() => go(s.id)}
                          className={cn(
                            'flex w-full items-center gap-2 border-tool-grid px-3 py-1.5 text-left text-sm focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring md:border-t',
                            active ? 'bg-tool-select font-semibold' : 'hover:bg-surface-2',
                          )}
                        >
                          <Icon className="size-4 text-fg-muted" aria-hidden />
                          {s.label}
                          {s.id === 'elements' && out.length ? (
                            <Badge tone="warning" className="ml-auto">
                              {out.length}
                            </Badge>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </aside>
            <div className="min-w-0 flex-1 overflow-auto p-3 md:p-4">{viewer}</div>
          </div>
        </ToolFrame>
      </div>
      <p className="mt-3 text-xs text-fg-muted">
        Simulation for learning. It is not AVEVA software and shows only part of what PI System
        Explorer does. Shortcuts: Ctrl+1 Elements, Ctrl+2 Event Frames, Ctrl+3 Library, Ctrl+S Check
        In.
      </p>

      <Dialog open={checkInOpen} onOpenChange={setCheckInOpen}>
        <DialogContent
          title="Check In"
          description="Checking in makes your edits visible to other users and to services such as the Analysis Service."
        >
          <CheckInForm
            objects={out}
            nameOf={nameOf}
            fieldsOf={(id) => Object.keys(state.pending[id] ?? {})}
            onCheckIn={(objects) => {
              dispatch({ type: 'checkIn', objects, at: Date.now() });
              setCheckInOpen(false);
            }}
            onUndo={(objects) => {
              dispatch({ type: 'undoCheckOut', objects });
              setCheckInOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent
          title="Reset the sandbox?"
          description="This discards every edit, checked in or not, and restores the original Riverbend database."
        >
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                dispatch({ type: 'reset' });
                setResetOpen(false);
              }}
            >
              Reset
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CheckInForm({
  objects,
  nameOf,
  fieldsOf,
  onCheckIn,
  onUndo,
}: {
  objects: string[];
  nameOf: (id: string) => string;
  fieldsOf: (id: string) => string[];
  onCheckIn: (objects: string[]) => void;
  onUndo: (objects: string[]) => void;
}) {
  const [chosen, setChosen] = useState<Set<string>>(() => new Set(objects));
  if (!objects.length) return <Note>Nothing is checked out.</Note>;
  const list = objects.filter((o) => chosen.has(o));
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onCheckIn(list);
      }}
      className="flex flex-col gap-3"
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">Checked-out objects</legend>
        {objects.map((id) => (
          <label
            key={id}
            className="flex items-start gap-2 rounded border border-border p-2 text-sm"
          >
            <input
              type="checkbox"
              className="mt-1"
              checked={chosen.has(id)}
              onChange={(e) => {
                const n = new Set(chosen);
                if (e.target.checked) n.add(id);
                else n.delete(id);
                setChosen(n);
              }}
            />
            <span>
              <span className="font-medium">{nameOf(id)}</span>
              <span className="block text-xs text-fg-muted">
                {fieldsOf(id).map(describeField).join(', ')}
              </span>
            </span>
          </label>
        ))}
      </fieldset>
      <Note>
        A checked-in, enabled analysis would start running at once on a real server, which is why
        you Evaluate and Preview before checking in.
      </Note>
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={!list.length}
          onClick={() => onUndo(list)}
        >
          <Undo2 /> Undo Check Out
        </Button>
        <Button type="submit" variant="success" disabled={!list.length}>
          <Upload /> Check In
        </Button>
      </div>
    </form>
  );
}
