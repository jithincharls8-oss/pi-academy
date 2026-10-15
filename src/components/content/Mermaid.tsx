import { useEffect, useId, useState } from 'react';
import DOMPurify from 'dompurify';
import { useApp } from '@/app/AppContext';

let mermaidPromise: Promise<typeof import('mermaid').default> | null = null;
function loadMermaid(): Promise<typeof import('mermaid').default> {
  mermaidPromise ??= import('mermaid').then((m) => m.default);
  return mermaidPromise;
}

function isDark(): boolean {
  return document.documentElement.dataset['theme'] === 'dark';
}

/** Renders a Mermaid diagram as sanitised SVG. Uses the strict security level and no HTML labels. */
export function Mermaid({ source, label }: { source: string; label?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const { settings } = useApp();
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadMermaid().then(async (mermaid) => {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: isDark() ? 'dark' : 'neutral',
        htmlLabels: false,
        fontFamily: 'inherit',
      });
      try {
        const out = await mermaid.render(`m${id}`, source);
        if (!cancelled) {
          setSvg(
            // Links inside diagrams are dropped (their text is kept): diagrams never navigate.
            DOMPurify.sanitize(out.svg, {
              USE_PROFILES: { svg: true, svgFilters: true },
              FORBID_TAGS: ['a'],
            }),
          );
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [source, id, settings.theme]);

  if (error) {
    return (
      <div className="rounded-md border border-warning bg-warning-soft p-3 text-sm">
        <div className="font-medium">Diagram could not be drawn</div>
        <pre className="mt-2 overflow-x-auto text-xs">{source}</pre>
      </div>
    );
  }
  if (!svg)
    return (
      <div className="h-40 animate-pulse rounded-md bg-surface-2" role="status" aria-label="Loading diagram" />
    );
  return (
    <figure
      className="my-4 overflow-x-auto rounded-md border border-border bg-surface p-4 [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full"
      // No role="img": that would hide the diagram's text labels from screen readers.
      aria-label={label ?? 'Diagram'}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
