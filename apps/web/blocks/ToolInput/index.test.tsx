import type { cmsType } from '@llf/contracts';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BlockToolInput } from './index';

// Tool calls `useRouter().push` with the results URL; jsdom has no App Router provider.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/find-my-tips',
}));

// Shaped after the `component.tool-input` block in apps/web/fixtures/cms/pages.json (page "find-my-tips").
// Strapi ids on links/titles are dropped: the shared contract types carry no `id`.
const block = {
  __component: 'component.tool-input',
  id: 18,
  subTitle: 'Tip Finder',
  description:
    "Whatever you're buying, cooking, or already have, we'll help you get the most out of it.",
  cardTitle: 'How it works',
  cardDescription:
    'Three simple steps between your ingredients and the tips that help you use them better.',
  placeholder: 'Enter a recipe URL or video link',
  // `copy` is Strapi Blocks rich text (Block.array()), not a plain string.
  copy: [
    {
      type: 'paragraph',
      children: [
        {
          type: 'text',
          text: 'Works with any recipe site or video link from YouTube, TikTok, or Instagram.',
        },
      ],
    },
  ],
  backgroundColor: 'paper',
  isFullwidth: true,
  title: { copy: 'Input ingredients,  get tips, waste less', header: 'h1' },
  image: {
    id: 6,
    documentId: 'ihf9pbfub16ofi5w13luqzza',
    url: '/uploads/12691884_uhd_2160_3840_60fps_ea8b6d8dc5.mp4',
    alternativeText: 'wwf',
    width: null,
    height: null,
  },
  button: [
    {
      label: '🔗 Paste Link',
      href: null,
      isDisplay: true,
      isButton: true,
      newTab: false,
      buttonType: 'Primary',
    },
    {
      label: '📷 Upload Image',
      href: null,
      isDisplay: true,
      isButton: true,
      newTab: false,
      buttonType: 'Secondary',
    },
    {
      label: 'find tips',
      href: '/search',
      isDisplay: true,
      isButton: null,
      newTab: false,
      buttonType: null,
    },
  ],
  cards: [
    {
      title: 'Step 1',
      description: 'Upload an image or recipe link',
      link: {
        label: 'What can I upload?',
        href: null,
        isDisplay: true,
        isButton: null,
        newTab: false,
        buttonType: null,
      },
    },
    { title: 'Step 2', description: 'You see how to waste less of each ingredient.' },
    { title: 'Step 3', description: 'You see how to waste less of each ingredient.' },
  ],
} satisfies cmsType.component.ToolInputDeepRef;

const extractResponse = {
  requestId: 'test-request',
  detectedType: 'recipe',
  readable: true,
  matches: [],
  unmatchedCount: 0,
  source: 'jsonld',
  catalogVersion: 'test',
};

const fetchMock = vi.fn(async () => ({ ok: true, json: async () => extractResponse }));

const renderBlock = () =>
  render(<BlockToolInput block={block} index={0} pageTitle="Find My Tips" />);

const urlTab = () => screen.getByRole('tab', { name: /Paste Link/ });
const uploadTab = () => screen.getByRole('tab', { name: /Upload Image/ });

describe('BlockToolInput', () => {
  beforeEach(() => {
    fetchMock.mockClear();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('renders both input tabs with the URL tab selected', () => {
    renderBlock();
    expect(screen.getAllByRole('tab')).toHaveLength(2);
    expect(urlTab().getAttribute('aria-selected')).toBe('true');
    expect(urlTab().getAttribute('tabindex')).toBe('0');
    expect(uploadTab().getAttribute('aria-selected')).toBe('false');
    expect(uploadTab().getAttribute('tabindex')).toBe('-1');
    expect(screen.getByRole('tabpanel').id).toContain('-panel-0');
  });

  it('switches to the upload panel when the second tab is clicked', () => {
    renderBlock();
    fireEvent.click(uploadTab());
    const panel = screen.getByRole('tabpanel');
    expect(panel.id).toContain('-panel-1');
    expect(panel.textContent).toContain('Upload an image of a shopping list or receipt');
    expect(uploadTab().getAttribute('aria-selected')).toBe('true');
    expect(uploadTab().getAttribute('tabindex')).toBe('0');
  });

  it('moves the roving tabindex with ArrowRight', () => {
    renderBlock();
    const first = urlTab();
    const second = uploadTab();
    fireEvent.keyDown(first, { key: 'ArrowRight' });
    expect(second.getAttribute('aria-selected')).toBe('true');
    expect(second.getAttribute('tabindex')).toBe('0');
    expect(first.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(second);
  });

  it('keeps submit disabled until a http(s) URL is typed', () => {
    renderBlock();
    const urlInput = screen.getByRole('textbox');
    const submit = screen.getByRole('button', { name: 'find tips' });
    expect(submit.hasAttribute('disabled')).toBe(true);

    fireEvent.input(urlInput, { target: { value: 'not-a-url' } });
    expect(submit.hasAttribute('disabled')).toBe(true);

    fireEvent.input(urlInput, { target: { value: 'https://example.com/recipe' } });
    expect(submit.hasAttribute('disabled')).toBe(false);
  });

  it('posts the pasted URL to the extract endpoint', async () => {
    renderBlock();
    const url = 'https://example.com/recipe';
    fireEvent.input(screen.getByRole('textbox'), { target: { value: url } });
    fireEvent.click(screen.getByRole('button', { name: 'find tips' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/find-tips/extract',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ inputType: 'url', url }),
      }),
    );
  });
});
