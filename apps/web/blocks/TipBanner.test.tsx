import type { cmsType } from '@llf/contracts';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { BlockTipBanner } from './TipBanner';

// Shaped after the `component.tip-banner` block in apps/web/fixtures/cms/pages.json (page "home").
const block = {
  __component: 'component.tip-banner',
  id: 69,
  label: 'Tip Of The Week',
  backgroundColor: 'terra',
  isFullwidth: false,
  cta: [
    {
      label: 'Share',
      href: null,
      isDisplay: true,
      isButton: true,
      buttonType: null,
      newTab: false,
    },
    {
      label: 'Save',
      href: null,
      isDisplay: true,
      isButton: true,
      buttonType: null,
      newTab: false,
    },
  ],
  tip: {
    id: 6,
    documentId: 'aso8i0z2t6ij0eleuv5vwk9n',
    title: "Gone brown? It's not gone bad.",
    description:
      'Brown flesh means oxidation, not rot. Scrape the top layer and everything underneath is still good.',
    tip_type: {
      id: 9,
      documentId: 'wy46qcysn8mub06x91za7imk',
      title: 'Rescue it',
    },
    ingredient: {
      id: 8,
      documentId: 'lmu8brjeuj01mtakozq43n7a',
      title: 'Avocado',
      type: null,
      synonyms: null,
      wasted: 3,
      image: {
        id: 54,
        documentId: 'w8vld5ywd5uzb46altzj5e20',
        url: '/uploads/53de8cb6b261d020c4208ef47da774c1990a6a2a_1_b85fe57f51.png',
        alternativeText: 'avocado',
        caption: null,
        width: 1000,
        height: 1000,
        mime: null,
        name: null,
      },
    },
  },
} satisfies cmsType.component.TipBannerDeepRef;

const renderBlock = (overrides: Partial<typeof block> = {}) =>
  render(<BlockTipBanner block={{ ...block, ...overrides }} index={1} pageTitle="Home" />);

describe('BlockTipBanner', () => {
  afterEach(cleanup);

  it('renders the CMS label, ingredient, tip title and description', () => {
    renderBlock();
    expect(screen.getByText('Tip Of The Week')).toBeDefined();
    expect(screen.getByText('Avocado')).toBeDefined();
    expect(screen.getByText("Gone brown? It's not gone bad.")).toBeDefined();
    expect(screen.getByText(block.tip.description)).toBeDefined();
  });

  it('renders the tip type badge and each CTA label', () => {
    renderBlock();
    expect(screen.getByText('rescue it')).toBeDefined();
    for (const item of block.cta) {
      expect(screen.getByRole('button', { name: item.label })).toBeDefined();
    }
  });

  it('renders without the optional tip and CTAs', () => {
    renderBlock({ tip: undefined, cta: undefined });
    expect(screen.getByText('Tip Of The Week')).toBeDefined();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryByText('Avocado')).toBeNull();
  });
});
