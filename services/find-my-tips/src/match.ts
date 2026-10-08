import type { ExtractedItem, IngredientMatch } from '@llf/contracts/find-tips';
import type { Matcher, MatchTier } from '@llf/matching';

const TIER_RANK: Record<MatchTier, number> = { strong: 0, good: 1, weak: 2 };

export type MatchSummary = { matches: IngredientMatch[]; unmatchedCount: number };

/**
 * Maps extracted terms onto catalog ingredients (TDD §7.4).
 * Non-food items are dropped without counting. Unmatched food terms only
 * increase a count; their text never leaves the service. Duplicates keep the
 * best tier, and an ingredient is `inferred` only if every mention was.
 */
export function matchItems(items: readonly ExtractedItem[], matcher: Matcher): MatchSummary {
  const bySlug = new Map<string, { match: IngredientMatch; rank: number; order: number }>();
  let unmatchedCount = 0;

  for (const item of items) {
    if (!item.isFood) continue;
    const found = matcher.match(item.term);
    if (!found) {
      unmatchedCount += 1;
      continue;
    }
    const rank = TIER_RANK[found.tier];
    const existing = bySlug.get(found.slug);
    if (!existing) {
      bySlug.set(found.slug, {
        match: { slug: found.slug, title: found.title, inferred: item.inferred },
        rank,
        order: bySlug.size,
      });
      continue;
    }
    existing.match.inferred = existing.match.inferred && item.inferred;
    existing.rank = Math.min(existing.rank, rank);
  }

  const matches = [...bySlug.values()]
    .sort((a, b) => a.rank - b.rank || a.order - b.order)
    .map((entry) => entry.match);
  return { matches, unmatchedCount };
}
