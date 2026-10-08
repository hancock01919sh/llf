import { ExtractionResult } from '@llf/contracts/find-tips';

import type { ProviderName } from '../config';
import { ToolError } from '../http';
import { createAnthropicProvider } from './anthropic';
import { createMockProvider } from './mock';
import { createBedrockProvider, createOpenAIProvider } from './stubs';
import type { ExtractionInput, ExtractionProvider, ExtractionUsage } from './types';

export { createAnthropicProvider } from './anthropic';
export { MOCK_IMAGE_RESULT, createMockProvider } from './mock';
export * from './types';

export type ProviderOptions = {
  anthropicApiKey?: string | undefined;
  fetch?: typeof fetch;
};

export function createProvider(
  name: ProviderName,
  options: ProviderOptions = {},
): ExtractionProvider {
  switch (name) {
    case 'mock':
      return createMockProvider();
    case 'anthropic':
      return createAnthropicProvider({
        apiKey: options.anthropicApiKey,
        ...(options.fetch ? { fetch: options.fetch } : {}),
      });
    case 'openai':
      return createOpenAIProvider();
    case 'bedrock':
      return createBedrockProvider();
  }
}

export type ExtractOptions = {
  timeoutMs: number;
  model: string;
  promptVersion: string;
  /** Aborts the model call when the whole request is cancelled. */
  signal?: AbortSignal;
};

export type Extraction = { result: ExtractionResult; usage?: ExtractionUsage };

/**
 * The single entry point for model calls (AGENTS.md, TDD §7.4). Applies the
 * model timeout and validates the adapter output with Zod before anything
 * else sees it. Invalid output is an upstream error; the raw value is never
 * logged or returned.
 */
export async function extractIngredients(
  provider: ExtractionProvider,
  input: ExtractionInput,
  options: ExtractOptions,
): Promise<Extraction> {
  const timeout = AbortSignal.timeout(options.timeoutMs);
  const signal = options.signal ? AbortSignal.any([timeout, options.signal]) : timeout;

  let output;
  try {
    output = await provider.extract(input, {
      signal,
      model: options.model,
      promptVersion: options.promptVersion,
    });
  } catch (error) {
    if (timeout.aborted) throw new ToolError('timeout');
    if (error instanceof ToolError) throw error;
    throw new ToolError('upstream_error');
  }
  if (timeout.aborted) throw new ToolError('timeout');

  const parsed = ExtractionResult.safeParse(output.result);
  if (!parsed.success) throw new ToolError('upstream_error');
  return output.usage ? { result: parsed.data, usage: output.usage } : { result: parsed.data };
}
