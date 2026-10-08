import { describe, expect, it } from 'vitest';

import { MemoryCacheStore, MemoryCounterStore } from '../cache';
import { loadConfig } from '../config';
import { createMockProvider } from '../extract';
import { ToolError } from '../http';
import { createQuota } from '../quota';
import { PUBLIC_IP, fakeResolver, fakeTransport, recipePage } from '../test-utils';
import { runUrlPipeline } from './pipeline';

const resolve = fakeResolver({ 'recipes.test': [PUBLIC_IP], 'internal.test': ['10.0.0.8'] });

const PAGES = {
  'https://recipes.test/pie': {
    html: recipePage(['2 cups whole milk', '1 loaf sourdough, sliced']),
  },
  'https://recipes.test/blog': {
    html: '<html><body><article>milk, spinach, bananas</article></body></html>',
  },
  'https://recipes.test/blank': { html: '<html><body><script>var x = 1;</script></body></html>' },
};

function setup(overrides: Record<string, string> = {}, quotaLimit = 10) {
  const config = loadConfig(overrides);
  const counters = new MemoryCounterStore();
  const quota = createQuota(counters, quotaLimit);
  const transport = fakeTransport(PAGES);
  const deps = {
    cache: new MemoryCacheStore(),
    config,
    provider: createMockProvider(),
    quota,
    resolve,
    transport,
  };
  return { deps, quota, transport, counters };
}

async function codeOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof ToolError) return error.code;
    throw error;
  }
  throw new Error('expected a ToolError');
}

describe('runUrlPipeline', () => {
  it('reads recipe JSON-LD without calling the model, even with no quota left', async () => {
    const { deps } = setup({}, 0);
    const result = await runUrlPipeline('https://recipes.test/pie?utm_source=feed', deps);
    expect(result.source).toBe('jsonld');
    expect(result.detectedType).toBe('recipe');
    expect(result.readable).toBe(true);
    expect(result.items.map((item) => item.term)).toEqual([
      '2 cups whole milk',
      '1 loaf sourdough, sliced',
    ]);
    expect(result.urlHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('serves repeat requests from the cache without refetching', async () => {
    const { deps, transport } = setup();
    const first = await runUrlPipeline('https://recipes.test/pie', deps);
    const callsAfterFirst = transport.calls.length;
    const second = await runUrlPipeline('https://recipes.test/pie#comments', deps);
    expect(second.source).toBe('cache');
    expect(second.items).toEqual(first.items);
    expect(second.urlHash).toBe(first.urlHash);
    expect(transport.calls).toHaveLength(callsAfterFirst);
  });

  it('falls back to the model for pages without JSON-LD and spends quota', async () => {
    const { deps, counters } = setup();
    const result = await runUrlPipeline('https://recipes.test/blog', deps);
    expect(result.source).toBe('model');
    expect(result.items.map((item) => item.term)).toEqual(['milk', 'spinach', 'bananas']);
    const key = `quota#url#${new Date().toISOString().slice(0, 10)}`;
    expect(await counters.peek(key)).toBe(1);
  });

  it('is unavailable without JSON-LD in jsonld-only mode', async () => {
    const { deps } = setup({ FIND_TIPS_MODE: 'jsonld-only' });
    expect(await codeOf(runUrlPipeline('https://recipes.test/blog', deps))).toBe('unavailable');
  });

  it('is unavailable without JSON-LD once the quota is spent', async () => {
    const { deps } = setup({}, 0);
    expect(await codeOf(runUrlPipeline('https://recipes.test/blog', deps))).toBe('unavailable');
  });

  it('reports an unreadable page without spending quota', async () => {
    const { deps, quota } = setup({}, 1);
    const result = await runUrlPipeline('https://recipes.test/blank', deps);
    expect(result).toMatchObject({ readable: false, detectedType: 'unknown', items: [] });
    expect(await quota.exhausted('url')).toBe(false);
  });

  it('rejects URLs that are not allowed', async () => {
    const { deps } = setup();
    expect(await codeOf(runUrlPipeline('ftp://recipes.test/pie', deps))).toBe('url_not_allowed');
    expect(await codeOf(runUrlPipeline('https://internal.test/', deps))).toBe('url_not_allowed');
  });
});
