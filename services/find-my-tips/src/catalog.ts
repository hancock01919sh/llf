import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

import { Catalog, toSlug } from '@llf/contracts/catalog';
import type { Match, Matcher } from '@llf/matching';
import { createMatcher, TIER_RANK } from '@llf/matching';
import { z } from 'zod';

export type CatalogSnapshot = { catalogVersion: string; matcher: Matcher };

export interface CatalogSource {
  version(): Promise<string>;
  matcher(terms: readonly string[]): Promise<Matcher>;
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type CatalogSourceOptions = {
  catalogUrl?: string | undefined;
  catalogToken?: string | undefined;
  catalogFile?: string | undefined;
  refreshMs: number;
  fetch?: FetchLike;
  now?: () => number;
  onLoad?: (catalogVersion: string) => void;
};

const FIXTURE = new URL('./fixtures/catalog.json', import.meta.url);
const PAGE_LIMIT = 100;
const CACHE_MAX = 5_000;

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 12);
}

function fetchError(status: number): Error {
  const error = new Error(`catalog fetch failed: ${status}`);
  error.name = `CatalogFetchError(${status})`;
  return error;
}

const CmsIngredient = z.object({
  title: z.string().min(1),
  synonyms: z.union([z.string(), z.array(z.string())]).nullish(),
});
type CmsIngredient = z.infer<typeof CmsIngredient>;

const CmsPage = z.object({
  data: z.array(CmsIngredient),
  meta: z
    .object({
      pagination: z.object({
        start: z.number().int().nonnegative(),
        limit: z.number().int().positive(),
        total: z.number().int().nonnegative(),
      }),
    })
    .optional(),
});
type CmsPage = z.infer<typeof CmsPage>;

const CmsFingerprint = z.object({
  data: z.array(z.object({ updatedAt: z.string().min(1) })),
  meta: z.object({ pagination: z.object({ total: z.number().int().nonnegative() }) }).optional(),
});

function snapshot(catalog: Catalog): CatalogSnapshot {
  return { catalogVersion: catalog.catalogVersion, matcher: createMatcher(catalog.ingredients) };
}

export function catalogFromData(data: unknown): CatalogSnapshot {
  return snapshot(Catalog.parse(data));
}

/** A fixed catalog, for tests and local runs without a CMS. */
export function staticCatalogSource(data: unknown): CatalogSource {
  const value = catalogFromData(data);
  return {
    version: async () => value.catalogVersion,
    matcher: async () => value.matcher,
  };
}

function splitSynonyms(value: CmsIngredient['synonyms']): string[] {
  const raw = value ?? [];
  const list = typeof raw === 'string' ? raw.split(',') : raw;
  return [...new Set(list.map((s) => s.trim()).filter(Boolean))];
}

function toIngredient(row: CmsIngredient) {
  return { slug: toSlug(row.title), title: row.title, synonyms: splitSynonyms(row.synonyms) };
}

/**
 * Resolves terms against the CMS catalog on demand (TDD §7.4). Nothing is
 * preloaded: each request passes the names it needs, pages are read lazily
 * until every term has a strong match or the list ends, and each term's result
 * (including a miss) is cached for `refreshMs`. Without a URL, `CATALOG_FILE`
 * or the bundled fixture is read once.
 */
