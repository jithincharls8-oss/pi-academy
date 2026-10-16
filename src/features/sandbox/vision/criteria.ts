/** Elements matching asset criteria (asset type, search root, attribute filter). */
import type { SimElement } from '@/core/sim/plant';
import { passesFilter } from './collections';
import { makeItem, type AssetTableSymbol } from './model';
import { elementsOfTemplate, readAt, readingOf, resolveItem } from './values';

export function matchingElements(
  template: string,
  root: string,
  filter: AssetTableSymbol['filter'],
  t: number,
  now: number,
): SimElement[] {
  return elementsOfTemplate(template, root || undefined).filter((e) => {
    if (!filter) return true;
    const r = resolveItem(makeItem(e.path, filter.attribute));
    if (!r) return false;
    return passesFilter(readingOf(r, readAt(r, t, now)), filter.op, filter.value);
  });
}
