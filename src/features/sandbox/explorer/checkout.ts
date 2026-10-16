/**
 * The PSE check-out / check-in model, as a reducer. Editing an object checks it out: the edit
 * lives in your sandbox ("pending") and only you see it. Check In commits pending edits;
 * Undo Check Out throws them away. Everything stays in component state (nothing is saved).
 */
import type { AnalysisDef } from './analyses';

export type EditValue = string | number | AnalysisDef[];
export type Fields = Record<string, EditValue>;

export interface CheckInRecord {
  at: number;
  objects: string[];
  changes: number;
}

export interface CheckoutState {
  /** checked-in edits, by object key then field key */
  committed: Record<string, Fields>;
  /** edits waiting for Check In */
  pending: Record<string, Fields>;
  history: CheckInRecord[];
}

export type CheckoutAction =
  | { type: 'edit'; object: string; field: string; value: EditValue }
  | { type: 'checkIn'; objects: string[]; at: number }
  | { type: 'undoCheckOut'; objects: string[] }
  | { type: 'reset' };

export const INITIAL_CHECKOUT: CheckoutState = { committed: {}, pending: {}, history: [] };

export function checkoutReducer(state: CheckoutState, action: CheckoutAction): CheckoutState {
  switch (action.type) {
    case 'edit': {
      const fields = { ...(state.pending[action.object] ?? {}), [action.field]: action.value };
      return { ...state, pending: { ...state.pending, [action.object]: fields } };
    }
    case 'checkIn': {
      const objects = action.objects.filter((o) => state.pending[o]);
      if (!objects.length) return state;
      const committed = { ...state.committed };
      let changes = 0;
      for (const o of objects) {
        const edits = state.pending[o] ?? {};
        changes += Object.keys(edits).length;
        committed[o] = { ...(committed[o] ?? {}), ...edits };
      }
      const pending = without(state.pending, objects);
      return {
        committed,
        pending,
        history: [{ at: action.at, objects, changes }, ...state.history].slice(0, 20),
      };
    }
    case 'undoCheckOut': {
      return { ...state, pending: without(state.pending, action.objects) };
    }
    case 'reset':
      return INITIAL_CHECKOUT;
  }
}

function without(map: Record<string, Fields>, keys: string[]): Record<string, Fields> {
  const drop = new Set(keys);
  return Object.fromEntries(Object.entries(map).filter(([k]) => !drop.has(k)));
}

export function isCheckedOut(state: CheckoutState, object: string): boolean {
  return Boolean(state.pending[object]);
}

export function checkedOutObjects(state: CheckoutState): string[] {
  return Object.keys(state.pending);
}

/** The value you see: your pending edit, else the checked-in edit, else undefined (base). */
export function effectiveValue(
  state: CheckoutState,
  object: string,
  field: string,
): EditValue | undefined {
  return state.pending[object]?.[field] ?? state.committed[object]?.[field];
}

/** What other users (and the Analysis Service) see: only checked-in edits. */
export function checkedInValue(
  state: CheckoutState,
  object: string,
  field: string,
): EditValue | undefined {
  return state.committed[object]?.[field];
}

/** Field keys used by the explorer. */
export const field = {
  description: 'description',
  analyses: 'analyses',
  value: (attribute: string): string => `attr:${attribute}:value`,
  config: (attribute: string): string => `attr:${attribute}:config`,
};

/** Human-readable label for a field key, for the Check In dialog. */
export function describeField(key: string): string {
  if (key === field.description) return 'Description';
  if (key === field.analyses) return 'Analyses';
  const m = /^attr:(.+):(value|config)$/.exec(key);
  if (m) return `${m[1]} (${m[2] === 'value' ? 'value' : 'data reference'})`;
  return key;
}
