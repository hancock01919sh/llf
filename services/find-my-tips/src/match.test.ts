import { readFileSync } from 'node:fs';

import type { ExtractedItem } from '@llf/contracts/find-tips';
import { describe, expect, it } from 'vitest';

import { catalogFromData } from './catalog';
import { matchItems } from './match';

const fixture: unknown = JSON.parse(
  readFileSync(new URL('./fixtures/catalog.json', import.meta.url), 'utf8'),
);
const { matcher } = catalogFromData(fixture);

const food = (term: string, inferred = false): ExtractedItem => ({ term, isFood: true, inferred });

describe('matchItems', () => {
  it('skips non-food items and counts unmatched food', () => {
    const result = matchItems(
      [food('milk'), { term: 'paper towels', isFood: false, inferred: false }, food('pad thai')],
      matcher,
    );
    expect(result.matches).toEqual([{ slug: 'milk', title: 'Milk', inferred: false }]);
    expect(result.unmatchedCount).toBe(1);
  });

  it('collapses duplicate mentions of one ingredient', () => {
    const result = matchItems([food('bananas'), food('banana'), food('Bananas')], matcher);
    expect(result.matches).toEqual([{ slug: 'banana', title: 'Banana', inferred: false }]);
    expect(result.unmatchedCount).toBe(0);
  });

  it('marks a match inferred only when every mention was inferred', () => {
    expect(
      matchItems([food('milk', true), food('whole milk', true)], matcher).matches[0]?.inferred,
    ).toBe(true);
    expect(
      matchItems([food('milk', true), food('whole milk', false)], matcher).matches[0]?.inferred,
    ).toBe(false);
  });

  it('orders by match strength, then first mention', () => {
    const result = matchItems(
      [food('spinch'), food('sliced bread'), food('chicken thighs'), food('milk'), food('basil')],
      matcher,
    );
    expect(result.matches.map((match) => match.slug)).toEqual([
      'chicken',
      'milk',
      'basil',
      'bread',
      'spinach',
    ]);
  });

  it('does not match a compound whose head noun differs', () => {
    const result = matchItems([food('chicken stock')], matcher);
    expect(result.matches).toEqual([]);
    expect(result.unmatchedCount).toBe(1);
  });
});
