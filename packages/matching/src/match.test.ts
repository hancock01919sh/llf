import type { CatalogIngredient } from '@llf/contracts';
import { describe, expect, it } from 'vitest';
import { createMatcher, matchTerms } from './match';

const catalog: CatalogIngredient[] = [
  { slug: 'milk', title: 'Milk', synonyms: [] },
  { slug: 'chicken-breast', title: 'Chicken Breast', synonyms: [] },
  { slug: 'chicken', title: 'Chicken', synonyms: [] },
  { slug: 'scallions', title: 'Scallions', synonyms: ['green onions', 'spring onion'] },
  { slug: 'onion', title: 'Onion', synonyms: [] },
  { slug: 'strawberries', title: 'Strawberries', synonyms: [] },
  { slug: 'bread', title: 'Bread', synonyms: [] },
  { slug: 'beef', title: 'Beef', synonyms: [] },
  { slug: 'ground-beef', title: 'Ground Beef', synonyms: [] },
];

describe('createMatcher', () => {
  const matcher = createMatcher(catalog);

  it('matches title and synonyms exactly (strong)', () => {
    expect(matcher.match('milk')).toMatchObject({ slug: 'milk', tier: 'strong' });
    expect(matcher.match('2 cups of Milk')).toMatchObject({ slug: 'milk', tier: 'strong' });
    expect(matcher.match('Green Onions')).toMatchObject({ slug: 'scallions', tier: 'strong' });
    expect(matcher.match('strawberry')).toMatchObject({ slug: 'strawberries', tier: 'strong' });
  });

  it('matches by token set / head noun (good)', () => {
    expect(matcher.match('boneless chicken breast')).toMatchObject({
      slug: 'chicken-breast',
      tier: 'good',
    });
    expect(matcher.match('whole milk')).toMatchObject({ slug: 'milk', tier: 'good' });
    expect(matcher.match('red onion')).toMatchObject({ slug: 'onion', tier: 'good' });
    expect(matcher.match('sourdough bread')).toMatchObject({ slug: 'bread', tier: 'good' });
    expect(matcher.match('lean ground beef')).toMatchObject({ slug: 'ground-beef', tier: 'good' });
  });

  it('requires a one-word name to be the head noun', () => {
    expect(matcher.match('chicken stock')).toBeNull();
    expect(matcher.match('milk chocolate')).toBeNull();
  });

  it('allows one edit for longer terms (weak), and can turn that off', () => {
    expect(matcher.match('stawberries')).toMatchObject({ slug: 'strawberries', tier: 'weak' });
    expect(matcher.match('brad')).toBeNull();
    expect(createMatcher(catalog, { weak: false }).match('stawberries')).toBeNull();
  });

  it('returns null for empty or unknown terms', () => {
    expect(matcher.match('')).toBeNull();
    expect(matcher.match('dish soap')).toBeNull();
  });
});

describe('matchTerms', () => {
  it('dedupes by slug, keeps the best tier, and counts misses', () => {
    const result = matchTerms(createMatcher(catalog), [
      'whole milk',
      'milk',
      'red onion',
      'dish soap',
      'paper towels',
    ]);
    expect(result.matches).toEqual([
      { slug: 'milk', title: 'Milk', tier: 'strong' },
      { slug: 'onion', title: 'Onion', tier: 'good' },
    ]);
    expect(result.unmatchedCount).toBe(2);
  });
});
