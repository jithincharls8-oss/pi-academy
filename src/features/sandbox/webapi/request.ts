/**
 * Request-builder helpers: split a PI Web API URL into editable query parameters and back,
 * render the request as curl / Python requests / JavaScript fetch, and a simulated timing.
 */
import type { ApiRequest } from '@/core/sim/webapi';

export interface Param {
  key: string;
  value: string;
}

export const HOST_PLACEHOLDER = 'https://your-server';

function decode(s: string): string {
  try {
    return decodeURIComponent(s.replace(/\+/g, ' '));
  } catch {
    return s;
  }
}

/** Encode a query component but keep characters PI users expect to read: \ ; | : , * ' $ */
export function encodeParam(s: string): string {
  return encodeURIComponent(s)
    .replace(/%5C/gi, '\\')
    .replace(/%3B/gi, ';')
    .replace(/%7C/gi, '|')
    .replace(/%3A/gi, ':')
    .replace(/%2C/gi, ',')
    .replace(/%24/g, '$');
}

/** Path (starting /piwebapi) and query parameters of a URL; the host is dropped. */
export function splitUrl(url: string): { path: string; params: Param[] } {
  const raw = url.trim().replace(/^https?:\/\/[^/]+/i, '');
  const q = raw.indexOf('?');
  const path = q === -1 ? raw : raw.slice(0, q);
  const query = q === -1 ? '' : raw.slice(q + 1);
  const params = query
    .split('&')
    .filter((kv) => kv !== '')
    .map((kv) => {
      const i = kv.indexOf('=');
      return i === -1
        ? { key: decode(kv), value: '' }
        : { key: decode(kv.slice(0, i)), value: decode(kv.slice(i + 1)) };
    });
  return { path, params };
}

export function joinUrl(path: string, params: Param[]): string {
  const qs = params
    .filter((p) => p.key !== '')
    .map((p) => `${encodeParam(p.key)}=${encodeParam(p.value)}`)
    .join('&');
  return qs ? `${path}?${qs}` : path;
}

/** Path relative to the /piwebapi root, e.g. "/streams/{id}/value" -> "streams/{id}/value". */
export function controllerPath(url: string): string[] {
  return splitUrl(url)
    .path.split('/')
    .filter(Boolean)
    .slice(1)
    .map((s) => decode(s));
}

export function param(url: string, name: string): string | null {
  const p = splitUrl(url).params.find((x) => x.key.toLowerCase() === name.toLowerCase());
  return p ? p.value : null;
}

/* ---------------------------------------------------------------- code snippets */

const isWrite = (m: ApiRequest['method']): boolean => m !== 'GET';

function shellQuote(s: string): string {
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

export function curlSnippet(req: ApiRequest): string {
  const { path, params } = splitUrl(req.url);
  const qs = params
    .filter((p) => p.key)
    .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
    .join('&');
  const url = `${HOST_PLACEHOLDER}${path}${qs ? `?${qs}` : ''}`;
  const lines = [
    `curl -X ${req.method} ${shellQuote(url)}`,
    `  -u 'user:password'`,
    `  -H 'Accept: application/json'`,
  ];
  if (isWrite(req.method)) {
    lines.push(`  -H 'X-Requested-With: XMLHttpRequest'`);
    if (req.body) {
      lines.push(`  -H 'Content-Type: application/json'`);
      lines.push(`  --data ${shellQuote(req.body)}`);
    }
  }
  return lines.join(' \\\n');
}

export function pythonSnippet(req: ApiRequest): string {
  const { path, params } = splitUrl(req.url);
  const out = [
    'import requests',
    'from requests.auth import HTTPBasicAuth',
    '',
    `url = ${JSON.stringify(`${HOST_PLACEHOLDER}${path}`)}`,
  ];
  const ps = params.filter((p) => p.key);
  if (ps.length) {
    out.push('params = [');
    for (const p of ps) out.push(`    (${JSON.stringify(p.key)}, ${JSON.stringify(p.value)}),`);
    out.push(']');
  }
  const headers = isWrite(req.method)
    ? '{"Accept": "application/json", "X-Requested-With": "XMLHttpRequest", "Content-Type": "application/json"}'
    : '{"Accept": "application/json"}';
  out.push(`headers = ${headers}`);
  if (isWrite(req.method) && req.body) out.push(`body = ${JSON.stringify(req.body)}`);
  out.push('');
  out.push('response = requests.request(');
  out.push(`    ${JSON.stringify(req.method)},`);
  out.push('    url,');
  if (ps.length) out.push('    params=params,');
  out.push('    headers=headers,');
  if (isWrite(req.method) && req.body) out.push('    data=body,');
  out.push('    auth=HTTPBasicAuth("user", "password"),');
  out.push(')');
  out.push('response.raise_for_status()');
  out.push('print(response.json())');
  return out.join('\n');
}

export function fetchSnippet(req: ApiRequest): string {
  const { path, params } = splitUrl(req.url);
  const ps = params.filter((p) => p.key);
  const out: string[] = [];
  if (ps.length) {
    out.push('const params = new URLSearchParams([');
    for (const p of ps) out.push(`  [${JSON.stringify(p.key)}, ${JSON.stringify(p.value)}],`);
    out.push(']);');
  }
  const url = JSON.stringify(`${HOST_PLACEHOLDER}${path}`);
  out.push(`const url = ${url}${ps.length ? ' + "?" + params' : ''};`);
  out.push('const response = await fetch(url, {');
  out.push(`  method: ${JSON.stringify(req.method)},`);
  out.push('  headers: {');
  out.push('    Accept: "application/json",');
  out.push('    Authorization: "Basic " + btoa("user:password"),');
  if (isWrite(req.method)) {
    out.push('    "X-Requested-With": "XMLHttpRequest",');
    out.push('    "Content-Type": "application/json",');
  }
  out.push('  },');
  if (isWrite(req.method) && req.body) out.push(`  body: ${JSON.stringify(req.body)},`);
  out.push('});');
  out.push('if (!response.ok) throw new Error(`HTTP ${response.status}`);');
  out.push('const data = await response.json();');
  out.push('console.log(data);');
  return out.join('\n');
}

/* ---------------------------------------------------------------- simulated timing */

/** A plausible, deterministic response time for the simulated server. */
export function simulatedMs(req: ApiRequest, bytes: number): number {
  let h = 0;
  for (const c of req.method + req.url) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const path = req.url.toLowerCase();
  const data = /\/(recorded|interpolated|plot|summary)/.test(path) ? 18 : 0;
  const batch = path.includes('/batch') ? 25 : 0;
  return 9 + data + batch + Math.round(bytes / 6000) + (h % 9);
}

export function formatBytes(n: number): string {
  return n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`;
}
