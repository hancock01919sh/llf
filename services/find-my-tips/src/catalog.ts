import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

import { Catalog, toSlug } from '@llf/contracts/catalog';
import type { Matcher } from '@llf/matching';
import { createMatcher } from '@llf/matching';
import { z } from 'zod';

export type CatalogSnapshot = { catalogVersion: string; matcher: Matcher };

export interface CatalogSource {
  /** The version reported by `/status` and in extraction responses. */
  version(): Promise<string>;
  /** The whole catalog, matched in memory. */
  matcher(): Promise<Matcher>;
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type CatalogSourceOptions = {
  catalogUrl?: string | undefined;
  catalogToken?: string | undefined;
  catalogFile?: string | undefined;
  /** How long a loaded catalog is trusted before the CMS is checked again. */
  refreshMs: number;
  fetch?: FetchLike;
  now?: () => number;
  onLoad?: (catalogVersion: string) => void;
};

const FIXTURE = new URL('./fixtures/catalog.json', import.meta.url);
const PAGE_LIMIT = 999;

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

function toSnapshot(catalog: Catalog): CatalogSnapshot {
  return { catalogVersion: catalog.catalogVersion, matcher: createMatcher(catalog.ingredients) };
}

export function catalogFromData(data: unknown): CatalogSnapshot {
  return toSnapshot(Catalog.parse(data));
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
 * Loads the whole catalog into memory once per `refreshMs` and matches terms
 * there (TDD §7.4). Reloads start with the cheap `updatedAt` fingerprint, so an
 * unchanged catalog costs one request instead of N pages. Nothing derived from a
 * user's input is kept: no term cache, no per-request state (D20/D35). Without
 * a URL, `CATALOG_FILE` or the bundled fixture is read once.
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
        return toSnapshot(Catalog.parse(JSON.parse(await readFile(path, 'utf8'))));
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
  const endpointVersion = digest(endpoint);

  let snapshot: CatalogSnapshot | undefined;
  let checkedAt = 0;
  let inflight: Promise<CatalogSnapshot> | undefined;

  function fingerprintUrl(): string {
    const target = new URL(endpoint);
    target.searchParams.set('fields[0]', 'updatedAt');
    target.searchParams.set('sort', 'updatedAt:desc');
    target.searchParams.set('pagination[limit]', '1');
    return target.toString();
  }

  function pageUrl(start: number): string {
    const target = new URL(endpoint);
    target.searchParams.set('fields[0]', 'title');
    target.searchParams.set('fields[1]', 'synonyms');
    target.searchParams.set('pagination[start]', String(start));
    target.searchParams.set('pagination[limit]', String(PAGE_LIMIT));
    return target.toString();
  }

  async function get(target: string): Promise<Response> {
    const res = await doFetch(target, { headers, signal: AbortSignal.timeout(5_000) });
    if (!res.ok) throw fetchError(res.status);
    return res;
  }

  async function fetchFingerprint(): Promise<string> {
    const latest = CmsFingerprint.parse(await (await get(fingerprintUrl())).json());
    return digest(`${latest.data[0]?.updatedAt ?? ''}|${latest.meta?.pagination.total ?? 0}`);
  }

  async function fetchPage(start: number): Promise<CmsPage> {
    return CmsPage.parse(await (await get(pageUrl(start))).json());
  }

  async function loadAll(catalogVersion: string): Promise<CatalogSnapshot> {
    const ingredients: ReturnType<typeof toIngredient>[] = [];
    let start = 0;
    for (;;) {
      const page = await fetchPage(start);
      ingredients.push(...page.data.map(toIngredient));
      const pagination = page.meta?.pagination;
      if (page.data.length === 0 || !pagination) break;
      start += pagination.limit;
      if (start >= pagination.total) break;
    }
    snapshot = { catalogVersion, matcher: createMatcher(ingredients) };
    options.onLoad?.(catalogVersion);
    return snapshot;
  }

  async function reload(): Promise<CatalogSnapshot> {
    checkedAt = now();
    const catalogVersion = await fetchFingerprint();
    if (snapshot && snapshot.catalogVersion === catalogVersion) return snapshot;
    return loadAll(catalogVersion);
  }

  function current(): Promise<CatalogSnapshot> {
    if (snapshot && now() - checkedAt < options.refreshMs) return Promise.resolve(snapshot);
    let pending = inflight;
    if (!pending) {
      pending = (async () => {
        try {
          return await reload();
        } catch (error) {
          if (snapshot) return snapshot;
          throw error;
        }
      })().finally(() => {
        inflight = undefined;
      });
      inflight = pending;
    }
    return pending;
  }

  return {
    async version() {
      try {
        return (await current()).catalogVersion;
      } catch {
        return snapshot?.catalogVersion ?? endpointVersion;
      }
    },
    async matcher() {
      return (await current()).matcher;
    },
  };
}
