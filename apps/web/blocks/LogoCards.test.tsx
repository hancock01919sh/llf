import type { cmsType } from '@llf/contracts';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { BlockLogoCards } from './LogoCards';

// Shaped after the `component.logo-cards` block in apps/web/fixtures/cms/pages.json (page "about").
const desktop = {
  id: 88,
  documentId: 'dmyuwjrcbt1jtkdvplmti766',
  url: '/uploads/warpdesktop_c437a1e7d7.png',
  alternativeText: 'wrap',
  caption: null,
  width: 313,
  height: 313,
  mime: 'image/png',
  name: 'warpdesktop.png',
};
const mobile = {
  id: 89,
  documentId: 'ijej77plriq4oiecc9cmwi7t',
  url: '/uploads/wwfmobile_02c950029f.png',
  alternativeText: 'wwfm',
  caption: null,
  width: 370,
  height: 200,
  mime: 'image/png',
  name: 'wwfmobile.png',
};

const block = {
  __component: 'component.logo-cards',
  id: 45,
  description:
    'Every tip is reviewed by a panel of food safety and culinary experts before it publishes. Nothing goes live without it.',
  backgroundColor: 'paper',
  isFullwidth: false,
  title: { copy: 'reviewed by the people who know this space', header: 'h2' },
  imageDesktop: [desktop],
  imageMobile: [mobile],
} satisfies cmsType.component.LogoCardsDeepRef;

const renderBlock = (overrides: Partial<typeof block> = {}) =>
  render(<BlockLogoCards block={{ ...block, ...overrides }} index={1} pageTitle="About" />);

describe('BlockLogoCards', () => {
  afterEach(cleanup);

  it('renders the CMS heading and description', () => {
    renderBlock();
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(
      'reviewed by the people who know this space',
    );
    expect(screen.getByText(block.description)).toBeDefined();
  });

  it('renders the desktop and mobile logos with their alt text', () => {
    renderBlock();
    expect(screen.getByAltText('wrap')).toBeDefined();
    expect(screen.getByAltText('wwfm')).toBeDefined();
  });

  it('renders without the optional logo images', () => {
    const withoutLogos = {
      ...block,
      imageDesktop: null,
      imageMobile: null,
    } satisfies cmsType.component.LogoCardsDeepRef;
    render(<BlockLogoCards block={withoutLogos} index={1} pageTitle="About" />);
    expect(screen.queryAllByRole('img')).toHaveLength(0);
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(
      'reviewed by the people who know this space',
    );
  });
});
