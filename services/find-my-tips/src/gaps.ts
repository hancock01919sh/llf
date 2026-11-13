import { GapResult, type GapClassification, type GapTerm } from '@llf/contracts/find-tips';

import { ToolError } from './http';
import type { ExtractionProvider, GapClassificationContext } from './extract/types';
import { DENYLIST_PHRASES, DENYLIST_WORDS } from './gaps-denylist';

export const GAP_PROMPT_VERSION = 'gap-v1';
export const GAP_CLASSIFICATION_TIMEOUT_MS = 3_000;

const DENYLIST = new Set(DENYLIST_WORDS);

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
        else
          signal.addEventListener('abort', () => reject(new ToolError('timeout')), { once: true });
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

/** Possessives and apostrophes must not hide a denylisted word ("mom's", "trader joe's"). */
function denylistForms(name: string): { words: string[]; text: string } {
  const lower = name.toLowerCase();
  return {
    words: lower
      .replace(/['’]s\b/g, '')
      .split(/[^a-z]+/)
      .filter(Boolean),
    text: lower.replace(/['’]/g, ''),
  };
}

function hitsDenylist(name: string): boolean {
  const { words, text } = denylistForms(name);
  return (
    words.some((word) => DENYLIST.has(word)) ||
    text.split(/[^a-z]+/).some((word) => DENYLIST.has(word)) ||
    DENYLIST_PHRASES.some((phrase) => text.includes(phrase))
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

/**
 * A capitalized, mixed-case word in the extractor's term is a name, brand, or
 * store ("Priya", "Kirkland milk"). Deliberately conservative: a missed gap only
 * costs one analytics row, a leaked name cannot be undone.
 */
const PROPER_NOUN = /\p{Lu}\p{Ll}/u;

function hasSensitiveSource(term: string): boolean {
  const normalized = term.toLowerCase();
  const digits = normalized.replace(/\D/g, '');
  return (
    digits.length >= 7 ||
    PROPER_NOUN.test(term) ||
    /\b(?:my name is|address|email|phone|card|account|social security|prescription|medicine|medication)\b/.test(
      normalized,
    ) ||
    hitsDenylist(term)
  );
}
