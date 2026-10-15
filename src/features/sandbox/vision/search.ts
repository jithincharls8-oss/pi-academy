/**
 * The Search pane: finds AF elements and attributes. As in PI Vision, `*` matches any run of
 * characters and is assumed at the end of every query, and `?` matches a single character.
 */
import type { SimAttribute, SimElement } from '@/core/sim/plant';

export function wildcardRegex(query: string): RegExp {
  const q = query.trim();
  const body = [...q]
    .map((c) => (c === '*' ? '.*' : c === '?' ? '.' : c.replace(/[.+^${}()|[\]\\]/g, '\\$&')))
    .join('');
  return new RegExp(`^${body}.*$`, 'i');
}

export interface SearchHit {
  element: SimElement;
  attribute: SimAttribute | null;
}

/**
 * Match element names and descriptions, and attribute names, descriptions and PI tags.
 * A query that starts without `*` matches from the start of a word-bounded field, so
 * `Flow` finds "Flow" and "Steam Flow" (each word is tried as a start).
 */
export function searchAssets(elements: SimElement[], query: string, limit = 60): SearchHit[] {
  if (!query.trim()) return [];
  const re = wildcardRegex(query);
  const test = (text: string): boolean => {
    if (re.test(text)) return true;
    const words = text.split(/[\s.\-_\\|]+/);
    for (let i = 1; i < words.length; i++) if (re.test(words.slice(i).join(' '))) return true;
    return false;
  };
  const out: SearchHit[] = [];
  for (const e of elements) {
    if (test(e.name) || test(e.description)) out.push({ element: e, attribute: null });
    for (const a of e.attributes) {
      if (test(a.name) || test(a.description) || (a.tag ? test(a.tag) : false)) {
        out.push({ element: e, attribute: a });
      }
    }
    if (out.length >= limit) break;
  }
  return out.slice(0, limit);
}
