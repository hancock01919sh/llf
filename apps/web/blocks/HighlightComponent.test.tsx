import type { cmsType } from '@llf/contracts';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BlockHighlightComponent } from './HighlightComponent';

// TransitionLink reads the app router, which jsdom has no provider for (TDD §6).
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}));

// Shaped after the `component.highlight-component` block in apps/web/fixtures/cms/pages.json.
const desktopImage = {
  id: 101,
  documentId: 'le10thkapmvacf3hnckbwdev',
  url: '/uploads/654263206_18574555336000707_5554589793423427233_n_c14b2157a9.jpg',
  alternativeText: 'tomatos',
  width: 1440,
  height: 1800,
};
const learnMore = {
  label: 'Learn more',
  href: '/tips',
  isDisplay: true,
  isButton: true,
  buttonType: 'Primary',
  newTab: false,
} satisfies cmsType.shared.LinksDeepRef;

const block = {
  __component: 'component.highlight-component',
  id: 163,
  description: 'Most of us don’t know where we’re losing food.',
  backgroundColor: 'forest-tint',
  interiorBackgroundColor: 'sand',
  isFullwidth: true,
  link: [learnMore],
  mobileImage: null,
  desktopImage,
  title: {
    copy: 'About 1 in 3 groceries you buy never get eaten.',
    header: 'h2',
  },
} satisfies cmsType.component.HighlightComponent;

const renderBlock = (overrides: Partial<cmsType.component.HighlightComponent> = {}) =>
  render(<BlockHighlightComponent block={{ ...block, ...overrides }} index={1} pageTitle="Home" />);

describe('BlockHighlightComponent', () => {
  afterEach(cleanup);

  it('renders the CMS title, description and desktop image', () => {
    const { container } = renderBlock();
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(block.title.copy);
    expect(screen.getByText(block.description)).toBeDefined();
    const images = container.querySelectorAll('img');
    expect(images).toHaveLength(2);
    expect(images[0]?.getAttribute('alt')).toBe(desktopImage.alternativeText);
    // next/image rewrites the src through the optimizer, so compare the decoded URL.
    expect(decodeURIComponent(images[0]?.getAttribute('src') ?? '')).toContain(desktopImage.url);
  });

  it('renders a displayed link with its href', () => {
    renderBlock();
    const link = screen.getByRole('link', { name: learnMore.label });
    // `__NEXT_TRAILING_SLASH` is true in vitest.config.ts, mirroring the static export.
    expect(link.getAttribute('href')).toBe(`${learnMore.href}/`);
  });

  it('skips links flagged as not displayed', () => {
    renderBlock({ link: [{ ...learnMore, isDisplay: false }] });
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('degrades gracefully when the mobile image is missing', () => {
    const { container } = renderBlock({ mobileImage: null });
    const mobile = container.querySelectorAll('img')[1];
    expect(decodeURIComponent(mobile?.getAttribute('src') ?? '')).toContain(desktopImage.url);
    expect(mobile?.getAttribute('alt')).toBe(desktopImage.alternativeText);
  });

  it('does not render a broken image when both images are missing', () => {
    const { container } = renderBlock({ desktopImage: undefined, mobileImage: null });
    expect(container.querySelectorAll('img')).toHaveLength(0);
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(block.title.copy);
  });
});
