import type { ReactNode } from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/cn';

/** Heading row for a tool pane, like an SMT plug-in title bar. */
export function ToolHeader({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-start justify-between gap-3 border-b border-tool-grid pb-2">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {children ? <div className="mt-0.5 max-w-3xl text-xs text-fg-muted">{children}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/** Teaching note shown next to a tool. */
export function Note({
  children,
  tone = 'info',
  className,
}: {
  children: ReactNode;
  tone?: 'info' | 'warn';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex gap-2 rounded border px-3 py-2 text-xs',
        tone === 'info'
          ? 'border-info/40 bg-info-soft text-fg'
          : 'border-warning/50 bg-warning-soft text-fg',
        className,
      )}
    >
      <Info className="mt-0.5 size-3.5 shrink-0 text-fg-muted" aria-hidden />
      <div className="space-y-1">{children}</div>
    </div>
  );
}

/** Scrollable table wrapper with a caption for screen readers. */
export function Grid({
  caption,
  children,
  className,
}: {
  caption: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('overflow-auto rounded border border-tool-grid bg-surface', className)}>
      <table className="w-full border-collapse text-xs">
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={cn(
        'sticky top-0 z-10 border-b border-tool-grid bg-surface-2 px-2 py-1.5 text-left font-medium whitespace-nowrap text-fg-muted',
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  mono,
}: {
  children?: ReactNode;
  className?: string;
  mono?: boolean;
}) {
  return (
    <td
      className={cn(
        'border-b border-tool-grid px-2 py-1 align-top',
        mono && 'font-mono',
        className,
      )}
    >
      {children}
    </td>
  );
}

export const fieldClass =
  'h-8 w-full rounded border border-border bg-surface px-2 text-xs text-fg focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-60 aria-[invalid=true]:border-danger';

export const smallButton =
  'inline-flex h-7 items-center gap-1 rounded border border-border bg-surface px-2 text-xs hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50 [&_svg]:size-3.5';
