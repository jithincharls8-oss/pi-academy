import { Marked, type Tokens } from 'marked';
import DOMPurify from 'dompurify';

const CALLOUTS: Record<string, { label: string; tone: string }> = {
  NOTE: { label: 'Note', tone: 'info' },
  TIP: { label: 'Tip', tone: 'success' },
  WARNING: { label: 'Warning', tone: 'warning' },
  CAUTION: { label: 'Caution', tone: 'danger' },
  IMPORTANT: { label: 'Important', tone: 'primary' },
  VERIFY: { label: 'Needs verification', tone: 'warning' },
};

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
    image(token: Tokens.Image): string {
      // No remote images in an offline app; show the alt text instead.
      return `<span class="text-fg-muted">[${escapeHtml(token.text)}]</span>`;
    },
  },
});

/** Markdown to sanitised HTML. Raw HTML in the source is escaped by DOMPurify's allow-list. */
export function renderMarkdown(src: string): string {
  const html = marked.parse(src, { async: false });
  return DOMPurify.sanitize(html, {
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'role', 'data-mermaid', 'data-lang', 'colspan', 'rowspan', 'align'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['style', 'script', 'iframe', 'form', 'input', 'img'],
  });
}
