import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { renderMarkdown } from './markdown';
import { Mermaid } from './Mermaid';
import { cn } from '@/lib/cn';

function decodeSource(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return '';
  }
}

/**
 * Sanitised Markdown with GitHub-style callouts and Mermaid diagrams. Diagrams are mounted
 * into their placeholder elements, so one inside a callout or list stays where it was written.
 */
export function Markdown({ source, className }: { source: string; className?: string }) {
  const html = useMemo(() => renderMarkdown(source), [source]);
  const ref = useRef<HTMLDivElement>(null);
  const [slots, setSlots] = useState<{ el: HTMLElement; source: string }[]>([]);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    setSlots(
      Array.from(root.querySelectorAll<HTMLElement>('div.mermaid-block[data-mermaid]')).map(
        (el) => ({ el, source: decodeSource(el.dataset['mermaid'] ?? '') }),
      ),
    );
  }, [html]);

  return (
    <>
      {/* Already sanitised by DOMPurify in renderMarkdown. */}
      <div ref={ref} className={cn('prose-pi', className)} dangerouslySetInnerHTML={{ __html: html }} />
      {slots.map((s, i) => (s.source ? createPortal(<Mermaid source={s.source} />, s.el, i) : null))}
    </>
  );
}
