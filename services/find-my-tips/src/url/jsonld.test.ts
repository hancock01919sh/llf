import { describe, expect, it } from 'vitest';

import { extractRecipeIngredients } from './jsonld';

const script = (body: unknown) =>
  `<script type="application/ld+json">${typeof body === 'string' ? body : JSON.stringify(body)}</script>`;

describe('extractRecipeIngredients', () => {
  it('reads a top-level Recipe', () => {
    const html = script({
      '@context': 'https://schema.org',
      '@type': 'Recipe',
      recipeIngredient: ['2 bananas', '1 cup whole milk'],
    });
    expect(extractRecipeIngredients(html)).toEqual(['2 bananas', '1 cup whole milk']);
  });

  it('finds a Recipe inside @graph with an array @type', () => {
    const html = script({
      '@graph': [
        { '@type': 'WebPage', name: 'x' },
        { '@type': ['Thing', 'schema:Recipe'], recipeIngredient: ['basil'] },
      ],
    });
    expect(extractRecipeIngredients(html)).toEqual(['basil']);
  });

  it('accepts {text} and {name} objects and the legacy ingredients key', () => {
    const html = script({
      '@type': 'Recipe',
      ingredients: [{ text: 'spinach' }, { name: 'bread' }],
    });
    expect(extractRecipeIngredients(html)).toEqual(['spinach', 'bread']);
  });

  it('skips a malformed block and keeps reading', () => {
    const html = script('{ not json') + script({ '@type': 'Recipe', recipeIngredient: ['milk'] });
    expect(extractRecipeIngredients(html)).toEqual(['milk']);
  });

  it('strips tags, decodes entities, and removes duplicates', () => {
    const html = script({
      '@type': 'Recipe',
      recipeIngredient: ['<b>1</b> cup milk &amp; honey', '1 cup milk &amp; honey', '  '],
    });
    expect(extractRecipeIngredients(html)).toEqual(['1 cup milk & honey']);
  });

  it('unwraps HTML comments around the JSON', () => {
    const html = script(
      `<!-- ${JSON.stringify({ '@type': 'Recipe', recipeIngredient: ['chicken'] })} -->`,
    );
    expect(extractRecipeIngredients(html)).toEqual(['chicken']);
  });

  it('returns null when there is no recipe', () => {
    expect(extractRecipeIngredients(script({ '@type': 'Article', name: 'x' }))).toBeNull();
    expect(extractRecipeIngredients('<p>no json-ld</p>')).toBeNull();
    expect(
      extractRecipeIngredients(script({ '@type': 'Recipe', recipeIngredient: [] })),
    ).toBeNull();
  });
});
