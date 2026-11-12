import { GapResult, type GapClassification, type GapTerm } from '@llf/contracts/find-tips';

import { ToolError } from './http';
import type { ExtractionProvider, GapClassificationContext } from './extract/types';

export const GAP_PROMPT_VERSION = 'gap-v1';
export const GAP_CLASSIFICATION_TIMEOUT_MS = 3_000;

const DENYLIST = new Set([
  'aaliyah', 'aaron', 'alice', 'amelia', 'andrew', 'anna', 'anthony', 'ava', 'barbara',
  'ben', 'benjamin', 'bob', 'brenda', 'brian', 'charlie', 'chris', 'christopher', 'daniel',
  'david', 'donald', 'elizabeth', 'emily', 'emma', 'ethan', 'evelyn', 'frank', 'george',
  'grace', 'hannah', 'henry', 'isabella', 'jack', 'james', 'jennifer', 'jessica', 'john',
  'joseph', 'judy', 'karen', 'katherine', 'kevin', 'kim', 'laura', 'linda', 'lisa', 'maria',
  'mary', 'matthew', 'max', 'michael', 'michelle', 'nancy', 'nicholas', 'olivia', 'patricia',
  'paul', 'richard', 'robert', 'sarah', 'susan', 'thomas', 'william',
  'aunt', 'brother', 'dad', 'daddy', 'daughter', 'family', 'father', 'grandma', 'grandmother',
  'grandpa', 'grandfather', 'husband', 'mom', 'mommy', 'mother', 'mum', 'sister', 'son', 'wife',
  'person', 'people', 'address', 'email', 'phone', 'number',
  'cat', 'dog', 'bird', 'bunny', 'hamster', 'pet', 'puppy', 'kitten', 'rabbit', 'parrot',
  'animal', 'horse', 'fish', 'turtle',
  'medicine', 'medication', 'prescription', 'pharmacy', 'pill', 'pills', 'tablet', 'capsule',
  'insulin', 'antibiotic', 'tylenol', 'advil', 'ibuprofen', 'aspirin', 'acetaminophen',
  'costco', 'walmart', 'target', 'kroger', 'kirkland', 'amazon', 'aldi', 'brand',
  'kraft', 'oreo', 'pepsi', 'coke', 'coca', 'cola', 'nestle', 'kelloggs', 'tyson',
  'ignore', 'previous', 'instruction', 'instructions', 'prompt', 'system', 'assistant',
]);

const DENYLIST_PHRASES = [
  'credit card', 'debit card', 'phone number', 'social security', 'account number',
  'whole foods', 'trader joes',
];

export type GapClassifier = Pick<ExtractionProvider, 'classifyGaps'>;

export async function classifyGapTerms(
  terms: readonly string[],
  context: Omit<GapClassificationContext, 'signal'> & {
    provider: GapClassifier;
    signal?: AbortSignal;
  },
): Promise<GapResult> {
  if (terms.length === 0 || !context.provider.classifyGaps) return { items: [] };
  const timeout = AbortSignal.timeout(GAP_CLASSIFICATION_TIMEOUT_MS);
  const signal = context.signal ? AbortSignal.any([timeout, context.signal]) : timeout;
  try {
    const output = await Promise.race([
      context.provider.classifyGaps(terms.slice(0, 60), {
        model: context.model,
        promptVersion: context.promptVersion,
        signal,
      }),
      new Promise<never>((_, reject) => {
        if (signal.aborted) reject(new ToolError('timeout'));
        else signal.addEventListener('abort', () => reject(new ToolError('timeout')), { once: true });
      }),
    ]);
    if (timeout.aborted) throw new ToolError('timeout');
    const parsed = GapResult.safeParse(output.result);
    if (!parsed.success || parsed.data.items.length !== terms.slice(0, 60).length) {
      throw new ToolError('upstream_error');
    }
    return parsed.data;
  } catch (error) {
    if (error instanceof ToolError) throw error;
    throw new ToolError(timeout.aborted ? 'timeout' : 'upstream_error', {}, { cause: error });
  }
}

function hitsDenylist(name: string): boolean {
  const normalized = name.toLowerCase();
  const words = normalized.split(/[ -]+/);
  return (
    words.some((word) => DENYLIST.has(word)) ||
    DENYLIST_PHRASES.some((phrase) => normalized.includes(phrase))
  );
}

export function filterGapTerms(
  result: GapResult | readonly GapClassification[],
  isCatalogMatch: (name: string) => boolean,
  sourceTerms: readonly string[] = [],
): GapTerm[] {
  const items: readonly GapClassification[] = 'items' in result ? result.items : result;
  const seen = new Set<string>();
  const kept: GapTerm[] = [];

  for (const [index, item] of items.entries()) {
    const name = item.name.trim();
    const sourceTerm = sourceTerms[index] ?? '';
    if (
      item.class === 'exclude' ||
      hasSensitiveSource(sourceTerm) ||
      !name ||
      /[0-9@/.:]/.test(name) ||
      name.length > 32 ||
      name.split(/\s+/).length > 3 ||
      !/^[a-z -]+$/.test(name) ||
      hitsDenylist(name) ||
      isCatalogMatch(name)
    ) {
      continue;
    }
    const key = name.toLowerCase().replace(/\s+/g, ' ');
    if (seen.has(key)) continue;
    seen.add(key);
    kept.push({ name, class: item.class });
    if (kept.length === 20) break;
  }
  return kept;
}

function hasSensitiveSource(term: string): boolean {
  const normalized = term.toLowerCase();
  const digits = normalized.replace(/\D/g, '');
  return (
    digits.length >= 7 ||
    /\b(?:my name is|address|email|phone|card|account|social security|prescription|medicine|medication)\b/.test(
      normalized,
    ) ||
    hitsDenylist(normalized)
  );
}