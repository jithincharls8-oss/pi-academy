import { useEffect, useId, useState } from 'react';
import DOMPurify from 'dompurify';
import { cn } from '@/lib/cn';

let mermaidPromise: Promise<typeof import('mermaid').default> | null = null;
function loadMermaid(): Promise<typeof import('mermaid').default> {
  mermaidPromise ??= import('mermaid').then((m) => m.default);
  return mermaidPromise;
}

function isDark(): boolean {
  return document.documentElement.dataset['theme'] === 'dark';
}

/** Reads a design token (a CSS custom property on :root) as a concrete colour string. */
function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
}

/**
 * Mermaid's "base" theme filled from the design tokens at render time, so diagrams follow the
 * active light or dark theme: flat surface nodes, hairline borders, token text colours and the
 * app's own font. Mermaid needs concrete colour strings, so nothing here is a literal.
 */
function themeFromTokens() {
  const surface = token('surface');
  const surface2 = token('surface-2');
  const fg = token('fg');
  const muted = token('fg-muted');
  const border = token('border-strong');
  const hairline = token('border');
  const line = token('fg-subtle');
  return {
    darkMode: isDark(),
    fontFamily: getComputedStyle(document.body).fontFamily,
    fontSize: '13px',
    background: surface,
    mainBkg: surface,
    primaryColor: surface,
    primaryTextColor: fg,
    primaryBorderColor: border,
    secondaryColor: surface2,
    secondaryTextColor: fg,
    secondaryBorderColor: border,
    tertiaryColor: surface2,
    tertiaryTextColor: fg,
    tertiaryBorderColor: hairline,
    nodeBorder: border,
    nodeTextColor: fg,
    textColor: fg,
    titleColor: muted,
    lineColor: line,
    clusterBkg: surface2,
    clusterBorder: hairline,
    edgeLabelBackground: surface,
  };
}

/** Re-renders when the html[data-theme] attribute changes (light, dark or system switch). */
function useThemeKey(): string {
  const [theme, setTheme] = useState(() => document.documentElement.dataset['theme'] ?? '');
  useEffect(() => {
    const el = document.documentElement;
    const obs = new MutationObserver(() => setTheme(el.dataset['theme'] ?? ''));
    obs.observe(el, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);
  return theme;
}

/**
 * Renders a Mermaid diagram as sanitised SVG, drawn at its natural size (scaled down only when
 * it would overflow). Uses the strict security level and no HTML labels.
 */
export function Mermaid({
  source,
  label,
  className,
}: {
  source: string;
  label?: string;
  /** Extra classes on the frame, e.g. selectors that tint specific subgraphs. */
  className?: string;
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const theme = useThemeKey();
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadMermaid().then(async (mermaid) => {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'base',
        look: 'classic',
        themeVariables: themeFromTokens(),
        htmlLabels: false,
        flowchart: {
          htmlLabels: false,
          useMaxWidth: false,
          nodeSpacing: 28,
          rankSpacing: 36,
          padding: 12,
          diagramPadding: 4,
          curve: 'basis',
        },
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
  }, [source, id, theme]);

  if (error) {
    return (
      <div className="my-4 rounded-xl bg-surface-2 p-4 text-sm ring-1 ring-border">
        <div className="font-semibold">Diagram could not be drawn</div>
        <pre className="mt-2 overflow-x-auto text-xs text-fg-muted">{source}</pre>
      </div>
    );
  }
  if (!svg)
    return (
      <div
        className="my-4 h-40 animate-pulse rounded-xl bg-surface-2"
        role="status"
        aria-label="Loading diagram"
      />
    );
  return (
    <figure
      className={cn(
        // Sized to the diagram: the frame hugs its content and scrolls only if it is too wide.
        'my-4 w-fit max-w-full overflow-x-auto rounded-xl bg-surface p-4 ring-1 ring-border',
        '[&_svg]:block [&_svg]:h-auto [&_svg]:max-w-full',
        // Flat, rounded nodes: no drop shadows, continuous-corner rectangles.
        '[&_.node_rect]:[rx:8px] [&_.node_rect]:[ry:8px] [&_.cluster_rect]:[rx:12px] [&_.cluster_rect]:[ry:12px] [&_svg_*]:[filter:none]',
        '[&_.edgeLabel_rect]:[rx:4px] [&_.edgeLabel]:text-fg-muted',
        className,
      )}
      // No role="img": that would hide the diagram's text labels from screen readers.
      aria-label={label ?? 'Diagram'}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
