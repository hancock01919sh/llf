import type { cmsType } from '@llf/contracts';
import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BlockCarouselSmall } from './CarouselSmall';

// Swiper mounts real slide/pagination DOM that jsdom can't size; stub the two exports we render.
vi.mock('swiper/react', () => ({
  Swiper: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  SwiperSlide: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}));
vi.mock('swiper/modules', () => ({ Pagination: {}, Navigation: {} }));
// TransitionLink reads the App Router; tests render outside it.
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: () => {} }),
}));

// Shaped after the `component.carousel-small` block in apps/web/fixtures/cms/pages.json (page "tips").
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
    alternativeText: 'smooth',
    caption: null,
    width: 1080,
    height: 1080,
    mime: 'image/jpeg',
    name: 'f3ccdaa0dc2388744fc5a2ecca06993396afa662.jpg',
  },
} as const;
const chickenBowls = {
  id: 8,
  documentId: 'cocy48y148ttigtvoxolvd99',
  title: 'chicken & Rice bowls',
  slug: 'chicken-and-rice-bowls',
  description: 'A weeknight regular. Here’s how to waste less of what goes into it.',
  mode: 'Ingredients',
  image: null,
} as const;

const block = {
  __component: 'component.carousel-small',
  id: 24,
  description:
    'You likely know all these meals. You probably didn’t know everything you could do with the ingredients in them.',
  backgroundColor: 'paper',
  isFullwidth: true,
  title: { copy: 'WEEKNIGHT STAPLES', header: 'h2' },
  smallCard: [{ category: sheetPan }, { category: chickenBowls }],
} satisfies cmsType.component.CarouselSmallDeepRef;

const renderBlock = (overrides: Partial<typeof block> = {}) =>
  render(<BlockCarouselSmall block={{ ...block, ...overrides }} index={1} pageTitle="Tips" />);

describe('BlockCarouselSmall', () => {
  afterEach(cleanup);

  it('renders the CMS heading, description and every card label', () => {
    renderBlock();
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('WEEKNIGHT STAPLES');
    expect(screen.getByText(block.description)).toBeDefined();
    expect(screen.getByText('Sheet Pan Dinners')).toBeDefined();
    expect(screen.getByText('chicken & Rice bowls')).toBeDefined();
  });

  it('links each card to its category tips page', () => {
    renderBlock();
    expect(screen.getByRole('link', { name: /Sheet Pan Dinners/ }).getAttribute('href')).toBe(
      '/tips/sheet-pan-dinners/',
    );
    expect(screen.getByRole('link', { name: /chicken & Rice bowls/ }).getAttribute('href')).toBe(
      '/tips/chicken-and-rice-bowls/',
    );
  });

  it('skips cards whose category is missing', () => {
    const withoutCategories = {
      ...block,
      smallCard: [{ category: null }],
    } satisfies cmsType.component.CarouselSmallDeepRef;
    render(<BlockCarouselSmall block={withoutCategories} index={1} pageTitle="Tips" />);
    expect(screen.queryByRole('link')).toBeNull();
  });
});
