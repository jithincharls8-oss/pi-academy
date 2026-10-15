// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderMarkdown } from './markdown';

describe('renderMarkdown', () => {
  it('removes scripts, event handlers and javascript: links', () => {
    const html = renderMarkdown('<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n[x](javascript:alert(1)) <b onclick="x()">b</b>');
    expect(html).not.toMatch(/<script|onerror|onclick|javascript:/i);
  });
  it('turns GitHub-style callouts into styled notes', () => {
    const html = renderMarkdown('> [!WARNING]\n> Do not set CompDev to 0.');
    expect(html).toContain('callout-warning');
    expect(html).toContain('Do not set CompDev to 0.');
    expect(html).not.toContain('[!WARNING]');
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
});
