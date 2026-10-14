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

  it('skips plant-part words when finding the head noun', () => {
    const herbs = createMatcher([
      { slug: 'basil', title: 'Basil', synonyms: [] },
      { slug: 'celery', title: 'Celery', synonyms: [] },
    ]);
    expect(herbs.match('¼ cup fresh basil leaves')).toMatchObject({ slug: 'basil', tier: 'good' });
    expect(herbs.match('2 celery stalks, finely chopped')).toMatchObject({ slug: 'celery' });
    expect(herbs.match('3 sprigs basil')).toMatchObject({ slug: 'basil' });
    expect(herbs.match('leaves')).toBeNull();
  });

  it('reads recipe lines with trailing phrases and leading adjectives', () => {
    expect(matcher.match('1 medium onion peeled and thinly sliced')).toMatchObject({
      slug: 'onion',
    });
    expect(matcher.match('1 lb. boneless, skinless chicken breast ($5.47)')).toMatchObject({
      slug: 'chicken-breast',
    });
    expect(matcher.match('2 cups milk, divided')).toMatchObject({ slug: 'milk' });
    expect(matcher.match('1 pound strawberries on the vine (3 to 5, cut up')).toMatchObject({
      slug: 'strawberries',
    });
    expect(matcher.match('salt and freshly ground black pepper')).toBeNull();
    expect(matcher.match('boneless, skinless')).toBeNull();
  });

  it('takes the first alternative that matches on its own', () => {
    const veg = createMatcher([
      { slug: 'zucchini', title: 'Zucchini', synonyms: [] },
      { slug: 'pumpkin', title: 'Pumpkin', synonyms: ['squash'] },
      { slug: 'bell-pepper', title: 'Bell Pepper', synonyms: ['yellow pepper'] },
      { slug: 'basil', title: 'Basil', synonyms: [] },
    ]);
    expect(veg.match('2 zucchini or yellow squash, diced')).toMatchObject({ slug: 'zucchini' });
    expect(veg.match('2 red or yellow peppers')).toMatchObject({ slug: 'bell-pepper' });
    expect(veg.match('1 pack or small bunch basil')).toMatchObject({ slug: 'basil' });
    expect(veg.match('fresh oregano')).toBeNull();
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
