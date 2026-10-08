import type { ExtractionProvider } from './types';
import { ProviderNotConfiguredError } from './types';

/**
 * Live adapters land with BD3244-33 (Anthropic, ddd dev key) and the TBWA
 * OpenAI test key. Bedrock is the Phase B option (TDD §7.4, OPEN-9).
 * Each must send `REPORT_INGREDIENTS_TOOL` as a forced tool call, pass
 * `ctx.signal` to the SDK, and return the raw tool input plus token usage.
 */
function stub(name: string): ExtractionProvider {
  return {
    name,
    async extract() {
      throw new ProviderNotConfiguredError(name);
    },
  };
}

export const createAnthropicProvider = () => stub('anthropic');
export const createOpenAIProvider = () => stub('openai');
export const createBedrockProvider = () => stub('bedrock');
