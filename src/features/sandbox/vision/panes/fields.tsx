/** Small labelled form controls used by the configure pane. */
import { useId, type ReactNode } from 'react';
import { Input, Select } from '@/components/ui/input';
import { Switch } from '@/components/ui/misc';
import { COLOR_LABELS, colorVar, TOKEN_COLORS, type TokenColor } from '../colors';

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-2 border-t border-tool-grid px-3 py-3">
      <legend className="float-left mb-1 w-full text-xs font-semibold tracking-wide text-fg-muted uppercase">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs font-medium">
        {label}
      </label>
      <Input
        id={id}
        className="h-8"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  placeholder,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div className="min-w-0 space-y-1">
      <label htmlFor={id} className="text-xs font-medium">
        {label}
      </label>
      <Input
        id={id}
        type="number"
        className="h-8 px-2"
        value={value ?? ''}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === '') return onChange(null);
          const n = Number(raw);
          if (Number.isFinite(n)) onChange(n);
        }}
      />
    </div>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const id = useId();
  return (
    <div className="min-w-0 space-y-1">
      <label htmlFor={id} className="text-xs font-medium">
        {label}
      </label>
      <Select
        id={id}
        className="h-8 px-2 text-xs"
        value={value}
        onChange={(e) => {
          const v = options.find((o) => o.value === e.target.value);
          if (v) onChange(v.value);
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </div>
  );
}

export function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-2">
      <label htmlFor={id} className="text-xs">
        {label}
      </label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

const COLOR_OPTIONS = TOKEN_COLORS.map((c) => ({ value: c, label: COLOR_LABELS[c] }));
const NONE = '__none';

/** Colour chooser limited to the design-token palette; `allowNone` adds "No fill". */
export function ColorField({
  label,
  value,
  onChange,
  allowNone,
}: {
  label: string;
  value: TokenColor | null;
  onChange: (v: TokenColor | null) => void;
  allowNone?: boolean;
}) {
  const id = useId();
  return (
    <div className="min-w-0 space-y-1">
      <label htmlFor={id} className="text-xs font-medium">
        {label}
      </label>
      <div className="flex items-center gap-1.5">
        <span
          aria-hidden
          className="size-5 shrink-0 rounded border border-border"
          style={{ background: value ? colorVar(value) : 'transparent' }}
        />
        <Select
          id={id}
          className="h-8 px-2 text-xs"
          value={value ?? NONE}
          onChange={(e) => {
            if (e.target.value === NONE) return onChange(null);
            const c = COLOR_OPTIONS.find((o) => o.value === e.target.value);
            if (c) onChange(c.value);
          }}
        >
          {allowNone ? <option value={NONE}>No fill</option> : null}
          {COLOR_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
