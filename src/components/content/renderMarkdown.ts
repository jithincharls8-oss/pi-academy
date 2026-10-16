import { Marked, type Tokens } from 'marked';
import DOMPurify from 'dompurify';

const CALLOUTS: Record<string, { label: string; tone: string }> = {
  NOTE: { label: 'Note', tone: 'info' },
  TIP: { label: 'Tip', tone: 'success' },
  WARNING: { label: 'Warning', tone: 'warning' },
  CAUTION: { label: 'Caution', tone: 'danger' },
  IMPORTANT: { label: 'Important', tone: 'primary' },
};

/*
 * [!VERIFY] notes sit next to the claim they qualify, so they stay visible but quiet: muted text
 * behind a hairline rule with a small outlined "Unverified" marker, not a loud warning box.
 * Tailwind utilities (scanned from this file); only these exact classes survive sanitising.
 */
const VERIFY_BOX =
  'verify-note my-4 border-l-2 border-border-strong pl-3 text-sm text-fg-muted [&>p]:my-1!';
const VERIFY_BADGE =
  'mr-1.5 inline-flex rounded-full px-2 py-px text-xs font-semibold ring-1 ring-inset ring-border-strong';
const VERIFY_CLASSES = new Set(`${VERIFY_BOX} ${VERIFY_BADGE}`.split(' '));

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);
}

const marked = new Marked({
  gfm: true,
  breaks: false,
  renderer: {
    code(token: Tokens.Code): string {
      if (token.lang === 'mermaid') {
        // Rendered later by the Mermaid component. The source is URI-encoded because DOMPurify
        // drops attribute values containing `-->`, which every Mermaid arrow does.
        return `<div class="mermaid-block" data-mermaid="${encodeURIComponent(token.text)}"></div>`;
      }
      const lang = token.lang ? ` data-lang="${escapeHtml(token.lang)}"` : '';
      return `<pre${lang}><code>${escapeHtml(token.text)}</code></pre>`;
    },
    blockquote(token: Tokens.Blockquote): string {
      const body = this.parser.parse(token.tokens);
      const m = /^<p>\[!([A-Z]+)\]\s*/.exec(body);
      const kind = m?.[1];
      if (m && kind === 'VERIFY') {
        const rest = body.replace(m[0], `<p><span class="${VERIFY_BADGE}">Unverified</span>`);
        return `<div class="${VERIFY_BOX}" role="note">${rest}</div>`;
      }
      const callout = kind ? CALLOUTS[kind] : undefined;
      if (!m || !callout) return `<blockquote>${body}</blockquote>`;
      return `<div class="callout callout-${callout.tone}" role="note"><div class="callout-title">${callout.label}</div>${body.replace(m[0], '<p>')}</div>`;
    },
    link(token: Tokens.Link): string {
      const text = this.parser.parseInline(token.tokens);
      const href = token.href;
      if (/^https?:\/\//i.test(href)) {
        return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${text}</a>`;
      }
      if (href.startsWith('#/')) return `<a href="${escapeHtml(href)}">${text}</a>`;
      return text;
    },
    // Raw HTML in content is shown as text, never rendered: authored content (including
    // in-app edits) must not be able to draw its own links, overlays or diagram blocks.
    html(token: Tokens.HTML | Tokens.Tag): string {
      return escapeHtml(token.text);
    },
    image(token: Tokens.Image): string {
      // No remote images in an offline app; show the alt text instead.
      return `<span class="text-fg-muted">[${escapeHtml(token.text)}]</span>`;
    },
  },
});

/** Only the classes this renderer emits survive sanitising. */
const ALLOWED_CLASS = /^(callout(-[a-z]+)?|callout-title|mermaid-block|text-fg-muted)$/;

// A private DOMPurify instance so these hooks do not touch other sanitising (Mermaid SVG).
let purifier: ReturnType<typeof DOMPurify> | null = null;
function getPurifier(): ReturnType<typeof DOMPurify> {
  if (purifier) return purifier;
  const p = DOMPurify(window);
  purifier = p;
  p.addHook('afterSanitizeAttributes', (node) => {
    const cls = node.getAttribute('class');
    if (cls !== null) {
      const kept = cls.split(/\s+/).filter((c) => ALLOWED_CLASS.test(c) || VERIFY_CLASSES.has(c));
      if (kept.length) node.setAttribute('class', kept.join(' '));
      else node.removeAttribute('class');
    }
    if (node.tagName === 'A') {
      const href = node.getAttribute('href') ?? '';
      if (/^https?:\/\//i.test(href)) {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
      } else if (!href.startsWith('#/')) {
        node.removeAttribute('href');
        node.removeAttribute('target');
      }
    }
  });
  return p;
}

/** Markdown to sanitised HTML. Raw HTML in the source is escaped, not rendered. */
export function renderMarkdown(src: string): string {
  const html = marked.parse(src, { async: false });
  return getPurifier().sanitize(html, {
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'role', 'data-mermaid', 'data-lang', 'colspan', 'rowspan', 'align'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['style', 'script', 'iframe', 'form', 'input', 'img'],
  });
}
