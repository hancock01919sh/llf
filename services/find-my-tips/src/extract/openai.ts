import { REPORT_INGREDIENTS_TOOL } from '@llf/contracts/find-tips';

import { systemPrompt } from './prompt';
import {
  ProviderNotConfiguredError,
  type ExtractionContext,
  type ExtractionInput,
  type ExtractionProvider,
  type ProviderOutput,
} from './types';

// OpenAI Chat Completions adapter (TDD §7.4, OPEN-1). Uses strict structured
// outputs with the report_ingredients schema, sends only the input and the
// system prompt, and never logs the input, the model output, or the response
// body.
//
// Reasoning tokens count against max_completion_tokens, so the cap leaves
// headroom above the ~1.5K tokens a full 60-item answer needs.
export const OPENAI_MAX_COMPLETION_TOKENS = 4000;

export interface OpenAIProviderOptions {
  apiKey?: string | undefined;
  baseUrl?: string;
  fetch?: typeof fetch;
}

interface ChatCompletionResponse {
  choices?: {
    finish_reason?: string;
    message?: { content?: string | null; refusal?: string | null };
  }[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    completion_tokens_details?: { reasoning_tokens?: number };
  };
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
      type: 'image_url',
      image_url: {
        url: `data:${input.mimeType};base64,${Buffer.from(input.bytes).toString('base64')}`,
      },
    },
    { type: 'text', text: 'Extract the ingredients shown in this image.' },
  ];
}

export function buildOpenAIRequest(input: ExtractionInput, ctx: Omit<ExtractionContext, 'signal'>) {
  return {
    model: ctx.model,
    max_completion_tokens: OPENAI_MAX_COMPLETION_TOKENS,
    ...(ctx.reasoningEffort ? { reasoning_effort: ctx.reasoningEffort } : {}),
    messages: [
      { role: 'system', content: systemPrompt(ctx.promptVersion) },
      { role: 'user', content: userContent(input) },
    ],
    // The contracts schema already meets strict mode (every property required,
    // additionalProperties false) and strict mode accepts maxItems, so it is
    // sent unchanged. The Render dev smoke test confirms this per model.
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: REPORT_INGREDIENTS_TOOL.name,
        description: REPORT_INGREDIENTS_TOOL.description,
        strict: true,
        schema: REPORT_INGREDIENTS_TOOL.inputSchema,
      },
    },
  };
}

export function createOpenAIProvider(options: OpenAIProviderOptions = {}): ExtractionProvider {
  const baseUrl = (options.baseUrl ?? 'https://api.openai.com').replace(/\/+$/, '');
  const doFetch = options.fetch ?? fetch;

  return {
    name: 'openai',
    async extract(input, ctx): Promise<ProviderOutput> {
      if (!options.apiKey) throw new ProviderNotConfiguredError('openai');

      const res = await doFetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${options.apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(buildOpenAIRequest(input, ctx)),
        signal: ctx.signal,
      });
      if (!res.ok) {
        await res.body?.cancel();
        throw new Error(`openai: HTTP ${res.status}`);
      }

      const body = (await res.json()) as ChatCompletionResponse;
      const choice = body.choices?.[0];
      if (choice?.message?.refusal) throw new Error('openai: refused');
      if (choice?.finish_reason === 'length') throw new Error('openai: output truncated');
      const content = choice?.message?.content;
      if (typeof content !== 'string') throw new Error('openai: no content');

      let result: unknown;
      try {
        result = JSON.parse(content);
      } catch {
        throw new Error('openai: content is not JSON');
      }

      const inputTokens = body.usage?.prompt_tokens;
      const outputTokens = body.usage?.completion_tokens;
      const reasoningTokens = body.usage?.completion_tokens_details?.reasoning_tokens;
      return {
        result,
        ...(typeof inputTokens === 'number' && typeof outputTokens === 'number'
          ? {
              usage: {
                inputTokens,
                outputTokens,
                ...(typeof reasoningTokens === 'number' ? { reasoningTokens } : {}),
              },
            }
          : {}),
      };
    },
  };
}