export function createCatalogSource(options: CatalogSourceOptions): CatalogSource {
  const now = options.now ?? Date.now;
  const doFetch: FetchLike = options.fetch ?? ((input, init) => fetch(input, init));
  const url = options.catalogUrl;

  if (!url) {
    let loaded: Promise<CatalogSnapshot> | undefined;
    const load = () => {
      loaded ??= (async () => {
        const path = options.catalogFile ?? FIXTURE;
        return snapshot(Catalog.parse(JSON.parse(await readFile(path, 'utf8'))));
      })().catch((error: unknown) => {
        loaded = undefined;
        throw error;
      });
      return loaded;
    };
    return {
      version: async () => (await load()).catalogVersion,
      matcher: async () => (await load()).matcher,
    };
  }

  const endpoint = url;
  const headers = new Headers();
  if (options.catalogToken) headers.set('authorization', `Bearer ${options.catalogToken}`);
  const cache = new Map<string, { match: Match | null; at: number }>();
  const inflight = new Map<string, Promise<Map<string, Match | null>>>();
  const pages = new Map<number, Promise<CmsPage>>();
  let announced = false;

  let version: { value: string; at: number } | undefined;
  const endpointVersion = digest(endpoint);

  async function fetchVersion(): Promise<string> {
    const target = new URL(endpoint);
    target.searchParams.set('fields[0]', 'updatedAt');
    target.searchParams.set('sort', 'updatedAt:desc');
    target.searchParams.set('pagination[limit]', '1');
    const res = await doFetch(target.toString(), {
      headers,
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) throw fetchError(res.status);
    const latest = CmsFingerprint.parse(await res.json());
    const total = latest.meta?.pagination.total ?? latest.data.length;
    return digest(`${latest.data[0]?.updatedAt ?? ''}|${total}`);
  }

  async function currentVersion(): Promise<string> {
    if (version && now() - version.at < options.refreshMs) return version.value;
    const at = now();
    try {
      version = { value: await fetchVersion(), at };
    } catch {
      version = { value: version?.value ?? endpointVersion, at };
    }
    return version.value;
  }

  function pageUrl(start: number): string {
    const target = new URL(endpoint);
    target.searchParams.set('fields[0]', 'title');
    target.searchParams.set('fields[1]', 'synonyms');
    target.searchParams.set('pagination[start]', String(start));
    target.searchParams.set('pagination[limit]', String(PAGE_LIMIT));
    return target.toString();
  }

  async function loadPage(start: number): Promise<CmsPage> {
    const res = await doFetch(pageUrl(start), {
      headers,
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) throw fetchError(res.status);
    return CmsPage.parse(await res.json());
  }

  function fetchPage(start: number): Promise<CmsPage> {
    const existing = pages.get(start);
    if (existing) return existing;
    const page = loadPage(start);
    pages.set(start, page);
    const settle = () => {
      if (pages.get(start) === page) pages.delete(start);
    };
    page.then(settle, settle);
    return page;
  }

  function evictOldest(): void {
    while (cache.size > CACHE_MAX) {
      const oldest = cache.keys().next().value;
      if (oldest === undefined) break;
      cache.delete(oldest);
    }
  }

  function resolve(terms: readonly string[]): Promise<Map<string, Match | null>> {
    const key = [...new Set(terms)].sort().join('\u0000');
    const existing = inflight.get(key);
    if (existing) return existing;
    const run = resolveOnce(terms);
    inflight.set(key, run);
    const settle = () => {
      if (inflight.get(key) === run) inflight.delete(key);
    };
    run.then(settle, settle);
    return run;
  }

  async function resolveOnce(terms: readonly string[]): Promise<Map<string, Match | null>> {
    const at = now();
    const resolved = new Map<string, Match | null>();
    const stale = new Map<string, Match | null>();
    const pending = new Set<string>();

    for (const term of terms) {
      const hit = cache.get(term);
      if (hit && at - hit.at < options.refreshMs) resolved.set(term, hit.match);
      else {
        if (hit) stale.set(term, hit.match);
        pending.add(term);
      }
    }
    if (pending.size === 0) return resolved;

    const best = new Map<string, Match>();
    try {
      let start = 0;
      while (pending.size > 0) {
        const page = await fetchPage(start);
        const pageMatcher = createMatcher(page.data.map(toIngredient));
        for (const term of [...pending]) {
          const found = pageMatcher.match(term);
          if (!found) continue;
          const previous = best.get(term);
          if (!previous || TIER_RANK[found.tier] < TIER_RANK[previous.tier]) {
            best.set(term, found);
          }
          if (found.tier === 'strong') {
            resolved.set(term, found);
            pending.delete(term);
          }
        }
        if (pending.size === 0) break;
        const pagination = page.meta?.pagination;
        if (page.data.length === 0 || !pagination) break;
        start += pagination.limit;
        if (start >= pagination.total) break;
      }
      for (const term of pending) resolved.set(term, best.get(term) ?? null);
    } catch (error) {
      for (const term of pending) {
        if (!stale.has(term)) throw error;
        resolved.set(term, stale.get(term) ?? null);
      }
    }

    for (const [term, match] of resolved) cache.set(term, { match, at });
    evictOldest();
    return resolved;
  }

  return {
    version: currentVersion,
    async matcher(terms) {
      const resolved = await resolve(terms);
      if (!announced) {
        announced = true;
        options.onLoad?.(version?.value ?? endpointVersion);
      }
      return { match: (term: string) => resolved.get(term) ?? null };
    },
  };
}
