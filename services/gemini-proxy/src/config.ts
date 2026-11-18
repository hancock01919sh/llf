import { loadConfig as loadToolConfig, type Config as ToolConfig } from '@llf/find-my-tips';
import { z } from 'zod';

const intFromEnv = (fallback: number) => z.coerce.number().int().positive().default(fallback);
const list = z
  .string()
  .transform((value) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  )
  .pipe(z.array(z.string()).min(1));

const EnvSchema = z.object({
  // ddd's capped Gemini dev key (TDD D33). Lives only on Render. Never logged or echoed.
  GEMINI_API_KEY: z.string().trim().min(1),
  // One token per developer, comma-separated, so one can be revoked without the others. Never
  // logged or echoed. RELAY_TOKENS is the name from the relay (D38) and keeps working.
  PROXY_TOKENS: list.pipe(z.array(z.string().min(24))).optional(),
  RELAY_TOKENS: list.pipe(z.array(z.string().min(24))).optional(),
  RELAY_MODELS: list.default(['gemini-3.8-flash']),
  RELAY_DAILY_CALLS: intFromEnv(500),
  RELAY_BODY_MAX_BYTES: intFromEnv(6 * 1024 * 1024),
  RELAY_TIMEOUT_MS: intFromEnv(30_000),
  RELAY_UPSTREAM: z.url().default('https://generativelanguage.googleapis.com'),
  PORT: intFromEnv(8790),
});

export type RelayConfig = {
  geminiApiKey: string;
  models: string[];
  dailyCalls: number;
  bodyMaxBytes: number;
  timeoutMs: number;
  upstream: string;
};

export type Config = {
  tokens: string[];
  port: number;
  relay: RelayConfig;
  tool: ToolConfig;
};

/**
 * The arena's pick (docs/eval/arena/model-audit-2026-10.md): Gemini 3.8 Flash, prompt p3,
 * thinking off. Env still wins, so the model can change without a code change (AGENTS.md).
 */
const TOOL_DEFAULTS = {
  AI_PROVIDER: 'gemini',
  AI_MODEL: 'gemini-3.8-flash',
  PROMPT_VERSION: 'p3',
  AI_REASONING_EFFORT: 'none',
};

/** Gemini only; `mock` is for tests and CI. */
const PROVIDERS = new Set(['gemini', 'mock']);

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
  // Treat empty strings as unset so `.env` files can list keys without values.
  const cleaned = Object.fromEntries(
    Object.entries(env).filter(([, value]) => value !== undefined && value !== ''),
  );
  const parsed = EnvSchema.safeParse(cleaned);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new Error(`gemini-proxy: invalid environment (${fields})`);
  }
  const e = parsed.data;
  const tokens = [...(e.PROXY_TOKENS ?? []), ...(e.RELAY_TOKENS ?? [])];
  if (tokens.length === 0) throw new Error('gemini-proxy: invalid environment (PROXY_TOKENS)');

  // The tool calls Google directly with the real key, never back through a proxy.
  const {
    GEMINI_BASE_URL: _base,
    GEMINI_PROXY_URL: _url,
    GEMINI_PROXY_TOKEN: _token,
    ...rest
  } = cleaned;
  const tool = loadToolConfig({ ...TOOL_DEFAULTS, ...rest, PORT: String(e.PORT) });
  if (!PROVIDERS.has(tool.provider)) {
    throw new Error(
      `gemini-proxy: AI_PROVIDER must be gemini (or mock in tests), not ${tool.provider}`,
    );
  }

  return {
    tokens,
    port: e.PORT,
    relay: {
      geminiApiKey: e.GEMINI_API_KEY,
      models: e.RELAY_MODELS,
      dailyCalls: e.RELAY_DAILY_CALLS,
      bodyMaxBytes: e.RELAY_BODY_MAX_BYTES,
      timeoutMs: e.RELAY_TIMEOUT_MS,
      upstream: e.RELAY_UPSTREAM.replace(/\/+$/, ''),
    },
    tool,
  };
}
