import type { cmsType } from '@llf/contracts';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { BlockToolkitHeadline } from './ToolkitHeadline';

// Shaped after the `component.toolkit-headline` block in apps/web/fixtures/cms/pages.json (page "toolkit").
const block = {
  __component: 'component.toolkit-headline',
  id: 49,
  description: 'This is the toolkit overview.',
  cta: {
    label: 'download campaign overview',
    href: null,
    isDisplay: true,
    isButton: true,
    buttonType: null,
    newTab: false,
  },
  file: {
    id: 2,
    documentId: 'uw2g4fsghdx7r63ujtkpj76l',
    url: '/uploads/PDPE_Cert_b124ac2c60.pdf',
    alternativeText: null,
    caption: null,
    width: null,
    height: null,
    mime: 'application/pdf',
    name: 'PDPECert.pdf',
  },
  title: { copy: 'Toolkit headline', header: 'h1' },
} satisfies cmsType.component.ToolkitHeadlineDeepRef;

const renderBlock = (index = 1, overrides: Partial<typeof block> = {}) =>
  render(
    <BlockToolkitHeadline block={{ ...block, ...overrides }} index={index} pageTitle="Toolkit" />,
  );

describe('BlockToolkitHeadline', () => {
  afterEach(cleanup);

  it('renders the CMS heading, description and CTA label', () => {
    renderBlock();
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Toolkit headline');
    expect(screen.getByText('This is the toolkit overview.')).toBeDefined();
    expect(screen.getByRole('button').textContent).toContain('download campaign overview');
  });

  it('keeps the h1 on the first block and downgrades it later', () => {
    const { unmount } = renderBlock(0);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Toolkit headline');
    unmount();

    renderBlock(1);
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Toolkit headline');
  });

  it('renders without the optional CTA', () => {
    renderBlock(1, { cta: undefined });
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Toolkit headline');
    expect(screen.getByText('This is the toolkit overview.')).toBeDefined();
    expect(screen.getByRole('button').textContent?.trim()).toBe('');
  });
});
