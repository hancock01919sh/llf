import { describe, expect, it } from 'vitest';

import { loadConfig } from './config';

describe('loadConfig', () => {
  it('defaults to the mock provider in live mode', () => {
    expect(loadConfig({})).toEqual({
      mode: 'live',
      gapLog: false,
      provider: 'mock',
      model: 'mock-1',
      promptVersion: 'p1',
      anthropicApiKey: undefined,
      openaiApiKey: undefined,
      geminiApiKey: undefined,
      geminiBaseUrl: undefined,
      reasoningEffort: undefined,
      port: 8787,
      trustedProxyHops: 0,
      catalogUrl: undefined,
      catalogFile: undefined,
      catalogRefreshMs: 60_000,
      quotaDailyModelCalls: 3_000,
      rateLimit: { windowMs: 300_000, url: 30, model: 10 },
      urlCacheTtlMs: 86_400_000,
      modelTimeoutMs: 15_000,
      handlerTimeoutMs: 25_000,
    });
  });

  it('treats empty values as unset', () => {
    expect(loadConfig({ AI_PROVIDER: '', PORT: '', CATALOG_URL: '' })).toMatchObject({
      provider: 'mock',
      port: 8787,
      catalogUrl: undefined,
    });
  });

  it('parses overrides', () => {
    const config = loadConfig({
      FIND_TIPS_MODE: 'jsonld-only',
      AI_PROVIDER: 'anthropic',
      AI_MODEL: 'some-model',
      PORT: '9000',
      CATALOG_URL: 'https://cms.example.test/api/catalog',
      RATE_LIMIT_URL: '5',
      RATE_LIMIT_MODEL: '1',
    });
    expect(config).toMatchObject({
      mode: 'jsonld-only',
      provider: 'anthropic',
      model: 'some-model',
      port: 9000,
      catalogUrl: 'https://cms.example.test/api/catalog',
      rateLimit: { windowMs: 300_000, url: 5, model: 1 },
    });
  });

  it('allows gap logging only in dev and keeps it off by default', () => {
    expect(loadConfig({}).gapLog).toBe(false);
    expect(loadConfig({ GAP_LOG: 'on' }).gapLog).toBe(true);
  });

  it('reads the Anthropic key without echoing it on errors', () => {
    expect(loadConfig({ ANTHROPIC_API_KEY: ' sk-test ' }).anthropicApiKey).toBe('sk-test');
    expect(loadConfig({ ANTHROPIC_API_KEY: '' }).anthropicApiKey).toBeUndefined();
    expect(() => loadConfig({ ANTHROPIC_API_KEY: 'sk-secret', PORT: 'abc' })).not.toThrow(
      /sk-secret/,
    );
  });

  it('reads the OpenAI key without echoing it on errors', () => {
    expect(loadConfig({ OPENAI_API_KEY: ' sk-proj-test ' }).openaiApiKey).toBe('sk-proj-test');
    expect(loadConfig({ OPENAI_API_KEY: '' }).openaiApiKey).toBeUndefined();
    expect(() => loadConfig({ OPENAI_API_KEY: 'sk-proj-secret', PORT: 'abc' })).not.toThrow(
      /sk-proj-secret/,
    );
  });

  it('reads the Gemini key without echoing it on errors', () => {
    expect(loadConfig({ GEMINI_API_KEY: ' g-test ' }).geminiApiKey).toBe('g-test');
    expect(loadConfig({ GEMINI_API_KEY: '' }).geminiApiKey).toBeUndefined();
    expect(() => loadConfig({ GEMINI_API_KEY: 'g-secret', PORT: 'abc' })).not.toThrow(/g-secret/);
  });

  it('turns on Gemini on Vertex AI with a project, defaulting to the US multi-region (D37)', () => {
    expect(loadConfig({}).geminiVertex).toBeUndefined();
    expect(loadConfig({ GOOGLE_CLOUD_PROJECT: 'p' }).geminiVertex).toBeUndefined();
    expect(loadConfig({ GEMINI_VERTEX: '1', GOOGLE_CLOUD_PROJECT: 'p' }).geminiVertex).toEqual({
      project: 'p',
      location: 'us',
    });
    expect(
      loadConfig({
        GEMINI_VERTEX: 'true',
        GOOGLE_CLOUD_PROJECT: 'p',
        GOOGLE_CLOUD_LOCATION: 'global',
      }).geminiVertex,
    ).toEqual({ project: 'p', location: 'global' });
    expect(
      loadConfig({ GEMINI_VERTEX: '0', GOOGLE_CLOUD_PROJECT: 'p' }).geminiVertex,
    ).toBeUndefined();
    expect(() => loadConfig({ GEMINI_VERTEX: '1' })).toThrow(/GOOGLE_CLOUD_PROJECT/);
    expect(() =>
      loadConfig({
        GEMINI_VERTEX: '1',
        GOOGLE_CLOUD_PROJECT: 'p',
        GOOGLE_CLOUD_LOCATION: 'us/../x',
      }),
    ).toThrow(/GOOGLE_CLOUD_LOCATION/);
  });

  it('uses the dev proxy URL and token when no real Gemini key is set (D39)', () => {
    const proxy = { GEMINI_PROXY_URL: 'https://proxy.example.com', GEMINI_PROXY_TOKEN: 'tok' };
    expect(loadConfig(proxy)).toMatchObject({
      geminiBaseUrl: 'https://proxy.example.com',
      geminiApiKey: 'tok',
    });
    // A real key always wins and goes straight to Google.
    expect(loadConfig({ ...proxy, GEMINI_API_KEY: 'real' })).toMatchObject({
      geminiBaseUrl: undefined,
      geminiApiKey: 'real',
    });
    expect(loadConfig({ GEMINI_PROXY_TOKEN: 'tok' }).geminiApiKey).toBeUndefined();
  });

  it('reads a Gemini relay base URL for dev (D38)', () => {
    expect(loadConfig({ GEMINI_BASE_URL: 'https://relay.example.com' }).geminiBaseUrl).toBe(
      'https://relay.example.com',
    );
    expect(loadConfig({ GEMINI_BASE_URL: '' }).geminiBaseUrl).toBeUndefined();
    expect(() => loadConfig({ GEMINI_BASE_URL: 'not a url' })).toThrow(/GEMINI_BASE_URL/);
  });

  it('accepts gemini as AI_PROVIDER', () => {
    expect(loadConfig({ AI_PROVIDER: 'gemini' }).provider).toBe('gemini');
  });

  it('parses AI_REASONING_EFFORT', () => {
    expect(loadConfig({ AI_REASONING_EFFORT: 'minimal' }).reasoningEffort).toBe('minimal');
    expect(loadConfig({ AI_REASONING_EFFORT: '' }).reasoningEffort).toBeUndefined();
    expect(() => loadConfig({ AI_REASONING_EFFORT: 'extreme' })).toThrow(/AI_REASONING_EFFORT/);
  });

  it('prefers TOOL_PORT over PORT', () => {
    expect(loadConfig({ TOOL_PORT: '8899', PORT: '3000' }).port).toBe(8899);
    expect(loadConfig({ TOOL_PORT: '', PORT: '3000' }).port).toBe(3000);
    expect(() => loadConfig({ TOOL_PORT: 'abc' })).toThrow(/TOOL_PORT/);
  });

  it('names the invalid variables without echoing their values', () => {
    expect(() => loadConfig({ PORT: 'abc', AI_PROVIDER: 'foo' })).toThrow(
      /invalid environment \(.*PORT/,
    );
    expect(() => loadConfig({ AI_PROVIDER: 'foo' })).toThrow(/AI_PROVIDER/);
    expect(() => loadConfig({ AI_PROVIDER: 'foo' })).not.toThrow(/foo/);
    expect(() => loadConfig({ FIND_TIPS_MODE: 'sometimes' })).toThrow(/FIND_TIPS_MODE/);
  });
});
