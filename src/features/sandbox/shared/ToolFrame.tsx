import type { ReactNode } from 'react';
import { FlaskConical } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Desktop-client style chrome for the PI tool mockups. Always labelled as a simulation so it
 * is never mistaken for the real product.
 */
export function ToolFrame({
  title,
  menu,
  toolbar,
  status,
  children,
  className,
}: {
  title: string;
  menu?: string[];
  toolbar?: ReactNode;
  status?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-label={`${title} (simulation)`}
      className={cn(
        'flex min-h-[36rem] flex-col overflow-hidden rounded-lg border border-border bg-tool-canvas shadow-sm',
        className,
      )}
    >
      <header className="flex items-center gap-3 bg-tool-chrome px-3 py-1.5 text-sm text-tool-chrome-fg">
        <span className="font-medium">{title}</span>
        <span className="ml-auto flex items-center gap-1 rounded bg-tool-chrome-fg/15 px-2 py-0.5 text-xs">
          <FlaskConical className="size-3" aria-hidden /> Simulation on fictional data
        </span>
      </header>
      {menu ? (
        <div
          className="flex gap-4 border-b border-tool-grid bg-surface px-3 py-1 text-xs text-fg-muted"
          aria-hidden
        >
          {menu.map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
      ) : null}
      {toolbar ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-tool-grid bg-surface px-3 py-2">
          {toolbar}
        </div>
      ) : null}
      <div className="flex min-h-0 flex-1">{children}</div>
      {status ? (
        <footer className="border-t border-tool-grid bg-surface px-3 py-1 text-xs text-fg-muted">
          {status}
        </footer>
      ) : null}
    </section>
  );
}
