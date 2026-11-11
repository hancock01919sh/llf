import type { cmsType } from '@llf/contracts';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CategoryEmoji } from './CategoryEmoji';

// TransitionLink reads the App Router; tests render outside it.
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: () => {} }),
}));

// Shaped after the `component.category-emoji` block in apps/web/fixtures/cms/pages.json (page "home").
const block = {
  __component: 'component.category-emoji',
  id: 47,
  description:
    'Organized by the food you cook, and the ingredients you use most. From produce to dairy to pantry staples.',
  backgroundColor: 'paper',
  isFullwidth: false,
  title: { copy: 'explore all the tips nobody told you about.', header: 'h2' },
  emoji: [
    {
      emoji: '🥕',
      category: {
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
      },
    },
    {
      emoji: '🍎',
      category: {
        id: 13,
        documentId: 'yreoqik5im47dv04pzyhvywp',
        title: 'The ones everyone buys and nobody finishes',
        slug: 'the-ones-everyone-buys-and-nobody-finishes',
        description: null,
        mode: 'Ingredients',
        image: null,
      },
    },
  ],
} satisfies cmsType.component.CategoryEmojiDeepRef;

const renderBlock = () =>
  render(<CategoryEmoji block={block} index={1} pageTitle="Home" />);

describe('CategoryEmoji', () => {
  afterEach(cleanup);

  it('renders the CMS heading, description and each emoji label', () => {
    renderBlock();
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(
      'explore all the tips nobody told you about.',
    );
    expect(screen.getByText(block.description)).toBeDefined();
    for (const item of block.emoji) expect(screen.getByText(item.emoji)).toBeDefined();
    expect(screen.getByText('Sheet Pan Dinners')).toBeDefined();
  });

  it('links each category to its tips page', () => {
    renderBlock();
    const first = block.emoji[0]!;
    const second = block.emoji[1]!;
    expect(
      screen.getByRole('link', { name: new RegExp(first.category!.title) }).getAttribute('href'),
    ).toBe('/tips/sheet-pan-dinners/');
    expect(
      screen.getByRole('link', { name: new RegExp(second.category!.title) }).getAttribute('href'),
    ).toBe('/tips/the-ones-everyone-buys-and-nobody-finishes/');
  });

  it('skips emoji whose category is missing', () => {
    const withMissingCategory = { ...block, emoji: [{ emoji: '🍌', category: null }] };
    render(<CategoryEmoji block={withMissingCategory} index={1} pageTitle="Home" />);
    expect(screen.queryByText('🍌')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
  });
});
