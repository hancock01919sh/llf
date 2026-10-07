import { describe, expect, it } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('keeps a token font size and a token color together', () => {
    expect(cn('text-label', 'text-fg')).toBe('text-label text-fg');
    expect(cn('text-paragraph text-ink-terra')).toBe('text-paragraph text-ink-terra');
  });

  it('lets later token classes win within a group', () => {
    expect(cn('px-lg', 'px-xs')).toBe('px-xs');
    expect(cn('h-control', 'h-control-compact')).toBe('h-control-compact');
    expect(cn('bg-surface-mint', 'bg-surface-sand')).toBe('bg-surface-sand');
    expect(cn('rounded-md', 'rounded-pill')).toBe('rounded-pill');
    expect(cn('text-label', 'text-paragraph')).toBe('text-paragraph');
  });

  it('drops falsy values', () => {
    expect(cn('a', false, undefined, null, 'b')).toBe('a b');
  });
});
