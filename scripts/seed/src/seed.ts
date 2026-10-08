import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import { cms, seed as contract, toSlug } from '@llf/contracts';
import type { StrapiClient } from './strapi';

type Seed = contract.Seed;
type SeedBlock = contract.SeedBlock;
type SeedCta = z.infer<typeof contract.SeedCta>;
type SeedTitle = z.infer<typeof contract.SeedTitle>;

export type Log = (line: string) => void;

export class SeedValidationError extends Error {
  constructor(readonly issues: contract.SeedIssue[]) {
    super(
      `Seed fixtures are invalid:\n${issues.map((issue) => `  ${issue.path}: ${issue.message}`).join('\n')}`,
    );
    this.name = 'SeedValidationError';
  }
}

/** Reads `<dir>/<section>.json` for every section, parses each with its schema, then checks cross-references. */
export async function loadSeed(dir: string): Promise<Seed> {
  const sections: Record<string, unknown> = {};
  const issues: contract.SeedIssue[] = [];
  for (const section of contract.SEED_SECTIONS) {
    const file = join(dir, `${section}.json`);
    const raw: unknown = JSON.parse(await readFile(file, 'utf8'));
    const parsed = contract.seedFile(contract.Seed.shape[section]).safeParse(raw);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        issues.push({
          path: [`${section}.json`, ...issue.path.map(String)].join('.'),
          message: issue.message,
        });
      }
      continue;
    }
    sections[section] = parsed.data.data;
  }
  if (issues.length > 0) throw new SeedValidationError(issues);
  const seed = contract.Seed.parse(sections);
  const crossIssues = contract.validateSeed(seed);
  if (crossIssues.length > 0) throw new SeedValidationError(crossIssues);
  return seed;
}

export interface SeedCount {
  created: number;
  updated: number;
}

export type SeedReport = Record<string, SeedCount>;

export interface RunSeedOptions {
  client: StrapiClient;
  seed: Seed;
  dryRun?: boolean;
  log?: Log;
}

const TAXONOMY_PLURALS = {
  tip_types: 'tip-types',
  tip_behaviors: 'tip-behaviors',
  tip_motivators: 'tip-motivators',
} as const;

type IdMap = Map<string, string>;

function lookup(map: IdMap, key: string, what: string): string {
  const id = map.get(key);
  if (id === undefined)
    throw new Error(`Missing ${what} "${key}" (validateSeed should have caught this)`);
  return id;
}

/**
 * Upserts every fixture into Strapi in dependency order and publishes it.
 * Documents are matched by natural key (title, slug or path), so reruns update instead of duplicating.
 */
export async function runSeed({
  client,
  seed,
  dryRun = false,
  log = () => {},
}: RunSeedOptions): Promise<SeedReport> {
  const report: SeedReport = {};
  let fakeId = 0;

  async function upsert(
    plural: string,
    field: string,
    value: string,
    data: Record<string, unknown>,
  ): Promise<string> {
    const count = (report[plural] ??= { created: 0, updated: 0 });
    const existing = await client.find(plural, field, value);
    if (existing) {
      count.updated += 1;
      if (!dryRun) await client.update(plural, existing.documentId, data);
      log(`${dryRun ? 'would update' : 'updated'} ${plural} ${JSON.stringify(value)}`);
      return existing.documentId;
    }
    count.created += 1;
    log(`${dryRun ? 'would create' : 'created'} ${plural} ${JSON.stringify(value)}`);
    if (dryRun) return `dry-run-${(fakeId += 1)}`;
    return (await client.create(plural, data)).documentId;
  }

  const taxonomyIds = {} as Record<keyof typeof TAXONOMY_PLURALS, IdMap>;
  for (const [key, plural] of Object.entries(TAXONOMY_PLURALS) as [
    keyof typeof TAXONOMY_PLURALS,
    string,
  ][]) {
    const ids: IdMap = new Map();
    for (const term of seed.taxonomies[key]) {
      ids.set(term.title, await upsert(plural, 'title', term.title, { title: term.title }));
    }
    taxonomyIds[key] = ids;
  }

  const ingredientIds: IdMap = new Map();
  for (const ingredient of seed.ingredients) {
    const slug = toSlug(ingredient.title);
    const data = {
      title: ingredient.title,
      type: ingredient.type ?? null,
      synonyms: ingredient.synonyms.join(', '),
      wasted: ingredient.wasted,
    };
    ingredientIds.set(slug, await upsert('ingredients', 'title', ingredient.title, data));
  }

  const tipIds: IdMap = new Map();
  const taxonomy = (key: keyof typeof TAXONOMY_PLURALS, title: string | undefined) =>
    title === undefined ? { set: [] } : { set: [lookup(taxonomyIds[key], title, key)] };
  for (const tip of seed.tips) {
    const data = {
      title: tip.title,
      description: tip.description ?? null,
      tip_type: taxonomy('tip_types', tip.type),
      tip_behavior: taxonomy('tip_behaviors', tip.behavior),
      tip_motivator: taxonomy('tip_motivators', tip.motivator),
      ingredient:
        tip.ingredient === undefined
          ? { set: [] }
          : { set: [lookup(ingredientIds, tip.ingredient, 'ingredient')] },
    };
    tipIds.set(tip.title, await upsert('tips', 'title', tip.title, data));
  }

  const groupIds: IdMap = new Map();
  for (const group of seed.groups) {
    groupIds.set(group.title, await upsert('groups', 'title', group.title, { ...group }));
  }

  const categoryIds: IdMap = new Map();
  for (const category of seed.categories) {
    const data = {
      title: category.title,
      slug: category.slug,
      description: category.description ?? null,
      mode: category.mode,
      group:
        category.group === undefined
          ? { set: [] }
          : { set: [lookup(groupIds, category.group, 'group')] },
      ingredients: {
        set: category.ingredients.map((slug) => lookup(ingredientIds, slug, 'ingredient')),
      },
      tips: { set: category.tips.map((title) => lookup(tipIds, title, 'tip')) },
      seo: category.seo ?? null,
    };
    categoryIds.set(category.slug, await upsert('categories', 'slug', category.slug, data));
  }

  // Pages link to each other (CTAs, link lists), so create them all bare first, then write `main`.
  const pageIds: IdMap = new Map();
  for (const page of seed.pages) {
    const data = { title: page.title, path: page.path, seo: page.seo ?? null };
    pageIds.set(contract.pathKey(page.path), await upsert('pages', 'path', page.path, data));
  }
  const ids = { pageIds, categoryIds, tipIds };
  for (const page of seed.pages) {
    const documentId = lookup(pageIds, contract.pathKey(page.path), 'page');
    const main = page.main.map((block) => toBlock(block, ids));
    if (!dryRun) await client.update('pages', documentId, { main });
    log(
      `${dryRun ? 'would write' : 'wrote'} pages ${JSON.stringify(page.path)} main (${main.length} blocks)`,
    );
  }

  return report;
}

