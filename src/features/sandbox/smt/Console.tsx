import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type Dispatch,
  type KeyboardEvent,
} from 'react';
import { Terminal } from 'lucide-react';
import { executeLine, newSession, type PiconfigSession } from './piconfig';
import { PROMPT, runShell, SHELL_HELP } from './shell';
import { SANDBOX_USER, type SandboxPoint } from './points';
import type { ArchiveModel, ServerStats } from './server';
import type { SmtAction } from './store';
import { Note, smallButton } from './ui';
import { cn } from '@/lib/cn';

interface Line {
  id: number;
  kind: 'in' | 'out' | 'err';
  text: string;
}

const PICONFIG_PROMPT = 'piconfig>';

const EXAMPLES: { label: string; script: string }[] = [
  {
    label: 'List feed pumps',
    script:
      'piconfig\n@table pipoint\n@mode list\n@ostr tag,descriptor,pointtype,compdev,excdev\n@select tag=RB.P10*\n@ends\n@exit',
  },
  {
    label: 'Tag to PointID map',
    script: 'piconfig\n@tabl pipoint\n@ostr tag,pointid\n@sele tag=*\n@ends\n@exit',
  },
  {
    label: 'Tighten compression',
    script:
      'piconfig\n@table pipoint\n@mode edit\n@istr tag,compdev,excdev\nRB.P101.FLOW,2,1\nRB.P102.FLOW,2,1\n@exit',
  },
  {
    label: 'Create a point',
    script:
      'piconfig\n@table pipoint\n@ptclass classic\n@mode create, t\n@istr tag,instrumenttag,descriptor,pointsource,pointtype,engunits,location1,location4\nRB.T103.LEVEL,ns=2;s=Riverbend.T103.LEVEL,T-103 level,OPC,Float32,%,1,2\n@exit',
  },
  { label: 'Snapshot stats', script: 'piartool -ss' },
  { label: 'Queue stats', script: 'piartool -qs' },
  { label: 'Archive stats', script: 'piartool -as' },
  { label: 'List archives', script: 'piartool -al' },
];

export function CommandConsole({
  points,
  stats,
  archives,
  now,
  dispatch,
}: {
  points: readonly SandboxPoint[];
  stats: ServerStats;
  archives: ArchiveModel;
  now: number;
  dispatch: Dispatch<SmtAction>;
}) {
  const [lines, setLines] = useState<Line[]>(() => [
    {
      id: 0,
      kind: 'out',
      text: 'Sandbox command prompt in %PISERVER%\\adm on PISRV01. Type help for commands.',
    },
  ]);
  const [input, setInput] = useState('');
  const [session, setSession] = useState<PiconfigSession | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState<number | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  /** Run a batch of input lines, threading piconfig state and points through. */
  const runLines = (inputs: string[]): void => {
    let sess = session;
    let pts: SandboxPoint[] = [...points];
    const added: Line[] = [];
    const push = (kind: Line['kind'], text: string): void => {
      added.push({ id: nextId.current++, kind, text });
    };
    let cleared = false;
    for (const raw of inputs) {
      push('in', `${sess ? PICONFIG_PROMPT : PROMPT} ${raw}`);
      if (sess) {
        const r = executeLine(sess, raw, pts, { now, user: SANDBOX_USER });
        for (const o of r.output) push(o.startsWith('Error') ? 'err' : 'out', o);
        if (r.changes.length) {
          dispatch({ type: 'piconfig', points: r.points, changes: r.changes, now });
          pts = r.points;
        }
        sess = r.exit ? null : r.session;
        continue;
      }
      const r = runShell(raw, { stats, archives });
      if (r.kind === 'clear') {
        cleared = true;
        added.length = 0;
      } else {
        for (const o of r.lines) push(o.startsWith("'") ? 'err' : 'out', o);
        if (r.kind === 'piconfig') sess = newSession();
      }
    }
    setSession(sess);
    setLines((l) => (cleared ? added : [...l, ...added]));
  };

  const submit = (): void => {
    const text = input;
    setInput('');
    setHistIdx(null);
    if (text.trim()) setHistory((h) => [...h, text]);
    runLines([text]);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    } else if (e.key === 'ArrowUp' && history.length) {
      e.preventDefault();
      const i = histIdx === null ? history.length - 1 : Math.max(0, histIdx - 1);
      setHistIdx(i);
      setInput(history[i] ?? '');
    } else if (e.key === 'ArrowDown' && histIdx !== null) {
      e.preventDefault();
      const i = histIdx + 1;
      if (i >= history.length) {
        setHistIdx(null);
        setInput('');
      } else {
        setHistIdx(i);
        setInput(history[i] ?? '');
      }
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>): void => {
    const text = e.clipboardData.getData('text');
    if (!text.includes('\n')) return;
    e.preventDefault();
    const all = (input + text).split(/\r?\n/);
    const last = all.pop() ?? '';
    setHistory((h) => [...h, ...all.filter((l) => l.trim())]);
    runLines(all);
    setInput(last);
  };

  return (
    <div className="flex h-full flex-col gap-3 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Terminal className="size-4 text-fg-muted" aria-hidden />
        <h2 className="mr-2 text-base font-semibold">Command prompt</h2>
        <span className="text-xs text-fg-muted">Examples:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            type="button"
            className={smallButton}
            onClick={() => runLines(ex.script.split('\n'))}
          >
            {ex.label}
          </button>
        ))}
      </div>
      <Note>
        <p>
          A sandbox subset of piconfig (PIPOINT table) and piartool working on the same points as
          the SMT tab, so edits made here show up in Point Builder and the message log. Prompts and
          messages are simplified; piartool layouts are not the real ones. Paste a multi-line script
          to run it line by line; Up and Down recall earlier commands.
        </p>
      </Note>
      <div
        ref={logRef}
        role="log"
        aria-live="polite"
        aria-label="Console output"
        tabIndex={0}
        className="min-h-[22rem] flex-1 overflow-auto rounded border border-tool-grid bg-tool-chrome p-3 font-mono text-xs text-tool-chrome-fg"
      >
        {lines.map((l) => (
          <pre
            key={l.id}
            className={cn(
              'break-words whitespace-pre-wrap',
              l.kind === 'in' && 'opacity-80',
              l.kind === 'err' && 'text-tool-alarm-warn',
            )}
          >
            {l.text}
          </pre>
        ))}
      </div>
      <form
        className="flex items-center gap-2 rounded border border-tool-grid bg-tool-chrome px-3 py-2 font-mono text-xs text-tool-chrome-fg"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label htmlFor="console-input" className="whitespace-nowrap">
          {session ? PICONFIG_PROMPT : PROMPT}
        </label>
        <input
          id="console-input"
          className="min-w-0 flex-1 bg-transparent outline-none focus-visible:outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          onPaste={onPaste}
          autoComplete="off"
          spellCheck={false}
          aria-describedby="console-help"
        />
      </form>
      <p id="console-help" className="text-[11px] text-fg-muted">
        {SHELL_HELP.slice(1, 3).join(' · ').replace(/\s+/g, ' ')}
      </p>
    </div>
  );
}
