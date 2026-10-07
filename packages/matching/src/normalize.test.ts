import { describe, expect, it } from 'vitest';
import { normalize, singularize } from './normalize';

describe('normalize', () => {
  it.each([
    ['Milk', 'milk'],
    ['  Whole   MILK ', 'whole milk'],
    ['Jalapeño', 'jalapeno'],
    ['2 cups of milk', 'milk'],
    ['1½ cups all-purpose flour', 'all purpose flour'],
    ['200g cheddar (grated)', 'cheddar'],
    ['2 cloves garlic, minced', 'garlic'],
    ['3 large tomatoes', 'large tomato'],
    ['1 (15 oz) can black beans, drained', 'black bean'],
    ['Cloves', 'clove'],
    ['Brand™ Strawberries', 'strawberry'],
    ['', ''],
  ])('%s → %s', (input, expected) => {
    expect(normalize(input)).toBe(expected);
  });
});

describe('singularize', () => {
  it.each([
    ['eggs', 'egg'],
    ['berries', 'berry'],
    ['pies', 'pie'],
    ['potatoes', 'potato'],
    ['peaches', 'peach'],
    ['radishes', 'radish'],
    ['leaves', 'leaf'],
    ['olives', 'olive'],
    ['chives', 'chive'],
    ['asparagus', 'asparagus'],
    ['hummus', 'hummus'],
    ['molasses', 'molasses'],
    ['grass', 'grass'],
  ])('%s → %s', (input, expected) => {
    expect(singularize(input)).toBe(expected);
  });
});
