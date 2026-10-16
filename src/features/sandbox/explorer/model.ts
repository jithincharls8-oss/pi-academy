import type { Dispatch } from 'react';
import type { SimElement } from '@/core/sim/plant';
import { exampleAnalyses, type AnalysisDef } from './analyses';
import { effectiveValue, field, type CheckoutAction, type CheckoutState } from './checkout';
import { parentMap, workingElement, type AfScope } from './afContext';

/** Everything the explorer panes need from the page. */
export interface ExplorerModel {
  now: number;
  state: CheckoutState;
  dispatch: Dispatch<CheckoutAction>;
  /** the working copy (base + your edits) of an element */
  working: (base: SimElement) => SimElement;
  scopeOf: (working: SimElement) => AfScope;
  analysesOf: (base: SimElement) => AnalysisDef[];
  setAnalyses: (base: SimElement, list: AnalysisDef[]) => void;
}

function isAnalysisList(v: unknown): v is AnalysisDef[] {
  return Array.isArray(v);
}

export function buildModel(
  root: SimElement,
  state: CheckoutState,
  dispatch: Dispatch<CheckoutAction>,
  now: number,
): ExplorerModel {
  const parents = parentMap(root);
  const cache = new Map<string, SimElement>();
  const working = (base: SimElement): SimElement => {
    const hit = cache.get(base.id);
    if (hit) return hit;
    const w = workingElement(base, state);
    cache.set(base.id, w);
    return w;
  };
  const scopeOf = (w: SimElement): AfScope => ({
    element: w,
    parentOf: (e) => {
      const p = parents.get(e.id);
      return p ? working(p) : undefined;
    },
  });
  return {
    now,
    state,
    dispatch,
    working,
    scopeOf,
    analysesOf: (base) => {
      const v = effectiveValue(state, base.id, field.analyses);
      return isAnalysisList(v) ? v : exampleAnalyses(base);
    },
    setAnalyses: (base, list) =>
      dispatch({ type: 'edit', object: base.id, field: field.analyses, value: list }),
  };
}
