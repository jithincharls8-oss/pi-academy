import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Bound, MultiState } from '../model';
import { digitalDefaults, numericDefaults } from '../multistate';
import { scaleOf, type ResolvedItem } from '../values';
import { ColorField, NumberField, SelectField, ToggleField } from './fields';

/** Defaults for an item: state colours for digital items, limit-based ranges for numbers. */
export function defaultMultiState(r: ResolvedItem | null): MultiState {
  if (r?.digitalStates) return digitalDefaults(r.digitalStates);
  return numericDefaults(
    r?.attribute.name ?? '',
    r?.element.attributes ?? [],
    r ? scaleOf(r) : { min: 0, max: 100 },
  );
}

/**
 * Multi-state configuration: up to five numeric states with editable maximums (a number or a
 * limit attribute of the same element), or one colour per digital state, plus the Bad data
 * colour and Blink.
 */
export function MultiStateEditor({
  value,
  onChange,
  item,
  title = 'Multi-state',
}: {
  value: MultiState | null;
  onChange: (ms: MultiState | null) => void;
  item: ResolvedItem | null;
  title?: string;
}) {
  const limitAttrs = (item?.element.attributes ?? [])
    .filter((a) => a.dataReference === 'None' && typeof a.value === 'number')
    .map((a) => a.name);
  const setRange = (i: number, patch: Partial<MultiState['ranges'][number]>): void => {
    if (!value) return;
    onChange({ ...value, ranges: value.ranges.map((r, j) => (j === i ? { ...r, ...patch } : r)) });
  };
  return (
    <div className="space-y-2">
      <ToggleField
        label={title}
        checked={Boolean(value)}
        onChange={(on) => onChange(on ? defaultMultiState(item) : null)}
      />
      {value && item?.digitalStates ? (
        <ul className="space-y-1.5" aria-label="Digital states">
          {value.states.map((s, i) => (
            <li key={s.name}>
              <ColorField
                label={`State: ${s.name}`}
                value={s.color}
                onChange={(c) =>
                  c &&
                  onChange({
                    ...value,
                    states: value.states.map((x, j) => (j === i ? { ...x, color: c } : x)),
                  })
                }
              />
            </li>
          ))}
        </ul>
      ) : null}
      {value && !item?.digitalStates ? (
        <ol className="space-y-2" aria-label="Numeric states">
          {value.ranges.map((r, i) => (
            <li key={i} className="space-y-1 rounded border border-tool-grid p-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <span>State {i + 1}</span>
                {value.ranges.length > 1 ? (
                  <button
                    type="button"
                    className="rounded p-0.5 text-fg-muted hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-ring"
                    aria-label={`Remove state ${i + 1}`}
                    onClick={() =>
                      onChange({ ...value, ranges: value.ranges.filter((_, j) => j !== i) })
                    }
                  >
                    <X className="size-3.5" />
                  </button>
                ) : null}
              </div>
              <BoundEditor
                index={i}
                bound={r.upTo}
                limitAttrs={limitAttrs}
                onChange={(upTo) => setRange(i, { upTo })}
              />
              <ColorField
                label={`State ${i + 1} colour`}
                value={r.color}
                onChange={(c) => c && setRange(i, { color: c })}
              />
            </li>
          ))}
          {value.ranges.length < 5 ? (
            <li>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const last = value.ranges[value.ranges.length - 1];
                  const prev = [...value.ranges]
                    .reverse()
                    .find((x) => x.upTo?.kind === 'number')?.upTo;
                  const n = prev?.kind === 'number' ? prev.value + 1 : 0;
                  const ranges = [...value.ranges];
                  ranges.splice(Math.max(0, ranges.length - 1), 0, {
                    upTo: { kind: 'number', value: n },
                    color: last?.color === 'ok' ? 'warn' : 'ok',
                  });
                  onChange({ ...value, ranges });
                }}
              >
                <Plus /> Add state
              </Button>
            </li>
          ) : null}
        </ol>
      ) : null}
      {value ? (
        <>
          <ColorField
            label="Bad data colour"
            value={value.bad}
            onChange={(c) => c && onChange({ ...value, bad: c })}
          />
          <ToggleField
            label="Blink in alarm"
            checked={value.blink}
            onChange={(b) => onChange({ ...value, blink: b })}
          />
        </>
      ) : null}
    </div>
  );
}

function BoundEditor({
  index,
  bound,
  limitAttrs,
  onChange,
}: {
  index: number;
  bound: Bound | null;
  limitAttrs: string[];
  onChange: (b: Bound | null) => void;
}) {
  type Mode = 'number' | 'attribute' | 'none';
  const mode: Mode = bound ? bound.kind : 'none';
  const modes: { value: Mode; label: string }[] = [
    { value: 'number', label: 'Below a value' },
    ...(limitAttrs.length ? [{ value: 'attribute' as const, label: 'Below an attribute' }] : []),
    { value: 'none', label: 'No maximum (all above)' },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      <SelectField
        label={`State ${index + 1} maximum`}
        value={mode}
        options={modes}
        onChange={(m) =>
          onChange(
            m === 'none'
              ? null
              : m === 'number'
                ? { kind: 'number', value: bound?.kind === 'number' ? bound.value : 0 }
                : { kind: 'attribute', name: limitAttrs[0] ?? '' },
          )
        }
      />
      {bound?.kind === 'number' ? (
        <NumberField
          label="Maximum"
          value={bound.value}
          step={0.1}
          onChange={(v) => onChange({ kind: 'number', value: v ?? 0 })}
        />
      ) : null}
      {bound?.kind === 'attribute' ? (
        <SelectField
          label="Limit attribute"
          value={bound.name}
          options={limitAttrs.map((a) => ({ value: a, label: a }))}
          onChange={(name) => onChange({ kind: 'attribute', name })}
        />
      ) : null}
    </div>
  );
}
