import type { Question } from '../schemas';

export type Answer =
  | { type: 'mcq' | 'scenario'; choice: string | null }
  | { type: 'multi'; choices: string[] }
  | { type: 'ordering'; order: string[] }
  | { type: 'matching'; pairs: Record<string, string> }
  | { type: 'fill' | 'code'; text: string };

export interface GradeResult {
  correct: boolean;
  /** 0..1 partial credit (only multi, ordering and matching give partial credit) */
  score: number;
  /** short, specific feedback for the learner */
  detail?: string;
}

const SMART_QUOTES: [RegExp, string][] = [
  [/[‘’‚‛]/g, "'"],
  [/[“”„‟]/g, '"'],
  [/[–—]/g, '-'],
];

export function normaliseText(s: string): string {
  let out = s;
  for (const [re, rep] of SMART_QUOTES) out = out.replace(re, rep);
  return out.trim().replace(/\s+/g, ' ');
}

/** Lower-case and drop whitespace outside quoted literals (PI names are case-insensitive). */
function normaliseExpression(s: string): string {
  const text = normaliseText(s).replace(/;+\s*$/, '');
  let out = '';
  let quote: string | null = null;
  for (const ch of text) {
    if (quote) {
      out += ch.toLowerCase();
      if (ch === quote) quote = null;
    } else if (ch === "'" || ch === '"') {
      quote = ch;
      out += ch;
    } else if (!/\s/.test(ch)) out += ch.toLowerCase();
  }
  return out;
}

/** Normalise a PI Web API request: optional method, host-independent path, order-insensitive query. */
export function normaliseWebApi(s: string): string {
  let text = normaliseText(s);
  const m = /^(GET|POST|PUT|PATCH|DELETE)\s+/i.exec(text);
  const method = (m?.[1] ?? 'GET').toUpperCase();
  if (m) text = text.slice(m[0].length);
  text = text.replace(/^https?:\/\/[^/]+/i, '');
  const idx = text.toLowerCase().indexOf('/piwebapi');
  if (idx > 0) text = text.slice(idx);
  const [rawPath = '', rawQuery = ''] = text.split('?', 2);
  const path = rawPath.replace(/\/+$/, '').toLowerCase();
  const query = rawQuery
    .split('&')
    .filter(Boolean)
    .map((kv) => {
      const [k = '', v = ''] = kv.split('=', 2);
      let dv = v;
      try {
        dv = decodeURIComponent(v.replace(/\+/g, ' '));
      } catch {
        /* keep raw value */
      }
      return `${k.toLowerCase()}=${dv.toLowerCase()}`;
    })
    .sort()
    .join('&');
  return `${method} ${path}${query ? `?${query}` : ''}`;
}

export function normaliseCode(language: 'webapi' | 'af' | 'pe', s: string): string {
  return language === 'webapi' ? normaliseWebApi(s) : normaliseExpression(s);
}

function setEquals(a: readonly string[], b: readonly string[]): boolean {
  const sa = new Set(a);
  const sb = new Set(b);
  return sa.size === sb.size && [...sa].every((x) => sb.has(x));
}

export function grade(q: Question, answer: Answer): GradeResult {
  switch (q.type) {
    case 'mcq':
    case 'scenario': {
      const choice = answer.type === 'mcq' || answer.type === 'scenario' ? answer.choice : null;
      const ok = choice === q.answer;
      return { correct: ok, score: ok ? 1 : 0 };
    }
    case 'multi': {
      const choices = answer.type === 'multi' ? answer.choices : [];
      const right = new Set(q.answers);
      const hits = choices.filter((c) => right.has(c)).length;
      const wrong = choices.filter((c) => !right.has(c)).length;
      const ok = setEquals(choices, q.answers);
      const score = ok ? 1 : Math.max(0, (hits - wrong) / q.answers.length);
      return {
        correct: ok,
        score,
        detail: ok
          ? undefined
          : `${hits} of ${q.answers.length} correct options selected${wrong ? `, ${wrong} incorrect` : ''}.`,
      };
    }
    case 'ordering': {
      const order = answer.type === 'ordering' ? answer.order : [];
      const inPlace = q.items.filter((it, i) => order[i] === it.id).length;
      const ok = inPlace === q.items.length && order.length === q.items.length;
      return {
        correct: ok,
        score: inPlace / q.items.length,
        detail: ok ? undefined : `${inPlace} of ${q.items.length} in the right position.`,
      };
    }
    case 'matching': {
      const pairs = answer.type === 'matching' ? answer.pairs : {};
      const right = q.pairs.filter((p) => pairs[p.left] === p.right).length;
      const ok = right === q.pairs.length;
      return {
        correct: ok,
        score: right / q.pairs.length,
        detail: ok ? undefined : `${right} of ${q.pairs.length} pairs matched.`,
      };
    }
    case 'fill': {
      const text = answer.type === 'fill' || answer.type === 'code' ? answer.text : '';
      const norm = (s: string): string =>
        q.caseSensitive ? normaliseText(s) : normaliseText(s).toLowerCase();
      const ok = text.trim() !== '' && q.accepted.some((a) => norm(a) === norm(text));
      return { correct: ok, score: ok ? 1 : 0 };
    }
    case 'code': {
      const text = answer.type === 'fill' || answer.type === 'code' ? answer.text : '';
      if (text.trim() === '') return { correct: false, score: 0, detail: 'No answer entered.' };
      const n = normaliseCode(q.language, text);
      if (q.accepted.some((a) => normaliseCode(q.language, a) === n))
        return { correct: true, score: 1 };
      if (q.requiredPatterns.length > 0) {
        const missing = q.requiredPatterns.filter((p) => !new RegExp(p, 'i').test(n));
        const forbidden = q.forbiddenPatterns.filter((p) => new RegExp(p, 'i').test(n));
        if (missing.length === 0 && forbidden.length === 0) return { correct: true, score: 1 };
        return {
          correct: false,
          score: 0,
          detail: forbidden.length
            ? 'Your answer contains something that should not be there.'
            : 'Your answer is missing a required part.',
        };
      }
      return { correct: false, score: 0 };
    }
  }
}
