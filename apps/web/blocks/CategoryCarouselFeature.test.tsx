import type { cmsType } from '@llf/contracts';
import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CategoryCarouselFeature } from './CategoryCarouselFeature';

// TransitionLink reads the app router, which jsdom has no provider for (TDD §6).
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}));

// Swiper needs a real layout (and ships its own React copy for jsdom), so render slides as plain boxes.
vi.mock('swiper/react', () => ({
  Swiper: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  SwiperSlide: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}));
vi.mock('swiper/modules', () => ({
  EffectCards: {},
  Navigation: {},
  Pagination: {},
}));

// Shaped after the `component.category-carousel-feature` block in apps/web/fixtures/cms/pages.json.
const sheetPan = {
  id: 11,
  documentId: 'gkzpnjnjp2ol95fan869f5pw',
  title: 'Sheet Pan Dinners',
  slug: 'sheet-pan-dinners',
  description: null,
  mode: 'Ingredients',
  image: {
    id: 79,
    documentId: 'y9nx7eqf41z6bz7cfih7ao79',
    url: '/uploads/f3ccdaa0dc2388744fc5a2ecca06993396afa662_9a3e712c9e.jpg',
    name: 'f3ccdaa0dc2388744fc5a2ecca06993396afa662.jpg',
    alternativeText: 'smooth',
    width: 1080,
    height: 1080,
  },
} as const;

const chickenBowls = {
  id: 8,
  documentId: 'cocy48y148ttigtvoxolvd99',
  title: 'chicken & Rice bowls',
  slug: 'chicken-and-rice-bowls',
  description: 'A weeknight regular. Here’s how to waste less of what goes into it.',
  mode: 'Ingredients',
  image: {
    id: 69,
    documentId: 'av6ps1h8yqx64ns6bt92cpbb',
    url: '/uploads/4ab2d307085b0badcb07d868a994713703d4aff0_cdc28e5f7c.jpg',
    name: '4ab2d307085b0badcb07d868a994713703d4aff0.jpg',
    alternativeText: 'chickenbowl',
    width: 1080,
    height: 1080,
  },
} as const;

const block = {
  __component: 'component.category-carousel-feature',
  id: 25,
  description: 'Every kitchen has a few repeat offenders. See which ones keep showing up in yours.',
  isFullwidth: true,
  backgroundColor: 'terra',
  title: { copy: 'The Usual Suspects of every kitchen', header: 'h2' },
  link: [
    {
      label: 'Discover tips in the library',
      href: '/tips',
      isDisplay: true,
      isButton: true,
      newTab: false,
      buttonType: 'Primary',
    },
    {
      label: 'Search specific ingredient tips',
      href: '/search',
      isDisplay: true,
      isButton: true,
      newTab: false,
      buttonType: 'Secondary',
    },
  ],
  featureCard: [{ category: sheetPan }, { category: chickenBowls }],
} satisfies cmsType.component.CategoryCarouselFeatureDeepRef;

const renderBlock = (overrides: Partial<cmsType.component.CategoryCarouselFeatureDeepRef> = {}) =>
  render(<CategoryCarouselFeature block={{ ...block, ...overrides }} index={1} pageTitle="Home" />);

describe('CategoryCarouselFeature', () => {
  afterEach(cleanup);

  it('renders the CMS title and description', () => {
    renderBlock();
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(block.title.copy);
    expect(screen.getByText(block.description)).toBeDefined();
  });

  it('renders one slide per card, with the category title and tips link', () => {
    const { container } = renderBlock();
    // The block renders a mobile and a desktop carousel, so every card shows twice.
    for (const card of block.featureCard) {
      const title = card.category?.title ?? '';
      expect(screen.getAllByText(title)).toHaveLength(2);
      const links = container.querySelectorAll(`a[href="/tips/${card.category?.slug}/"]`);
      expect(links).toHaveLength(2);
    }
  });

  it('renders the primary CTA and ignores secondary links', () => {
    renderBlock();
    const primary = block.link[0];
    if (!primary?.href) throw new Error('fixture link needs an href');
    const ctas = screen.getAllByRole('link', { name: primary.label });
    expect(ctas).toHaveLength(2);
    expect(ctas[0]?.getAttribute('href')).toBe('/tips/');
    expect(screen.queryByText('Search specific ingredient tips')).toBeNull();
  });

  it('renders without throwing when there are no cards', () => {
    renderBlock({ featureCard: [] });
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(block.title.copy);
    expect(screen.queryByRole('link', { name: 'Sheet Pan Dinners' })).toBeNull();
    expect(screen.getByRole('button', { name: 'prev' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'next' })).toBeDefined();
  });

  it('degrades gracefully when a card has no image', () => {
    renderBlock({ featureCard: [{ category: { ...sheetPan, image: null } }] });
    const images = document.querySelectorAll('img');
    expect(images).toHaveLength(0);
    expect(screen.getAllByText('Sheet Pan Dinners')).toHaveLength(2);
  });
});
