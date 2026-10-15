/** Guided challenges, each checked against the last request and response. */
import type { ApiRequest, ApiResponse } from '@/core/sim/webapi';
import { webId } from '@/core/sim/webapi';
import { parseTimeRange } from '@/core/sim/time';
import { findElement } from '@/core/sim/plant';
import { controllerPath, param } from './request';
import { decodeWebId } from './webid';

export interface Challenge {
  id: string;
  title: string;
  goal: string;
  hint: string;
  check: (req: ApiRequest, res: ApiResponse, now: number) => boolean;
}

const asRecord = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

function items(res: ApiResponse): Record<string, unknown>[] {
  const its = asRecord(res.body)?.['Items'];
  return Array.isArray(its) ? its.map((x) => asRecord(x) ?? {}) : [];
}

/** Does any object anywhere in the body satisfy the predicate? */
function deepSome(v: unknown, pred: (o: Record<string, unknown>) => boolean): boolean {
  if (Array.isArray(v)) return v.some((x) => deepSome(x, pred));
  const o = asRecord(v);
  if (!o) return false;
  return pred(o) || Object.values(o).some((x) => deepSome(x, pred));
}

/** Path the WebID in /{controller}/{webId}/... points at, uppercased. */
function targetPath(req: ApiRequest): string {
  const id = controllerPath(req.url)[1] ?? '';
  return decodeWebId(id).path?.toUpperCase() ?? '';
}

const P102 = webId('DP', '\\\\PISRV01\\RB.P102.FLOW');

export const CHALLENGES: Challenge[] = [
  {
    id: 'webid-p102',
    title: 'Find the WebID of RB.P102.FLOW',
    goal: 'Get a response that contains the PI point RB.P102.FLOW with its WebId.',
    hint: 'Points are located by path: GET /piwebapi/points?path=\\\\PISRV01\\RB.P102.FLOW',
    check: (_req, res) =>
      res.status === 200 &&
      deepSome(res.body, (o) => o['Name'] === 'RB.P102.FLOW' && o['WebId'] === P102),
  },
  {
    id: 'hourly-avg-t101',
    title: 'Hourly averages for T-101 Level today',
    goal: 'Get one time-weighted average per hour of the T-101 level since midnight.',
    hint: 'Use /streams/{webId}/summary with startTime=t, endTime=*, summaryType=Average and summaryDuration=1h. The WebId can be the point RB.T101.LEVEL or the attribute T-101|Level.',
    check: (req, res, now) => {
      const c = controllerPath(req.url);
      if (
        res.status !== 200 ||
        c[0]?.toLowerCase() !== 'streams' ||
        c[2]?.toLowerCase() !== 'summary'
      )
        return false;
      const path = targetPath(req);
      if (!path.endsWith('\\RB.T101.LEVEL') && !path.endsWith('\\T-101|LEVEL')) return false;
      if ((param(req.url, 'summaryType') ?? '').toLowerCase() !== 'average') return false;
      const d = (param(req.url, 'summaryDuration') ?? '').toLowerCase();
      if (d !== '1h' && d !== '60m') return false;
      try {
        const r = parseTimeRange(
          param(req.url, 'startTime') ?? '*-1d',
          param(req.url, 'endTime') ?? '*',
          now,
        );
        const midnight = new Date(now);
        midnight.setHours(0, 0, 0, 0);
        if (r.start !== midnight.getTime()) return false;
      } catch {
        return false;
      }
      return items(res).length >= 1;
    },
  },
  {
    id: 'selected-fields',
    title: 'Only names and WebIds of P-101 attributes',
    goal: "List P-101's attributes with nothing but Name and WebId in each item.",
    hint: 'Find the element by path, follow Links.Attributes, and add selectedFields=Items.Name;Items.WebId',
    check: (req, res) => {
      const c = controllerPath(req.url);
      const p101 = findElement('\\\\AFSRV01\\Riverbend\\Riverbend Plant\\Process\\P-101');
      if (!p101 || res.status !== 200) return false;
      if (c[0]?.toLowerCase() !== 'elements' || c[2]?.toLowerCase() !== 'attributes') return false;
      if (targetPath(req) !== p101.path.toUpperCase()) return false;
      const its = items(res);
      return (
        its.length === p101.attributes.length &&
        its.every((o) => {
          const keys = Object.keys(o).sort();
          return keys.length === 2 && keys[0] === 'Name' && keys[1] === 'WebId';
        })
      );
    },
  },
  {
    id: 'recorded-maxcount',
    title: 'At most 20 recorded steam-flow values',
    goal: 'Read recorded values of RB.B100.STEAM.FLOW for the last 2 hours, limited to 20.',
    hint: 'GET /streams/{webId}/recorded?startTime=*-2h&endTime=*&maxCount=20 (maxCount defaults to 1000)',
    check: (req, res) => {
      const c = controllerPath(req.url);
      return (
        res.status === 200 &&
        c[0]?.toLowerCase() === 'streams' &&
        c[2]?.toLowerCase() === 'recorded' &&
        targetPath(req).endsWith('\\RB.B100.STEAM.FLOW') &&
        param(req.url, 'maxCount') === '20' &&
        (param(req.url, 'startTime') ?? '').replace(/\s/g, '') === '*-2h' &&
        items(res).length > 0 &&
        items(res).length <= 20
      );
    },
  },
  {
    id: 'streamset-t102',
    title: 'Every current value of T-102 in one call',
    goal: 'Get the current value of all attributes of the T-102 element at once.',
    hint: 'Stream sets by element: GET /streamsets/{elementWebId}/value',
    check: (req, res) => {
      const c = controllerPath(req.url);
      const t102 = findElement('\\\\AFSRV01\\Riverbend\\Riverbend Plant\\Process\\T-102');
      return (
        !!t102 &&
        res.status === 200 &&
        c[0]?.toLowerCase() === 'streamsets' &&
        c[2]?.toLowerCase() === 'value' &&
        targetPath(req) === t102.path.toUpperCase() &&
        items(res).length === t102.attributes.length
      );
    },
  },
  {
    id: 'batch-p103',
    title: 'Look up and read RB.P103.FLOW in one batch',
    goal: 'POST one batch that finds the point by path and reads its current value using the first result.',
    hint: 'Sub-request "1" GETs points?path=..., sub-request "2" GETs streams/{0}/value with ParentIds ["1"] and Parameters ["$.1.Content.WebId"].',
    check: (req, res) => {
      const c = controllerPath(req.url);
      if (req.method !== 'POST' || c[0]?.toLowerCase() !== 'batch' || res.status !== 207)
        return false;
      const subs = Object.values(asRecord(res.body) ?? {}).map((x) => asRecord(x) ?? {});
      const found = subs.some((s) => asRecord(s['Content'])?.['Name'] === 'RB.P103.FLOW');
      const value = subs.some((s) => {
        const content = asRecord(s['Content']);
        return s['Status'] === 200 && !!content && 'Timestamp' in content && 'Value' in content;
      });
      return found && value;
    },
  },
];
