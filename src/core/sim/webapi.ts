/**
 * A simulated PI Web API over the synthetic plant. Routes, query parameters and response
 * shapes follow the PI Web API 2018 swagger specification and the PI World 2020 lab
 * (research/int.md). WebIDs use the WebID 2.0 PathOnly layout ("P1" + object marker + owner
 * marker + base64url path); encoding details such as case handling are simplified.
 */
import {
  recorded,
  interpolated,
  plotValues,
  snapshot,
  summary,
  SUMMARY_TYPES,
  formatValue,
  type SummaryType,
} from './data';
import type { TimedValue } from './compression';
import { allElements, plant, type SimAttribute, type SimElement, type SimPoint } from './plant';
import { parseTimeRange, TimeParseError } from './time';

export interface ApiRequest {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** path plus query, e.g. `/piwebapi/points?path=\\PISRV01\RB.P101.FLOW` */
  url: string;
  body?: string;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  body: unknown;
}

const BASE = 'https://pi-academy.local/piwebapi';

type Marker = 'DS' | 'DP' | 'RS' | 'RD' | 'Em' | 'Ab';

function b64url(s: string): string {
  const bytes = new TextEncoder().encode(s.toUpperCase());
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(s: string): string | null {
  try {
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
    return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  } catch {
    return null;
  }
}

export function webId(marker: Marker, path: string): string {
  const owner = marker === 'Ab' ? 'E' : '';
  // The encoded path leaves out the leading \\ (research/int.md, int.webapi-basics).
  return `P1${marker}${owner}${b64url(path.replace(/^\\\\/, ''))}`;
}

function decodeWebId(id: string): { marker: Marker; path: string } | null {
  const m = /^P1(DS|DP|RS|RD|Em|Ab)(E?)([A-Za-z0-9_-]+)$/.exec(id);
  if (!m) return null;
  const raw = fromB64url(m[3] ?? '');
  if (!raw) return null;
  const path = raw.startsWith('\\\\') ? raw : `\\\\${raw}`;
  return { marker: m[1] as Marker, path };
}

/* ---------------------------------------------------------------- objects */

const m = () => plant();
const dsPath = (): string => `\\\\${m().dataServer}`;
const pointPath = (p: SimPoint): string => `${dsPath()}\\${p.tag}`;
const asPath = (): string => `\\\\${m().afServer}`;
const dbPath = (): string => `${asPath()}\\${m().database}`;

function link(path: string): string {
  return `${BASE}${path}`;
}

function pointJson(p: SimPoint, i: number) {
  const id = webId('DP', pointPath(p));
  return {
    WebId: id,
    Id: i + 1,
    Name: p.tag,
    Path: pointPath(p),
    Descriptor: p.descriptor,
    PointClass: 'classic',
    PointType: p.pointtype,
    DigitalSetName: p.digitalset,
    Span: p.span,
    Zero: p.zero,
    EngineeringUnits: p.engunits,
    Step: p.step,
    Future: false,
    DisplayDigits: -5,
    Links: {
      Self: link(`/points/${id}`),
      DataServer: link(`/dataservers/${webId('DS', dsPath())}`),
      Attributes: link(`/points/${id}/attributes`),
      Value: link(`/streams/${id}/value`),
      InterpolatedData: link(`/streams/${id}/interpolated`),
      RecordedData: link(`/streams/${id}/recorded`),
      PlotData: link(`/streams/${id}/plot`),
      SummaryData: link(`/streams/${id}/summary`),
    },
  };
}

function elementJson(e: SimElement) {
  const id = webId('Em', e.path);
  return {
    WebId: id,
    Id: guidFor(e.path),
    Name: e.name,
    Description: e.description,
    Path: e.path,
    TemplateName: e.template ?? '',
    HasChildren: e.children.length > 0,
    CategoryNames: [],
    ExtendedProperties: {},
    Links: {
      Self: link(`/elements/${id}`),
      Elements: link(`/elements/${id}/elements`),
      Attributes: link(`/elements/${id}/attributes`),
      Database: link(`/assetdatabases/${webId('RD', dbPath())}`),
      Value: link(`/streamsets/${id}/value`),
    },
  };
}

function attrPath(e: SimElement, a: SimAttribute): string {
  return `${e.path}|${a.name}`;
}

function attributeJson(e: SimElement, a: SimAttribute) {
  const id = webId('Ab', attrPath(e, a));
  return {
    WebId: id,
    Id: guidFor(attrPath(e, a)),
    Name: a.name,
    Description: a.description,
    Path: attrPath(e, a),
    Type: a.type === 'Digital' ? 'EnumerationValue' : a.type,
    TypeQualifier: '',
    DefaultUnitsName: a.uom,
    DataReferencePlugIn: a.dataReference === 'None' ? '' : a.dataReference,
    ConfigString: a.configString,
    IsConfigurationItem: a.dataReference === 'None',
    IsExcluded: false,
    IsHidden: false,
    IsManualDataEntry: false,
    HasChildren: false,
    CategoryNames: [a.category],
    Step: a.type === 'Digital',
    Links: {
      Self: link(`/attributes/${id}`),
      Element: link(`/elements/${webId('Em', e.path)}`),
      Value: link(`/streams/${id}/value`),
      ...(a.tag
        ? {
            InterpolatedData: link(`/streams/${id}/interpolated`),
            RecordedData: link(`/streams/${id}/recorded`),
            PlotData: link(`/streams/${id}/plot`),
            SummaryData: link(`/streams/${id}/summary`),
            Point: link(`/points/${webId('DP', `${dsPath()}\\${a.tag}`)}`),
          }
        : {}),
    },
  };
}

function guidFor(s: string): string {
  let h = 0x811c9dc5;
  const hex: string[] = [];
  for (let round = 0; round < 4; round++) {
    for (const c of `${round}|${s}`) {
      h ^= c.charCodeAt(0);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    hex.push(h.toString(16).padStart(8, '0'));
  }
  const x = hex.join('');
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20, 32)}`;
}

/* ---------------------------------------------------------------- lookup */

function findByPath(path: string): {
  point?: SimPoint;
  element?: SimElement;
  attr?: { e: SimElement; a: SimAttribute };
} {
  const up = path.toUpperCase();
  const p = m().points.find((x) => pointPath(x).toUpperCase() === up);
  if (p) return { point: p };
  if (up.includes('|')) {
    const [ep, an] = up.split('|') as [string, string];
    const e = allElements().find((x) => x.path.toUpperCase() === ep);
    const a = e?.attributes.find((x) => x.name.toUpperCase() === an);
    if (e && a) return { attr: { e, a } };
    return {};
  }
  const e = allElements().find((x) => x.path.toUpperCase() === up);
  return e ? { element: e } : {};
}

/* ---------------------------------------------------------------- values */

function valueJson(p: SimPoint, v: TimedValue) {
  const digital = p.pointtype === 'Digital';
  return {
    Timestamp: new Date(v.t).toISOString(),
    Value: digital
      ? { Name: formatValue(p, v.v), Value: Math.round(v.v), IsSystem: false }
      : p.pointtype === 'Int32'
        ? Math.round(v.v)
        : Math.round(v.v * 1000) / 1000,
    UnitsAbbreviation: p.engunits,
    Good: true,
    Questionable: false,
    Substituted: false,
    Annotated: false,
  };
}

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const STATUS_TEXT: Record<number, string> = {
  200: 'OK',
  202: 'Accepted',
  400: 'Bad Request',
  404: 'Not Found',
  405: 'Method Not Allowed',
};

function streamPoint(id: string): {
  point: SimPoint | null;
  staticAttr?: { e: SimElement; a: SimAttribute };
} {
  const d = decodeWebId(id);
  if (!d) throw new HttpError(400, `Unknown or malformed WebID "${id}".`);
  const found = findByPath(d.path);
  if (found.point) return { point: found.point };
  if (found.attr) {
    const tag = found.attr.a.tag;
    const p = tag ? (m().points.find((x) => x.tag === tag) ?? null) : null;
    return p ? { point: p } : { point: null, staticAttr: found.attr };
  }
  throw new HttpError(404, `No stream found for WebID "${id}".`);
}

function range(q: URLSearchParams, now: number, defStart: string): { start: number; end: number } {
  try {
    return parseTimeRange(
      q.get('startTime') ?? q.get('starttime') ?? defStart,
      q.get('endTime') ?? q.get('endtime') ?? '*',
      now,
    );
  } catch (e) {
    throw new HttpError(400, e instanceof TimeParseError ? e.message : 'Invalid time.');
  }
}

function intervalMs(s: string): number {
  const mm = /^(\d+(?:\.\d+)?)\s*(s|m|h|d)$/i.exec(s.trim());
  if (!mm) throw new HttpError(400, `Invalid interval "${s}". Use a value such as 1h or 15m.`);
  const unit = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[
    (mm[2] ?? 's').toLowerCase() as 's'
  ];
  return Number(mm[1]) * unit;
}

function getParam(q: URLSearchParams, name: string): string | null {
  for (const [k, v] of q) if (k.toLowerCase() === name.toLowerCase()) return v;
  return null;
}

function applySelectedFields(body: unknown, fields: string | null): unknown {
  if (!fields) return body;
  const paths = fields.split(';').map((f) => f.trim().split('.'));
  const pick = (obj: unknown, ps: string[][]): unknown => {
    if (Array.isArray(obj)) return obj.map((x) => pick(x, ps));
    if (!obj || typeof obj !== 'object') return obj;
    const out: Record<string, unknown> = {};
    const rec = obj as Record<string, unknown>;
    for (const p of ps) {
      const [head, ...rest] = p;
      if (!head) continue;
      const key = Object.keys(rec).find((k) => k.toLowerCase() === head.toLowerCase());
      if (!key) continue;
      const sub = ps
        .filter((x) => x[0]?.toLowerCase() === head.toLowerCase())
        .map((x) => x.slice(1));
      out[key] = rest.length
        ? pick(
            rec[key],
            sub.filter((x) => x.length),
          )
        : rec[key];
    }
    return out;
  };
  return pick(body, paths);
}

/* ---------------------------------------------------------------- router */

export function handle(req: ApiRequest, now: number): ApiResponse {
  try {
    const body = route(req, now);
    const status = req.method === 'POST' ? 202 : 200;
    return { status, statusText: STATUS_TEXT[status] ?? '', body };
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 400;
    return {
      status,
      statusText: STATUS_TEXT[status] ?? 'Error',
      body: { Errors: [e instanceof Error ? e.message : String(e)] },
    };
  }
}

function route(req: ApiRequest, now: number): unknown {
  const raw = req.url.trim().replace(/^https?:\/\/[^/]+/i, '');
  const qIndex = raw.indexOf('?');
  const pathPart = (qIndex === -1 ? raw : raw.slice(0, qIndex)).replace(/\/+$/, '');
  // Keep backslashes in path= values: URLSearchParams would otherwise be fine, but '+' is a space.
  const q = new URLSearchParams(qIndex === -1 ? '' : raw.slice(qIndex + 1));
  const segs = pathPart.split('/').filter(Boolean);
  if (segs[0]?.toLowerCase() !== 'piwebapi') {
    throw new HttpError(404, 'PI Web API URLs start with /piwebapi.');
  }
  const [, c1 = '', id = '', c2 = ''] = segs.map((s) => decodeURIComponent(s));
  const ctrl = c1.toLowerCase();
  const sub = c2.toLowerCase();
  const fields = getParam(q, 'selectedFields');

  if (req.method !== 'GET') {
    if (req.method === 'POST' && ctrl === 'streams' && (sub === 'value' || sub === 'recorded')) {
      streamPoint(id);
      return { Message: 'Simulated write accepted. The sandbox does not store written values.' };
    }
    throw new HttpError(405, `${req.method} is not supported by this simulated endpoint.`);
  }

  const out = ((): unknown => {
    if (!ctrl) {
      return {
        Links: {
          Self: link(''),
          AssetServers: link('/assetservers'),
          DataServers: link('/dataservers'),
          Omf: link('/omf'),
          Search: link('/search'),
          System: link('/system'),
        },
      };
    }
    switch (ctrl) {
      case 'system':
        return {
          ProductTitle: 'PI Web API (PI Academy simulation)',
          ProductVersion: 'simulated',
          Links: { Self: link('/system') },
        };
      case 'dataservers': {
        const ds = {
          WebId: webId('DS', dsPath()),
          Id: guidFor(dsPath()),
          Name: m().dataServer,
          Path: dsPath(),
          IsConnected: true,
          ServerVersion: 'simulated',
          Links: {
            Self: link(`/dataservers/${webId('DS', dsPath())}`),
            Points: link(`/dataservers/${webId('DS', dsPath())}/points`),
          },
        };
        if (!id) return { Links: {}, Items: [ds] };
        if (decodeWebId(id)?.marker !== 'DS') throw new HttpError(404, 'Data server not found.');
        if (sub !== 'points') return ds;
        const filter = (getParam(q, 'nameFilter') ?? '*')
          .replace(/[.+^${}()|[\]\\]/g, '\\$&')
          .replace(/\*/g, '.*')
          .replace(/\?/g, '.');
        const re = new RegExp(`^${filter}$`, 'i');
        const max = Number(getParam(q, 'maxCount') ?? 1000);
        return {
          Links: {},
          Items: m()
            .points.map(pointJson)
            .filter((p) => re.test(p.Name))
            .slice(0, max),
        };
      }
      case 'points': {
        if (!id) {
          const path = getParam(q, 'path');
          if (!path) throw new HttpError(400, 'Supply a WebID or ?path=\\\\Server\\Tag.');
          const f = findByPath(path);
          if (!f.point) throw new HttpError(404, `PI point not found: ${path}`);
          return pointJson(f.point, m().points.indexOf(f.point));
        }
        const s = streamPoint(id);
        if (!s.point) throw new HttpError(404, 'PI point not found.');
        if (sub === 'attributes') {
          const p = s.point;
          const attrs: [string, unknown][] = [
            ['tag', p.tag],
            ['descriptor', p.descriptor],
            ['engunits', p.engunits],
            ['pointtype', p.pointtype],
            ['pointsource', p.pointsource],
            ['digitalset', p.digitalset],
            ['span', p.span],
            ['zero', p.zero],
            ['step', p.step ? 1 : 0],
            ['excdev', p.excdev],
            ['excmin', p.excmin],
            ['excmax', p.excmax],
            ['compressing', p.compressing ? 1 : 0],
            ['compdev', p.compdev],
            ['compmin', p.compmin],
            ['compmax', p.compmax],
            ['location1', p.location1],
            ['location4', p.location4],
            ['instrumenttag', p.instrumenttag],
            ['creationdate', p.creationdate],
          ];
          return { Links: {}, Items: attrs.map(([Name, Value]) => ({ Name, Value })) };
        }
        return pointJson(s.point, m().points.indexOf(s.point));
      }
      case 'assetservers': {
        const as = {
          WebId: webId('RS', asPath()),
          Id: guidFor(asPath()),
          Name: m().afServer,
          Path: asPath(),
          IsConnected: true,
          Links: {
            Self: link(`/assetservers/${webId('RS', asPath())}`),
            Databases: link(`/assetservers/${webId('RS', asPath())}/assetdatabases`),
          },
        };
        if (!id) return { Links: {}, Items: [as] };
        if (sub === 'assetdatabases') {
          const dbId = webId('RD', dbPath());
          return {
            Links: {},
            Items: [
              {
                WebId: dbId,
                Id: guidFor(dbPath()),
                Name: m().database,
                Description: 'Riverbend Plant (fictional)',
                Path: dbPath(),
                Links: {
                  Self: link(`/assetdatabases/${dbId}`),
                  Elements: link(`/assetdatabases/${dbId}/elements`),
                },
              },
            ],
          };
        }
        return as;
      }
      case 'assetdatabases': {
        if (sub === 'elements') return { Links: {}, Items: [elementJson(m().root)] };
        const dbId = webId('RD', dbPath());
        return {
          WebId: dbId,
          Name: m().database,
          Path: dbPath(),
          Links: {
            Self: link(`/assetdatabases/${dbId}`),
            Elements: link(`/assetdatabases/${dbId}/elements`),
          },
        };
      }
      case 'elements': {
        let el: SimElement | undefined;
        if (!id) {
          const path = getParam(q, 'path');
          if (!path)
            throw new HttpError(400, 'Supply a WebID or ?path=\\\\AFServer\\Database\\Element.');
          el = findByPath(path).element;
        } else {
          const d = decodeWebId(id);
          if (d?.marker !== 'Em') throw new HttpError(400, `"${id}" is not an element WebID.`);
          el = findByPath(d.path).element;
        }
        if (!el) throw new HttpError(404, 'Element not found.');
        if (sub === 'elements') return { Links: {}, Items: el.children.map(elementJson) };
        if (sub === 'attributes')
          return { Links: {}, Items: el.attributes.map((a) => attributeJson(el, a)) };
        return elementJson(el);
      }
      case 'attributes': {
        let found: { e: SimElement; a: SimAttribute } | undefined;
        if (!id) {
          const path = getParam(q, 'path');
          if (!path)
            throw new HttpError(
              400,
              'Supply a WebID or ?path=\\\\AFServer\\Database\\Element|Attribute.',
            );
          found = findByPath(path).attr;
        } else {
          const d = decodeWebId(id);
          if (d?.marker !== 'Ab') throw new HttpError(400, `"${id}" is not an attribute WebID.`);
          found = findByPath(d.path).attr;
        }
        if (!found) throw new HttpError(404, 'Attribute not found.');
        return attributeJson(found.e, found.a);
      }
      case 'streams':
        return streams(id, sub, q, now);
      case 'streamsets': {
        const d = decodeWebId(id);
        const el = d?.marker === 'Em' ? findByPath(d.path).element : undefined;
        if (!el) throw new HttpError(404, 'Stream sets need an element WebID.');
        if (sub !== 'value')
          throw new HttpError(404, 'This simulation supports /streamsets/{webId}/value.');
        return {
          Links: {},
          Items: el.attributes.map((a) => {
            const aid = webId('Ab', attrPath(el, a));
            const s = streams(aid, 'value', q, now);
            return { WebId: aid, Name: a.name, Path: attrPath(el, a), Value: s, Links: {} };
          }),
        };
      }
      default:
        throw new HttpError(404, `The "${c1}" controller is not part of this simulation.`);
    }
  })();
  return applySelectedFields(out, fields);
}

function streams(id: string, sub: string, q: URLSearchParams, now: number): unknown {
  const s = streamPoint(id);
  if (!s.point) {
    const a = s.staticAttr?.a;
    if (sub !== 'value' || !a)
      throw new HttpError(400, 'This attribute has no PI point, so only /value is available.');
    return {
      Timestamp: '1970-01-01T00:00:00Z',
      Value: a.value ?? null,
      UnitsAbbreviation: a.uom,
      Good: true,
      Questionable: false,
      Substituted: false,
      Annotated: false,
    };
  }
  const p = s.point;
  switch (sub) {
    case 'value':
    case 'end': {
      const time = getParam(q, 'time');
      if (time && time !== '*') {
        const { end } = range(new URLSearchParams({ startTime: '*', endTime: time }), now, '*');
        return valueJson(p, {
          t: end,
          v: interpolated(p, end, end, 1000, now)[0]?.v ?? snapshot(p, now).v,
        });
      }
      return valueJson(p, snapshot(p, now));
    }
    case 'recorded': {
      const { start, end } = range(q, now, '*-1d');
      const max = Number(getParam(q, 'maxCount') ?? 1000);
      let items = recorded(p, start, Math.min(end, now));
      const filter = getParam(q, 'filterExpression');
      if (filter) {
        const fm = /^'\.'\s*(>=|<=|<>|=|>|<)\s*(-?\d+(?:\.\d+)?)$/.exec(filter.trim());
        if (!fm)
          throw new HttpError(
            400,
            `This simulation supports filters like '.'>75, not "${filter}".`,
          );
        const k = Number(fm[2]);
        const op = fm[1];
        items = items.filter((v) =>
          op === '>'
            ? v.v > k
            : op === '<'
              ? v.v < k
              : op === '>='
                ? v.v >= k
                : op === '<='
                  ? v.v <= k
                  : op === '='
                    ? v.v === k
                    : v.v !== k,
        );
      }
      return {
        Links: {},
        Items: items.slice(0, max).map((v) => valueJson(p, v)),
        UnitsAbbreviation: p.engunits,
      };
    }
    case 'interpolated': {
      const { start, end } = range(q, now, '*-1d');
      const ms = intervalMs(getParam(q, 'interval') ?? '1h');
      if ((end - start) / ms > 10_000)
        throw new HttpError(
          400,
          'That would return more than 10,000 values. Use a longer interval.',
        );
      return {
        Links: {},
        Items: interpolated(p, start, end, ms, now).map((v) => valueJson(p, v)),
        UnitsAbbreviation: p.engunits,
      };
    }
    case 'plot': {
      const { start, end } = range(q, now, '*-1d');
      const n = Math.max(1, Number(getParam(q, 'intervals') ?? 24));
      return {
        Links: {},
        Items: plotValues(p, start, Math.min(end, now), n).map((v) => valueJson(p, v)),
        UnitsAbbreviation: p.engunits,
      };
    }
    case 'summary': {
      const { start, end } = range(q, now, '*-1d');
      const types = q.getAll('summaryType').length ? q.getAll('summaryType') : ['Total'];
      return {
        Links: {},
        Items: types.map((t) => {
          const type = SUMMARY_TYPES.find((x) => x.toLowerCase() === t.toLowerCase());
          if (!type)
            throw new HttpError(
              400,
              `Unknown summaryType "${t}". Try ${SUMMARY_TYPES.join(', ')}.`,
            );
          const v = summary(p, start, end, type as SummaryType, now);
          return {
            Type: type,
            Value: {
              Timestamp: new Date(start).toISOString(),
              Value: Math.round(v * 1000) / 1000,
              UnitsAbbreviation: type === 'Count' || type === 'PercentGood' ? '' : p.engunits,
              Good: true,
              Questionable: false,
              Substituted: false,
              Annotated: false,
            },
          };
        }),
      };
    }
    default:
      throw new HttpError(
        404,
        `/streams/{webId}/${sub} is not part of this simulation. Try value, recorded, interpolated, plot or summary.`,
      );
  }
}

/** Ready-made requests for the request builder. */
export function exampleRequests(): { label: string; url: string }[] {
  const pt = m().points[1] as SimPoint;
  const pid = webId('DP', pointPath(pt));
  const el = allElements().find((e) => e.template === 'Pump') as SimElement;
  return [
    { label: 'Home', url: '/piwebapi' },
    { label: 'Find a point by path', url: `/piwebapi/points?path=${dsPath()}\\${pt.tag}` },
    { label: 'Current value', url: `/piwebapi/streams/${pid}/value` },
    {
      label: 'Recorded values, last hour',
      url: `/piwebapi/streams/${pid}/recorded?startTime=*-1h&endTime=*`,
    },
    {
      label: 'Hourly interpolated, last day',
      url: `/piwebapi/streams/${pid}/interpolated?startTime=*-1d&endTime=*&interval=1h`,
    },
    {
      label: 'Summary (average and max)',
      url: `/piwebapi/streams/${pid}/summary?startTime=t&endTime=*&summaryType=Average&summaryType=Maximum`,
    },
    {
      label: 'Search points by name',
      url: `/piwebapi/dataservers/${webId('DS', dsPath())}/points?nameFilter=RB.P10*.FLOW`,
    },
    { label: 'Find an element by path', url: `/piwebapi/elements?path=${el.path}` },
    {
      label: 'Element attributes (names only)',
      url: `/piwebapi/elements/${webId('Em', el.path)}/attributes?selectedFields=Items.Name;Items.WebId`,
    },
    {
      label: 'All current values of an element',
      url: `/piwebapi/streamsets/${webId('Em', el.path)}/value`,
    },
  ];
}
