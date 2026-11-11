import type { cmsType } from '@llf/contracts';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { BlockToolkit } from './index';

// Shaped after the `component.toolkit` block in apps/web/fixtures/cms/pages.json (page "toolkit").
const image = {
  id: 4,
  documentId: 'osmlnlzapxmh3btnnv9jo78z',
  url: '/uploads/0463f55167f2aa4fa754c47cd7895be7d1a5db56_0db62a4435.png',
  alternativeText: 'guide',
  width: 814,
  height: 796,
};

const pdf = {
  id: 2,
  documentId: 'uw2g4fsghdx7r63ujtkpj76l',
  url: '/uploads/PDPE_Cert_b124ac2c60.pdf',
  name: 'PDPECert.pdf',
  mime: 'application/pdf',
  alternativeText: null,
  width: null,
  height: null,
};

const assetA = {
  title: 'Asset Title Goes Here',
  description: 'Lorem ipsum dolor sit amet, consect adipisc elit, sed do eiusmod tempor.',
  displayMode: 'aspect-16/9',
  label: '16x9 :30 second',
  image,
  file: pdf,
} as const;

const assetB = {
  title: 'Brand Guidelines1',
  description: 'Lorem ipsum dolor sit amet, consect adipisc elit, sed do eiusmod tempor. 1',
  displayMode: 'aspect-4/5',
  label: '4x5 :15 second',
  image,
  file: pdf,
} as const;

const assetC = {
  title: 'Brand Guidelines2',
  description: 'Lorem ipsum dolor sit amet, consect adipisc elit, sed do eiusmod tempor. 2',
  displayMode: 'aspect-4/5',
  label: '4x5 :15 second',
  image,
  file: null,
} as const;

const assetD = {
  title: 'Brand Guidelines3',
  description: 'Lorem ipsum dolor sit amet, consect adipisc elit, sed do eiusmod tempor. 3',
  displayMode: 'aspect-1/1',
  label: '1x1 :15 second',
  image,
  file: null,
} as const;

const assetE = {
  title: 'Brand Guidelines',
  description: 'Lorem ipsum dolor sit amet, consect adipisc elit, sed do eiusmod tempor. 4',
  displayMode: 'aspect-16/9',
  label: '16x9 :30 second',
  image,
  file: pdf,
} as const;

const block = {
  __component: 'component.toolkit',
  id: 17,
  title: 'MainCategory',
  toolkitCategory: [
    {
      id: 39,
      title: { copy: 'Guidelines', header: 'h2' },
      subCategory: [
        {
          id: 66,
          description: 'This is a description of what this asset category is.',
          backgroundColor: 'paper',
          title: { copy: 'brand guidelines', header: 'h2' },
          assets: [assetA, assetB, assetC],
        },
        {
          id: 65,
          description: 'This is the radio description.',
          backgroundColor: null,
          title: { copy: 'radio', header: 'h2' },
          assets: [assetD],
        },
      ],
    },
    {
      id: 40,
      title: { copy: 'PSA Assets', header: 'h2' },
      subCategory: [
        {
          id: 67,
          description: 'This is a description of what this asset category is.',
          backgroundColor: null,
          title: { copy: 'televison', header: 'h3' },
          assets: [assetE],
        },
      ],
    },
  ],
} satisfies cmsType.component.ToolkitDeepRef;

const renderBlock = (overrides: Partial<cmsType.component.ToolkitDeepRef> = {}) =>
  render(<BlockToolkit block={{ ...block, ...overrides }} index={1} pageTitle="Toolkit" />);

describe('BlockToolkit', () => {
  afterEach(cleanup);

  it('renders the nav categories and every sub-category heading', () => {
    renderBlock();
    const [guidelines, psaAssets] = block.toolkitCategory;
    if (!guidelines?.title.copy || !psaAssets?.title.copy) {
      throw new Error('fixture needs both category titles');
    }
    expect(screen.getAllByText(guidelines.title.copy).length).toBeGreaterThan(0);
    expect(screen.getAllByText(psaAssets.title.copy).length).toBeGreaterThan(0);

    for (const category of block.toolkitCategory) {
      for (const sub of category.subCategory) {
        const level = sub.title.header === 'h3' ? 3 : 2;
        expect(
          screen.getByRole('heading', { level, name: sub.title.copy ?? '' }),
        ).toBeDefined();
      }
    }
  });

  it('renders every asset title and description', () => {
    renderBlock();
    for (const category of block.toolkitCategory) {
      for (const sub of category.subCategory) {
        expect(screen.getAllByText(sub.description).length).toBeGreaterThan(0);
        for (const asset of sub.assets) {
          expect(screen.getByText(asset.title)).toBeDefined();
          expect(screen.getByText(asset.description)).toBeDefined();
        }
      }
    }
  });

  it('groups assets under their label', () => {
    renderBlock();
    // Two sub-categories each render a 16x9 group; the two 4x5 assets share one group.
    expect(screen.getAllByText('16x9 :30 second')).toHaveLength(2);
    expect(screen.getAllByText('4x5 :15 second')).toHaveLength(1);
    expect(screen.getByText('1x1 :15 second')).toBeDefined();
  });

  it('renders the CMS image for every asset and a download link only when a file exists', () => {
    const { container } = renderBlock();
    const assets: cmsType.shared.AssetsCardsDeepRef[] = [];
    for (const category of block.toolkitCategory) {
      for (const sub of category.subCategory) assets.push(...sub.assets);
    }

    const images = [...container.querySelectorAll('img')];
    expect(images.map((img) => img.getAttribute('alt'))).toEqual(assets.map((a) => a.title));
    for (const img of images) {
      expect(decodeURIComponent(img.getAttribute('src') ?? '')).toContain(image.url);
    }

    const anchors = [...container.querySelectorAll('a')];
    expect(anchors).toHaveLength(assets.length);
    expect(anchors.filter((anchor) => anchor.getAttribute('href') === pdf.url)).toHaveLength(3);
    expect(anchors.filter((anchor) => anchor.getAttribute('href') === null)).toHaveLength(2);
  });

  it('renders without categories instead of throwing', () => {
    const { container } = renderBlock({ toolkitCategory: [] });
    expect(container.querySelectorAll('img')).toHaveLength(0);
    expect(container.querySelectorAll('a')).toHaveLength(0);
    expect(screen.queryByRole('heading')).toBeNull();
  });
});
