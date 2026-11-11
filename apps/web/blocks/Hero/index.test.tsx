import type { cmsType } from '@llf/contracts';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BlockHero } from './index';

// TransitionLink reads the app router, which jsdom has no provider for (TDD §6).
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}));

// Shaped after the `component.hero` block in apps/web/fixtures/cms/pages.json (page "home").
const heroVideo = {
  id: 104,
  documentId: 'n6hxkgr75amc5nir5prc2flz',
  url: '/uploads/8801814_uhd_2160_3840_24fps_d3cf82912a.mp4',
  alternativeText: null,
  height: null,
  width: null,
};

const block = {
  __component: 'component.hero',
  id: 25,
  description: "Everything you didn't know about the ingredients in your kitchen.",
  title: [
    { type: 'paragraph', children: [{ text: 'Discover tips to help', type: 'text' }] },
    {
      type: 'paragraph',
      children: [
        { text: 'you ', type: 'text' },
        { code: true, text: 'store food smarter', type: 'text' },
        { text: ' ', type: 'text' },
      ],
    },
    { type: 'paragraph', children: [{ text: 'and waste less. ', type: 'text' }] },
  ],
  backgroundColor: 'terra',
  isFullwidth: null,
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
    {
      label: 'Hidden CTA',
      href: '/hidden',
      isDisplay: false,
      isButton: true,
      newTab: false,
      buttonType: 'Primary',
    },
  ],
  images: [heroVideo],
} satisfies cmsType.component.Hero;

// Blocks are always rendered inside a ModuleBoundary <section> (TDD §8); the block walks to its sibling.
const renderBlock = (overrides: Partial<cmsType.component.Hero> = {}) =>
  render(
    <section>
      <BlockHero block={{ ...block, ...overrides }} index={0} pageTitle="Home" />
    </section>,
  );

describe('BlockHero', () => {
  afterEach(cleanup);

  it('renders the CMS headline as the page h1', () => {
    renderBlock();
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toContain('Discover tips to help');
    expect(heading.textContent).toContain('store food smarter');
    expect(heading.textContent).toContain('and waste less.');
  });

  it('renders the CMS description for both breakpoints', () => {
    renderBlock();
    expect(screen.getAllByText(block.description)).toHaveLength(2);
  });

  it('plays the CMS media in a video element', () => {
    const { container } = renderBlock();
    const videos = [...container.querySelectorAll('video')];
    expect(videos).toHaveLength(1);
    expect(videos[0]?.getAttribute('src')).toBe(heroVideo.url);
    expect(screen.getByRole('button', { name: 'Scroll to next section' })).toBeDefined();
  });

  it('renders every displayed CTA link and skips hidden ones', () => {
    const { container } = renderBlock();
    const [primary, secondary] = block.link;
    if (!primary?.label || !secondary?.label) throw new Error('fixture needs both links');

    const primaryLinks = screen.getAllByRole('link', { name: primary.label });
    expect(primaryLinks).toHaveLength(2);
    expect(primaryLinks[0]?.getAttribute('href')).toBe('/tips/');

    // The secondary button renders a mobile and a desktop anchor in each HeroContent instance.
    expect(container.querySelectorAll('a[href="/search/"]')).toHaveLength(4);
    expect(screen.queryByRole('link', { name: 'Hidden CTA' })).toBeNull();
  });

  it('keeps the copy when the media and headline are empty', () => {
    const { container } = renderBlock({ images: [], title: [] });
    expect(screen.getAllByText(block.description)).toHaveLength(2);
    // UIVideo still mounts, but without a URL rather than a broken one.
    expect(container.querySelectorAll('video[src]')).toHaveLength(0);
  });
});
