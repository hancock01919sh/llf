import { ToolMode } from '@llf/contracts/find-tips';
import { z } from 'zod';

import { REASONING_EFFORTS, type ReasoningEffort } from './extract/types';

export const PROVIDERS = ['mock', 'anthropic', 'openai', 'gemini', 'bedrock'] as const;
export type ProviderName = (typeof PROVIDERS)[number];

const intFromEnv = (fallback: number) => z.coerce.number().int().positive().default(fallback);

const EnvSchema = z.object({
  // Phase A kill switch (TDD §7.7). Phase B reads an SSM parameter instead.
  FIND_TIPS_MODE: ToolMode.default('live'),
  GAP_LOG: z.enum(['on', 'off']).default('off'),
  AI_PROVIDER: z.enum(PROVIDERS).default('mock'),
  AI_MODEL: z.string().trim().min(1).default('mock-1'),
  PROMPT_VERSION: z.string().trim().min(1).default('p1'),
  // Dev only (ddd's key on Render dev or a local `.env`). Never logged or echoed.
  ANTHROPIC_API_KEY: z.string().trim().min(1).optional(),
  // TBWA's capped test key (dev and the eval arena only). Never logged or echoed.
  OPENAI_API_KEY: z.string().trim().min(1).optional(),
  // Gemini key. With GEMINI_VERTEX=1 it is the Vertex AI key bound to the llf-gemini-dev
  // service account in Ad Council's Google Cloud project (TDD D37; Render dev and local).
  // Without it, ddd's own Gemini API key (eval arena only, TDD D25). Never logged or echoed.
  GEMINI_API_KEY: z.string().trim().min(1).optional(),
  // Call Gemini on Vertex AI in Ad Council's Google Cloud project (TDD D37) instead of the
  // Gemini API. Location `us` is the US multi-region endpoint; `global` has no residency.
  GEMINI_VERTEX: z.enum(['0', '1', 'false', 'true']).optional(),
  GOOGLE_CLOUD_PROJECT: z.string().trim().min(1).optional(),
  GOOGLE_CLOUD_LOCATION: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/)
    .default('us'),
  // Dev only: send Gemini calls through ddd's relay instead of Google (TDD D38, for developers
  // who can't reach Google from mainland China). GEMINI_API_KEY is then the relay token.
  GEMINI_BASE_URL: z.url().optional(),
  // Only sent to providers that support it (OpenAI reasoning models, Gemini thinking
  // budgets). Unset = provider default.
  AI_REASONING_EFFORT: z.enum(REASONING_EFFORTS).optional(),
  // TOOL_PORT wins so one root `.env` can drive both the tool and the web proxy;
  // PORT is what Render injects.
  TOOL_PORT: z.coerce.number().int().positive().optional(),
  PORT: intFromEnv(8787),
  // Proxies we run in front of the service, each appending to x-forwarded-for (Render's proxy
  // on dev). 0 = use the socket address, as in local dev. Decides the rate-limit key (§7.6).
  TRUSTED_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
  CATALOG_URL: z.url().optional(),
  CATALOG_TOKEN: z.string().trim().min(1).optional(),
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

export type GeminiVertex = { project: string; location: string };

export type Config = {
  mode: ToolMode;
  provider: ProviderName;
  model: string;
  gapLog: boolean;
  promptVersion: string;
  anthropicApiKey: string | undefined;
  openaiApiKey: string | undefined;
  geminiApiKey: string | undefined;
  geminiVertex: GeminiVertex | undefined;
  geminiBaseUrl: string | undefined;
  reasoningEffort: ReasoningEffort | undefined;
  port: number;
  trustedProxyHops: number;
  catalogUrl: string | undefined;
  catalogToken: string | undefined;
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
  const vertex = e.GEMINI_VERTEX === '1' || e.GEMINI_VERTEX === 'true';
  if (vertex && !e.GOOGLE_CLOUD_PROJECT) {
    throw new Error('find-my-tips: invalid environment (GOOGLE_CLOUD_PROJECT)');
  }
  return {
    mode: e.FIND_TIPS_MODE,
    provider: e.AI_PROVIDER,
    model: e.AI_MODEL,
    gapLog: e.GAP_LOG === 'on',
    promptVersion: e.PROMPT_VERSION,
    anthropicApiKey: e.ANTHROPIC_API_KEY,
    openaiApiKey: e.OPENAI_API_KEY,
    geminiApiKey: e.GEMINI_API_KEY,
    geminiVertex:
      vertex && e.GOOGLE_CLOUD_PROJECT
        ? { project: e.GOOGLE_CLOUD_PROJECT, location: e.GOOGLE_CLOUD_LOCATION }
        : undefined,
    geminiBaseUrl: e.GEMINI_BASE_URL,
    reasoningEffort: e.AI_REASONING_EFFORT,
    port: e.TOOL_PORT ?? e.PORT,
    trustedProxyHops: e.TRUSTED_PROXY_HOPS,
    catalogUrl: e.CATALOG_URL,
    catalogToken: e.CATALOG_TOKEN,
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
