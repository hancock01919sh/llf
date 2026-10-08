import { describe, expect, it } from 'vitest';
import {
  pathKey,
  Seed,
  SEED_BLOCK_COMPONENTS,
  SeedBlock,
  SeedCta,
  SeedIngredient,
  SeedPage,
  SeedPath,
  seedFile,
  SeedTaxonomy,
  toBlocks,
  validateSeed,
  type SeedInput,
} from './seed';

const minimal = (): SeedInput => ({
  taxonomies: {
    tip_types: [{ title: 'Storage' }],
    tip_behaviors: [{ title: 'Plan' }],
    tip_motivators: [{ title: 'Save money' }],
  },
  ingredients: [{ title: 'Banana' }, { title: 'Bell Peppers' }],
  tips: [
    {
      title: 'Freeze it',
      type: 'Storage',
      behavior: 'Plan',
      motivator: 'Save money',
      ingredient: 'banana',
    },
    { title: 'Shop your fridge first' },
  ],
  groups: [{ title: 'Your kitchen', description: 'Where food goes.' }],
  categories: [
    {
      title: 'Produce',
      slug: 'produce',
      group: 'Your kitchen',
      ingredients: ['banana', 'bell-peppers'],
    },
    {
      title: 'Smart Shopping',
      slug: 'smart-shopping',
      mode: 'Tips',
      tips: ['Shop your fridge first'],
    },
  ],
  pages: [
    {
      title: 'Home',
      path: '/',
      main: [
        { __component: 'component.hero', ctas: [{ label: 'About', page: 'about' }] },
        { __component: 'component.carousel', categories: ['produce', 'smart-shopping'] },
        { __component: 'custom.tip-list', tips: ['Freeze it'] },
      ],
    },
    {
      title: 'About',
      path: 'about',
      main: [
        { __component: 'component.teaser', ctas: [{ label: 'Home', page: '/' }] },
        { __component: 'component.link-list', pages: ['/', 'about'] },
      ],
    },
  ],
});

const parse = (input: SeedInput) => Seed.parse(input);

