import { describe, expect, it } from 'vitest';
import { exampleRequests, webId, type ApiRequest } from '@/core/sim/webapi';
import {
  curlSnippet,
  fetchSnippet,
  joinUrl,
  pythonSnippet,
  simulatedMs,
  splitUrl,
} from './request';
import { controllerFor, decodeWebId, guidFromChars } from './webid';
import { jsonPath, send } from './send';
import { CHALLENGES } from './challenges';
import { findElement } from '@/core/sim/plant';

const NOW = new Date('2026-10-15T10:30:00').getTime();
const P102 = webId('DP', '\\\\PISRV01\\RB.P102.FLOW');
const T101 = webId('DP', '\\\\PISRV01\\RB.T101.LEVEL');
const P101_EL = webId('Em', '\\\\AFSRV01\\Riverbend\\Riverbend Plant\\Process\\P-101');

const get = (url: string): ApiRequest => ({ method: 'GET', url });
const challenge = (id: string) => {
  const c = CHALLENGES.find((x) => x.id === id);
  if (!c) throw new Error(id);
  return c;
};

describe('URL and query parameters', () => {
  it('splits and rejoins, keeping backslashes and semicolons readable', () => {
    const url = '/piwebapi/points?path=\\\\PISRV01\\RB.P101.FLOW&selectedFields=Name;WebId';
    const { path, params } = splitUrl(url);
    expect(path).toBe('/piwebapi/points');
    expect(params).toEqual([
      { key: 'path', value: '\\\\PISRV01\\RB.P101.FLOW' },
      { key: 'selectedFields', value: 'Name;WebId' },
    ]);
    expect(joinUrl(path, params)).toBe(url);
  });

  it('drops the host, decodes %20 and treats + as a space like a server would', () => {
    const { path, params } = splitUrl('https://srv/piwebapi/x?a=Riverbend%20Plant&b=*+1h');
    expect(path).toBe('/piwebapi/x');
    expect(params[0]?.value).toBe('Riverbend Plant');
    expect(params[1]?.value).toBe('* 1h');
    expect(joinUrl('/p', [{ key: 't', value: '*+1h' }])).toBe('/p?t=*%2B1h');
  });
});

describe('code snippets', () => {
  const req = get('/piwebapi/streams/ABC/recorded?startTime=*-1h&maxCount=10');
  it('render curl, Python requests and fetch with the host placeholder', () => {
    expect(curlSnippet(req)).toContain(
      "'https://your-server/piwebapi/streams/ABC/recorded?startTime=*-1h&maxCount=10'",
    );
    const py = pythonSnippet(req);
    expect(py).toContain('import requests');
    expect(py).toContain('("maxCount", "10")');
    expect(py).toContain('HTTPBasicAuth');
    const js = fetchSnippet(req);
    expect(js).toContain('new URLSearchParams');
    expect(js).toContain('"https://your-server/piwebapi/streams/ABC/recorded"');
  });

  it('adds X-Requested-With and the body for writes', () => {
    const w: ApiRequest = { method: 'POST', url: '/piwebapi/batch', body: '{"a": 1}' };
    expect(curlSnippet(w)).toContain('X-Requested-With: XMLHttpRequest');
    expect(curlSnippet(w)).toContain(`--data '{"a": 1}'`);
    expect(pythonSnippet(w)).toContain('data=body');
    expect(fetchSnippet(w)).toContain('"X-Requested-With": "XMLHttpRequest"');
  });

  it('gives a deterministic simulated time', () => {
    expect(simulatedMs(req, 2000)).toBe(simulatedMs(req, 2000));
    expect(simulatedMs(req, 2000)).toBeGreaterThan(0);
  });
});

