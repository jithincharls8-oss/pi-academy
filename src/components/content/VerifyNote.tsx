import { ChevronDown, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';

const DEFAULT_NOTE = 'This entry could not be checked against a readable primary source.';

/**
 * Small outlined marker for one unverified item (a list row, a claim). The reason is on hover
 * via the title; the detail page carries the full note in a {@link VerifyNote}.
 */
export function UnverifiedBadge({ note, className }: { note?: string | undefined; className?: string }) {
  return (
    <Badge tone="outline" title={note ?? DEFAULT_NOTE} className={cn('font-medium', className)}>
      Unverified
    </Badge>
  );
}

/**
 * One quiet line on a detail page saying parts are unverified. The note itself sits behind a
 * keyboard-accessible disclosure, so the information is kept without outweighing the content.
 */
export function VerifyNote({
  note,
  className,
  label = 'Parts of this entry are unverified',
}: {
  note?: string | undefined;
  className?: string;
  label?: string;
}) {
  return (
    <details className={cn('group text-[13px] text-fg-muted', className)}>
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-full py-0.5 hover:text-fg [&::-webkit-details-marker]:hidden">
        <Info className="size-3.5 shrink-0" aria-hidden />
        <span>{label}</span>
        <ChevronDown
          className="size-3.5 shrink-0 transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <p className="mt-1 max-w-2xl pl-5 leading-relaxed">{note ?? DEFAULT_NOTE}</p>
    </details>
  );
}