describe('seed schemas', () => {
  it('applies defaults', () => {
    const seed = parse({
      ...minimal(),
      pages: [
        {
          title: 'Home',
          path: '/',
          main: [
            { __component: 'component.hero' },
            { __component: 'component.teaser', title: { copy: 'Hi' } },
            { __component: 'component.link-list' },
            { __component: 'component.carousel' },
            { __component: 'custom.tip-list' },
          ],
        },
        { title: 'Empty', path: 'empty' },
      ],
    });
    expect(seed.ingredients[0]).toEqual({ title: 'Banana', synonyms: [], wasted: 3 });
    expect(seed.categories[0]?.mode).toBe('Ingredients');
    expect(seed.categories[1]?.ingredients).toEqual([]);
    const [hero, teaser, linkList, carousel, tipList] = seed.pages[0]?.main ?? [];
    expect(hero).toMatchObject({ layout: 'Primary', description: [], ctas: [] });
    expect(teaser).toMatchObject({ layout: 'Basic', title: { copy: 'Hi', header: 'h3' } });
    expect(linkList).toMatchObject({ layout: 'Basic', pages: [] });
    expect(carousel).toMatchObject({ layout: 'Basic', mode: 'categories', categories: [] });
    expect(tipList).toMatchObject({ layout: 'Basic', tips: [] });
    expect(seed.pages[1]?.main).toEqual([]);
  });

  it('rejects unknown keys', () => {
    expect(SeedTaxonomy.safeParse({ title: 'x', slug: 'x' }).success).toBe(false);
    expect(SeedPage.safeParse({ title: 'x', path: 'x', mian: [] }).success).toBe(false);
    expect(
      SeedBlock.safeParse({ __component: 'custom.search', placeholder: 'x', extra: 1 }).success,
    ).toBe(false);
    expect(Seed.safeParse({ ...minimal(), global: {} }).success).toBe(false);
  });

  it('defaults the page template to generic and fills template slots', () => {
    expect(SeedPage.parse({ title: 'About', path: 'about' }).template).toBe('generic');
    const home = SeedPage.parse({
      title: 'Home',
      path: '/',
      template: 'home',
      hero: { eyebrow: 'Hi' },
      intro: ['Welcome'],
      featured: ['fruits'],
    });
    expect(home.hero).toEqual({ layout: 'Primary', eyebrow: 'Hi', description: [], ctas: [] });
    expect(home.featured).toEqual(['fruits']);
  });

  it.each([
    [{ template: 'generic', hero: { eyebrow: 'Hi' } }, 'hero'],
    [{ template: 'generic', featured: ['fruits'] }, 'featured'],
    [
      {
        template: 'home',
        tool: {
          url_label: 'a',
          url_placeholder: 'b',
          upload_label: 'c',
          upload_placeholder: 'd',
          description: 'e',
          cta_label: 'f',
        },
      },
      'tool',
    ],
    [
      { template: 'find-my-tips', main: [{ __component: 'custom.search', placeholder: 'x' }] },
      'main',
    ],
  ])('rejects a slot the template does not show (%#)', (page, slot) => {
    const result = SeedPage.safeParse({ title: 'x', path: 'x', ...page });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual([slot]);
  });

  it('rejects an unknown block component', () => {
    expect(SeedBlock.safeParse({ __component: 'component.video' }).success).toBe(false);
  });

  it('rejects blank text', () => {
    expect(SeedTaxonomy.safeParse({ title: '   ' }).success).toBe(false);
  });

  it.each([
    [{ label: 'Go', page: 'about' }, true],
    [{ label: 'Go', href: 'https://example.org/' }, true],
    [{ label: 'Go' }, false],
    [{ label: 'Go', page: 'about', href: 'https://example.org/' }, false],
    [{ label: 'Go', href: 'javascript:alert(1)' }, false],
    [{ label: 'Go', href: 'ftp://example.org/' }, false],
  ])('CTA %j → %s', (cta, ok) => {
    expect(SeedCta.safeParse(cta).success).toBe(ok);
  });

  it('rejects synonyms with commas', () => {
    expect(
      SeedIngredient.safeParse({ title: 'Bread', synonyms: ['loaf, sourdough'] }).success,
    ).toBe(false);
  });

  it('rejects wasted outside 1–5', () => {
    expect(SeedIngredient.safeParse({ title: 'Bread', wasted: 0 }).success).toBe(false);
    expect(SeedIngredient.safeParse({ title: 'Bread', wasted: 6 }).success).toBe(false);
    expect(SeedIngredient.safeParse({ title: 'Bread', wasted: 2.5 }).success).toBe(false);
  });

  it.each([
    ['/', true],
    ['about', true],
    ['a/b-c', true],
    ['find-my-tips', true],
    ['/about', false],
    ['about/', false],
    ['About', false],
    ['a//b', false],
    ['', false],
  ])('path %j → %s', (path, ok) => {
    expect(SeedPath.safeParse(path).success).toBe(ok);
  });

  it('lists every block component once', () => {
    expect(SEED_BLOCK_COMPONENTS).toHaveLength(7);
    expect(new Set(SEED_BLOCK_COMPONENTS).size).toBe(7);
  });

  it('wraps a section in a versioned file', () => {
    const File = seedFile(SeedTaxonomy);
    expect(File.safeParse({ version: 1, data: { title: 'x' } }).success).toBe(true);
    expect(File.safeParse({ version: 2, data: { title: 'x' } }).success).toBe(false);
    expect(File.safeParse({ data: { title: 'x' } }).success).toBe(false);
  });
});

describe('pathKey', () => {
  it.each([
    ['/', ''],
    ['about', 'about'],
    ['/about/', 'about'],
    ['a/b', 'a/b'],
  ])('%s → %s', (path, key) => {
    expect(pathKey(path)).toBe(key);
  });
});

