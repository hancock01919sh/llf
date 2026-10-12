import { REPORT_INGREDIENTS_TOOL } from '@llf/contracts/find-tips';

import { systemPrompt } from './prompt';
import {
  ProviderNotConfiguredError,
  type ExtractionContext,
  type ExtractionInput,
  type ExtractionProvider,
  type ProviderOutput,
  type ReasoningEffort,
} from './types';

// Google Gemini API adapter (TDD §7.4, §7.7). Dev and eval only, on ddd's own
// key, pending acceptance (TDD D25). Uses JSON mode with the report_ingredients
// schema, sends only the input and the system prompt, and never logs the input,
// the model output, or the response body.
//
// Thinking tokens count against maxOutputTokens, so the cap leaves headroom
// above the ~1.5K tokens a full 60-item answer needs.
export const GEMINI_MAX_OUTPUT_TOKENS = 4000;

// Gemini 2.5 takes a token budget rather than an effort level (thinkingLevel
// is Gemini 3+ only). 0 turns thinking off where the model allows it.
export const GEMINI_THINKING_BUDGETS: Record<ReasoningEffort, number> = {
  none: 0,
  minimal: 0,
  low: 1024,
  medium: 8192,
  high: 24576,
};

export interface GeminiProviderOptions {
  apiKey?: string | undefined;
  baseUrl?: string;
  fetch?: typeof fetch;
}

interface GenerateContentResponse {
  promptFeedback?: { blockReason?: string };
  candidates?: {
    finishReason?: string;
    content?: { parts?: { text?: string; thought?: boolean }[] };
  }[];
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    thoughtsTokenCount?: number;
  };
}

function userParts(input: ExtractionInput): unknown[] {
  if (input.kind === 'text') {
    return [
      {
        text: `Extract the ingredients from the text between the <input> tags.\n<input>\n${input.text}\n</input>`,
      },
    ];
  }
  return [
    {
      inlineData: {
        mimeType: input.mimeType,
        data: Buffer.from(input.bytes).toString('base64'),
      },
    },
    { text: 'Extract the ingredients shown in this image.' },
  ];
}

// Gemini rejects the schema as "too many states" with maxItems: 60 on the
// items array. The 60-item cap is still enforced by the Zod parse and the
// pipeline slice, so the schema sent to Gemini leaves it out.
const { maxItems: _maxItems, ...geminiItems } =
  REPORT_INGREDIENTS_TOOL.inputSchema.properties.items;
export const GEMINI_RESPONSE_SCHEMA = {
  ...REPORT_INGREDIENTS_TOOL.inputSchema,
  properties: { ...REPORT_INGREDIENTS_TOOL.inputSchema.properties, items: geminiItems },
};

export function buildGeminiRequest(input: ExtractionInput, ctx: Omit<ExtractionContext, 'signal'>) {
  return {
    systemInstruction: { parts: [{ text: systemPrompt(ctx.promptVersion) }] },
    contents: [{ role: 'user', parts: userParts(input) }],
    generationConfig: {
      responseMimeType: 'application/json',
      // responseJsonSchema takes standard JSON Schema (additionalProperties,
      // enum), so the contracts schema is sent minus maxItems. Google now
      // also documents generationConfig.responseFormat.text.schema; move to it
      // if responseJsonSchema is retired.
      responseJsonSchema: GEMINI_RESPONSE_SCHEMA,
      maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
      ...(ctx.reasoningEffort
        ? { thinkingConfig: { thinkingBudget: GEMINI_THINKING_BUDGETS[ctx.reasoningEffort] } }
        : {}),
    },
  };
}

export function createGeminiProvider(options: GeminiProviderOptions = {}): ExtractionProvider {
  const baseUrl = (options.baseUrl ?? 'https://generativelanguage.googleapis.com').replace(
    /\/+$/,
    '',
  );
  const doFetch = options.fetch ?? fetch;

  return {
    name: 'gemini',
    async extract(input, ctx): Promise<ProviderOutput> {
      if (!options.apiKey) throw new ProviderNotConfiguredError('gemini');

      const res = await doFetch(
        `${baseUrl}/v1beta/models/${encodeURIComponent(ctx.model)}:generateContent`,
        {
          method: 'POST',
          headers: {
            'x-goog-api-key': options.apiKey,
            'content-type': 'application/json',
          },
          body: JSON.stringify(buildGeminiRequest(input, ctx)),
          signal: ctx.signal,
        },
      );
      if (!res.ok) {
        await res.body?.cancel();
        throw new Error(`gemini: HTTP ${res.status}`);
      }

      const body = (await res.json()) as GenerateContentResponse;
      if (body.promptFeedback?.blockReason) throw new Error('gemini: blocked');
      const candidate = body.candidates?.[0];
      const finish = candidate?.finishReason;
      if (finish === 'MAX_TOKENS') throw new Error('gemini: output truncated');
      if (finish && finish !== 'STOP') throw new Error(`gemini: finish ${finish}`);

      const text = (candidate?.content?.parts ?? [])
        .filter((part) => !part.thought && typeof part.text === 'string')
        .map((part) => part.text)
        .join('');
      if (!text) throw new Error('gemini: no content');

      let result: unknown;
      try {
        result = JSON.parse(text);
      } catch {
        throw new Error('gemini: content is not JSON');
      }

      const inputTokens = body.usageMetadata?.promptTokenCount;
      const candidateTokens = body.usageMetadata?.candidatesTokenCount;
      const thoughtTokens = body.usageMetadata?.thoughtsTokenCount ?? 0;
      return {
        result,
        ...(typeof inputTokens === 'number' && typeof candidateTokens === 'number'
          ? {
              usage: {
                inputTokens,
                // Gemini bills thinking at the output rate but reports it apart.
                outputTokens: candidateTokens + thoughtTokens,
                ...(thoughtTokens > 0 ? { reasoningTokens: thoughtTokens } : {}),
              },
            }
          : {}),
      };
    },
  };
}
