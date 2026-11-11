import type { cmsType } from '@llf/contracts';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CategoryDetailComponent, type CategoryDetailWithSearchProps } from './index';

// IngredientsList/IngredientsHeader read the App Router (rows, result slugs, TransitionLink).
// The router object must be stable: IngredientsList lists it in an effect dependency array.
const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => router,
  usePathname: () => '/tips/category',
  useSearchParams: () => new URLSearchParams(),
}));

// Shaped after the `component.category-detail` block in apps/web/fixtures/cms/pages.json
// (page "category") and the first category in apps/web/fixtures/cms/categories.json.
// Strapi ids on the block's links/titles are dropped: the shared contract types carry no `id`.
const block = {
  __component: 'component.category-detail',
  id: 29,
  description:
    'The following ingredients have been extracted. Select one to see how to get the most out of it.',
  subTitle: null,
  statement: [
    {
      type: 'paragraph',
      children: [
        { text: 'All tips reviewed by ', type: 'text' },
        { text: 'food experts', type: 'text', underline: true },
      ],
    },
  ],
  isFullwidth: true,
  backgroundColor: 'forest',
  hint: 'Click an ingredient to view specific tips that save time, money, and food.',
  image: null,
  button: {
    label: 'Upload Another Link or Image',
    href: null,
    isDisplay: true,
    isButton: true,
    newTab: false,
    buttonType: null,
  },
  title: { copy: null, header: 'h2' },
  popup: {
    id: 37,
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
      copy: 'All tips reviewed by food experts.',
      header: 'h2',
    },
  },
} satisfies CategoryDetailWithSearchProps;

const category = {
  id: 1,
  documentId: 'fxca0001',
  title: 'Fruits & Veggies',
  slug: 'fruits-and-veggies',
  description: 'Keep produce fresh for longer.',
  mode: 'Ingredients',
  image: null,
  ingredients: [
    {
      id: 1,
      documentId: 'fxin0001',
      title: 'Banana',
      type: 'Produce',
      synonyms: 'bananas',
      wasted: 4,
      image: null,
      tips: [
        {
          id: 1,
          documentId: 'fxtp0001',
          title: 'Freeze ripe bananas',
          description: 'Peel, slice, and freeze them for smoothies and baking.',
          tip_type: { id: 1, documentId: 'fxtt0001', title: 'Storage' },
        },
        {
          id: 2,
          documentId: 'fxtp0002',
          title: 'Bake with brown bananas',
          description: 'Spotty bananas make the sweetest banana bread.',
          tip_type: { id: 3, documentId: 'fxtt0003', title: 'Reuse' },
        },
      ],
    },
    {
      id: 2,
      documentId: 'fxin0002',
      title: 'Spinach',
      type: 'Leafy Greens',
      synonyms: 'baby spinach',
      wasted: 5,
      image: null,
      tips: [
        {
          id: 3,
          documentId: 'fxtp0003',
          title: 'Store with a paper towel',
          description:
            'A dry paper towel in the container soaks up moisture so leaves last longer.',
          tip_type: { id: 1, documentId: 'fxtt0001', title: 'Storage' },
        },
      ],
    },
  ],
  tips: [],
  group: { id: 1, documentId: 'fxgr0001', title: 'Your kitchen' },
  seo: {
    metaTitle: null,
    metaKeywords: null,
    metaDescription: 'Tips to keep fruits and vegetables fresh.',
  },
} satisfies cmsType.api.CategoryDeepRef;

/** The block is an async server component; call it and render the resolved element. */
const renderBlock = async (data: cmsType.api.Category = category) => {
  const element = await CategoryDetailComponent({
    block,
    index: 0,
    pageTitle: 'Category',
    categoryData: data,
  });
  return render(element);
};

describe('CategoryDetailComponent', () => {
  afterEach(cleanup);

  it('renders the CMS heading and one row per ingredient', async () => {
    await renderBlock();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Fruits & Veggies');
    expect(screen.getByText('Keep produce fresh for longer.')).toBeDefined();
    expect(await screen.findByRole('button', { name: /Banana/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /Spinach/ })).toBeDefined();
    expect(screen.getByText('2 ingredients | 3 tips')).toBeDefined();
  });

  it('marks the selected ingredient with aria-pressed and clears the previous one', async () => {
    await renderBlock();
    const banana = await screen.findByRole('button', { name: /Banana/ });
    const spinach = screen.getByRole('button', { name: /Spinach/ });

    expect(banana.getAttribute('aria-pressed')).toBe('false');
    expect(spinach.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(banana);
    expect(banana.getAttribute('aria-pressed')).toBe('true');
    expect(spinach.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(spinach);
    expect(spinach.getAttribute('aria-pressed')).toBe('true');
    expect(banana.getAttribute('aria-pressed')).toBe('false');
  });

  it('selects an ingredient from the keyboard', async () => {
    await renderBlock();
    const spinach = await screen.findByRole('button', { name: /Spinach/ });
    fireEvent.keyDown(spinach, { key: 'Enter' });
    expect(spinach.getAttribute('aria-pressed')).toBe('true');
  });

  it('renders an empty ingredient list without throwing', async () => {
    await renderBlock({ ...category, ingredients: [] });
    await act(async () => {});
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Fruits & Veggies');
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
