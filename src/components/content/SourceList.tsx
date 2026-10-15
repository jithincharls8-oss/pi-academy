import { ExternalLink } from 'lucide-react';
import { useApp } from '@/app/AppContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';

/** Lists cited sources. Links open in the system browser only when online features are allowed. */
export function SourceList({ ids, compact = false }: { ids: readonly string[]; compact?: boolean }) {
  const { library, settings } = useApp();
  const sources = ids.map((id) => library.source.find((s) => s.id === id)).filter((s) => s !== undefined);
  if (sources.length === 0) return null;
  return (
    <div className={cn(compact ? 'mt-3 text-xs' : 'mt-2 text-sm')}>
      <div className="font-semibold text-fg-muted">Sources</div>
      <ul className="mt-1 space-y-1">
        {sources.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center gap-2">
            {settings.onlineFeatures ? (
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary underline">
                {s.title} <ExternalLink className="size-3" aria-hidden />
              </a>
            ) : (
              <span title={s.url}>{s.title}</span>
            )}
            <span className="text-fg-muted">({s.publisher})</span>
            {!s.readable ? (
              <Badge tone="warning" title="This page could only be located, not read, when the content was written.">
                located only
              </Badge>
            ) : null}
          </li>
        ))}
      </ul>
      {!settings.onlineFeatures ? (
        <p className="mt-1 text-fg-subtle">Turn on online features in Settings to open source links.</p>
      ) : null}
    </div>
  );
}
