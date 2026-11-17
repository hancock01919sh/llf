import { createApp, type App } from './app';
import { MemoryCacheStore, MemoryCounterStore } from './cache';
import { createCatalogSource } from './catalog';
import type { Config } from './config';
import { createProvider } from './extract';
import { createVertexAccessTokenSource } from './extract/vertex-token';
import { stdoutLogger } from './log';

/**
 * The wiring the Node adapter and the Next route handler share (BD3244-87): config, catalog
 * source, provider, and the in-memory cache and quota counters. Stores are in-memory until
 * Render Key Value / DynamoDB adapters replace them behind the same interfaces.
 */
export function createDefaultApp(config: Config): App {
  const logger = stdoutLogger;
  // Vertex without a key (staging and prod on Fargate) needs an OAuth token source; dev keeps
  // using the API key, so this is undefined there (TDD D37).
  const geminiAccessToken = createVertexAccessTokenSource(config);

  const catalog = createCatalogSource({
    refreshMs: config.catalogRefreshMs,
    ...(config.catalogUrl ? { catalogUrl: config.catalogUrl } : {}),
    ...(config.catalogToken ? { catalogToken: config.catalogToken } : {}),
    ...(config.catalogFile ? { catalogFile: config.catalogFile } : {}),
    onLoad: (catalogVersion) => logger({ requestId: '', event: 'catalog', catalogVersion }),
  });

  return createApp({
    config,
    catalog,
    provider: createProvider(config.provider, {
      anthropicApiKey: config.anthropicApiKey,
      openaiApiKey: config.openaiApiKey,
      geminiApiKey: config.geminiApiKey,
      geminiVertex: config.geminiVertex,
      geminiBaseUrl: config.geminiBaseUrl,
      ...(geminiAccessToken ? { geminiAccessToken } : {}),
    }),
    cache: new MemoryCacheStore(),
    counters: new MemoryCounterStore(),
    logger,
  });
}
