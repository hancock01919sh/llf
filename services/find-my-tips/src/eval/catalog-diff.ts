import { Catalog, toSlug } from '@llf/contracts/catalog';
import { createMatcher } from '@llf/matching';
import { z } from 'zod';

import type { LabeledSet } from './labeled-set';

/**
 * Carries the eval vocabulary over to the real CMS catalog (OPEN-8/13/30).
 * The eval catalog's slugs, titles and synonyms were tuned against model output
 * across three arena rounds; the CMS names ingredients its own way. This maps
 * every eval ingredient onto a CMS slug through the production matcher and
 * lists what the CMS would need to match the same terms.
 */

/** A CMS ingredient as exported: seed fixture, Strapi REST `data`, or catalog shape. */
const ExportedIngredient = z.object({
  slug: z.string().optional(),
  title: z.string().min(1),
  synonyms: z.union([z.string(), z.array(z.string())]).nullish(),
});

/**
 * Reads a CMS export in any of the shapes we have: the published catalog
 * (`{catalogVersion, ingredients}`), a seed fixture or a Strapi REST response
 * (`{data: [{title, synonyms}]}`, synonyms as one comma-separated string or an
 * array). Slugs come from `toSlug(title)` like the site's (TDD §5.3).
 */
export function catalogFromExport(data: unknown, version = 'cms'): Catalog {
  const parsed = Catalog.safeParse(data);
  if (parsed.success) return parsed.data;
  const wrapper = z.object({ data: z.array(ExportedIngredient) }).safeParse(data);
  if (!wrapper.success) {
    throw new Error(
      'unrecognized catalog export: expected {catalogVersion, ingredients} or {data: [{title, synonyms}]}',
    );
  }
  const ingredients = wrapper.data.data.map((item) => {
    const raw = item.synonyms ?? [];
    const list = typeof raw === 'string' ? raw.split(',') : raw;
    return {
      slug: item.slug ?? toSlug(item.title),
      title: item.title,
      synonyms: [...new Set(list.map((s) => s.trim()).filter(Boolean))],
    };
  });
  return Catalog.parse({ catalogVersion: version, ingredients });
}

export type TermOutcome = { term: string; cmsSlug: string | null };

export type IngredientDiff = {
  evalSlug: string;
  title: string;
  /** The CMS slug this ingredient's labels move to; null if the CMS has no counterpart. */
  cmsSlug: string | null;
  /** How `cmsSlug` was chosen: the eval title matched it, or most of the synonyms did. */
  via: 'title' | 'synonyms' | null;
  /** Eval terms the CMS doesn't match at all: synonyms to add to `cmsSlug`. */
  missing: string[];
  /** Eval terms the CMS matches to a different ingredient (the CMS splits what eval lumps). */
  elsewhere: TermOutcome[];
};

export type CatalogDiff = {
  evalVersion: string;
  cmsVersion: string;
  ingredients: IngredientDiff[];
  /** eval slug -> CMS slug, for relabeling sets. */
  mapping: Record<string, string | null>;
  /** CMS slugs no eval ingredient maps to (untested by the eval sets). */
  cmsOnly: string[];
};

export function diffCatalogs(evalCatalog: Catalog, cms: Catalog): CatalogDiff {
  const matcher = createMatcher(cms.ingredients);
  const ingredients: IngredientDiff[] = evalCatalog.ingredients.map((item) => {
    const match = (term: string): TermOutcome => ({
      term,
      cmsSlug: matcher.match(term)?.slug ?? null,
    });
    const title = match(item.title);
    const synonyms = item.synonyms.map(match);
    let cmsSlug = title.cmsSlug;
    let via: IngredientDiff['via'] = cmsSlug ? 'title' : null;
    if (!cmsSlug) {
      const counts = new Map<string, number>();
      for (const s of synonyms) {
        if (s.cmsSlug) counts.set(s.cmsSlug, (counts.get(s.cmsSlug) ?? 0) + 1);
      }
      const best = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
      if (best) {
        cmsSlug = best[0];
        via = 'synonyms';
      }
    }
    const all = [title, ...synonyms];
    return {
      evalSlug: item.slug,
      title: item.title,
      cmsSlug,
      via,
      missing: all.filter((t) => t.cmsSlug === null).map((t) => t.term),
      elsewhere: cmsSlug ? all.filter((t) => t.cmsSlug !== null && t.cmsSlug !== cmsSlug) : [],
    };
  });
  const mapping = Object.fromEntries(ingredients.map((d) => [d.evalSlug, d.cmsSlug]));
  const used = new Set(
    ingredients.flatMap((d) => [d.cmsSlug, ...d.elsewhere.map((t) => t.cmsSlug)]),
  );
  return {
    evalVersion: evalCatalog.catalogVersion,
    cmsVersion: cms.catalogVersion,
    ingredients,
    mapping,
    cmsOnly: cms.ingredients.map((i) => i.slug).filter((slug) => !used.has(slug)),
  };
}

