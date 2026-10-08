import type { ExtractionProvider } from './types';
import { ProviderNotConfiguredError } from './types';

/**
 * OpenAI lands with the TBWA test key; Bedrock is the Phase B option
 * (TDD §7.4, OPEN-1). Follow `anthropic.ts`: send `REPORT_INGREDIENTS_TOOL`
 * as a forced tool call, pass `ctx.signal`, and return the raw tool input
 * plus token usage.
 */
function stub(name: string): ExtractionProvider {
  return {
    name,
    async extract() {
      throw new ProviderNotConfiguredError(name);
    },
  };
}

export const createOpenAIProvider = () => stub('openai');
export const createBedrockProvider = () => stub('bedrock');