describe('toBlocks', () => {
  it('turns paragraphs into Strapi blocks', () => {
    expect(toBlocks(['One', 'Two'])).toEqual([
      { type: 'paragraph', children: [{ type: 'text', text: 'One' }] },
      { type: 'paragraph', children: [{ type: 'text', text: 'Two' }] },
    ]);
    expect(toBlocks([])).toEqual([]);
  });
});

describe('validateSeed', () => {
  it('accepts a consistent seed, including references to home', () => {
    expect(validateSeed(parse(minimal()))).toEqual([]);
  });

  it('reports duplicate keys', () => {
    const input = minimal();
    input.taxonomies.tip_types.push({ title: 'Storage' });
    input.ingredients.push({ title: 'banana' });
    input.tips.push({ title: 'Freeze it' });
    input.groups.push({ title: 'Your kitchen', description: 'Again.' });
    input.categories.push({ title: 'Produce 2', slug: 'produce' });
    input.pages.push({ title: 'Home again', path: '/' });
    expect(validateSeed(parse(input))).toEqual([
      { path: 'taxonomies.tip_types[1]', message: 'Duplicate title "Storage"' },
      { path: 'ingredients[2]', message: 'Duplicate ingredient slug "banana"' },
      { path: 'tips[2]', message: 'Duplicate title "Freeze it"' },
      { path: 'groups[1]', message: 'Duplicate title "Your kitchen"' },
      { path: 'categories[2]', message: 'Duplicate slug "produce"' },
      { path: 'pages[2]', message: 'Duplicate path "/"' },
    ]);
  });

  it('reports an ingredient whose title has no slug', () => {
    const input = minimal();
    input.ingredients.push({ title: '!!!' });
    expect(validateSeed(parse(input))).toEqual([
      { path: 'ingredients[2]', message: 'Empty ingredient slug' },
    ]);
  });

  it('reports unknown references', () => {
    const input = minimal();
    input.tips.push({
      title: 'Bad',
      type: 'Nope',
      behavior: 'Nope',
      motivator: 'Nope',
      ingredient: 'kale',
    });
    input.categories.push({
      title: 'Bad',
      slug: 'bad',
      group: 'Nope',
      ingredients: ['kale'],
      tips: ['Nope'],
    });
    input.pages.push({
      title: 'Bad',
      path: 'bad',
      main: [
        { __component: 'component.hero', ctas: [{ label: 'x', page: 'missing' }] },
        { __component: 'component.link-list', pages: ['missing'] },
        { __component: 'component.carousel', categories: ['nope'] },
        { __component: 'custom.tip-list', tips: ['Nope'] },
      ],
    });
    expect(validateSeed(parse(input))).toEqual([
      { path: 'tips[2].type', message: 'Unknown tip type "Nope"' },
      { path: 'tips[2].behavior', message: 'Unknown tip behavior "Nope"' },
      { path: 'tips[2].motivator', message: 'Unknown tip motivator "Nope"' },
      { path: 'tips[2].ingredient', message: 'Unknown ingredient "kale"' },
      { path: 'categories[2].group', message: 'Unknown group "Nope"' },
      { path: 'categories[2].ingredients[0]', message: 'Unknown ingredient "kale"' },
      { path: 'categories[2].tips[0]', message: 'Unknown tip "Nope"' },
      { path: 'pages[2].main[0].ctas[0].page', message: 'Unknown page "missing"' },
      { path: 'pages[2].main[1].pages[0]', message: 'Unknown page "missing"' },
      { path: 'pages[2].main[2].categories[0]', message: 'Unknown category "nope"' },
      { path: 'pages[2].main[3].tips[0]', message: 'Unknown tip "Nope"' },
    ]);
  });

  it('ignores external CTAs', () => {
    const input = minimal();
    input.pages[0]?.main?.push({
      __component: 'component.hero',
      ctas: [{ label: 'x', href: 'https://example.org/' }],
    });
    expect(validateSeed(parse(input))).toEqual([]);
  });
});
