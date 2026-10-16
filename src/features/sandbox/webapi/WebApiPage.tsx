import { useMemo, useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Copy,
  History,
  ListChecks,
  Plus,
  Send,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '@/app/AppContext';
import { exampleRequests, type ApiRequest, type ApiResponse } from '@/core/sim/webapi';
import { Button } from '@/components/ui/button';
import { Input, Label, Select, Textarea } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';
import { ToolFrame } from '../shared/ToolFrame';
import { JsonTree } from './JsonTree';
import {
  HOST_PLACEHOLDER,
  curlSnippet,
  fetchSnippet,
  formatBytes,
  joinUrl,
  pythonSnippet,
  simulatedMs,
  splitUrl,
  type Param,
} from './request';
import { send } from './send';
import { CHALLENGES } from './challenges';
import { OWNER_MARKERS, WEBID_MARKERS, decodeWebId, type WebIdPart } from './webid';

/** Wall-clock time for a request, read when the request is sent (never during render). */
function clockNow(): number {
  return Date.now();
}

const TOOL = 'webapi';
const HISTORY = 'Request history';
const DONE = 'Completed challenges';
const METHODS: ApiRequest['method'][] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

interface HistoryEntry {
  method: ApiRequest['method'];
  url: string;
  body?: string;
  status: number;
  at: number;
}

interface Exchange {
  req: ApiRequest;
  res: ApiResponse;
  ms: number;
  bytes: number;
}

const BATCH_EXAMPLE = JSON.stringify(
  {
    '1': { Method: 'GET', Resource: '/piwebapi/points?path=\\\\PISRV01\\RB.P101.FLOW' },
    '2': {
      Method: 'GET',
      Resource: '/piwebapi/streams/{0}/value',
      ParentIds: ['1'],
      Parameters: ['$.1.Content.WebId'],
    },
    '3': {
      Method: 'GET',
      Resource:
        '/piwebapi/streams/{0}/recorded?maxCount=5&selectedFields=Items.Timestamp;Items.Value',
      ParentIds: ['1'],
      Parameters: ['$.1.Content.WebId'],
    },
  },
  null,
  2,
);

function parseJson<T>(data: string | undefined, guard: (v: unknown) => v is T, dflt: T): T {
  if (!data) return dflt;
  try {
    const v: unknown = JSON.parse(data);
    return guard(v) ? v : dflt;
  } catch {
    return dflt;
  }
}
const isHistory = (v: unknown): v is HistoryEntry[] =>
  Array.isArray(v) &&
  v.every(
    (e) =>
      !!e &&
      typeof e === 'object' &&
      typeof (e as HistoryEntry).url === 'string' &&
      METHODS.includes((e as HistoryEntry).method) &&
      ((e as HistoryEntry).body === undefined || typeof (e as HistoryEntry).body === 'string'),
  );
const isStrings = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === 'string');

const ROLE_STYLE: Record<WebIdPart['role'], string> = {
  type: 'bg-chart-1/20',
  version: 'bg-chart-2/20',
  marker: 'bg-chart-3/20',
  owner: 'bg-chart-4/20',
  guid: 'bg-chart-5/20',
  pointid: 'bg-chart-6/20',
  path: 'bg-chart-6/20',
  rest: 'bg-surface-3',
};

