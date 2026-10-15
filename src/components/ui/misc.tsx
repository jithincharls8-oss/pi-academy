import { Switch as SwitchPrimitive, Progress as ProgressPrimitive } from 'radix-ui';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Switch({ className, ...p }: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-border bg-surface-3 transition-colors data-[state=checked]:bg-primary',
        className,
      )}
      {...p}
    >
      <SwitchPrimitive.Thumb className="block size-4 translate-x-0.5 rounded-full bg-surface shadow transition-transform data-[state=checked]:translate-x-4" />
    </SwitchPrimitive.Root>
  );
}

export function Progress({
  value,
  className,
  label,
}: {
  value: number;
  className?: string;
  label: string;
}) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <ProgressPrimitive.Root
      value={v}
      aria-label={label}
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-surface-3', className)}
    >
      <ProgressPrimitive.Indicator
        className="h-full bg-primary transition-transform"
        style={{ transform: `translateX(-${100 - v}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-10 text-center">
      <p className="font-medium">{title}</p>
      {children ? <div className="max-w-md text-sm text-fg-muted">{children}</div> : null}
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="mt-1 max-w-3xl text-fg-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-fg-muted">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {hint ? <div className="mt-1 text-xs text-fg-muted">{hint}</div> : null}
    </div>
  );
}
