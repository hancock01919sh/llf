import { describe, expect, it } from 'vitest';

import { ToolError } from '../http';
import { MOCK_IMAGE_RESULT, createMockProvider, createProvider, extractIngredients } from './index';
import type { ExtractionProvider } from './types';

const opts = { timeoutMs: 1_000, model: 'mock-1', promptVersion: 'p1' };

async function codeOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof ToolError) return error.code;
    throw error;
  }
  throw new Error('expected a ToolError');
}

describe('mock provider', () => {
  it('splits text into terms and strips list markers', async () => {
    const { result } = await extractIngredients(
      createMockProvider(),
      { kind: 'text', text: '- milk\n2. spinach, bananas; • bread\n\n' },
      opts,
    );
    expect(result.items.map((item) => item.term)).toEqual(['milk', 'spinach', 'bananas', 'bread']);
    expect(result.readable).toBe(true);
    expect(result.detectedType).toBe('shopping_list');
  });

  it('reports unreadable text when there are no terms', async () => {
    const { result } = await extractIngredients(
      createMockProvider(),
      { kind: 'text', text: ' , ; \n' },
      opts,
    );
    expect(result).toMatchObject({ readable: false, items: [] });
  });

  it('caps the number of items', async () => {
    const text = Array.from({ length: 80 }, (_, i) => `item ${i}`).join('\n');
    const { result } = await extractIngredients(createMockProvider(), { kind: 'text', text }, opts);
    expect(result.items).toHaveLength(60);
  });

  it('returns the canned fridge photo for images', async () => {
    const { result } = await extractIngredients(
      createMockProvider(),
      { kind: 'image', bytes: new Uint8Array([0xff, 0xd8, 0xff]), mimeType: 'image/jpeg' },
      opts,
    );
    expect(result).toEqual(MOCK_IMAGE_RESULT);
  });
});

describe('extractIngredients', () => {
  it('times out a slow provider and aborts its signal', async () => {
    let aborted = false;
    const slow: ExtractionProvider = {
      name: 'slow',
      extract: (_input, ctx) =>
        new Promise((_resolve, reject) => {
          ctx.signal.addEventListener('abort', () => {
            aborted = true;
            reject(ctx.signal.reason);
          });
        }),
    };
    expect(
      await codeOf(
        extractIngredients(slow, { kind: 'text', text: 'milk' }, { ...opts, timeoutMs: 10 }),
      ),
    ).toBe('timeout');
    expect(aborted).toBe(true);
  });

  it('rejects output that fails the schema', async () => {
    const bad: ExtractionProvider = {
      name: 'bad',
      extract: async () => ({
        result: { readable: true, detectedType: 'recipe', items: [{ term: 'milk' }] },
      }),
    };
    expect(await codeOf(extractIngredients(bad, { kind: 'text', text: 'milk' }, opts))).toBe(
      'upstream_error',
    );
  });

  it('maps provider failures to upstream_error', async () => {
    const broken: ExtractionProvider = {
      name: 'broken',
      extract: async () => {
        throw new Error('socket hang up');
      },
    };
    expect(await codeOf(extractIngredients(broken, { kind: 'text', text: 'milk' }, opts))).toBe(
      'upstream_error',
    );
  });

  it('passes ToolErrors through unchanged', async () => {
    const limited: ExtractionProvider = {
      name: 'limited',
      extract: async () => {
        throw new ToolError('rate_limited');
      },
    };
    expect(await codeOf(extractIngredients(limited, { kind: 'text', text: 'milk' }, opts))).toBe(
      'rate_limited',
    );
  });

  it('passes usage through', async () => {
    const counted: ExtractionProvider = {
      name: 'counted',
      extract: async () => ({
        result: {
          readable: true,
          detectedType: 'recipe',
          items: [{ term: 'milk', isFood: true, inferred: false }],
        },
        usage: { inputTokens: 12, outputTokens: 3 },
      }),
    };
    const extraction = await extractIngredients(counted, { kind: 'text', text: 'milk' }, opts);
    expect(extraction.usage).toEqual({ inputTokens: 12, outputTokens: 3 });
  });

  it('treats unconfigured live providers as upstream errors', async () => {
    for (const name of ['anthropic', 'openai', 'bedrock'] as const) {
      expect(
        await codeOf(
          extractIngredients(createProvider(name), { kind: 'text', text: 'milk' }, opts),
        ),
      ).toBe('upstream_error');
    }
    expect(createProvider('mock').name).toBe('mock');
  });
});
