import { ToolMode } from '@llf/contracts/find-tips';
import { z } from 'zod';

export const PROVIDERS = ['mock', 'anthropic', 'openai', 'bedrock'] as const;
export type ProviderName = (typeof PROVIDERS)[number];

const intFromEnv = (fallback: number) => z.coerce.number().int().positive().default(fallback);

const EnvSchema = z.object({
  // Phase A kill switch (TDD §7.7). Phase B reads an SSM parameter instead.
  FIND_TIPS_MODE: ToolMode.default('live'),
  AI_PROVIDER: z.enum(PROVIDERS).default('mock'),
  AI_MODEL: z.string().trim().min(1).default('mock-1'),
  PROMPT_VERSION: z.string().trim().min(1).default('p1'),
  // TOOL_PORT wins so one root `.env` can drive both the tool and the web proxy;
  // PORT is what Render injects.
  TOOL_PORT: z.coerce.number().int().positive().optional(),
  PORT: intFromEnv(8787),
  CATALOG_URL: z.url().optional(),
  CATALOG_FILE: z.string().trim().min(1).optional(),
  CATALOG_REFRESH_MS: intFromEnv(60_000),
  QUOTA_DAILY_MODEL_CALLS: intFromEnv(3000),
  RATE_LIMIT_WINDOW_MS: intFromEnv(5 * 60_000),
  RATE_LIMIT_URL: intFromEnv(30),
  RATE_LIMIT_MODEL: intFromEnv(10),
  URL_CACHE_TTL_MS: intFromEnv(24 * 60 * 60_000),
  MODEL_TIMEOUT_MS: intFromEnv(15_000),
  HANDLER_TIMEOUT_MS: intFromEnv(25_000),
});

export type Config = {
  mode: ToolMode;
  provider: ProviderName;
  model: string;
  promptVersion: string;
  port: number;
  catalogUrl: string | undefined;
  catalogFile: string | undefined;
  catalogRefreshMs: number;
  quotaDailyModelCalls: number;
  rateLimit: { windowMs: number; url: number; model: number };
  urlCacheTtlMs: number;
  modelTimeoutMs: number;
  handlerTimeoutMs: number;
};

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
  // Treat empty strings as unset so `.env` files can list keys without values.
  const cleaned = Object.fromEntries(
    Object.entries(env).filter(([, value]) => value !== undefined && value !== ''),
  );
  const parsed = EnvSchema.safeParse(cleaned);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new Error(`find-my-tips: invalid environment (${fields})`);
  }
  const e = parsed.data;
  return {
    mode: e.FIND_TIPS_MODE,
    provider: e.AI_PROVIDER,
    model: e.AI_MODEL,
    promptVersion: e.PROMPT_VERSION,
    port: e.TOOL_PORT ?? e.PORT,
    catalogUrl: e.CATALOG_URL,
    catalogFile: e.CATALOG_FILE,
    catalogRefreshMs: e.CATALOG_REFRESH_MS,
    quotaDailyModelCalls: e.QUOTA_DAILY_MODEL_CALLS,
    rateLimit: {
      windowMs: e.RATE_LIMIT_WINDOW_MS,
      url: e.RATE_LIMIT_URL,
      model: e.RATE_LIMIT_MODEL,
    },
    urlCacheTtlMs: e.URL_CACHE_TTL_MS,
    modelTimeoutMs: e.MODEL_TIMEOUT_MS,
    handlerTimeoutMs: e.HANDLER_TIMEOUT_MS,
  };
}
