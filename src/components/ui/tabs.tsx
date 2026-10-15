import { Tabs as TabsPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...p }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex flex-wrap items-center gap-1 rounded-md bg-surface-2 p-1',
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
        'rounded px-3 py-1.5 text-sm font-medium text-fg-muted transition-colors hover:text-fg data-[state=active]:bg-surface data-[state=active]:text-fg data-[state=active]:shadow-sm',
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
