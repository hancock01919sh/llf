import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SearchDocument } from '@/lib/search';
import { BlockSearch } from './index';
import type { CategoryDetailWithSearchProps } from '../CategoryDetail.tsx';

// IngredientsList/IngredientsHeader read the App Router (rows, result slugs, TransitionLink).
// The router object must be stable: IngredientsList lists it in an effect dependency array.
const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => router,
  usePathname: () => '/search',
  useSearchParams: () => new URLSearchParams(),
}));

// Shaped after the `component.search` block in apps/web/fixtures/cms/pages.json (page "search").
// Strapi ids on links/titles are dropped: the shared contract types carry no `id`.
const block = {
  __component: 'component.search',
  id: 6,
  description: 'Type an ingredient to find tips that save time, money, and food.',
  placeholder: 'Search 100+ ingredients',
  statement: [
    {
      type: 'paragraph',
      children: [
        { text: 'All tips reviewed by ', type: 'text' },
        { text: 'food experts', type: 'text', underline: true },
      ],
    },
  ],
  hint: 'Click an ingredient to view specific tips that save time, money, and food.',
  isFullwidth: false,
  backgroundColor: 'paper',
  title: { copy: 'Search for tips', header: 'h1' },
  popup: {
    id: 32,
    description: "Most of us don't know where we're losing food. ",
    link: {
      label: 'Discover tips in the library',
      href: '/tips',
      isDisplay: true,
      isButton: true,
      newTab: false,
      buttonType: null,
    },
    title: {
      copy: 'About 1 in 3 groceries you buy never get eaten.',
      header: 'h2',
    },
  },
} satisfies CategoryDetailWithSearchProps;

// Real documents from apps/web/out/data/search-index.json.
const searchIndex = [
  {
    id: 'ingredient:banana',
    kind: 'ingredient',
    title: 'Banana',
    body: 'bananas',
    href: '/find-my-tips/results/?i=banana',
    image: null,
    tips: [
      {
        title: 'Freeze ripe bananas',
        description: 'Peel, slice, and freeze them for smoothies and baking.',
        type: 'Storage',
        tip_behavior: '',
        tip_motivator: '',
      },
    ],
  },
  {
    id: 'ingredient:spinach',
    kind: 'ingredient',
    title: 'Spinach',
    body: 'baby spinach',
    href: '/find-my-tips/results/?i=spinach',
    image: null,
    tips: [
      {
        title: 'Store with a paper towel',
        description: 'A dry paper towel in the container soaks up moisture so leaves last longer.',
        type: 'Storage',
        tip_behavior: '',
        tip_motivator: '',
      },
    ],
  },
] satisfies SearchDocument[];

const stubIndex = (documents: SearchDocument[]) => {
  const fetchMock = vi.fn(async () => ({ ok: true, json: async () => documents }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

const renderBlock = () => render(<BlockSearch block={block} index={0} pageTitle="Search" />);

const typeAndSearch = (term: string) => {
  const input = screen.getByRole('textbox', { name: 'Search 100+ ingredients' });
  fireEvent.change(input, { target: { value: term } });
  fireEvent.keyDown(input, { key: 'Enter' });
  fireEvent(window, new Event('hashchange'));
};

describe('BlockSearch', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('loads the stub index and lists its documents', async () => {
    const fetchMock = stubIndex(searchIndex);
    renderBlock();

    expect(await screen.findByRole('button', { name: /Banana/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /Spinach/ })).toBeDefined();
    expect(fetchMock).toHaveBeenCalledWith('/data/search-index.json');
  });

  it('puts the typed term in the hash and keeps its matching row', async () => {
    stubIndex(searchIndex);
    renderBlock();

    typeAndSearch('banana');
    expect(window.location.hash).toBe('#q=banana');

    const banana = await screen.findByRole('button', { name: /banana/i });
    expect(banana.textContent).toContain('Banana');
  });

  it('shows an empty state instead of crashing when nothing matches', async () => {
    stubIndex([]);
    renderBlock();
    await act(async () => {});

    typeAndSearch('no-such-ingredient');
    await act(async () => {});

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Search for tips');
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('keeps the page usable when the index cannot be loaded', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, json: async () => [] })),
    );
    renderBlock();
    await act(async () => {});

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Search for tips');
    expect(screen.getByRole('textbox', { name: 'Search 100+ ingredients' })).toBeDefined();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
