import type { cmsType } from '@llf/contracts';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { BlockTextAndImage55 } from './TextAndImage55';

// Shaped after the `component.5050-text-and-image` block in apps/web/fixtures/cms/pages.json.
const image = {
  id: 98,
  documentId: 't64cbi069z7k0fzb75xlxaz0',
  url: '/uploads/ello_AEU_9_U_Zst_Cfs_unsplash_56b249cce8.jpg',
  alternativeText: 'fresh',
  width: 640,
  height: 445,
};

const block = {
  __component: 'component.5050-text-and-image',
  id: 75,
  description:
    "Store it differently. Freeze it before it turns. Use the part you were about to throw away. None of it takes more time than what you're doing now.",
  makeImageLeft: false,
  addBackgroundColor: null,
  positionOfAddingBgColor: null,
  isFullwidth: false,
  backgroundColor: 'paper',
  title: { copy: 'small changes, real impact', header: 'h2' },
  image,
} satisfies cmsType.component._5050TextAndImageDeepRef;

const renderBlock = (overrides: Partial<cmsType.component._5050TextAndImageDeepRef> = {}) =>
  render(<BlockTextAndImage55 block={{ ...block, ...overrides }} index={3} pageTitle="Home" />);

describe('BlockTextAndImage55', () => {
  afterEach(cleanup);

  it('renders the CMS title, description and image', () => {
    const { container } = renderBlock();
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(block.title.copy);
    expect(screen.getByText(block.description)).toBeDefined();
    const img = container.querySelector('img');
    expect(img?.getAttribute('alt')).toBe(image.alternativeText);
    expect(decodeURIComponent(img?.getAttribute('src') ?? '')).toContain(image.url);
  });

  it('puts the image on the left when the CMS says so', () => {
    const { container } = renderBlock({ makeImageLeft: true });
    expect(container.querySelector('picture')?.className).toContain('order-1');
  });

  it('puts the image on the right by default', () => {
    const { container } = renderBlock({ makeImageLeft: false });
    expect(container.querySelector('picture')?.className).toContain('order-2');
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
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(block.title.copy);
    expect(screen.getByText(block.description)).toBeDefined();
  });
});
