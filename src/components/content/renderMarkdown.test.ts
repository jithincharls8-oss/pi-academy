// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderMarkdown } from './renderMarkdown';

describe('renderMarkdown', () => {
  it('removes scripts, event handlers and javascript: links', () => {
    const html = renderMarkdown('<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n[x](javascript:alert(1)) <b onclick="x()">b</b>');
    // Raw HTML is escaped to text, so nothing executable survives as markup.
    const doc = new DOMParser().parseFromString(html, 'text/html');
    expect(doc.querySelector('script, img, [onerror], [onclick]')).toBeNull();
    expect([...doc.querySelectorAll('a')].some((a) => /javascript:/i.test(a.href))).toBe(false);
    expect(html).not.toMatch(/<script|<img/i);
  });
  it('turns GitHub-style callouts into styled notes', () => {
    const html = renderMarkdown('> [!WARNING]\n> Do not set CompDev to 0.');
    expect(html).toContain('callout-warning');
    expect(html).toContain('Do not set CompDev to 0.');
    expect(html).not.toContain('[!WARNING]');
  });
  it('renders [!VERIFY] notes as a quiet, labelled note instead of a warning box', () => {
    const html = renderMarkdown('> [!VERIFY]\n> The window is an example.');
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const note = doc.querySelector('[role="note"]');
    expect(note?.classList.contains('verify-note')).toBe(true);
    expect(note?.classList.contains('text-fg-muted')).toBe(true);
    expect(note?.textContent).toContain('Unverified');
    expect(note?.textContent).toContain('The window is an example.');
    expect(html).not.toContain('callout-warning');
    expect(html).not.toContain('[!VERIFY]');
  });
  it('keeps mermaid source for the diagram component, escaped', () => {
    const html = renderMarkdown('```mermaid\nflowchart LR\n  A["<b>x</b>"] --> B\n```');
    expect(html).toContain('mermaid-block');
    expect(html).not.toContain('<b>x</b>');
    // The source must survive sanitising intact, arrows included.
    const encoded = /data-mermaid="([^"]*)"/.exec(html)?.[1] ?? '';
    expect(decodeURIComponent(encoded)).toBe('flowchart LR\n  A["<b>x</b>"] --> B');
  });
  it('opens external links safely and drops unknown relative links', () => {
    const html = renderMarkdown('[AVEVA](https://docs.aveva.com) and [local](file.txt) and [in-app](#/learn)');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).not.toContain('file.txt');
    expect(html).toContain('href="#/learn"');
  });
  it('shows raw HTML as text instead of rendering it', () => {
    const html = renderMarkdown(
      'Hi <a href="https://evil.example" target="_blank">x</a>\n\n<div class="fixed inset-0 mermaid-block">overlay</div>',
    );
    expect(html).not.toContain('<a href="https://evil.example"');
    expect(html).not.toContain('<div class="fixed');
    expect(html).toContain('&lt;a href=');
  });
  it('drops non-app relative links and hardens external ones', () => {
    const html = renderMarkdown('[mail](mailto:a@b.c) [ext](https://aveva.com)');
    expect(html).not.toContain('mailto:');
    expect(html).toMatch(/href="https:\/\/aveva.com" target="_blank" rel="noopener noreferrer"/);
  });
});
