import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import { useId, type ReactNode } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
  /** Optional accessible name when the visible label is short or an icon. */
  ariaLabel?: string;
}

/**
 * Apple-style segmented control with radio-group semantics (Radix RadioGroup): Tab enters the
 * group on the selected segment, arrow keys move and select, and each segment is a role="radio".
 * Matches the look of TabsList so tabs and choices read as one family.
 */
export function SegmentedControl<T extends string>({
  value,
  onValueChange,
  options,
  className,
  fill = false,
  size = 'md',
  ...aria
}: {
  value: T;
  onValueChange: (v: T) => void;
  options: readonly SegmentOption<T>[];
  className?: string;
  /** Stretch segments to share the full width equally. */
  fill?: boolean;
  size?: 'sm' | 'md';
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}) {
  return (
    <RadioGroupPrimitive.Root
      value={value}
      onValueChange={(v) => onValueChange(v as T)}
      orientation="horizontal"
      loop
      className={cn(
        'flex-wrap items-stretch gap-0.5 rounded-[10px] bg-surface-3/70 p-0.5',
        fill ? 'flex w-full' : 'inline-flex',
        className,
      )}
      {...aria}
    >
      {options.map((o) => (
        <RadioGroupPrimitive.Item
          key={o.value}
          value={o.value}
          aria-label={o.ariaLabel}
          className={cn(
            'cursor-pointer rounded-[8px] font-semibold whitespace-nowrap text-fg-muted transition-all hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring data-[state=checked]:bg-surface data-[state=checked]:text-fg data-[state=checked]:shadow-card dark:data-[state=checked]:bg-border-strong',
            size === 'sm' ? 'px-3 py-1 text-[13px]' : 'px-3.5 py-1.5 text-[13px]',
            fill && 'min-w-0 flex-1',
          )}
        >
          {o.label}
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroupPrimitive.Root>
  );
}

/**
 * Numeric stepper: a labelled number field flanked by minus and plus buttons. Typing still
 * works; the buttons move by `step` and never go below `min`.
 */
export function Stepper({
  id,
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  hint,
  className,
}: {
  id?: string;
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  hint?: ReactNode;
  className?: string;
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const clamp = (n: number) => {
    const r = Math.max(min, Math.round(Number.isFinite(n) ? n : min));
    return max === undefined ? r : Math.min(max, r);
  };
  const btn =
    'grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-primary transition-colors hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring disabled:cursor-default disabled:text-fg-subtle disabled:hover:bg-transparent [&_svg]:size-4';
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-x-3 gap-y-1', className)}>
      <div className="min-w-0 flex-1">
        <label htmlFor={inputId} className="text-sm font-medium">
          {label}
        </label>
        {hint ? (
          <p id={hintId} className="text-xs text-fg-muted">
            {hint}
          </p>
        ) : null}
      </div>
      <div className="flex items-center gap-0.5 rounded-full bg-surface-2 p-0.5 ring-1 ring-border">
        <button
          type="button"
          className={btn}
          aria-label={`Decrease ${label}`}
          aria-controls={inputId}
          disabled={value <= min}
          onClick={() => onChange(clamp(value - step))}
        >
          <Minus aria-hidden />
        </button>
        <input
          id={inputId}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-describedby={hintId}
          onChange={(e) => onChange(clamp(Number(e.target.value) || 0))}
          className="tabular h-9 w-20 [appearance:textfield] rounded-md bg-transparent text-center text-[15px] font-semibold text-fg focus-visible:outline-2 focus-visible:outline-ring [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          className={btn}
          aria-label={`Increase ${label}`}
          aria-controls={inputId}
          disabled={max !== undefined && value >= max}
          onClick={() => onChange(clamp(value + step))}
        >
          <Plus aria-hidden />
        </button>
      </div>
    </div>
  );
}
