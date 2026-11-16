import type { cmsType } from '@llf/contracts';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { strings } from '@/content/strings';
import { BlockTipBanner } from './TipBanner';

// The share/download buttons render the tip as an image through html-to-image before
// handing it to the Web Share API or the browser download. jsdom can't rasterise, so
// stub the encode step and assert on what TipBanner hands over.
const JPEG_DATA_URL = 'data:image/jpeg;base64,ZmFrZQ==';
vi.mock('html-to-image', () => ({
  toJpeg: vi.fn().mockResolvedValue('data:image/jpeg;base64,ZmFrZQ=='),
}));

// Shaped after the `component.tip-banner` block in apps/web/fixtures/cms/pages.json (page "home").
const block = {
  __component: 'component.tip-banner',
  id: 69,
  label: 'Tip Of The Week',
  backgroundColor: 'terra',
  isFullwidth: false,
  interiorBackgroundColor: 'sand',
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

// `DownloadTemplate` names the file `<ingredient>-<first two words of the tip>.jpeg`.
const EXPECTED_FILENAME = 'Avocado-Gone brown?.jpeg';

const renderBlock = (overrides: Partial<typeof block> = {}) =>
  render(<BlockTipBanner block={{ ...block, ...overrides }} index={1} pageTitle="Home" />);

const getShareButton = () =>
  screen.getByRole('button', { name: strings.tipBanner.share }) as HTMLButtonElement;
const getSaveButton = () =>
  screen.getByRole('button', { name: strings.tipBanner.save }) as HTMLButtonElement;

describe('BlockTipBanner', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders the CMS label, ingredient, tip title and description', () => {
    renderBlock();
    expect(screen.getByText('Tip Of The Week')).toBeDefined();
    expect(screen.getByText(block.tip.description)).toBeDefined();
    // The ingredient title shows in the banner copy and again in the generated template.
    expect(screen.getAllByText('Avocado').length).toBeGreaterThan(0);
    expect(screen.getAllByText("Gone brown? It's not gone bad.").length).toBeGreaterThan(0);
  });

  it('applies the CMS interior background to the banner and the label', () => {
    const { container } = renderBlock({ interiorBackgroundColor: 'sand' });
    // Both the banner and the floating label opt into the CMS surface (packages/ui tokens).
    expect(container.querySelectorAll('[data-surface="sand"]')).toHaveLength(2);
    expect(container.querySelectorAll('[data-surface="forest-tint"]')).toHaveLength(0);
  });

  it('renders the tip type badge and both CTAs', () => {
    renderBlock();
    expect(screen.getByText('rescue it')).toBeDefined();
    expect(getShareButton()).toBeDefined();
    expect(getSaveButton()).toBeDefined();
  });

  it('shares the rendered tip image through the Web Share API', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const canShare = vi.fn().mockReturnValue(true);
    vi.stubGlobal('navigator', { ...window.navigator, share, canShare });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        blob: async () => new Blob(['fake'], { type: 'image/jpeg' }),
      }),
    );
    renderBlock();

    fireEvent.click(getShareButton());

    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    const payload = share.mock.calls[0]?.[0] as { files: File[] };
    expect(payload.files).toHaveLength(1);
    expect(payload.files[0]?.name).toBe(EXPECTED_FILENAME);
    expect(payload.files[0]?.type).toBe('image/jpeg');
  });

  it('downloads the rendered tip image and disables the buttons while it renders', async () => {
    const links: HTMLAnchorElement[] = [];
    const createElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(((
      tagName: string,
      options?: ElementCreationOptions,
    ) => {
      const element = createElement(tagName, options);
      if (tagName === 'a') links.push(element as HTMLAnchorElement);
      return element;
    }) as typeof document.createElement);
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    renderBlock();

    fireEvent.click(getSaveButton());

    // Both CTAs lock while the image is being generated.
    expect(getSaveButton().disabled).toBe(true);
    expect(getShareButton().disabled).toBe(true);

    await waitFor(() => expect(click).toHaveBeenCalledTimes(1));
    const link = links.at(-1);
    expect(link?.download).toBe(EXPECTED_FILENAME);
    expect(link?.getAttribute('href')).toBe(JPEG_DATA_URL);
  });

  it('renders without the optional tip', () => {
    renderBlock({ tip: undefined });
    expect(screen.getByText('Tip Of The Week')).toBeDefined();
    expect(screen.queryByText('Avocado')).toBeNull();
    expect(screen.queryAllByRole('img')).toHaveLength(0);
  });
});
