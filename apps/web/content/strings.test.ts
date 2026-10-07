import { describe, expect, it } from 'vitest';
import { format, strings } from './strings';

describe('site strings', () => {
  it('parse at import time', () => {
    expect(strings.site.name).toBeTruthy();
  });

  it('format fills known placeholders and keeps unknown ones', () => {
    expect(format('{count} results for {term}', { count: 3 })).toBe('3 results for {term}');
  });
});
