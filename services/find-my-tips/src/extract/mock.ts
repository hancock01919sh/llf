import { EXTRACTION_MAX_ITEMS } from '@llf/contracts/find-tips';
import type { ExtractionResult } from '@llf/contracts/find-tips';

import type { ExtractionInput, ExtractionProvider, ProviderOutput } from './types';

/** Deterministic stand-in for a fridge photo, used by local dev, CI, and e2e. */
export const MOCK_IMAGE_RESULT: ExtractionResult = {
  readable: true,
  detectedType: 'fridge_photo',
  items: [
    { term: 'milk', isFood: true, inferred: false },
    { term: 'spinach', isFood: true, inferred: false },
    { term: 'bananas', isFood: true, inferred: false },
    { term: 'leftover pad thai', isFood: true, inferred: false },
  ],
};

function fromText(text: string): ExtractionResult {
  const items = text
    .split(/[\n,;]+/)
    .map((part) => part.replace(/^[\s\-*•\d.)]+/, '').trim())
    .filter((part) => part.length > 0 && part.length <= 200)
    .slice(0, EXTRACTION_MAX_ITEMS)
    .map((term) => ({ term, isFood: true, inferred: false }));
  return { readable: items.length > 0, detectedType: 'shopping_list', items };
}

/**
 * `AI_PROVIDER=mock` (the default). No network calls. Text is split on
 * newlines, commas, and semicolons; images return a fixed fridge photo.
 */
export function createMockProvider(): ExtractionProvider {
  return {
    name: 'mock',
    async extract(input: ExtractionInput, ctx): Promise<ProviderOutput> {
      if (ctx.signal.aborted) throw ctx.signal.reason;
      const result = input.kind === 'text' ? fromText(input.text) : MOCK_IMAGE_RESULT;
      return { result, usage: { inputTokens: 0, outputTokens: 0 } };
    },
    async classifyGaps(terms, ctx): Promise<ProviderOutput> {
      if (ctx.signal.aborted) throw ctx.signal.reason;
      const edible = new Set([
        'dragonfruit',
        'jackfruit',
        'quinoa',
        'tahini',
        'milk',
        'leftover pad thai',
      ]);
      const compostable = new Set(['eggshell', 'eggshells', 'coffee grounds', 'orange peel']);
      const inedible = new Set(['foil', 'plastic wrap', 'glass jar', 'paper bag']);
      return {
        result: {
          items: terms.map((term) => {
            const name = term.trim().toLowerCase();
            const itemClass = edible.has(name)
              ? 'edible'
              : compostable.has(name)
                ? 'compostable'
                : inedible.has(name)
                  ? 'inedible'
                  : 'exclude';
            return { name, class: itemClass };
          }),
        },
        usage: { inputTokens: 0, outputTokens: 0 },
      };
    },
  };
}
