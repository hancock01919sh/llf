import {
  createApp,
  createCatalogSource,
  createProvider,
  MemoryCacheStore,
  MemoryCounterStore,
  stdoutLogger,
} from '@llf/find-my-tips';

import { createProxyApp } from './app';
import { loadConfig } from './config';
import { stdoutLog } from './log';

/**
 * Render dev entry point (TDD D39). The tool wiring matches `services/find-my-tips/src/server.ts`;
 * switch to `createDefaultApp(config)` once #61 merges.
 */
const config = loadConfig();
const { tool: toolConfig } = config;

const catalog = createCatalogSource({
  refreshMs: toolConfig.catalogRefreshMs,
  ...(toolConfig.catalogUrl ? { catalogUrl: toolConfig.catalogUrl } : {}),
  ...(toolConfig.catalogToken ? { catalogToken: toolConfig.catalogToken } : {}),
  ...(toolConfig.catalogFile ? { catalogFile: toolConfig.catalogFile } : {}),
  onLoad: (catalogVersion) => stdoutLogger({ requestId: '', event: 'catalog', catalogVersion }),
});

const tool = createApp({
  config: toolConfig,
  catalog,
  provider: createProvider(toolConfig.provider, { geminiApiKey: config.relay.geminiApiKey }),
  cache: new MemoryCacheStore(),
  counters: new MemoryCounterStore(),
  logger: stdoutLogger,
});

const server = createProxyApp({ config, tool, log: stdoutLog }).listen(config.port, () =>
  stdoutLog({
    event: 'start',
    port: config.port,
    provider: toolConfig.provider,
    model: toolConfig.model,
  }),
);
server.requestTimeout = Math.max(toolConfig.handlerTimeoutMs, config.relay.timeoutMs) + 5_000;

function shutdown(): void {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
