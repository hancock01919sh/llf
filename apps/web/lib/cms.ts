import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { cms, cmsType } from '@llf/contracts';
import { z } from 'zod';
import { normalizePath } from './paths';

/**
 * Build-time content loader (TDD §6.2). Runs only in Node during `next build` / `next dev`.
 * Fetches every entry in pages of 100 with explicit populate, then validates each entry with Zod
 * so a bad entry fails the build with a message an editor can act on.
 */

export const PAGE_SIZE = 100;

type Populate = { [key: string]: true | Populate };

// const ctas: Populate = { populate: { page: true } };
const tipFields: Populate = {
  tip_type: true,
  tip_behavior: true,
  tip_motivator: true,
  ingredient: true,
};
const tipRelations: Populate = { populate: tipFields };
// const hero: Populate = { populate: { ctas, images: true } };
export const ImagePopulate = {
  fields: ['url', 'ext', 'alternativeText', 'height', 'width', 'size'],
};
// Verified against seeded content (BD3244-24). Keep in sync with POPULATE in scripts/seed/src/seed.ts.
const POPULATE = {
  pages: {
    // hero,
    // featured: { populate: { image: true } },
    // tool: true,
    main: {
      on: {
        // 'component.hero': hero,
        // 'component.teaser': { populate: { title: true, ctas, images: true } },
        // 'component.link-list': { populate: { title: true, pages: true } },
        // 'component.carousel': {
        //   populate: { title: true, ctas, categories: { populate: { image: true } } },
        // },
        // 'custom.tip-list': { populate: { title: true, tips: tipRelations } },
        // 'custom.search': true,
        // 'custom.tool': true,
        'component.tool-input': {
          populate: {
            button: true,
            cards: {
              populate: {
                link: true,
              },
            },
            image: ImagePopulate,
          },
        },
        'component.accordion': {
          populate: {
            accordionItem: true,
          },
        },
        'component.highlight-component': {
          populate: {
            link: true,
            image: ImagePopulate,
          },
        },
        'component.category-detail': {
          populate: {
            image: ImagePopulate,
            button: true,
            popup: {
              populate: {
                link: true,
              },
            },
          },
        },
        'component.404': true,
        'component.search': {
          populate: {
            popup: {
              populate: {
                link: true,
              },
            },
          },
        },
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
  footer: { link: true, iconLink: true, overlayLink: true },
  navigation: { link: true },
  global: { load: true, seo: true },
};
// satisfies Record<string, Populate>;

const SCHEMAS = {
  pages: cms.Page,
  categories: cms.Category,
  groups: cms.Group,
  ingredients: cms.Ingredient,
  tips: cms.Tip,
  footer: cmsType.api.Footer,
  navigation: cmsType.api.Navigation,
  global: cmsType.api.Global,
} as const;

export type CollectionKey = keyof typeof SCHEMAS;
type Item<K extends CollectionKey> = z.output<(typeof SCHEMAS)[K]>;

/** Serializes nested objects to Strapi's bracket query syntax (what `qs` would produce). */
export function toQuery(params: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(params).flatMap(([key, value]) => {
    const name = prefix ? `${prefix}[${key}]` : key;
    if (value !== null && typeof value === 'object') {
      return toQuery(value as Record<string, unknown>, name);
    }
    return [`${encodeURIComponent(name)}=${encodeURIComponent(String(value))}`];
  });
}

export class ContentError extends Error {
  override name = 'ContentError';
}

function describe(raw: unknown): string {
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    const label = r.title ?? r.path ?? r.slug;
    const id = r.documentId;
    return [label ? `"${String(label)}"` : null, id ? `(documentId ${String(id)})` : null]
      .filter(Boolean)
      .join(' ');
  }
  return 'an entry';
}

/** Validates each entry on its own so the error names the entry an editor has to fix. */
export function validateCollection<K extends CollectionKey>(key: K, raw: unknown[]): Item<K>[] {
  const schema = SCHEMAS[key];
  const problems: string[] = [];
  const items: Item<K>[] = [];
  raw.forEach((entry, index) => {
    const result = schema.safeParse(entry);
    if (result.success) {
      items.push(result.data as Item<K>);
      return;
    }
    const fields = result.error.issues
      .map((issue) => `${issue.path.join('.') || '(entry)'}: ${issue.message}`)
      .join('; ');
    problems.push(`  • ${key} #${index + 1} ${describe(entry)}: ${fields}`);
  });
  if (problems.length > 0) {
    throw new ContentError(
      `CMS content in "${key}" doesn't match what the site expects. Fix these entries in Strapi and publish again:\n${problems.join('\n')}`,
    );
  }
  return items;
}

const envelope = cms.collectionResponse(z.unknown());
const signalSchema = envelope.extend({
  data: z.unknown(),
});
const signalKey = ['footer', 'navigation', 'global'];

async function fetchFromStrapi(key: CollectionKey): Promise<unknown[] | unknown> {
  const base = process.env.CMS_URL;
  const token = process.env.CMS_TOKEN;
  if (!base || !token) {
    throw new ContentError(
      'Set CMS_URL and CMS_TOKEN to build from Strapi, or CMS_FIXTURES=1 to build from fixtures (see .env.example).',
    );
  }
  const all: unknown[] = [];
  for (let page = 1; ; page++) {
    const query = toQuery({
      populate: POPULATE[key],
      pagination: { page, pageSize: PAGE_SIZE },
    }).join('&');
    const url = `${base.replace(/\/$/, '')}/api/${key}?${query}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      throw new ContentError(`Strapi returned ${res.status} for /api/${key} (page ${page}).`);
    }

    const raw = await res.json();
    let body = null;
    if (signalKey.includes(key)) {
      body = signalSchema.parse(raw);
      all.push(body.data);
    } else {
      body = envelope.parse(raw);
      all.push(...body.data);
    }
    const pageCount = body.meta?.pagination?.pageCount ?? 1;
    if (page >= pageCount) {
      if (signalKey.includes(key)) {
        return all[0];
      }
      return all;
    }
  }
}

async function readFixture(key: CollectionKey): Promise<unknown[]> {
  const file = path.join(process.cwd(), 'fixtures', 'cms', `${key}.json`);
  return envelope.parse(JSON.parse(await readFile(file, 'utf8'))).data;
}
async function readFixtureSingle(key: CollectionKey): Promise<unknown> {
  const file = path.join(process.cwd(), 'fixtures', 'cms', `${key}.json`);
  const signalSchema = cms.singleResponse(z.unknown());
  return signalSchema.parse(JSON.parse(await readFile(file, 'utf8'))).data;
}

const cache = new Map<CollectionKey, Promise<unknown[]>>();

export async function loadCollection<K extends CollectionKey>(key: K): Promise<Item<K>[]> {
  let pending = cache.get(key);
  if (!pending) {
    const source = process.env.CMS_FIXTURES === '1' ? readFixture : fetchFromStrapi;
    pending = source(key).then((raw) => validateCollection(key, raw as unknown[]));
    cache.set(key, pending);
  }
  return (await pending) as Item<K>[];
}
export async function loadSingle<K extends CollectionKey>(key: K): Promise<Item<K>> {
  let pending = cache.get(key);
  if (!pending) {
    const source = process.env.CMS_FIXTURES === '1' ? readFixtureSingle : fetchFromStrapi;
    pending = source(key).then((raw) => validateCollection(key, [raw]));
    cache.set(key, pending);
  }
  return (await pending)[0] as Item<K>;
}

export { normalizePath };

export const getPages = () => loadCollection('pages');
export const getCategories = () => loadCollection('categories');
export const getGroups = () => loadCollection('groups');
export const getIngredients = () => loadCollection('ingredients');
export const getTips = () => loadCollection('tips');

export async function getPageByPath(value: string): Promise<cms.Page | undefined> {
  const wanted = normalizePath(value);
  const pages = await getPages();
  return pages.find((page) => normalizePath(page.path) === wanted);
}

/** Designed routes need their CMS page; a missing one is an editor error, not a 404. */
export async function requirePage(value: string): Promise<cms.Page> {
  const page = await getPageByPath(value);
  if (!page) {
    throw new ContentError(
      `The site needs a published Page with path "/${normalizePath(value)}". Create it in Strapi and publish.`,
    );
  }
  return page;
}

export async function getCategory(slug: string): Promise<cms.Category | undefined> {
  return (await getCategories()).find((category) => category.slug === slug);
}
export async function getPageProviderData() {
  return Promise.all([loadSingle('footer'), loadSingle('navigation'), loadSingle('global')]).then(
    ([footer, navigation, global]) => ({ footer, navigation, global }),
  );
}