function WebIdDecoder({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const d = decodeWebId(value);
  return (
    <section aria-labelledby="wid-h" className="grid gap-2">
      <h2 id="wid-h" className="text-sm font-semibold">
        WebID decoder
      </h2>
      <Label htmlFor="wid-in" className="sr-only">
        WebID to decode
      </Label>
      <Input
        id="wid-in"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste a WebID, or press the decode icon in a response"
        className="h-8 font-mono text-xs"
        spellCheck={false}
      />
      {value.trim() ? (
        <>
          <div className="flex flex-wrap font-mono text-xs break-all" aria-hidden>
            {d.parts.map((p, i) => (
              <span key={i} className={cn('rounded-sm px-0.5', ROLE_STYLE[p.role])}>
                {p.chars}
              </span>
            ))}
          </div>
          {d.error ? (
            <p role="status" className="text-xs text-danger">
              {d.error}
            </p>
          ) : null}
          <dl className="grid gap-1 text-xs">
            {d.parts.map((p, i) => (
              <div key={i} className="grid grid-cols-[6.5rem_1fr] gap-2">
                <dt className="flex items-start gap-1 text-fg-muted">
                  <span
                    className={cn(
                      'mt-1 inline-block size-2 shrink-0 rounded-sm',
                      ROLE_STYLE[p.role],
                    )}
                    aria-hidden
                  />
                  {p.label}
                </dt>
                <dd className="break-all">
                  <code className="font-mono">
                    {p.chars.length > 24 ? `${p.chars.slice(0, 24)}…` : p.chars}
                  </code>
                  <span className="block text-fg-muted">{p.meaning}</span>
                </dd>
              </div>
            ))}
          </dl>
        </>
      ) : null}
      <details className="text-xs text-fg-muted">
        <summary className="cursor-pointer text-fg">WebID 2.0 layout</summary>
        <ul className="mt-1 list-disc space-y-1 pl-4">
          <li>Character 1: type (F Full, I IDOnly, P PathOnly, L LocalIDOnly, D DefaultIDOnly).</li>
          <li>
            Character 2: version, always 1. WebID 2.0 arrived in PI Web API 2017 R2; 1.0 IDs were
            opaque.
          </li>
          <li>
            Characters 3–4: object marker, e.g.{' '}
            {Object.entries(WEBID_MARKERS)
              .slice(0, 6)
              .map(([k, v]) => `${k} ${v}`)
              .join(', ')}
            .
          </li>
          <li>
            Optional owner marker for attributes and similar objects:{' '}
            {Object.entries(OWNER_MARKERS)
              .map(([k, v]) => `${k} ${v}`)
              .join(', ')}
            .
          </li>
          <li>
            Then Base64url (- and _ instead of + and /, no = padding): GUIDs take 22 characters, a
            PI point ID 6, and a PathOnly WebID encodes the UPPERCASE path.
          </li>
          <li>
            PathOnly WebIDs break when an object is renamed; IDOnly ones become invalid when it is
            deleted. Choose with ?webIdType=.
          </li>
          <li title="Simplified">
            Simplified: this sandbox issues PathOnly WebIDs only. As in PI Web API, the encoded path
            is upper case and leaves out the leading \\.
          </li>
        </ul>
      </details>
    </section>
  );
}

/** PI Web API request builder and HATEOAS browser over the simulated plant. */
export function WebApiPage() {
  const { user, rev } = useApp();
  const examples = useMemo(() => exampleRequests(), []);
  const [method, setMethod] = useState<ApiRequest['method']>('GET');
  const [url, setUrl] = useState('/piwebapi');
  const [body, setBody] = useState('');
  const [last, setLast] = useState<Exchange | null>(null);
  const [webIdInput, setWebIdInput] = useState('');
  const [view, setView] = useState('pretty');
  const [copied, setCopied] = useState<string | null>(null);
  const [justSolved, setJustSolved] = useState<string[]>([]);

  const rows = useMemo(() => {
    void rev;
    return user.savedDisplays(TOOL);
  }, [user, rev]);
  const historyRow = rows.find((r) => r.name === HISTORY);
  const doneRow = rows.find((r) => r.name === DONE);
  const history = parseJson(historyRow?.data, isHistory, []);
  const done = new Set(parseJson(doneRow?.data, isStrings, []));

  const { path, params } = splitUrl(url);
  const setParams = (ps: Param[]): void => setUrl(joinUrl(path || '/piwebapi', ps));
  const req: ApiRequest = method === 'GET' ? { method, url } : { method, url, body };

  const run = (r: ApiRequest): void => {
    const now = clockNow();
    const res = send(r, now);
    const text = JSON.stringify(res.body);
    const bytes = new TextEncoder().encode(text).length;
    setLast({ req: r, res, ms: simulatedMs(r, bytes), bytes });
    const entry: HistoryEntry = {
      method: r.method,
      url: r.url,
      status: res.status,
      at: now,
      ...(r.body ? { body: r.body } : {}),
    };
    const next = [
      entry,
      ...history.filter((h) => !(h.method === r.method && h.url === r.url && h.body === r.body)),
    ].slice(0, 30);
    user.saveDisplay(TOOL, HISTORY, JSON.stringify(next), historyRow?.id);
    const solved = CHALLENGES.filter((c) => !done.has(c.id) && c.check(r, res, now)).map(
      (c) => c.id,
    );
    if (solved.length) {
      user.saveDisplay(TOOL, DONE, JSON.stringify([...done, ...solved]), doneRow?.id);
      setJustSolved(solved);
    } else setJustSolved([]);
  };

  const load = (m: ApiRequest['method'], u: string, b?: string, go = true): void => {
    setMethod(m);
    setUrl(u);
    setBody(b ?? '');
    if (go) run(m === 'GET' ? { method: m, url: u } : { method: m, url: u, body: b ?? '' });
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      run(req);
    }
  };

  const copy = (label: string, text: string): void => {
    void navigator.clipboard?.writeText(text).then(
      () => setCopied(label),
      () => setCopied(null),
    );
  };

  const shown = last?.req ?? req;
  const snippets = {
    curl: curlSnippet(shown),
    python: pythonSnippet(shown),
    fetch: fetchSnippet(shown),
  };
  const ok = last ? last.res.status < 400 : true;

  return (
    <ToolFrame
      title="PI Web API browser"
      status={
        <span>
          Base URL {HOST_PLACEHOLDER}/piwebapi · Ctrl+Enter sends · Links and WebIds in responses
          are clickable · Simulated server: write requests are accepted but not stored
        </span>
      }
    >
      <aside
        className="w-72 shrink-0 overflow-y-auto border-r border-tool-grid bg-surface p-3"
        aria-label="Requests"
      >
        <Tabs defaultValue="examples">
          <TabsList className="w-full">
            <TabsTrigger value="examples" className="flex-1 px-2 text-xs">
              <Sparkles className="mr-1 inline size-3.5" aria-hidden />
              Examples
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 px-2 text-xs">
              <History className="mr-1 inline size-3.5" aria-hidden />
              History
            </TabsTrigger>
            <TabsTrigger value="challenges" className="flex-1 px-2 text-xs">
              <ListChecks className="mr-1 inline size-3.5" aria-hidden />
              {done.size}/{CHALLENGES.length}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="examples">
            <ul className="grid gap-1">
              {examples.map((ex) => (
                <li key={ex.label}>
                  <button
                    type="button"
                    onClick={() => load('GET', ex.url)}
                    className="w-full rounded px-2 py-1 text-left text-xs hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <span className="font-medium">{ex.label}</span>
                    <span className="block truncate font-mono text-fg-muted">
                      {ex.url.replace('/piwebapi', '')}
                    </span>
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => load('POST', '/piwebapi/batch', BATCH_EXAMPLE)}
                  className="w-full rounded px-2 py-1 text-left text-xs hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <span className="font-medium">Batch: look up, then read twice</span>
                  <span className="block truncate font-mono text-fg-muted">POST /batch</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    const id = examples[2]?.url.split('/')[3] ?? '';
                    load(
                      'GET',
                      `/piwebapi/streams/${id}/summary?startTime=t&endTime=*&summaryType=Average&summaryDuration=1h`,
                    );
                  }}
                  className="w-full rounded px-2 py-1 text-left text-xs hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <span className="font-medium">Hourly averages today</span>
                  <span className="block truncate font-mono text-fg-muted">
                    summary?summaryDuration=1h
                  </span>
                </button>
              </li>
            </ul>
          </TabsContent>
          <TabsContent value="history">
            {history.length ? (
              <>
                <ul className="grid gap-1">
                  {history.map((h) => (
                    <li key={`${h.at}-${h.url}`}>
                      <button
                        type="button"
                        onClick={() => load(h.method, h.url, h.body, false)}
                        className="w-full rounded px-2 py-1 text-left text-xs hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-ring"
                      >
                        <span className="flex items-center gap-1">
                          <span className="font-mono font-semibold">{h.method}</span>
                          <Badge tone={h.status < 400 ? 'success' : 'danger'}>{h.status}</Badge>
                          <span className="ml-auto text-fg-muted">
                            {new Date(h.at).toLocaleTimeString()}
                          </span>
                        </span>
                        <span className="block truncate font-mono text-fg-muted">
                          {h.url.replace('/piwebapi', '')}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2"
                  onClick={() => historyRow && user.deleteDisplay(historyRow.id)}
                >
                  <Trash2 aria-hidden /> Clear history
                </Button>
              </>
            ) : (
              <p className="text-xs text-fg-muted">
                Requests you send are kept here, newest first. Click one to load it.
              </p>
            )}
          </TabsContent>
          <TabsContent value="challenges">
            <ol className="grid gap-2">
              {CHALLENGES.map((c) => {
                const isDone = done.has(c.id);
                return (
                  <li key={c.id} className="rounded border border-border p-2 text-xs">
                    <div className="flex items-start gap-1.5 font-medium">
                      {isDone ? (
                        <CheckCircle2
                          className="mt-0.5 size-3.5 shrink-0 text-tool-ok"
                          aria-label="Done"
                        />
                      ) : (
                        <Circle
                          className="mt-0.5 size-3.5 shrink-0 text-fg-muted"
                          aria-label="Not done"
                        />
                      )}
                      {c.title}
                    </div>
                    <p className="mt-1 text-fg-muted">{c.goal}</p>
                    <details className="mt-1">
                      <summary className="cursor-pointer text-primary">Hint</summary>
                      <p className="mt-1 font-mono break-all text-fg-muted">{c.hint}</p>
                    </details>
                  </li>
                );
              })}
            </ol>
            <p className="mt-2 text-xs text-fg-muted">
              Each challenge is checked automatically against your last response.
            </p>
            {doneRow ? (
              <Button
                size="sm"
                variant="ghost"
                className="mt-1"
                onClick={() => user.deleteDisplay(doneRow.id)}
              >
                Reset challenges
              </Button>
            ) : null}
          </TabsContent>
        </Tabs>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-3 overflow-y-auto p-3" onKeyDown={onKey}>
        <div className="flex flex-wrap items-center gap-2">
          <Label htmlFor="wa-method" className="sr-only">
            HTTP method
          </Label>
          <Select
            id="wa-method"
            value={method}
            onChange={(e) => setMethod(e.target.value as ApiRequest['method'])}
            className="h-9 w-28 font-mono text-xs"
          >
            {METHODS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </Select>
          <div className="flex min-w-0 flex-1 items-center rounded-md border border-border bg-surface focus-within:outline-2 focus-within:outline-ring">
            <span className="pl-2 font-mono text-xs text-fg-muted select-none">
              {HOST_PLACEHOLDER}
            </span>
            <label htmlFor="wa-url" className="sr-only">
              Request URL
            </label>
            <input
              id="wa-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              spellCheck={false}
              className="h-9 min-w-0 flex-1 bg-transparent pr-2 font-mono text-xs outline-none"
            />
          </div>
          <Button onClick={() => run(req)} aria-keyshortcuts="Control+Enter">
            <Send aria-hidden /> Send
          </Button>
        </div>

        <fieldset className="rounded border border-border bg-surface p-2">
          <legend className="px-1 text-xs font-semibold text-fg-muted">Query parameters</legend>
          {params.length === 0 ? (
            <p className="px-1 text-xs text-fg-muted">No parameters.</p>
          ) : null}
          <div className="grid gap-1">
            {params.map((p, i) => (
              <div key={i} className="flex items-center gap-1">
                <label className="sr-only" htmlFor={`wa-k${i}`}>
                  Parameter {i + 1} name
                </label>
                <input
                  id={`wa-k${i}`}
                  value={p.key}
                  onChange={(e) =>
                    setParams(params.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))
                  }
                  className="h-7 w-40 rounded border border-border bg-surface px-2 font-mono text-xs focus-visible:outline-2 focus-visible:outline-ring"
                />
                <span className="text-fg-muted">=</span>
                <label className="sr-only" htmlFor={`wa-v${i}`}>
                  Parameter {i + 1} value
                </label>
                <input
                  id={`wa-v${i}`}
                  value={p.value}
                  onChange={(e) =>
                    setParams(params.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))
                  }
                  className="h-7 min-w-0 flex-1 rounded border border-border bg-surface px-2 font-mono text-xs focus-visible:outline-2 focus-visible:outline-ring"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  aria-label={`Remove parameter ${p.key || i + 1}`}
                  onClick={() => setParams(params.filter((_, j) => j !== i))}
                >
                  <X aria-hidden />
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setParams([...params, { key: 'name', value: '' }])}
            >
              <Plus aria-hidden /> Add parameter
            </Button>
            {[
              'startTime',
              'endTime',
              'interval',
              'maxCount',
              'selectedFields',
              'summaryType',
              'summaryDuration',
            ]
              .filter((k) => !params.some((p) => p.key.toLowerCase() === k.toLowerCase()))
              .map((k) => (
                <Button
                  key={k}
                  size="sm"
                  variant="ghost"
                  className="font-mono text-xs"
                  onClick={() => setParams([...params, { key: k, value: '' }])}
                >
                  +{k}
                </Button>
              ))}
          </div>
        </fieldset>

        {method !== 'GET' ? (
          <div className="grid gap-1">
            <Label htmlFor="wa-body" className="text-xs">
              Request body (JSON). Write requests also need the X-Requested-With header, which the
              code snippets include.
            </Label>
            <Textarea
              id="wa-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              spellCheck={false}
              className="min-h-32 font-mono text-xs"
            />
          </div>
        ) : null}

        {justSolved.length ? (
          <p
            role="status"
            className="flex items-center gap-2 rounded bg-success-soft px-3 py-2 text-sm text-success"
          >
            <CheckCircle2 className="size-4" aria-hidden />
            Challenge solved:{' '}
            {justSolved.map((id) => CHALLENGES.find((c) => c.id === id)?.title).join(', ')}
          </p>
        ) : null}

        <section
          aria-label="Response"
          className="flex min-h-64 flex-col rounded border border-border bg-surface"
        >
          <div
            className="flex flex-wrap items-center gap-3 border-b border-border px-3 py-2 text-xs"
            aria-live="polite"
          >
            {last ? (
              <>
                <span
                  className={cn(
                    'font-mono font-semibold',
                    ok ? 'text-tool-ok' : 'text-tool-alarm-hi',
                  )}
                >
                  HTTP/1.1 {last.res.status} {last.res.statusText}
                </span>
                <span className="text-fg-muted">{last.ms} ms (simulated)</span>
                <span className="text-fg-muted">{formatBytes(last.bytes)}</span>
                <span className="truncate font-mono text-fg-muted">
                  {last.req.method} {last.req.url}
                </span>
              </>
            ) : (
              <span className="text-fg-muted">
                Send a request to see the response. Try an example on the left.
              </span>
            )}
          </div>
          <Tabs value={view} onValueChange={setView} className="flex min-h-0 flex-1 flex-col p-2">
            <div className="flex flex-wrap items-center gap-2">
              <TabsList>
                <TabsTrigger value="pretty" className="text-xs">
                  Pretty
                </TabsTrigger>
                <TabsTrigger value="raw" className="text-xs">
                  Raw
                </TabsTrigger>
                <TabsTrigger value="headers" className="text-xs">
                  Headers
                </TabsTrigger>
                <TabsTrigger value="code" className="text-xs">
                  Code snippet
                </TabsTrigger>
              </TabsList>
              {last ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-auto"
                  onClick={() => copy('json', JSON.stringify(last.res.body, null, 2))}
                >
                  <Copy aria-hidden /> {copied === 'json' ? 'Copied' : 'Copy JSON'}
                </Button>
              ) : null}
            </div>
            <TabsContent value="pretty" className="mt-2 max-h-[32rem] overflow-auto">
              {last ? (
                <JsonTree
                  value={last.res.body}
                  onNavigate={(u) => load('GET', u)}
                  onDecode={setWebIdInput}
                />
              ) : null}
            </TabsContent>
            <TabsContent value="raw" className="mt-2 max-h-[32rem] overflow-auto">
              {last ? (
                <pre className="font-mono text-xs whitespace-pre-wrap break-all">
                  {JSON.stringify(last.res.body)}
                </pre>
              ) : null}
            </TabsContent>
            <TabsContent value="headers" className="mt-2">
              {last ? (
                <pre className="font-mono text-xs">
                  {[
                    `HTTP/1.1 ${last.res.status} ${last.res.statusText}`,
                    'Content-Type: application/json; charset=utf-8',
                    `Content-Length: ${last.bytes}`,
                    'Cache-Control: no-cache',
                  ].join('\n')}
                </pre>
              ) : null}
            </TabsContent>
            <TabsContent value="code" className="mt-2 grid gap-3">
              <p className="text-xs text-fg-muted">
                The {last ? 'last sent' : 'current'} request for a real server. Replace the host,
                user and password; prefer Kerberos or OpenID Connect over Basic in production.
              </p>
              {(
                [
                  ['curl', 'curl'],
                  ['python', 'Python (requests)'],
                  ['fetch', 'JavaScript (fetch)'],
                ] as const
              ).map(([k, label]) => (
                <div key={k}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold">{label}</h3>
                    <Button size="sm" variant="ghost" onClick={() => copy(k, snippets[k])}>
                      <Copy aria-hidden /> {copied === k ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                  <pre className="overflow-x-auto rounded bg-surface-2 p-2 font-mono text-xs">
                    {snippets[k]}
                  </pre>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </section>
      </div>

      <aside
        className="hidden w-80 shrink-0 overflow-y-auto border-l border-tool-grid bg-surface p-3 xl:block"
        aria-label="WebID decoder"
      >
        <WebIdDecoder value={webIdInput} onChange={setWebIdInput} />
        <p className="mt-4 text-xs text-fg-muted">
          Navigation tip: every response carries <code>Links</code>. Follow them instead of building
          URLs by hand: that is how PI Web API is meant to be explored.
        </p>
        <Link
          to="/learn"
          className="mt-2 inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
        >
          <BookOpen className="size-3.5" aria-hidden /> Lessons
        </Link>
      </aside>
    </ToolFrame>
  );
}
