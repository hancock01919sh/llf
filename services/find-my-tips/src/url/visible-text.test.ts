import { describe, expect, it } from 'vitest';

import { visibleText } from './visible-text';

describe('visibleText', () => {
  it('prefers <main> and drops chrome', () => {
    const html = `<html><head><title>T</title></head><body>
      <nav>Menu</nav>
      <main><h1>Soup</h1><script>var x = 1;</script><p>2 cups spinach</p><!-- hidden --></main>
      <footer>Footer</footer></body></html>`;
    const text = visibleText(html);
    expect(text).toContain('Soup');
    expect(text).toContain('2 cups spinach');
    expect(text).not.toMatch(/Menu|Footer|var x|hidden|<p>/);
  });

  it('falls back to <body> and decodes entities', () => {
    const text = visibleText('<body><p>Milk &amp; bread&nbsp;rolls</p><style>p{}</style></body>');
    expect(text).toBe('Milk & bread rolls');
  });

  it('caps the output length', () => {
    expect(visibleText(`<p>${'a'.repeat(100)}</p>`, 10)).toHaveLength(10);
  });
});
