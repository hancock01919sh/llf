import { REPORT_INGREDIENTS_TOOL } from '@llf/contracts/find-tips';
import { describe, expect, it } from 'vitest';

import { ToolError } from '../http';
import { createProvider, extractIngredients } from './index';
import { OPENAI_MAX_COMPLETION_TOKENS, buildOpenAIRequest, createOpenAIProvider } from './openai';
import { systemPrompt } from './prompt';
import { ProviderNotConfiguredError } from './types';

const ctx = { model: 'gpt-test', promptVersion: 'p1' };
const KEY = 'sk-openai-test-key';

const RESULT = {
  readable: true,
  detectedType: 'shopping_list',
  items: [{ term: 'milk', isFood: true, inferred: false }],
};

type Call = { url: string; init: RequestInit };

function fakeFetch(response: () => Response): { fetch: typeof fetch; calls: Call[] } {
  const calls: Call[] = [];
  const impl = async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    return response();
  };
  return { fetch: impl as typeof fetch, calls };
}

function ok(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

interface CompletionOverrides {
  content?: string | null;
  refusal?: string;
  finishReason?: string;
  usage?: Record<string, unknown>;
}

function completion(overrides: CompletionOverrides = {}) {
  return {
    choices: [
      {
        finish_reason: overrides.finishReason ?? 'stop',
        message: {
          content: overrides.content === undefined ? JSON.stringify(RESULT) : overrides.content,
          ...(overrides.refusal ? { refusal: overrides.refusal } : {}),
        },
      },
    ],
    ...(overrides.usage ? { usage: overrides.usage } : {}),
  };
}

function bodyOf(call: Call | undefined): Record<string, unknown> {
  if (!call) throw new Error('expected a fetch call');
  return JSON.parse(String(call.init.body)) as Record<string, unknown>;
}

describe('buildOpenAIRequest', () => {
  it('uses strict structured output with the shared schema and sends no catalog', () => {
    const req = buildOpenAIRequest({ kind: 'text', text: 'milk' }, ctx);
    expect(req.model).toBe('gpt-test');
    expect(req.max_completion_tokens).toBe(OPENAI_MAX_COMPLETION_TOKENS);
    expect(req.messages[0]).toEqual({ role: 'system', content: systemPrompt('p1') });
    expect(req.response_format).toEqual({
      type: 'json_schema',
      json_schema: {
        name: REPORT_INGREDIENTS_TOOL.name,
        description: REPORT_INGREDIENTS_TOOL.description,
        strict: true,
        schema: REPORT_INGREDIENTS_TOOL.inputSchema,
      },
    });
    expect(JSON.stringify(req)).not.toMatch(/catalog/i);
  });

  it('wraps text input in <input> tags', () => {
    const req = buildOpenAIRequest({ kind: 'text', text: 'two eggs' }, ctx);
    const user = req.messages[1] as { role: string; content: { type: string; text: string }[] };
    expect(user.role).toBe('user');
    expect(user.content).toHaveLength(1);
    expect(user.content[0]?.text).toContain('<input>\ntwo eggs\n</input>');
  });

  it('sends images as a base64 data URL followed by an instruction', () => {
    const req = buildOpenAIRequest(
      { kind: 'image', mimeType: 'image/jpeg', bytes: new Uint8Array([0xff, 0xd8, 0xff]) },
      ctx,
    );
    const user = req.messages[1] as { content: Record<string, unknown>[] };
    expect(user.content[0]).toEqual({
      type: 'image_url',
      image_url: { url: 'data:image/jpeg;base64,/9j/' },
    });
    expect(user.content[1]).toMatchObject({ type: 'text' });
  });

  it('sends reasoning_effort only when set', () => {
    expect(buildOpenAIRequest({ kind: 'text', text: 'milk' }, ctx)).not.toHaveProperty(
      'reasoning_effort',
    );
    expect(
      buildOpenAIRequest({ kind: 'text', text: 'milk' }, { ...ctx, reasoningEffort: 'minimal' }),
    ).toMatchObject({ reasoning_effort: 'minimal' });
  });

  it('rejects an unknown prompt version', () => {
    expect(() =>
      buildOpenAIRequest({ kind: 'text', text: 'milk' }, { ...ctx, promptVersion: 'p999' }),
    ).toThrow(/p999/);
  });
});

describe('createOpenAIProvider', () => {
  it('fails closed without a key and makes no request', async () => {
    const { fetch, calls } = fakeFetch(() => ok(completion()));
    const provider = createOpenAIProvider({ fetch });
    await expect(
      provider.extract(
        { kind: 'text', text: 'milk' },
        { ...ctx, signal: AbortSignal.timeout(1_000) },
      ),
    ).rejects.toBeInstanceOf(ProviderNotConfiguredError);
    expect(calls).toHaveLength(0);
  });

  it('posts to chat completions with the key, JSON body, and caller signal', async () => {
    const { fetch, calls } = fakeFetch(() => ok(completion()));
    const provider = createOpenAIProvider({ apiKey: KEY, baseUrl: 'https://proxy.test/', fetch });
    const signal = AbortSignal.timeout(1_000);
    const out = await provider.extract({ kind: 'text', text: 'milk' }, { ...ctx, signal });

    expect(out).toEqual({ result: RESULT });
    const call = calls[0];
    expect(call?.url).toBe('https://proxy.test/v1/chat/completions');
    expect(call?.init.method).toBe('POST');
    expect(call?.init.headers).toEqual({
      authorization: `Bearer ${KEY}`,
      'content-type': 'application/json',
    });
    expect(call?.init.signal).toBe(signal);
    expect(bodyOf(call)).toMatchObject({ model: 'gpt-test' });
  });

  it('maps usage, including reasoning tokens when reported', async () => {
    const { fetch } = fakeFetch(() =>
      ok(
        completion({
          usage: {
            prompt_tokens: 120,
            completion_tokens: 40,
            completion_tokens_details: { reasoning_tokens: 16 },
          },
        }),
      ),
    );
    const provider = createOpenAIProvider({ apiKey: KEY, fetch });
    const out = await provider.extract(
      { kind: 'text', text: 'milk' },
      { ...ctx, signal: AbortSignal.timeout(1_000) },
    );
    expect(out.usage).toEqual({ inputTokens: 120, outputTokens: 40, reasoningTokens: 16 });
  });

  it('omits reasoning tokens when not reported and usage when absent', async () => {
    const withUsage = createOpenAIProvider({
      apiKey: KEY,
      fetch: fakeFetch(() => ok(completion({ usage: { prompt_tokens: 9, completion_tokens: 3 } })))
        .fetch,
    });
    const signal = AbortSignal.timeout(1_000);
    expect(
      (await withUsage.extract({ kind: 'text', text: 'milk' }, { ...ctx, signal })).usage,
    ).toEqual({ inputTokens: 9, outputTokens: 3 });

    const without = createOpenAIProvider({
      apiKey: KEY,
      fetch: fakeFetch(() => ok(completion())).fetch,
    });
    expect(
      await without.extract({ kind: 'text', text: 'milk' }, { ...ctx, signal }),
    ).not.toHaveProperty('usage');
  });

  it.each([
    ['a refusal', completion({ refusal: 'no' }), 'openai: refused'],
    ['truncated output', completion({ finishReason: 'length' }), 'openai: output truncated'],
    ['missing content', completion({ content: null }), 'openai: no content'],
    ['non-JSON content', completion({ content: 'milk, eggs' }), 'openai: content is not JSON'],
    ['no choices', { choices: [] }, 'openai: no content'],
  ])('rejects %s', async (_label, body, message) => {
    const provider = createOpenAIProvider({ apiKey: KEY, fetch: fakeFetch(() => ok(body)).fetch });
    await expect(
      provider.extract(
        { kind: 'text', text: 'milk' },
        { ...ctx, signal: AbortSignal.timeout(1_000) },
      ),
    ).rejects.toThrow(message);
  });

  it('reports HTTP errors by status only, never the key', async () => {
    const { fetch } = fakeFetch(() => new Response(`bad key ${KEY}`, { status: 529 }));
    const provider = createOpenAIProvider({ apiKey: KEY, fetch });
    const error = (await provider
      .extract({ kind: 'text', text: 'milk' }, { ...ctx, signal: AbortSignal.timeout(1_000) })
      .catch((e: unknown) => e)) as Error;
    expect(error.message).toBe('openai: HTTP 529');
    expect(error.message).not.toContain(KEY);
  });
});

describe('openai through extractIngredients', () => {
  const opts = { timeoutMs: 1_000, model: 'gpt-test', promptVersion: 'p1' };

  it('validates and returns a well-formed result', async () => {
    const { fetch, calls } = fakeFetch(() =>
      ok(completion({ usage: { prompt_tokens: 10, completion_tokens: 5 } })),
    );
    const provider = createProvider('openai', { openaiApiKey: KEY, fetch });
    const extraction = await extractIngredients(
      provider,
      { kind: 'text', text: 'milk' },
      {
        ...opts,
        reasoningEffort: 'low',
      },
    );
    expect(extraction).toEqual({ result: RESULT, usage: { inputTokens: 10, outputTokens: 5 } });
    expect(bodyOf(calls[0])).toMatchObject({ reasoning_effort: 'low' });
  });

  it('maps malformed output to upstream_error', async () => {
    const { fetch } = fakeFetch(() =>
      ok(completion({ content: JSON.stringify({ readable: true, items: 'milk' }) })),
    );
    const provider = createProvider('openai', { openaiApiKey: KEY, fetch });
    const error = await extractIngredients(provider, { kind: 'text', text: 'milk' }, opts).catch(
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(ToolError);
    expect((error as ToolError).code).toBe('upstream_error');
  });

  it('maps HTTP errors to upstream_error', async () => {
    const { fetch } = fakeFetch(() => new Response('overloaded', { status: 529 }));
    const provider = createProvider('openai', { openaiApiKey: KEY, fetch });
    const error = await extractIngredients(provider, { kind: 'text', text: 'milk' }, opts).catch(
      (e: unknown) => e,
    );
    expect((error as ToolError).code).toBe('upstream_error');
  });
});
