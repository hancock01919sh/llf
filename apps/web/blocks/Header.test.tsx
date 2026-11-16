import type { cmsType } from '@llf/contracts';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { BlockHeader } from './Header';

// Shaped after the `component.header` block in apps/web/fixtures/cms/pages.json.
const image = {
  id: 103,
  documentId: 'bcggp8n6khopm9x09tuidwbf',
  url: '/uploads/pexels_mike_jones_8805172_3fc5023de6.jpg',
  alternativeText: 'Mike',
  width: 4000,
  height: 6000,
};
const video = {
  ...image,
  url: '/uploads/brand_opening_clip.mp4',
  alternativeText: 'Brand opening clip',
};

const block = {
  __component: 'component.header',
  id: 50,
  subTitle: 'Discover',
  description: 'Find yours by meal, ingredient, or something \nthat sounds like you.',
  backgroundColor: 'forest',
  addBackgroundColor: true,
  positionOfAddingBgColor: 'down',
  isFullwidth: false,
  title: { copy: 'Every ingredient has a secret. This is where you find them.', header: 'h1' },
  image,
} satisfies cmsType.component.Header;

// Blocks are always rendered inside a ModuleBoundary <section> (TDD §8); useAdjacent walks to its siblings.
const renderBlock = (index = 0, overrides: Partial<cmsType.component.Header> = {}) =>
  render(
    <section>
      <BlockHeader block={{ ...block, ...overrides }} index={index} pageTitle="Library" />
    </section>,
  );

describe('BlockHeader', () => {
  afterEach(cleanup);

  it('renders the CMS eyebrow, title and description', () => {
    const { container } = renderBlock(0);
    expect(screen.getByText(block.subTitle)).toBeDefined();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(block.title.copy);
    expect(container.textContent).toContain('Find yours by meal, ingredient, or something');
  });

  it('uses the heading level chosen in the CMS and downgrades later blocks', () => {
    const { unmount } = renderBlock(0);
    expect(screen.getByRole('heading', { level: 1 })).toBeDefined();
    unmount();

    renderBlock(1);
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(block.title.copy);
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
  });

  it('renders a video element when the CMS URL is an mp4', () => {
    const { container } = renderBlock(0, { image: video });
    const videos = [...container.querySelectorAll('video')];
    // The background-colour split renders a second, mobile-only copy.
    expect(videos).toHaveLength(2);
    for (const v of videos) expect(v.getAttribute('src')).toBe(video.url);
  });

  it('renders an image element when the CMS URL is not an mp4', () => {
    const { container } = renderBlock(0, { image });
    const imgs = [...container.querySelectorAll('img')];
    expect(imgs.length).toBeGreaterThan(0);
    // All rendered images should use the CMS URL and alt text.
    for (const img of imgs) {
      expect(decodeURIComponent(img.getAttribute('src') ?? '')).toContain(image.url);
      expect(img.getAttribute('alt')).toBe(image.alternativeText);
    }
    // And no video element leaks in.
    expect(container.querySelectorAll('video')).toHaveLength(0);
  });

  it('renders without media instead of a broken element', () => {
    // `image` is nullish in the contract: null, undefined, and an empty URL must all degrade alike.
    for (const media of [null, undefined, { ...image, url: '' }]) {
      const { container, unmount } = renderBlock(0, {
        image: media,
        addBackgroundColor: false,
      });
      expect(container.querySelectorAll('video')).toHaveLength(0);
      expect(container.querySelectorAll('img')).toHaveLength(0);
      expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(block.title.copy);
      expect(container.textContent).toContain('Find yours by meal, ingredient, or something');
      unmount();
    }
  });

  it('renders without a heading when the CMS title is null', () => {
    // TitleRef isn't nullish in the contract, but runtime data can carry null and the component
    // protects with `title &&`, so exercise that branch anyway.
    renderBlock(0, { title: null as unknown as typeof block.title });
    expect(screen.queryByRole('heading')).toBeNull();
    // But subtitle and description still render.
    expect(screen.getByText(block.subTitle)).toBeDefined();
    expect(screen.getByText(/Find yours by meal/)).toBeDefined();
  });
});
