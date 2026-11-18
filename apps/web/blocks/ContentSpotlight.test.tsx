import type { cmsType } from '@llf/contracts';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BlockContentSpotlight } from './ContentSpotlight';

// The CTA renders through TransitionLink, which needs an App Router provider jsdom doesn't have.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}));

// Shaped after the `component.content-spotlight` block in apps/web/fixtures/cms/pages.json.
const image = {
  id: 97,
  documentId: 'ij6bzxqsuoh3jzkiomnz5mix',
  url: '/uploads/fe2e2dd11eba6f522641efac80f543d743f2d477_1_985ddf0fb4.png',
  alternativeText: 'oven',
  width: 1982,
  height: 1314,
};

const descriptionText =
  "It's rarely one bad decision. It's a bag of greens behind the milk. A jar opened for one recipe. A date label that sounds more final than it is. Most kitchens share the same handful of patterns, and most people have never had a reason to notice them. Once you see the pattern, the fixes are small, and they hold.";

// `description` is Strapi Blocks rich text (Block.array()), not a plain string.
const description = [{ type: 'paragraph', children: [{ type: 'text', text: descriptionText }] }];

const block = {
  __component: 'component.content-spotlight',
  id: 23,
  description,
  backgroundColor: 'sand',
  makeImageLeft: null,
  isFullwidth: false,
  title: { copy: 'why it happens', header: 'h2' },
  image,
} satisfies cmsType.component.ContentSpotlightDeepRef;

const renderBlock = (overrides: Partial<cmsType.component.ContentSpotlightDeepRef> = {}) =>
  render(<BlockContentSpotlight block={{ ...block, ...overrides }} index={2} pageTitle="Home" />);

describe('BlockContentSpotlight', () => {
  afterEach(cleanup);

  it('renders the CMS title, description and image', () => {
    const { container } = renderBlock();
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(block.title.copy);
    expect(screen.getByText(descriptionText)).toBeDefined();
    const img = container.querySelector('img');
    expect(img?.getAttribute('alt')).toBe(image.alternativeText);
    expect(decodeURIComponent(img?.getAttribute('src') ?? '')).toContain(image.url);
  });

  it('uses the heading level chosen in the CMS', () => {
    renderBlock({ title: { copy: 'why it happens', header: 'h3' } });
    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe(block.title.copy);
  });

  it('falls back to the title for alt text when the image has none', () => {
    const { container } = renderBlock({
      image: { ...image, alternativeText: null, name: undefined },
    });
    expect(container.querySelector('img')?.getAttribute('alt')).toBe(block.title.copy);
  });

  it('renders without an image instead of a broken one', () => {
    const { container } = renderBlock({ image: undefined });
    expect(container.querySelectorAll('img')).toHaveLength(0);
    expect(screen.getByText(descriptionText)).toBeDefined();
  });

  it('renders the CTA when the CMS adds one', () => {
    renderBlock({
      cta: {
        label: 'Learn more',
        href: '/about',
        isDisplay: true,
        isButton: true,
        newTab: false,
        buttonType: null,
      },
    });
    expect(screen.getByRole('link', { name: 'Learn more' }).getAttribute('href')).toContain(
      '/about',
    );
  });

  it('renders the description when the CMS title is empty', () => {
    renderBlock({ title: { copy: null, header: 'h2' } });
    expect(screen.queryByRole('heading')).toBeNull();
    expect(screen.getByText(descriptionText)).toBeDefined();
  });
});