export type RelabelNote = { caseId: string; dropped: string[]; split: string[] };

/**
 * Rewrites a labeled set's slugs onto the CMS. Slugs with no CMS counterpart are
 * dropped (and listed). Slugs whose eval terms the CMS splits across several
 * ingredients are kept on the main CMS slug and flagged: a person should check
 * those cases (for example a chickpea dish labeled `beans`).
 */
export function relabelSet(
  set: LabeledSet,
  diff: CatalogDiff,
): { set: LabeledSet; notes: RelabelNote[] } {
  const split = new Set(
    diff.ingredients.filter((d) => d.elsewhere.length > 0).map((d) => d.evalSlug),
  );
  const notes: RelabelNote[] = [];
  const cases = set.cases.map((item) => {
    const dropped: string[] = [];
    const flagged: string[] = [];
    const remap = (slugs: string[]): string[] => {
      const out: string[] = [];
      for (const slug of slugs) {
        const to = diff.mapping[slug];
        if (to === undefined || to === null) {
          dropped.push(slug);
          continue;
        }
        if (split.has(slug)) flagged.push(slug);
        if (!out.includes(to)) out.push(to);
      }
      return out;
    };
    const expectedSlugs = remap(item.expectedSlugs);
    const acceptableSlugs = remap(item.acceptableSlugs).filter((s) => !expectedSlugs.includes(s));
    const next = { ...item, expectedSlugs, acceptableSlugs };
    if (item.injectedSlugs !== undefined) {
      next.injectedSlugs = remap(item.injectedSlugs).filter(
        (s) => !expectedSlugs.includes(s) && !acceptableSlugs.includes(s),
      );
    }
    if (dropped.length > 0 || flagged.length > 0) {
      notes.push({ caseId: item.id, dropped: [...new Set(dropped)], split: [...new Set(flagged)] });
    }
    return next;
  });
  return {
    set: { ...set, version: `${set.version}-${diff.cmsVersion}`, cases },
    notes,
  };
}

export function renderCatalogDiff(diff: CatalogDiff): string {
  const mapped = diff.ingredients.filter((d) => d.cmsSlug !== null);
  const renamed = mapped.filter((d) => d.cmsSlug !== d.evalSlug);
  const unmapped = diff.ingredients.filter((d) => d.cmsSlug === null);
  const missing = diff.ingredients.filter((d) => d.cmsSlug !== null && d.missing.length > 0);
  const split = diff.ingredients.filter((d) => d.elsewhere.length > 0);
  const termCount = diff.ingredients.reduce((n, d) => n + d.missing.length, 0);
  const lines = [
    `# Catalog carry-over: eval ${diff.evalVersion} → CMS ${diff.cmsVersion}`,
    '',
    `- ${mapped.length}/${diff.ingredients.length} eval ingredients map to a CMS ingredient (${renamed.length} under a different slug).`,
    `- ${unmapped.length} have no CMS counterpart: their labels drop out of a relabeled set.`,
    `- ${termCount} eval terms don't match anything in the CMS: add them as synonyms.`,
    `- ${split.length} eval ingredients are split across several CMS ingredients: check the flagged cases.`,
    `- ${diff.cmsOnly.length} CMS ingredients aren't covered by any eval term.`,
    '',
  ];
  if (unmapped.length > 0) {
    lines.push('## No CMS counterpart', '', '| Eval slug | Terms |', '|---|---|');
    for (const d of unmapped) lines.push(`| \`${d.evalSlug}\` | ${d.missing.join(', ')} |`);
    lines.push('');
  }
  if (missing.length > 0) {
    lines.push(
      '## Synonyms to add',
      '',
      '| CMS ingredient | Eval slug | Add as synonyms |',
      '|---|---|---|',
    );
    for (const d of missing)
      lines.push(`| \`${d.cmsSlug}\` | \`${d.evalSlug}\` | ${d.missing.join(', ')} |`);
    lines.push('');
  }
  if (split.length > 0) {
    lines.push(
      '## Split by the CMS',
      '',
      '| Eval slug | Main CMS slug | Terms that go elsewhere |',
      '|---|---|---|',
    );
    for (const d of split) {
      lines.push(
        `| \`${d.evalSlug}\` | \`${d.cmsSlug}\` | ${d.elsewhere.map((t) => `${t.term} → \`${t.cmsSlug}\``).join(', ')} |`,
      );
    }
    lines.push('');
  }
  if (renamed.length > 0) {
    lines.push('## Slug changes', '', '| Eval slug | CMS slug | Via |', '|---|---|---|');
    for (const d of renamed) lines.push(`| \`${d.evalSlug}\` | \`${d.cmsSlug}\` | ${d.via} |`);
    lines.push('');
  }
  if (diff.cmsOnly.length > 0) {
    lines.push(
      '## CMS ingredients without eval coverage',
      '',
      diff.cmsOnly.map((s) => `\`${s}\``).join(', '),
      '',
    );
  }
  return lines.join('\n');
}
