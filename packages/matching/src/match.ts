import type { CatalogIngredient } from '@llf/contracts';
import { osaDistance } from './distance';
import { normalize, tokens } from './normalize';

/** Internal only: for tests and tuning, never shown to users (TDD §7.5). */
export type MatchTier = 'strong' | 'good' | 'weak';

export interface Match {
  slug: string;
  title: string;
  tier: MatchTier;
}

export interface MatcherOptions {
  /** Bounded fuzzy matching. Turn off if QA finds false positives. Default true. */
  weak?: boolean;
}

/** Preparation and size words ignored when looking for the head noun. */
const DESCRIPTORS = new Set([
  'baby',
  'boneless',
  'chilled',
  'chopped',
  'cold',
  'cooked',
  'crushed',
  'cubed',
  'diced',
  'extra',
  'fine',
  'finely',
  'firm',
  'fresh',
  'freshly',
  'frozen',
  'grated',
  'ground',
  'halved',
  'jumbo',
  'large',
  'lean',
  'leftover',
  'lightly',
  'low',
  'medium',
  'melted',
  'minced',
  'natural',
  'organic',
  'packed',
  'peeled',
  'plain',
  'raw',
  'ripe',
  'roasted',
  'rough',
  'roughly',
  'shredded',
  'skinless',
  'sliced',
  'small',
  'softened',
  'thin',
  'thinly',
  'torn',
  'trimmed',
  'unsalted',
  'warm',
  'whole',
]);

interface Name {
  ingredient: CatalogIngredient;
  name: string;
  tokens: string[];
}

export interface Matcher {
  match(term: string): Match | null;
}

export function createMatcher(
  catalog: readonly CatalogIngredient[],
  options: MatcherOptions = {},
): Matcher {
  const weak = options.weak ?? true;
  const byName = new Map<string, CatalogIngredient>();
  const names: Name[] = [];

  for (const ingredient of catalog) {
    const variants = [ingredient.title, ingredient.plural, ...ingredient.synonyms];
    for (const variant of variants) {
      if (!variant) continue;
      const name = normalize(variant);
      if (!name || byName.has(name)) continue;
      byName.set(name, ingredient);
      names.push({ ingredient, name, tokens: tokens(name) });
    }
  }

  const result = (ingredient: CatalogIngredient, tier: MatchTier): Match => ({
    slug: ingredient.slug,
    title: ingredient.title,
    tier,
  });

  return {
    match(term) {
      const normalized = normalize(term);
      if (!normalized) return null;

      const exact = byName.get(normalized);
      if (exact) return result(exact, 'strong');

      const all = tokens(normalized);
      const core = all.filter((t) => !DESCRIPTORS.has(t));
      if (core.length === 0) return null;
      const coreName = core.join(' ');

      // Token set: every token of the catalog name appears in the term; the longest name wins.
      // A one-word name must be the term's head noun, so "chicken stock" doesn't match "chicken".
      const head = core[core.length - 1];
      const termSet = new Set(all);
      let best: Name | undefined;
      for (const candidate of names) {
        if (!candidate.tokens.every((t) => termSet.has(t))) continue;
        if (candidate.tokens.length === 1 && candidate.tokens[0] !== head) continue;
        if (!best || candidate.tokens.length > best.tokens.length) best = candidate;
      }
      if (best) return result(best.ingredient, 'good');

      if (weak && coreName.length >= 5) {
        for (const candidate of names) {
          if (candidate.name.length < 5) continue;
          if (osaDistance(coreName, candidate.name, 1) <= 1) {
            return result(candidate.ingredient, 'weak');
          }
        }
      }
      return null;
    },
  };
}

const TIER_RANK: Record<MatchTier, number> = { strong: 0, good: 1, weak: 2 };

/** Matches each term, removes duplicates by slug (keeping the best tier), and counts misses. */
export function matchTerms(
  matcher: Matcher,
  terms: readonly string[],
): { matches: Match[]; unmatchedCount: number } {
  const bySlug = new Map<string, Match>();
  let unmatchedCount = 0;
  for (const term of terms) {
    const found = matcher.match(term);
    if (!found) {
      unmatchedCount++;
      continue;
    }
    const existing = bySlug.get(found.slug);
    if (!existing || TIER_RANK[found.tier] < TIER_RANK[existing.tier])
      bySlug.set(found.slug, found);
  }
  return { matches: [...bySlug.values()], unmatchedCount };
}
