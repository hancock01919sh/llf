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
// system prompt, constrains the reply to the report_ingredients JSON schema
// with structured outputs, and never logs the input, the model output, or the
// response body. Structured outputs rather than a forced tool call, because
// Sonnet 5.5, Opus 5.5 and Fable 5.1 reject tool_choice "tool" and "any".
export const ANTHROPIC_API_VERSION = '2023-06-01';
export const ANTHROPIC_MAX_TOKENS = 1000;

export interface AnthropicProviderOptions {
  apiKey?: string | undefined;
  baseUrl?: string;
  fetch?: typeof fetch;
}

interface ContentBlock {
  type: string;
  text?: string;
}

interface MessagesResponse {
  content?: ContentBlock[];
  stop_reason?: string;
  usage?: { input_tokens?: number; output_tokens?: number };
}

// Structured outputs reject maxItems. The cap is still enforced by the Zod
// validation every provider result goes through.
const { maxItems: _maxItems, ...anthropicItems } =
  REPORT_INGREDIENTS_TOOL.inputSchema.properties.items;
export const ANTHROPIC_OUTPUT_SCHEMA = {
  ...REPORT_INGREDIENTS_TOOL.inputSchema,
  properties: { ...REPORT_INGREDIENTS_TOOL.inputSchema.properties, items: anthropicItems },
};

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
    output_config: {
      format: { type: 'json_schema', schema: ANTHROPIC_OUTPUT_SCHEMA },
    },
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
      if (body.stop_reason === 'refusal') throw new Error('anthropic: refused');
      if (body.stop_reason === 'max_tokens') throw new Error('anthropic: output truncated');
      const block = body.content?.find((b) => b.type === 'text' && typeof b.text === 'string');
      if (!block?.text) throw new Error('anthropic: no structured output');
      let result: unknown;
      try {
        result = JSON.parse(block.text);
      } catch {
        throw new Error('anthropic: output is not JSON');
      }

      const inputTokens = body.usage?.input_tokens;
      const outputTokens = body.usage?.output_tokens;
      return {
        result,
        ...(typeof inputTokens === 'number' && typeof outputTokens === 'number'
          ? { usage: { inputTokens, outputTokens } }
          : {}),
      };
    },
  };
}
