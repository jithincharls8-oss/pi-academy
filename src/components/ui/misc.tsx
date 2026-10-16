import { Switch as SwitchPrimitive, Progress as ProgressPrimitive } from 'radix-ui';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Pip, type PipMood } from './pip';

export function Switch({ className, ...p }: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        'relative inline-flex h-[26px] w-[44px] shrink-0 cursor-pointer items-center rounded-full bg-surface-3 p-0.5 transition-colors duration-200 data-[state=checked]:bg-success-solid disabled:opacity-50',
        className,
      )}
      {...p}
    >
      <SwitchPrimitive.Thumb className="block size-[22px] rounded-full bg-on-solid shadow-card transition-transform duration-200 data-[state=checked]:translate-x-[18px]" />
    </SwitchPrimitive.Root>
  );
}

export function Progress({
  value,
  className,
  label,
  tone = 'primary',
}: {
  value: number;
  className?: string;
  label: string;
  tone?: 'primary' | 'success' | 'xp';
}) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <ProgressPrimitive.Root
      value={v}
      aria-label={label}
      className={cn('relative h-2.5 w-full overflow-hidden rounded-full bg-surface-3', className)}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          'h-full rounded-full transition-transform duration-500 ease-out',
          tone === 'success' ? 'bg-path-done' : tone === 'xp' ? 'bg-xp' : 'bg-primary-solid',
        )}
        style={{ transform: `translateX(-${100 - v}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export function EmptyState({
  title,
  children,
  action,
  mood = 'wave',
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  mood?: PipMood | 'none';
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl bg-surface-2/60 px-6 py-10 text-center ring-1 ring-border/60">
      {mood === 'none' ? null : <Pip mood={mood} size={72} />}
      <p className="text-[17px] font-semibold tracking-[-0.02em]">{title}</p>
      {children ? (
        <div className="max-w-md text-sm leading-relaxed text-fg-muted">{children}</div>
      ) : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? (
          <div className="mb-1 text-[13px] font-semibold text-primary">{eyebrow}</div>
        ) : null}
        <h1 className="text-[32px] leading-tight font-bold tracking-[-0.03em]">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-fg-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-xl bg-surface p-4 shadow-card ring-1 ring-border/70 dark:ring-border">
      <div className="flex items-center gap-1.5 text-[13px] font-medium text-fg-muted">
        {icon}
        {label}
      </div>
      <div className="tabular mt-1 text-[28px] leading-tight font-bold tracking-[-0.03em]">
        {value}
      </div>
      {hint ? <div className="mt-0.5 text-xs text-fg-muted">{hint}</div> : null}
    </div>
  );
}
