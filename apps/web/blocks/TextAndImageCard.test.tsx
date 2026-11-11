import type { cmsType } from '@llf/contracts';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { BlockTextAndImageCard } from './TextAndImageCard';

// Shaped after the `component.text-and-image-card` block in apps/web/fixtures/cms/pages.json (page "about").
const block = {
  __component: 'component.text-and-image-card',
  id: 23,
  description:
    "We organize everything around the ingredient, not the recipe. That's how food actually reaches your kitchen, and it's how waste starts. Learn what one ingredient needs and it applies to every meal you make with it, for as long as you cook.",
  backgroundColor: 'paper',
  isFullwidth: false,
  title: { copy: 'the ingredient lens', header: 'h2' },
  image: [
    {
      id: 33,
      documentId: 'd23224iaqwukqaujl87uyau0',
      url: '/uploads/b8386b50887cf289c23e003fffc68b6324544947_fe579bbf2a.jpg',
      alternativeText: 'egg1',
      caption: null,
      width: 2305,
      height: 4096,
      mime: null,
      name: null,
    },
    {
      id: 55,
      documentId: 'ngza02doc6yuxf4wknlmtqtz',
      url: '/uploads/1f08bbe9b525806c74d081cc9223b65d58a11fd6_53155a218b.jpg',
      alternativeText: 'carrot',
      caption: null,
      width: 3032,
      height: 2021,
      mime: null,
      name: null,
    },
  ],
} satisfies cmsType.component.TextAndImageCardDeepRef;

const renderBlock = (overrides: Partial<typeof block> = {}) =>
  render(
    <BlockTextAndImageCard
      block={{ ...block, ...overrides }}
      index={1}
      pageTitle="About"
    />,
  );

describe('BlockTextAndImageCard', () => {
  afterEach(cleanup);

  it('renders the CMS heading and description', () => {
    renderBlock();
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('the ingredient lens');
    expect(screen.getByText(block.description)).toBeDefined();
  });

  it('renders every image with its alt text', () => {
    renderBlock();
    for (const image of block.image) {
      expect(screen.getByAltText(image.alternativeText)).toBeDefined();
    }
    expect(screen.getAllByRole('img')).toHaveLength(block.image.length);
  });

  it('renders without images', () => {
    renderBlock({ image: [] });
    expect(screen.queryAllByRole('img')).toHaveLength(0);
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('the ingredient lens');
  });
});
