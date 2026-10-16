import { Tabs as TabsPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...p }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex flex-wrap items-center gap-0.5 rounded-[10px] bg-surface-3/70 p-0.5',
        className,
      )}
      {...p}
    />
  );
}
export function TabsTrigger({ className, ...p }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'rounded-[8px] px-3.5 py-1.5 text-[13px] font-semibold text-fg-muted transition-all hover:text-fg data-[state=active]:bg-surface data-[state=active]:text-fg data-[state=active]:shadow-card dark:data-[state=active]:bg-surface-3',
        className,
      )}
      {...p}
    />
  );
}
export function TabsContent({ className, ...p }: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content className={cn('mt-4 focus-visible:outline-none', className)} {...p} />
  );
}