describe('WebID decoder', () => {
  it('decodes the research Full WebID example', () => {
    const d = decodeWebId('F1RSiOPKGTTUcUCFkVGxiCya9gUElTUlYwMQ');
    expect(d.ok).toBe(true);
    expect(d.parts.map((p) => p.role)).toEqual(['type', 'version', 'marker', 'guid', 'path']);
    expect(d.parts[3]?.chars).toBe('iOPKGTTUcUCFkVGxiCya9g');
    expect(d.path).toBe('\\\\PISRV01');
  });

  it('decodes PathOnly point and attribute WebIDs with owner markers', () => {
    const d = decodeWebId(P102);
    expect(d.marker).toBe('DP');
    expect(d.path).toBe('\\\\PISRV01\\RB.P102.FLOW');
    const ab = decodeWebId(
      webId('Ab', '\\\\AFSRV01\\Riverbend\\Riverbend Plant\\Process\\T-101|Level'),
    );
    expect(ab.parts.find((p) => p.role === 'owner')?.chars).toBe('E');
    expect(ab.path?.endsWith('T-101|LEVEL')).toBe(true);
    expect(controllerFor('Ab')).toBe('attributes');
  });

  it('rejects malformed WebIDs with a reason', () => {
    expect(decodeWebId('X1DPabc').error).toMatch(/type letter/);
    expect(decodeWebId('P2DPabc').error).toMatch(/version/);
    expect(decodeWebId('P1ZZabc').error).toMatch(/marker/);
    expect(guidFromChars('short')).toBeNull();
  });
});

describe('send: core passthrough and summaryDuration', () => {
  it('forwards ordinary requests to the simulator', () => {
    for (const ex of exampleRequests()) expect(send(get(ex.url), NOW).status).toBe(200);
  });

  it('returns one summary per interval', () => {
    const r = send(
      get(
        `/piwebapi/streams/${T101}/summary?startTime=*-3h&endTime=*&summaryType=Average&summaryDuration=1h`,
      ),
      NOW,
    );
    expect(r.status).toBe(200);
    const items = (r.body as { Items: { Type: string; Value: { Timestamp: string } }[] }).Items;
    expect(items).toHaveLength(3);
    expect(items.every((i) => i.Type === 'Average')).toBe(true);
    expect(new Date(items[1]!.Value.Timestamp).getTime()).toBe(NOW - 2 * 3_600_000);
    expect(send(get(`/piwebapi/streams/${T101}/summary?summaryDuration=soon`), NOW).status).toBe(
      400,
    );
  });
});

describe('send: batch', () => {
  const body = JSON.stringify({
    '1': { Method: 'GET', Resource: 'https://srv/piwebapi/points?path=\\\\PISRV01\\RB.P103.FLOW' },
    '2': {
      Method: 'GET',
      Resource: 'https://srv/piwebapi/streams/{0}/value',
      ParentIds: ['1'],
      Parameters: ['$.1.Content.WebId'],
    },
  });

  it('runs sub-requests with ParentIds and JSONPath parameters', () => {
    const r = send({ method: 'POST', url: '/piwebapi/batch', body }, NOW);
    expect(r.status).toBe(207);
    const out = r.body as Record<string, { Status: number; Content: Record<string, unknown> }>;
    expect(out['1']?.Content['Name']).toBe('RB.P103.FLOW');
    expect(out['2']?.Status).toBe(200);
    expect(out['2']?.Content).toHaveProperty('Timestamp');
  });

  it('expands a RequestTemplate over wildcard results', () => {
    const tb = JSON.stringify({
      a: { Method: 'GET', Resource: `/piwebapi/elements/${P101_EL}/attributes` },
      b: {
        Method: 'GET',
        RequestTemplate: { Resource: '/piwebapi/streams/{0}/value' },
        ParentIds: ['a'],
        Parameters: ['$.a.Content.Items[*].WebId'],
      },
    });
    const r = send({ method: 'POST', url: '/piwebapi/batch', body: tb }, NOW);
    const b = (r.body as Record<string, { Content: { Items: unknown[] } }>)['b'];
    const el = findElement('\\\\AFSRV01\\Riverbend\\Riverbend Plant\\Process\\P-101');
    expect(b?.Content.Items.length).toBe(el?.attributes.length);
  });

  it('reports errors: GET, bad JSON, missing parent, unmatched parameter', () => {
    expect(send(get('/piwebapi/batch'), NOW).status).toBe(405);
    expect(send({ method: 'POST', url: '/piwebapi/batch', body: '{"1": {},}' }, NOW).status).toBe(
      400,
    );
    const r = send(
      {
        method: 'POST',
        url: '/piwebapi/batch',
        body: JSON.stringify({
          x: { Method: 'GET', Resource: '/piwebapi', ParentIds: ['nope'] },
          y: {
            Method: 'GET',
            Resource: '/piwebapi/streams/{0}/value',
            Parameters: ['$.z.Content.WebId'],
          },
        }),
      },
      NOW,
    );
    const out = r.body as Record<string, { Status: number }>;
    expect(out['x']?.Status).toBe(409);
    expect(out['y']?.Status).toBe(400);
  });

  it('evaluates the JSONPath subset', () => {
    const doc = { a: { B: [{ v: 1 }, { v: 2 }] } };
    expect(jsonPath(doc, '$.a.B[1].v')).toEqual([2]);
    expect(jsonPath(doc, '$.a.b[*].v')).toEqual([1, 2]);
    expect(jsonPath(doc, '$.missing')).toEqual([]);
  });
});

