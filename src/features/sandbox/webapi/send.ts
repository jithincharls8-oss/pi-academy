/**
 * The browser's entry point to the simulated PI Web API. It forwards to the core simulator
 * (`handle`) and adds two documented features the core does not model yet:
 * - `POST /batch` (Batch controller, Execute): named sub-requests with Method, Resource,
 *   Content, ParentIds, Parameters (JSONPath such as `$.1.Content.WebId`) and RequestTemplate.
 * - `summaryDuration` on `/streams/{webId}/summary`: one summary per interval.
 * Both follow research/int.md; details the research leaves open (status codes of the batch
 * envelope, RequestTemplate shape) are simplified.
 */
import { handle, type ApiRequest, type ApiResponse } from '@/core/sim/webapi';
import { formatPiTime, parseTimeRange, TimeParseError } from '@/core/sim/time';
import { joinUrl, splitUrl } from './request';

const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' };

const bad = (status: number, statusText: string, message: string): ApiResponse => ({
  status,
  statusText,
  body: { Errors: [message] },
});

export function send(req: ApiRequest, now: number): ApiResponse {
  const { path, params } = splitUrl(req.url);
  const segs = path
    .split('/')
    .filter(Boolean)
    .map((s) => s.toLowerCase());
  if (segs[0] === 'piwebapi' && segs[1] === 'batch' && segs.length === 2) {
    if (req.method !== 'POST') {
      return bad(
        405,
        'Method Not Allowed',
        'The Batch controller has a single action, Execute (POST /piwebapi/batch). GET is not supported.',
      );
    }
    return batch(req.body ?? '', now);
  }
  const summaryDuration = params.find((p) => p.key.toLowerCase() === 'summaryduration');
  if (req.method === 'GET' && segs[1] === 'streams' && segs[3] === 'summary' && summaryDuration) {
    return summaryByDuration(path, params, summaryDuration.value, now);
  }
  return handle(req, now);
}

/* ---------------------------------------------------------------- summaryDuration */

function durationMs(s: string): number | null {
  const m = /^(\d+(?:\.\d+)?)\s*(s|m|h|d)$/i.exec(s.trim());
  if (!m) return null;
  const unit = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[
    (m[2] ?? 's').toLowerCase() as 's' | 'm' | 'h' | 'd'
  ];
  return Number(m[1]) * unit;
}

function summaryByDuration(
  path: string,
  params: { key: string; value: string }[],
  duration: string,
  now: number,
): ApiResponse {
  const ms = durationMs(duration);
  if (!ms || ms < 1000) {
    return bad(
      400,
      'Bad Request',
      `Invalid summaryDuration "${duration}". Use a value such as 1h.`,
    );
  }
  const get = (k: string): string | undefined =>
    params.find((p) => p.key.toLowerCase() === k.toLowerCase())?.value;
  let range: { start: number; end: number };
  try {
    range = parseTimeRange(get('startTime') ?? '*-1d', get('endTime') ?? '*', now);
  } catch (e) {
    return bad(400, 'Bad Request', e instanceof TimeParseError ? e.message : 'Invalid time.');
  }
  if ((range.end - range.start) / ms > 1000) {
    return bad(
      400,
      'Bad Request',
      'More than 1000 summary intervals: use a longer summaryDuration.',
    );
  }
  const rest = params.filter(
    (p) => !['starttime', 'endtime', 'summaryduration'].includes(p.key.toLowerCase()),
  );
  const items: unknown[] = [];
  let first: Record<string, unknown> | null = null;
  for (let t = range.start; t < range.end && t < now; t += ms) {
    const url = joinUrl(path, [
      ...rest,
      { key: 'startTime', value: formatPiTime(t) },
      { key: 'endTime', value: formatPiTime(Math.min(t + ms, range.end)) },
    ]);
    const r = handle({ method: 'GET', url }, now);
    if (r.status !== 200) return r;
    const body = r.body as Record<string, unknown>;
    first ??= body;
    const its = body['Items'];
    if (Array.isArray(its)) items.push(...its);
  }
  return {
    status: 200,
    statusText: 'OK',
    body: { ...(first ?? { Links: {} }), Items: items },
  };
}

/* ---------------------------------------------------------------- batch */

interface SubRequest {
  Method: ApiRequest['method'];
  Resource: string;
  Content?: string;
  ParentIds?: string[];
  Parameters?: string[];
  RequestTemplate?: { Resource: string };
}

interface SubResponse {
  Status: number;
  Headers: Record<string, string>;
  Content: unknown;
}

const METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

function asSubRequest(v: unknown): SubRequest | string {
  if (!v || typeof v !== 'object') return 'Each batch entry must be an object.';
  const o = v as Record<string, unknown>;
  const method = String(o['Method'] ?? 'GET').toUpperCase();
  if (!METHODS.has(method)) return `Unsupported Method "${method}".`;
  const tpl = o['RequestTemplate'];
  const tplRes =
    tpl && typeof tpl === 'object' ? (tpl as Record<string, unknown>)['Resource'] : undefined;
  if (typeof o['Resource'] !== 'string' && typeof tplRes !== 'string')
    return 'Each batch entry needs a Resource (or a RequestTemplate with a Resource).';
  const strings = (x: unknown): string[] | undefined =>
    Array.isArray(x) ? x.map((s) => String(s)) : undefined;
  const content = o['Content'];
  return {
    Method: method as ApiRequest['method'],
    Resource: typeof o['Resource'] === 'string' ? o['Resource'] : '',
    ...(content === undefined
      ? {}
      : { Content: typeof content === 'string' ? content : JSON.stringify(content) }),
    ...(strings(o['ParentIds']) ? { ParentIds: strings(o['ParentIds']) } : {}),
    ...(strings(o['Parameters']) ? { Parameters: strings(o['Parameters']) } : {}),
    ...(typeof tplRes === 'string' ? { RequestTemplate: { Resource: tplRes } } : {}),
  };
}

