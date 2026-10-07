import { describe, expect, it } from 'vitest';
import { IngredientData, parseResultSlugs, RESULTS_MAX_SLUGS, toSlug } from './catalog';

describe('toSlug', () => {
  it.each([
    ['Tomatoes', 'tomatoes'],
    ['Bell Peppers', 'bell-peppers'],
    ['Jalapeño', 'jalapeno'],
    ['Mac & Cheese', 'mac-and-cheese'],
    ['  Bread (sliced) ', 'bread-sliced'],
  ])('%s → %s', (title, slug) => {
    expect(toSlug(title)).toBe(slug);
  });
});

describe('parseResultSlugs', () => {
  it('returns [] for empty input', () => {
    expect(parseResultSlugs(null)).toEqual([]);
    expect(parseResultSlugs('')).toEqual([]);
  });

  it('drops invalid and duplicate slugs and keeps order', () => {
    expect(parseResultSlugs('milk,Bread,../etc,milk,,<b>')).toEqual(['milk', 'bread']);
  });

  it(`caps the list at ${RESULTS_MAX_SLUGS}`, () => {
    const many = Array.from({ length: 50 }, (_, i) => `item-${i}`).join(',');
    expect(parseResultSlugs(many)).toHaveLength(RESULTS_MAX_SLUGS);
  });
});

describe('IngredientData', () => {
  it('rejects a bad slug', () => {
    const result = IngredientData.safeParse({
      slug: 'Not A Slug',
      title: 'x',
      wasted: 3,
      image: null,
      tips: [],
    });
    expect(result.success).toBe(false);
  });
});
