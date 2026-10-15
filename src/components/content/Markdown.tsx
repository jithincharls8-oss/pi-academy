import { Fragment, useMemo } from 'react';
import { renderMarkdown } from './markdown';
import { Mermaid } from './Mermaid';
import { cn } from '@/lib/cn';

const MERMAID_SPLIT = /<div class="mermaid-block" data-mermaid="([^"]*)"><\/div>/g;

function decodeSource(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return '';
  }
}

/** Sanitised Markdown with GitHub-style callouts and Mermaid diagrams. */
export function Markdown({ source, className }: { source: string; className?: string }) {
  const parts = useMemo(() => {
    const html = renderMarkdown(source);
    const out: { kind: 'html' | 'mermaid'; value: string }[] = [];
    let last = 0;
    for (const m of html.matchAll(MERMAID_SPLIT)) {
      if (m.index > last) out.push({ kind: 'html', value: html.slice(last, m.index) });
      out.push({ kind: 'mermaid', value: decodeSource(m[1] ?? '') });
      last = m.index + m[0].length;
    }
    if (last < html.length) out.push({ kind: 'html', value: html.slice(last) });
    return out;
  }, [source]);

  return (
    <div className={cn('prose-pi', className)}>
      {parts.map((p, i) =>
        p.kind === 'mermaid' ? (
          <Mermaid key={i} source={p.value} />
        ) : (
          // Already sanitised by DOMPurify in renderMarkdown.
          <Fragment key={i}>
            <div dangerouslySetInnerHTML={{ __html: p.value }} />
          </Fragment>
        ),
      )}
    </div>
  );
}