describe('challenges', () => {
  const run = (req: ApiRequest) => send(req, NOW);

  it('accepts correct solutions', () => {
    const cases: [string, ApiRequest][] = [
      ['webid-p102', get('/piwebapi/points?path=\\\\PISRV01\\RB.P102.FLOW')],
      [
        'hourly-avg-t101',
        get(
          `/piwebapi/streams/${T101}/summary?startTime=t&endTime=*&summaryType=Average&summaryDuration=1h`,
        ),
      ],
      [
        'selected-fields',
        get(`/piwebapi/elements/${P101_EL}/attributes?selectedFields=Items.Name;Items.WebId`),
      ],
      [
        'recorded-maxcount',
        get(
          `/piwebapi/streams/${webId('DP', '\\\\PISRV01\\RB.B100.STEAM.FLOW')}/recorded?startTime=*-2h&endTime=*&maxCount=20`,
        ),
      ],
      [
        'streamset-t102',
        get(
          `/piwebapi/streamsets/${webId('Em', '\\\\AFSRV01\\Riverbend\\Riverbend Plant\\Process\\T-102')}/value`,
        ),
      ],
      [
        'batch-p103',
        {
          method: 'POST',
          url: '/piwebapi/batch',
          body: JSON.stringify({
            '1': { Method: 'GET', Resource: '/piwebapi/points?path=\\\\PISRV01\\RB.P103.FLOW' },
            '2': {
              Method: 'GET',
              Resource: '/piwebapi/streams/{0}/value',
              ParentIds: ['1'],
              Parameters: ['$.1.Content.WebId'],
            },
          }),
        },
      ],
    ];
    for (const [id, req] of cases) expect(challenge(id).check(req, run(req), NOW), id).toBe(true);
  });

  it('rejects near misses', () => {
    const wrongTag = get('/piwebapi/points?path=\\\\PISRV01\\RB.P101.FLOW');
    expect(challenge('webid-p102').check(wrongTag, run(wrongTag), NOW)).toBe(false);
    const noDuration = get(
      `/piwebapi/streams/${T101}/summary?startTime=t&endTime=*&summaryType=Average`,
    );
    expect(challenge('hourly-avg-t101').check(noDuration, run(noDuration), NOW)).toBe(false);
    const allFields = get(`/piwebapi/elements/${P101_EL}/attributes`);
    expect(challenge('selected-fields').check(allFields, run(allFields), NOW)).toBe(false);
  });
});

describe('batch ids that match Object properties', () => {
  it('treats toString, __proto__ and hasOwnProperty as plain ids', () => {
    const sys = '{"Method":"GET","Resource":"https://your-server/piwebapi/system"}';
    // Written as text: an object literal's __proto__ would set the prototype, not a key.
    const body = `{"toString":${sys},"__proto__":${sys},"child":{"Method":"GET","Resource":"https://your-server/piwebapi/system","ParentIds":["hasOwnProperty"]}}`;
    const r = send({ method: 'POST', url: '/piwebapi/batch', body }, NOW);
    const out = r.body as Record<string, { Status: number }>;
    expect(Object.keys(out).sort()).toEqual(['__proto__', 'child', 'toString'].sort());
    expect(out['toString']?.Status).toBe(200);
    expect(out['child']?.Status).toBe(409);
  });
});
