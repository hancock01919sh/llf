import { FIND_TIPS_API, cms, type ExtractResponse, type ToolMode } from '@llf/contracts';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { format, strings } from '@/content/strings';
import { resultsHref } from '@/lib/paths';
import { FindMyTips } from './FindMyTips';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

const t = strings.tool;

const block = cms.ToolBlock.parse({
  __component: 'custom.tool',
  id: 5,
  url_label: 'Recipe link',
  url_placeholder: 'https://',
  upload_label: 'Recipe photo',
  upload_placeholder: 'Choose a photo',
  description: 'Fixture copy.',
  cta_label: 'Find my tips',
});

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function extractBody(overrides: Partial<ExtractResponse> = {}): ExtractResponse {
  return {
    requestId: 'req-1',
    detectedType: 'recipe',
    readable: true,
    matches: [],
    unmatchedCount: 0,
    source: 'model',
    catalogVersion: 'test',
    ...overrides,
  } as ExtractResponse;
}

function stubApi(mode: ToolMode, extract?: () => Response) {
  const fetchMock = vi.fn(async (input: string) => {
    if (input === FIND_TIPS_API.status) return json(200, { mode, catalogVersion: 'test' });
    if (input === FIND_TIPS_API.extract && extract) return extract();
    return json(500, { requestId: 'x', code: 'server' });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function renderTool() {
  return render(<FindMyTips block={block} index={1} pageTitle="Find My Tips" />);
}

beforeEach(() => {
  push.mockReset();
  sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('FindMyTips', () => {
  it('shows a checking status before the mode resolves', async () => {
    stubApi('live');
    renderTool();
    expect(screen.getByRole('status').textContent).toBe(t.checking);
    await screen.findByRole('tablist');
  });

  it('shows the unavailable message and fallback links when the tool is off', async () => {
    stubApi('off');
    const { container } = renderTool();
    await screen.findByText(t.unavailable);
    expect(container.querySelector('[data-tool-state="unavailable"]')).not.toBeNull();
    expect(screen.getByRole('link', { name: t.browseTips }).getAttribute('href')).toBe('/tips/');
    expect(screen.queryByRole('form')).toBeNull();
  });

  it('treats a failed status request as off', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new Error('offline'))),
    );
    renderTool();
    await screen.findByText(t.unavailable);
  });

  it('renders three tabs with roving tabindex and arrow-key navigation when live', async () => {
    stubApi('live');
    renderTool();
    const tabs = await screen.findAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual([t.tabs.url, t.tabs.image, t.tabs.text]);
    expect(tabs.map((tab) => tab.getAttribute('aria-selected'))).toEqual([
      'true',
      'false',
      'false',
    ]);
    expect(tabs.map((tab) => tab.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);
    expect(screen.getByRole('tablist').getAttribute('aria-label')).toBe(t.tabsLabel);

    fireEvent.keyDown(tabs[0]!, { key: 'ArrowRight' });
    const image = screen.getByRole('tab', { name: t.tabs.image });
    expect(image.getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(image);
    expect(screen.getByLabelText(block.upload_label!).getAttribute('type')).toBe('file');

    fireEvent.keyDown(image, { key: 'End' });
    expect(screen.getByRole('tab', { name: t.tabs.text }).getAttribute('aria-selected')).toBe(
      'true',
    );
    expect(screen.getByLabelText(t.textLabel).tagName).toBe('TEXTAREA');

    fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: t.tabs.url }).getAttribute('aria-selected')).toBe(
      'true',
    );

    const panel = screen.getByRole('tabpanel');
    expect(panel.getAttribute('aria-labelledby')).toBe(
      screen.getByRole('tab', { name: t.tabs.url }).id,
    );
  });

  it('flags an empty submit, describes the error, and focuses the field', async () => {
    stubApi('live');
    renderTool();
    await screen.findByRole('tablist');
    fireEvent.click(screen.getByRole('button', { name: block.cta_label }));

    const input = screen.getByLabelText(block.url_label!);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(input);
    const error = screen.getByText(t.required);
    expect(input.getAttribute('aria-describedby')?.split(' ')).toContain(error.id);
  });

  it('rejects a non-http URL without calling the API', async () => {
    const fetchMock = stubApi('live');
    renderTool();
    await screen.findByRole('tablist');
    fireEvent.change(screen.getByLabelText(block.url_label!), {
      target: { value: 'ftp://example.com/x' },
    });
    fireEvent.click(screen.getByRole('button', { name: block.cta_label }));
    expect(screen.getByText(t.invalidUrl)).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('shows only the URL field and the JSON-LD notice in jsonld-only mode', async () => {
    stubApi('jsonld-only');
    renderTool();
    await screen.findByText(t.jsonldOnly);
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.queryByRole('tabpanel')).toBeNull();
    expect(screen.getByLabelText(block.url_label!)).toBeTruthy();
  });

  it('navigates to the results page and stores the handoff for confirmed matches', async () => {
    const fetchMock = stubApi('live', () =>
      json(
        200,
        extractBody({
          matches: [
            { slug: 'banana', title: 'Bananas', inferred: false },
            { slug: 'bread', title: 'Bread', inferred: false },
          ],
          unmatchedCount: 2,
        }),
      ),
    );
    renderTool();
    await screen.findByRole('tablist');
    fireEvent.change(screen.getByLabelText(block.url_label!), {
      target: { value: 'https://example.com/recipe' },
    });
    fireEvent.click(screen.getByRole('button', { name: block.cta_label }));

    await waitFor(() => expect(push).toHaveBeenCalledWith(resultsHref(['banana', 'bread'])));
    const [, init] = fetchMock.mock.calls[1] as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      inputType: 'url',
      url: 'https://example.com/recipe',
    });
    const handoff = JSON.parse(sessionStorage.getItem('llf:find-tips-result') ?? '{}') as Record<
      string,
      unknown
    >;
    expect(handoff).toMatchObject({ inputType: 'url', source: 'model', unmatchedCount: 2 });
    expect(JSON.stringify(handoff)).not.toContain('example.com');
  });

  it('lets the user remove likely matches before confirming', async () => {
    stubApi('live', () =>
      json(
        200,
        extractBody({
          matches: [
            { slug: 'milk', title: 'Milk', inferred: false },
            { slug: 'basil', title: 'Basil', inferred: true },
            { slug: 'spinach', title: 'Spinach', inferred: true },
          ],
        }),
      ),
    );
    renderTool();
    await screen.findByRole('tablist');
    fireEvent.click(screen.getByRole('tab', { name: t.tabs.text }));
    fireEvent.change(screen.getByLabelText(t.textLabel), {
      target: { value: 'milk, maybe basil' },
    });
    fireEvent.click(screen.getByRole('button', { name: block.cta_label }));

    await screen.findByText(t.likely);
    await waitFor(() => expect(document.activeElement?.textContent).toBe(t.likely));
    fireEvent.click(screen.getByRole('button', { name: format(t.remove, { title: 'Basil' }) }));
    expect(screen.queryByText('Basil')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: t.seeTips }));
    expect(push).toHaveBeenCalledWith(resultsHref(['milk', 'spinach']));
  });

  it('returns to the form on Start over', async () => {
    stubApi('live', () =>
      json(200, extractBody({ matches: [{ slug: 'basil', title: 'Basil', inferred: true }] })),
    );
    renderTool();
    await screen.findByRole('tablist');
    fireEvent.change(screen.getByLabelText(block.url_label!), {
      target: { value: 'https://example.com/recipe' },
    });
    fireEvent.click(screen.getByRole('button', { name: block.cta_label }));
    fireEvent.click(await screen.findByRole('button', { name: t.startOver }));
    expect(screen.getByRole('tablist')).toBeTruthy();
    expect(push).not.toHaveBeenCalled();
  });

  it('shows the no-match message with fallback links and focuses it', async () => {
    stubApi('live', () => json(200, extractBody({ unmatchedCount: 3 })));
    renderTool();
    await screen.findByRole('tablist');
    fireEvent.change(screen.getByLabelText(block.url_label!), {
      target: { value: 'https://example.com/recipe' },
    });
    fireEvent.click(screen.getByRole('button', { name: block.cta_label }));
    const message = await screen.findByText(t.noMatch);
    await waitFor(() => expect(document.activeElement?.contains(message)).toBe(true));
    expect(screen.getByRole('link', { name: t.searchSite })).toBeTruthy();
  });

  it('shows a retryable server error and retries on click', async () => {
    let calls = 0;
    const fetchMock = stubApi('live', () => {
      calls += 1;
      return calls === 1 ? json(500, { requestId: 'x', code: 'server' }) : json(200, extractBody());
    });
    renderTool();
    await screen.findByRole('tablist');
    fireEvent.change(screen.getByLabelText(block.url_label!), {
      target: { value: 'https://example.com/recipe' },
    });
    fireEvent.click(screen.getByRole('button', { name: block.cta_label }));
    await screen.findByText(t.error);
    fireEvent.click(screen.getByRole('button', { name: t.retry }));
    await screen.findByText(t.noMatch);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('shows Site blocked copy with no retry button and no auto-retry', async () => {
    const fetchMock = stubApi('live', () =>
      json(424, { requestId: 'x', code: 'source_unavailable' }),
    );
    renderTool();
    await screen.findByRole('tablist');
    fireEvent.change(screen.getByLabelText(block.url_label!), {
      target: { value: 'https://example.com/recipe' },
    });
    fireEvent.click(screen.getByRole('button', { name: block.cta_label }));
    await screen.findByText(t.siteBlocked);
    expect(screen.queryByRole('button', { name: t.retry })).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('counts down after a 429 and disables submit', async () => {
    stubApi('live', () => new Response(null, { status: 429, headers: { 'retry-after': '5' } }));
    renderTool();
    await screen.findByRole('tablist');
    fireEvent.change(screen.getByLabelText(block.url_label!), {
      target: { value: 'https://example.com/recipe' },
    });
    fireEvent.click(screen.getByRole('button', { name: block.cta_label }));
    await screen.findByText(new RegExp(t.rateLimited.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    expect(screen.getByRole('button', { name: block.cta_label }).hasAttribute('disabled')).toBe(
      true,
    );
  });

  it('switches to the unavailable state when extract returns 503', async () => {
    stubApi('live', () => json(503, { requestId: 'x', code: 'unavailable' }));
    renderTool();
    await screen.findByRole('tablist');
    fireEvent.change(screen.getByLabelText(block.url_label!), {
      target: { value: 'https://example.com/recipe' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: block.cta_label }));
    });
    await screen.findByText(t.unavailable);
  });
});
