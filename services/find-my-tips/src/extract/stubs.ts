import type { ExtractionProvider } from './types';
import { ProviderNotConfiguredError } from './types';

/**
 * Bedrock is the Phase B option (TDD §7.4, OPEN-1). Follow `anthropic.ts` or
 * `openai.ts`: send `REPORT_INGREDIENTS_TOOL` as a forced tool call or strict
 * JSON schema, pass `ctx.signal`, and return the raw result plus token usage.
 */
function stub(name: string): ExtractionProvider {
  return {
    name,
    async extract() {
      throw new ProviderNotConfiguredError(name);
    },
    async classifyGaps() {
      throw new ProviderNotConfiguredError(name);
    },
  };
}

export const createBedrockProvider = () => stub('bedrock');
