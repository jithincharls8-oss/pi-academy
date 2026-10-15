import type { KeyboardEvent, ReactNode } from 'react';
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/cn';

/** Pencil marker PSE shows on a checked-out object. */
export function CheckedOutMark({ label = 'Checked out by you' }: { label?: string }) {
  return (
    <span className="inline-flex items-center text-warning" title={label}>
      <Pencil className="size-3.5" aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/**
 * Props that make a table row selectable with the mouse and keyboard: Tab focuses rows,
 * Enter or Space selects, and the arrow keys move between rows.
 */
export function selectableRow(selected: boolean, onSelect: () => void, onOpen?: () => void) {
  return {
    tabIndex: 0,
    'aria-selected': selected,
    onClick: onSelect,
    onDoubleClick: onOpen,
    onKeyDown: (e: KeyboardEvent<HTMLTableRowElement>): void => {
      if (e.target !== e.currentTarget) return;
      if (e.key === 'Enter' && onOpen) {
        e.preventDefault();
        onOpen();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const next = (
          e.key === 'ArrowDown'
            ? e.currentTarget.nextElementSibling
            : e.currentTarget.previousElementSibling
        ) as HTMLElement | null;
        next?.focus();
        next?.click();
      }
    },
    className: cn(
      'cursor-pointer border-b border-tool-grid outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
      selected ? 'bg-tool-select' : 'hover:bg-surface-2',
    ),
  };
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={cn(
        'border-b border-border bg-surface-2 px-2 py-1.5 text-left text-xs font-medium text-fg-muted',
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn('px-2 py-1 align-top', className)}>{children}</td>;
}

/** Label/value pair in a property sheet. */
export function Prop({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] items-baseline gap-2 py-1 text-sm">
      <dt className="text-fg-muted">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

export function Panel({
  title,
  children,
  actions,
  className,
}: {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-label={title}
      className={cn('rounded border border-border bg-surface', className)}
    >
      <header className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-2 px-3 py-1.5">
        <h3 className="text-sm font-semibold">{title}</h3>
        {actions ? <div className="ml-auto flex flex-wrap gap-2">{actions}</div> : null}
      </header>
      <div className="p-3">{children}</div>
    </section>
  );
}

/** An expression with the character at an error position highlighted. */
export function ErrorAt({ source, position }: { source: string; position: number }) {
  const p = Math.max(0, Math.min(position, source.length));
  const at = source.slice(p, p + 1) || ' ';
  return (
    <code className="block overflow-x-auto font-mono text-xs whitespace-pre text-fg-muted">
      {source.slice(0, p)}
      <mark className="rounded-sm bg-danger-soft px-px text-danger underline">{at}</mark>
      {source.slice(p + 1)}
    </code>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="text-xs text-fg-muted">{children}</p>;
}
