import type { cmsType } from '@llf/contracts';
import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BlockCarouselStandard } from './CarouselStandard';

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
vi.mock('swiper/modules', () => ({ Navigation: {}, Pagination: {} }));

// Shaped after the `component.carousel-standard` block in apps/web/fixtures/cms/pages.json.
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
  __component: 'component.carousel-standard',
  id: 93,
  description:
    'Every kitchen has a few repeat offenders. See which ones keep showing up in yours.',
  backgroundColor: 'sand',
  cardBackgroundColor: null,
  isFullwidth: true,
  title: { copy: 'Ingredients with Reputations', header: 'h2' },
  standardCard: [{ category: sheetPan }, { category: chickenBowls }],
} satisfies cmsType.component.CarouselStandardDeepRef;

const renderBlock = (overrides: Partial<cmsType.component.CarouselStandardDeepRef> = {}) =>
  render(
    <BlockCarouselStandard block={{ ...block, ...overrides }} index={4} pageTitle="Home" />,
  );

describe('BlockCarouselStandard', () => {
  afterEach(cleanup);

  it('renders the CMS title and description', () => {
    renderBlock();
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(block.title.copy);
    expect(screen.getByText(block.description)).toBeDefined();
  });

  it('renders one slide per card, with the category title and tips link', () => {
    const { container } = renderBlock();
    for (const card of block.standardCard) {
      const title = card.category.title;
      expect(screen.getAllByText(title)).toHaveLength(1);
      expect(container.querySelectorAll(`a[href="/tips/${card.category.slug}/"]`)).toHaveLength(
        1,
      );
    }
  });

  it('skips cards that have no category', () => {
    const { container } = renderBlock({
      standardCard: [{ category: sheetPan }, { category: null }],
    });
    expect(container.querySelectorAll('a[href^="/tips/"]')).toHaveLength(1);
  });

  it('renders without throwing when there are no cards', () => {
    const { container } = renderBlock({ standardCard: [] });
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(block.title.copy);
    expect(container.querySelectorAll('a[href^="/tips/"]')).toHaveLength(0);
  });

  it('degrades gracefully when a card has no image', () => {
    const { container } = renderBlock({
      standardCard: [{ category: { ...sheetPan, image: null } }],
    });
    expect(container.querySelectorAll('img')).toHaveLength(0);
    expect(screen.getByText(sheetPan.title)).toBeDefined();
  });
});
