import { EXTRACTION_MAX_ITEMS, ExtractionResult } from '@llf/contracts/find-tips';
import type { DetectedType, ExtractedItem, ExtractSource } from '@llf/contracts/find-tips';

import type { CacheStore } from '../cache';
import type { Config } from '../config';
import { extractIngredients } from '../extract';
import type { ExtractionProvider, ExtractionUsage } from '../extract';
import { ToolError } from '../http';
import type { Quota } from '../quota';
import { canonicalizeUrl, sha256Hex } from './canonicalize';
import { extractRecipeIngredients } from './jsonld';
import { SafeFetchError, safeFetch } from './safe-fetch';
import type { Resolver, Transport } from './safe-fetch';
import { VISIBLE_TEXT_MAX, visibleText } from './visible-text';

/** Bump when parsing or prompting changes so cached terms are re-extracted (TDD §7.4). */
export const EXTRACTOR_VERSION = 'x1';

export type UrlPipelineDeps = {
  cache: CacheStore;
  config: Pick<Config, 'mode' | 'model' | 'promptVersion' | 'urlCacheTtlMs' | 'modelTimeoutMs'>;
  provider: ExtractionProvider;
  quota: Quota;
  resolve?: Resolver;
  transport?: Transport;
  signal?: AbortSignal;
};

export type UrlPipelineResult = {
  items: ExtractedItem[];
  detectedType: DetectedType;
  readable: boolean;
  source: ExtractSource;
  /** sha256 of the final URL; the only URL-derived value that may be logged. */
  urlHash: string;
  usage?: ExtractionUsage;
};

type CachedTerms = Pick<UrlPipelineResult, 'items' | 'detectedType' | 'readable'>;

const aliasKey = (canonicalHash: string) => `alias#${canonicalHash}`;

function valueKey(urlHash: string, deps: UrlPipelineDeps): string {
  const { promptVersion, model } = deps.config;
  return `url#${urlHash}#${EXTRACTOR_VERSION}#${promptVersion}#${model}`;
}

async function readCache(deps: UrlPipelineDeps, key: string): Promise<CachedTerms | undefined> {
  const raw = await deps.cache.get(key);
  if (raw === undefined) return undefined;
  try {
    const parsed = ExtractionResult.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

function fromJsonLd(lines: string[]): CachedTerms {
  const items = lines
    .map((line) => line.slice(0, 200).trim())
    .filter((term) => term.length > 0)
    .slice(0, EXTRACTION_MAX_ITEMS)
    .map((term) => ({ term, isFood: true, inferred: false }));
  return { items, detectedType: 'recipe', readable: items.length > 0 };
}

async function fetchPage(url: URL, deps: UrlPipelineDeps) {
  try {
    return await safeFetch(url, {
      ...(deps.resolve ? { resolve: deps.resolve } : {}),
      ...(deps.transport ? { transport: deps.transport } : {}),
      ...(deps.signal ? { signal: deps.signal } : {}),
    });
  } catch (error) {
    if (error instanceof SafeFetchError) throw new ToolError(error.reason);
    throw new ToolError('upstream_error');
  }
}

/**
 * Recipe URL → raw ingredient terms (TDD §7.4). Returns terms, not matches:
 * the caller matches against the current catalog so cached terms never go
 * stale when editors change tips. Never logs or stores the URL itself.
 */
export async function runUrlPipeline(
  input: string,
  deps: UrlPipelineDeps,
): Promise<UrlPipelineResult> {
  const canonical = canonicalizeUrl(input);
  if (!canonical) throw new ToolError('url_not_allowed');

  const canonicalHash = sha256Hex(canonical.href);
  const aliasedHref = await deps.cache.get(aliasKey(canonicalHash));
  if (aliasedHref !== undefined) {
    const aliasedHash = sha256Hex(aliasedHref);
    const hit = await readCache(deps, valueKey(aliasedHash, deps));
    if (hit) return { ...hit, source: 'cache', urlHash: aliasedHash };
  }

  const page = await fetchPage(canonical, deps);
  const finalHref = page.finalUrl.href;
  const urlHash = sha256Hex(finalHref);
  const ttl = deps.config.urlCacheTtlMs;
  await deps.cache.set(aliasKey(canonicalHash), finalHref, ttl);

  const finalHit = await readCache(deps, valueKey(urlHash, deps));
  if (finalHit) return { ...finalHit, source: 'cache', urlHash };

  const store = async (terms: CachedTerms) => {
    await deps.cache.set(valueKey(urlHash, deps), JSON.stringify(terms), ttl);
  };

  const lines = extractRecipeIngredients(page.html);
  if (lines && lines.length > 0) {
    const terms = fromJsonLd(lines);
    if (terms.items.length > 0) {
      await store(terms);
      return { ...terms, source: 'jsonld', urlHash };
    }
  }

  if (deps.config.mode !== 'live' || (await deps.quota.exhausted('url'))) {
    throw new ToolError('unavailable');
  }

  const text = visibleText(page.html, VISIBLE_TEXT_MAX);
  if (text.length === 0) {
    return { items: [], detectedType: 'unknown', readable: false, source: 'model', urlHash };
  }

  await deps.quota.consume('url');
  const extraction = await extractIngredients(
    deps.provider,
    { kind: 'text', text },
    {
      timeoutMs: deps.config.modelTimeoutMs,
      model: deps.config.model,
      promptVersion: deps.config.promptVersion,
      ...(deps.signal ? { signal: deps.signal } : {}),
    },
  );
  const terms: CachedTerms = {
    items: extraction.result.items,
    detectedType: extraction.result.detectedType,
    readable: extraction.result.readable,
  };
  await store(terms);
  return {
    ...terms,
    source: 'model',
    urlHash,
    ...(extraction.usage ? { usage: extraction.usage } : {}),
  };
}