interface BlockIds {
  pageIds: IdMap;
  categoryIds: IdMap;
  tipIds: IdMap;
}

function toTitle(title: SeedTitle | undefined) {
  return title === undefined ? null : { copy: title.copy, header: title.header };
}

function toCta(cta: SeedCta, { pageIds }: BlockIds) {
  if (cta.page !== undefined) {
    return {
      label: cta.label,
      page: { set: [lookup(pageIds, contract.pathKey(cta.page), 'page')] },
    };
  }
  return { label: cta.label, href: cta.href ?? null };
}

function toBlock(block: SeedBlock, ids: BlockIds): Record<string, unknown> {
  switch (block.__component) {
    case 'component.hero':
      return {
        ...block,
        eyebrow: block.eyebrow ?? null,
        description: contract.toBlocks(block.description),
        ctas: block.ctas.map((cta) => toCta(cta, ids)),
      };
    case 'component.teaser':
      return {
        ...block,
        title: toTitle(block.title),
        description: contract.toBlocks(block.description),
        ctas: block.ctas.map((cta) => toCta(cta, ids)),
      };
    case 'component.link-list':
      return {
        ...block,
        title: toTitle(block.title),
        description: contract.toBlocks(block.description),
        pages: {
          set: block.pages.map((path) => lookup(ids.pageIds, contract.pathKey(path), 'page')),
        },
      };
    case 'component.carousel':
      return {
        ...block,
        title: toTitle(block.title),
        description: block.description ?? null,
        categories: {
          set: block.categories.map((slug) => lookup(ids.categoryIds, slug, 'category')),
        },
        ctas: block.ctas.map((cta) => toCta(cta, ids)),
      };
    case 'custom.tip-list':
      return {
        ...block,
        title: toTitle(block.title),
        description: block.description ?? null,
        tips: { set: block.tips.map((title) => lookup(ids.tipIds, title, 'tip')) },
      };
    case 'custom.search':
    case 'custom.tool':
      return { ...block };
  }
}

// Same populate tree as apps/web/lib/cms.ts, so verification reads exactly what the site reads.
type Populate = { [key: string]: true | Populate };
const ctas = { populate: { page: true } } satisfies Populate;
const tipFields = {
  tip_type: true,
  tip_behavior: true,
  tip_motivator: true,
  ingredient: true,
} satisfies Populate;
const tipRelations = { populate: tipFields } satisfies Populate;
export const POPULATE = {
  pages: {
    main: {
      on: {
        'component.hero': { populate: { ctas, images: true } },
        'component.teaser': { populate: { title: true, ctas, images: true } },
        'component.link-list': { populate: { title: true, pages: true } },
        'component.carousel': {
          populate: { title: true, ctas, categories: { populate: { image: true } } },
        },
        'custom.tip-list': { populate: { title: true, tips: tipRelations } },
        'custom.search': true,
        'custom.tool': true,
      },
    },
    seo: true,
  },
  categories: {
    image: true,
    seo: true,
    group: true,
    ingredients: { populate: { image: true, tips: { populate: { tip_type: true } } } },
    tips: tipRelations,
  },
  groups: { categories: { populate: { image: true } } },
  ingredients: { image: true, tips: { populate: { tip_type: true } } },
  tips: tipFields,
} satisfies Record<string, Populate>;

const SCHEMAS = {
  pages: cms.Page,
  categories: cms.Category,
  groups: cms.Group,
  ingredients: cms.Ingredient,
  tips: cms.Tip,
} satisfies Record<keyof typeof POPULATE, z.ZodType>;

export type VerifyReport = Record<keyof typeof POPULATE, number>;

/** Reads every published collection the way the site does and parses it with the site's schemas. */
export async function verify(client: StrapiClient): Promise<VerifyReport> {
  const report = {} as VerifyReport;
  for (const plural of Object.keys(POPULATE) as (keyof typeof POPULATE)[]) {
    const items: unknown[] = [];
    for (let page = 1, pageCount = 1; page <= pageCount; page += 1) {
      const result = await client.list(plural, {
        status: 'published',
        populate: POPULATE[plural],
        pagination: { page, pageSize: 100 },
      });
      items.push(...result.data);
      pageCount = result.pageCount;
    }
    const parsed = z.array(SCHEMAS[plural]).safeParse(items);
    if (!parsed.success) {
      throw new Error(
        `${plural} does not match the site schema:\n${z.prettifyError(parsed.error)}`,
      );
    }
    report[plural] = items.length;
  }
  return report;
}