/** Evaluate the JSONPath subset PI Web API batch supports: $, .name, [n] and [*]. */
export function jsonPath(root: unknown, expr: string): unknown[] {
  const e = expr.trim();
  if (!e.startsWith('$')) return [];
  const tokens: (string | number | '*')[] = [];
  const re = /\.([^.[\]]+)|\[(\d+|\*)\]/gy;
  re.lastIndex = 1;
  let pos = 1;
  while (pos < e.length) {
    re.lastIndex = pos;
    const m = re.exec(e);
    if (!m) return [];
    if (m[1] !== undefined) tokens.push(m[1]);
    else if (m[2] === '*') tokens.push('*');
    else tokens.push(Number(m[2]));
    pos = re.lastIndex;
  }
  let cur: unknown[] = [root];
  for (const t of tokens) {
    const next: unknown[] = [];
    for (const c of cur) {
      if (t === '*') {
        if (Array.isArray(c)) next.push(...c);
        else if (c && typeof c === 'object') next.push(...Object.values(c));
      } else if (typeof t === 'number') {
        if (Array.isArray(c) && t < c.length) next.push(c[t]);
      } else if (c && typeof c === 'object' && !Array.isArray(c)) {
        const rec = c as Record<string, unknown>;
        const key = Object.keys(rec).find((k) => k.toLowerCase() === t.toLowerCase());
        if (key !== undefined) next.push(rec[key]);
      }
    }
    cur = next;
  }
  return cur;
}

function batch(body: string, now: number): ApiResponse {
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return bad(400, 'Bad Request', 'The batch body is not valid JSON (check for trailing commas).');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return bad(400, 'Bad Request', 'A batch body is a JSON object of named sub-requests.');
  }
  const entries = Object.entries(parsed as Record<string, unknown>);
  if (entries.length === 0) return bad(400, 'Bad Request', 'The batch has no sub-requests.');
  const reqs = new Map<string, SubRequest | string>(entries.map(([k, v]) => [k, asSubRequest(v)]));
  const done = new Map<string, SubResponse>();
  const visiting = new Set<string>();
  const error = (status: number, message: string): SubResponse => ({
    Status: status,
    Headers: JSON_HEADERS,
    Content: { Errors: [message] },
  });

  const remember = (id: string, r: SubResponse): SubResponse => {
    done.set(id, r);
    return r;
  };

  const runOne = (id: string): SubResponse => {
    const hit = done.get(id);
    if (hit) return hit;
    const r = reqs.get(id);
    if (r === undefined)
      return error(400, `ParentIds refers to "${id}", which is not in the batch.`);
    if (typeof r === 'string') return remember(id, error(400, r));
    if (visiting.has(id)) return remember(id, error(400, `Circular ParentIds involving "${id}".`));
    visiting.add(id);
    for (const p of r.ParentIds ?? []) {
      const pr = runOne(p);
      if (pr.Status >= 400) {
        visiting.delete(id);
        return remember(id, error(409, `Parent request "${p}" failed (status ${pr.Status}).`));
      }
    }
    visiting.delete(id);
    const values = (r.Parameters ?? []).map((expr) =>
      jsonPath(Object.assign(Object.create(null) as object, Object.fromEntries(done)), expr),
    );
    const missing = values.findIndex((v) => v.length === 0);
    if (missing !== -1) {
      return remember(
        id,
        error(
          400,
          `Parameter "${r.Parameters?.[missing]}" matched nothing. Did you list the parent in ParentIds?`,
        ),
      );
    }
    const fill = (template: string, pick: (vals: unknown[]) => unknown): string =>
      values.reduce<string>(
        (res, vals, i) => res.split(`{${i}}`).join(String(pick(vals))),
        template,
      );
    const exec = (resource: string): SubResponse => {
      const res = handle({ method: r.Method, url: resource, body: r.Content }, now);
      return { Status: res.status, Headers: JSON_HEADERS, Content: res.body };
    };
    if (r.RequestTemplate) {
      const n = Math.max(...values.map((v) => v.length), 1);
      const items: SubResponse[] = [];
      for (let i = 0; i < n; i++) {
        items.push(
          exec(fill(r.RequestTemplate.Resource, (vals) => vals[Math.min(i, vals.length - 1)])),
        );
      }
      const allOk = items.every((x) => x.Status < 400);
      return remember(id, {
        Status: allOk ? 200 : 207,
        Headers: JSON_HEADERS,
        Content: { Items: items },
      });
    }
    if (values.some((v) => v.length > 1)) {
      return remember(
        id,
        error(
          400,
          'A parameter matched several values; use a RequestTemplate to repeat the request for each.',
        ),
      );
    }
    return remember(id, exec(fill(r.Resource, (vals) => vals[0])));
  };

  // A null-prototype object keeps ids such as "__proto__" or "toString" as ordinary keys.
  const out = Object.create(null) as Record<string, SubResponse>;
  for (const [id] of entries) out[id] = runOne(id);
  return { status: 207, statusText: 'Multi-Status', body: out };
}
