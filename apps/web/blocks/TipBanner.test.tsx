import type { cmsType } from '@llf/contracts';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { strings } from '@/content/strings';
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
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('renders the CMS label, ingredient, tip title and description', () => {
    renderBlock();
    expect(screen.getByText('Tip Of The Week')).toBeDefined();
    expect(screen.getByText('Avocado')).toBeDefined();
    expect(screen.getByText("Gone brown? It's not gone bad.")).toBeDefined();
    expect(screen.getByText(block.tip.description)).toBeDefined();
  });

  it('renders the tip type badge and both CTAs', () => {
    renderBlock();
    expect(screen.getByText('rescue it')).toBeDefined();
    expect(screen.getByRole('button', { name: strings.tipBanner.share })).toBeDefined();
    expect(screen.getByRole('button', { name: strings.tipBanner.save })).toBeDefined();
  });

  it('shares a search link for the ingredient through the Web Share API', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...window.navigator, share });
    renderBlock();

    fireEvent.click(screen.getByRole('button', { name: strings.tipBanner.share }));

    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    // The term rides in the fragment, never the query string (TDD §6.1).
    expect(share.mock.calls[0]?.[0]).toEqual({
      url: `${window.location.origin}/search/#q=Avocado`,
    });
  });

  it('copies the link when the browser has no Web Share API', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...window.navigator, share: undefined, clipboard: { writeText } });
    renderBlock();

    fireEvent.click(screen.getByRole('button', { name: strings.tipBanner.share }));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/search/#q=Avocado`);
  });

  it('renders without the optional tip', () => {
    renderBlock({ tip: undefined });
    expect(screen.getByText('Tip Of The Week')).toBeDefined();
    expect(screen.queryByText('Avocado')).toBeNull();
    expect(screen.queryAllByRole('img')).toHaveLength(0);
  });
});
