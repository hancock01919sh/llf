import { REPORT_INGREDIENTS_TOOL } from '@llf/contracts/find-tips';

import { systemPrompt } from './prompt';
import {
  ProviderNotConfiguredError,
  type ExtractionContext,
  type ExtractionInput,
  type ExtractionProvider,
  type ProviderOutput,
} from './types';

// Anthropic Messages API adapter (TDD §7.4). Sends only the input and the
// system prompt, forces the report_ingredients tool call, and never logs the
// input, the model output, or the response body.
export const ANTHROPIC_API_VERSION = '2023-06-01';
export const ANTHROPIC_MAX_TOKENS = 1000;

export interface AnthropicProviderOptions {
  apiKey?: string | undefined;
  baseUrl?: string;
  fetch?: typeof fetch;
}

interface ContentBlock {
  type: string;
  name?: string;
  input?: unknown;
}

interface MessagesResponse {
  content?: ContentBlock[];
  usage?: { input_tokens?: number; output_tokens?: number };
}

function userContent(input: ExtractionInput): unknown[] {
  if (input.kind === 'text') {
    return [
      {
        type: 'text',
        text: `Extract the ingredients from the text between the <input> tags.\n<input>\n${input.text}\n</input>`,
      },
    ];
  }
  return [
    {
      type: 'image',
      source: {
        type: 'base64',
        media_type: input.mimeType,
        data: Buffer.from(input.bytes).toString('base64'),
      },
    },
    { type: 'text', text: 'Extract the ingredients shown in this image.' },
  ];
}

export function buildAnthropicRequest(
  input: ExtractionInput,
  ctx: Omit<ExtractionContext, 'signal'>,
) {
  return {
    model: ctx.model,
    max_tokens: ANTHROPIC_MAX_TOKENS,
    system: systemPrompt(ctx.promptVersion),
    tools: [
      {
        name: REPORT_INGREDIENTS_TOOL.name,
        description: REPORT_INGREDIENTS_TOOL.description,
        input_schema: REPORT_INGREDIENTS_TOOL.inputSchema,
      },
    ],
    tool_choice: { type: 'tool', name: REPORT_INGREDIENTS_TOOL.name },
    messages: [{ role: 'user', content: userContent(input) }],
  };
}

export function createAnthropicProvider(
  options: AnthropicProviderOptions = {},
): ExtractionProvider {
  const baseUrl = (options.baseUrl ?? 'https://api.anthropic.com').replace(/\/+$/, '');
  const doFetch = options.fetch ?? fetch;

  return {
    name: 'anthropic',
    async extract(input, ctx): Promise<ProviderOutput> {
      if (!options.apiKey) throw new ProviderNotConfiguredError('anthropic');

      const res = await doFetch(`${baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': options.apiKey,
          'anthropic-version': ANTHROPIC_API_VERSION,
          'content-type': 'application/json',
        },
        body: JSON.stringify(buildAnthropicRequest(input, ctx)),
        signal: ctx.signal,
      });
      if (!res.ok) {
        await res.body?.cancel();
        throw new Error(`anthropic: HTTP ${res.status}`);
      }

      const body = (await res.json()) as MessagesResponse;
      const block = body.content?.find(
        (b) => b.type === 'tool_use' && b.name === REPORT_INGREDIENTS_TOOL.name,
      );
      if (!block) throw new Error('anthropic: no report_ingredients tool call');

      const inputTokens = body.usage?.input_tokens;
      const outputTokens = body.usage?.output_tokens;
      return {
        result: block.input,
        ...(typeof inputTokens === 'number' && typeof outputTokens === 'number'
          ? { usage: { inputTokens, outputTokens } }
          : {}),
      };
    },
  };
}
