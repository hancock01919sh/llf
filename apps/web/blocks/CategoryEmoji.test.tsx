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
  id: 50,
  description:
    'Organized by the food you cook, and the ingredients you use most. From produce to dairy to pantry staples.',
  backgroundColor: 'paper',
  isFullwidth: false,
  title: { copy: 'explore all the tips nobody told you about.', header: 'h2' },
  emoji: [
    {
      ingredient_type: {
        id: 3,
        documentId: 'v2093m0bniczb32051hhlqeu',
        title: 'Meat & Poultry',
        slug: 'meat-poultry',
        emoji: '🥩',
      },
    },
    {
      ingredient_type: {
        id: 4,
        documentId: 'fxin0004',
        title: 'Produce',
        slug: 'produce',
        emoji: '🥕',
      },
    },
  ],
} satisfies cmsType.component.CategoryEmojiDeepRef;

const renderBlock = () => render(<CategoryEmoji block={block} index={1} pageTitle="Home" />);

describe('CategoryEmoji', () => {
  afterEach(cleanup);

  it('renders the CMS heading, description and each emoji label', () => {
    renderBlock();
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(
      'explore all the tips nobody told you about.',
    );
    expect(screen.getByText(block.description)).toBeDefined();
    for (const item of block.emoji) {
      expect(screen.getByText(item.ingredient_type.emoji)).toBeDefined();
      expect(screen.getByText(item.ingredient_type.title)).toBeDefined();
    }
  });

  it('links each ingredient type to its tips page', () => {
    renderBlock();
    const first = block.emoji[0]!.ingredient_type;
    const second = block.emoji[1]!.ingredient_type;
    expect(screen.getByRole('link', { name: new RegExp(first.title) }).getAttribute('href')).toBe(
      `/tips/${first.slug}/`,
    );
    expect(screen.getByRole('link', { name: new RegExp(second.title) }).getAttribute('href')).toBe(
      `/tips/${second.slug}/`,
    );
  });

  it('skips emoji whose ingredient type is missing', () => {
    const withMissingType = { ...block, emoji: [{ ingredient_type: null }] };
    render(<CategoryEmoji block={withMissingType} index={1} pageTitle="Home" />);
    expect(screen.queryByText('🍌')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
  });
});
