import { readFile } from 'node:fs/promises';

import { Catalog } from '@llf/contracts/catalog';
import type { Matcher } from '@llf/matching';
import { createMatcher } from '@llf/matching';

export type CatalogSnapshot = { catalogVersion: string; matcher: Matcher };

export interface CatalogSource {
  get(): Promise<CatalogSnapshot>;
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type CatalogSourceOptions = {
  catalogUrl?: string | undefined;
  catalogFile?: string | undefined;
  refreshMs: number;
  fetch?: FetchLike;
  now?: () => number;
  onLoad?: (catalogVersion: string) => void;
};

const FIXTURE = new URL('./fixtures/catalog.json', import.meta.url);

function snapshot(catalog: Catalog): CatalogSnapshot {
  return { catalogVersion: catalog.catalogVersion, matcher: createMatcher(catalog.ingredients) };
}

export function catalogFromData(data: unknown): CatalogSnapshot {
  return snapshot(Catalog.parse(data));
}

/** A fixed catalog, for tests and local runs without a CMS. */
export function staticCatalogSource(data: unknown): CatalogSource {
  const value = catalogFromData(data);
  return { get: async () => value };
}

/**
 * Loads the matching catalog published by the CMS (TDD §7.4).
 * `CATALOG_URL` is polled with ETag at most every `refreshMs`; on a failed
 * refresh the last good catalog keeps serving. Without a URL, `CATALOG_FILE`
 * or the bundled fixture is read once.
 */
export function createCatalogSource(options: CatalogSourceOptions): CatalogSource {
  const now = options.now ?? Date.now;
  const doFetch: FetchLike = options.fetch ?? ((input, init) => fetch(input, init));
  let current: CatalogSnapshot | undefined;
  let etag: string | undefined;
  let checkedAt = 0;
  let inflight: Promise<CatalogSnapshot> | undefined;

  const accept = (data: unknown) => {
    const parsed = Catalog.parse(data);
    if (current?.catalogVersion !== parsed.catalogVersion) {
      current = snapshot(parsed);
      options.onLoad?.(parsed.catalogVersion);
    }
    return current!;
  };

  async function loadFile(): Promise<CatalogSnapshot> {
    const path = options.catalogFile ?? FIXTURE;
    return accept(JSON.parse(await readFile(path, 'utf8')));
  }

  async function loadUrl(url: string): Promise<CatalogSnapshot> {
    try {
      const res = await doFetch(url, {
        headers: etag ? { 'if-none-match': etag } : {},
        signal: AbortSignal.timeout(5_000),
      });
      if (res.status === 304 && current) return current;
      if (!res.ok) throw new Error(`catalog fetch failed: ${res.status}`);
      const next = accept(await res.json());
      etag = res.headers.get('etag') ?? undefined;
      return next;
    } catch (error) {
      if (current) return current;
      throw error;
    }
  }

  async function refresh(): Promise<CatalogSnapshot> {
    checkedAt = now();
    return options.catalogUrl ? loadUrl(options.catalogUrl) : loadFile();
  }

  return {
    async get() {
      const stale = !current || (options.catalogUrl && now() - checkedAt >= options.refreshMs);
      if (!stale) return current!;
      inflight ??= refresh().finally(() => {
        inflight = undefined;
      });
      return inflight;
    },
  };
}
