import type { IMAGE_MIME_TYPES } from '@llf/contracts/find-tips';

export type ExtractionInput =
  | { kind: 'text'; text: string }
  | { kind: 'image'; bytes: Uint8Array; mimeType: (typeof IMAGE_MIME_TYPES)[number] };

export type ExtractionContext = {
  signal: AbortSignal;
  model: string;
  promptVersion: string;
};

export type ExtractionUsage = { inputTokens: number; outputTokens: number };

/** Raw adapter output. `result` is untrusted until `extractIngredients` parses it. */
export type ProviderOutput = { result: unknown; usage?: ExtractionUsage };

/**
 * One adapter per provider (TDD §7.4). Chosen by `AI_PROVIDER`, never by code
 * changes. Adapters must use the provider's forced tool / strict JSON-schema
 * mode with `REPORT_INGREDIENTS_TOOL` and must not log the input.
 */
export interface ExtractionProvider {
  readonly name: string;
  extract(input: ExtractionInput, ctx: ExtractionContext): Promise<ProviderOutput>;
}

export class ProviderNotConfiguredError extends Error {
  constructor(provider: string) {
    super(`AI provider "${provider}" is not configured`);
    this.name = 'ProviderNotConfiguredError';
  }
}
