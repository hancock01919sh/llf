import type { cmsType } from '@llf/contracts';
import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ToolSpotlight } from './ToolSpotlight';

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
vi.mock('swiper/modules', () => ({ Pagination: {} }));

// The scroll timeline needs layout and ScrollTrigger; jsdom has neither, so call the setup hook only.
vi.mock('@gsap/react', () => ({
  useGSAP: (fn?: () => void) => {
    fn?.();
  },
}));
vi.mock('gsap', () => ({
  default: {
    registerPlugin: () => {},
    utils: { toArray: () => [] },
    set: () => {},
    timeline: () => ({ to: () => {} }),
  },
}));
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: {} }));

// Shaped after the `component.tool-spotlight` block in apps/web/fixtures/cms/pages.json (page "home").
const recipeVideo = {
  id: 16,
  documentId: 'lv9kx3stxx6am8yo5j9u1q60',
  url: '/uploads/9558515_uhd_4096_2160_25fps_874870bfc4.mp4',
  alternativeText: null,
  width: null,
  height: null,
};

const listVideo = {
  id: 18,
  documentId: 'rd3tds5eal0noyc402pf6sjm',
  url: '/uploads/12487432_1920_1080_60fps_73dc4911da.mp4',
  alternativeText: null,
  width: null,
  height: null,
};

const block = {
  __component: 'component.tool-spotlight',
  id: 25,
  subTitle: "Everything you didn't know about the ingredients in your kitchen.",
  isFullwidth: null,
  backgroundColor: 'forest',
  link: {
    label: 'See how it works',
    href: '/find-my-tips',
    isDisplay: true,
    isButton: true,
    newTab: false,
    buttonType: null,
  },
  title: { copy: 'Get tips for the ingredients in your next meal', header: 'h2' },
  spotlightItem: [
    { copy: 'A recipe you’re planning to cook', video: recipeVideo },
    { copy: 'A shopping list before you go', video: listVideo },
  ],
} satisfies cmsType.component.ToolSpotlightDeepRef;

const renderBlock = (
  overrides: Partial<cmsType.component.ToolSpotlightDeepRef> = {},
) =>
  render(
    <section>
      <ToolSpotlight block={{ ...block, ...overrides }} index={2} pageTitle="Home" />
    </section>,
  );

describe('ToolSpotlight', () => {
  afterEach(cleanup);

  it('renders the CMS title and subtitle for both breakpoints', () => {
    renderBlock();
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(block.title.copy);
    expect(screen.getAllByText(block.subTitle)).toHaveLength(2);
  });

  it('renders every spotlight item copy', () => {
    renderBlock();
    // Mobile carousel and desktop list both render the copy.
    for (const item of block.spotlightItem) {
      expect(screen.getAllByText(item.copy)).toHaveLength(2);
    }
  });

  it('plays each CMS video, twice (mobile carousel and desktop stack)', () => {
    const { container } = renderBlock();
    const videos = [...container.querySelectorAll('video')];
    expect(videos).toHaveLength(block.spotlightItem.length * 2);
    for (const item of block.spotlightItem) {
      const matching = videos.filter((video) => video.getAttribute('src') === item.video?.url);
      expect(matching).toHaveLength(2);
    }
  });

  it('links the CTA with the trailing-slash URL', () => {
    renderBlock();
    const links = screen.getAllByRole('link', { name: block.link.label });
    expect(links).toHaveLength(2);
    for (const link of links) expect(link.getAttribute('href')).toBe('/find-my-tips/');
  });

  it('renders without items or a link instead of throwing', () => {
    const { container } = renderBlock({ spotlightItem: [], link: null });
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(block.title.copy);
    expect(container.querySelectorAll('video')).toHaveLength(0);
    expect(container.querySelector('a')?.getAttribute('href')).toBe('#');
  });
});
