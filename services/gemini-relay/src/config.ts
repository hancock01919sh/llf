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
  // One token per developer, comma-separated, so one can be revoked without the others.
  // Developers send theirs as `x-goog-api-key`. Never logged or echoed.
  RELAY_TOKENS: list.pipe(z.array(z.string().min(24))),
  RELAY_MODELS: list.default(['gemini-3.8-flash']),
  RELAY_DAILY_CALLS: intFromEnv(500),
  RELAY_BODY_MAX_BYTES: intFromEnv(6 * 1024 * 1024),
  RELAY_TIMEOUT_MS: intFromEnv(30_000),
  RELAY_UPSTREAM: z.url().default('https://generativelanguage.googleapis.com'),
  PORT: intFromEnv(8790),
});

export type Config = {
  geminiApiKey: string;
  tokens: string[];
  models: string[];
  dailyCalls: number;
  bodyMaxBytes: number;
  timeoutMs: number;
  upstream: string;
  port: number;
};

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
  // Treat empty strings as unset so `.env` files can list keys without values.
  const cleaned = Object.fromEntries(
    Object.entries(env).filter(([, value]) => value !== undefined && value !== ''),
  );
  const parsed = EnvSchema.safeParse(cleaned);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new Error(`gemini-relay: invalid environment (${fields})`);
  }
  const e = parsed.data;
  return {
    geminiApiKey: e.GEMINI_API_KEY,
    tokens: e.RELAY_TOKENS,
    models: e.RELAY_MODELS,
    dailyCalls: e.RELAY_DAILY_CALLS,
    bodyMaxBytes: e.RELAY_BODY_MAX_BYTES,
    timeoutMs: e.RELAY_TIMEOUT_MS,
    upstream: e.RELAY_UPSTREAM.replace(/\/+$/, ''),
    port: e.PORT,
  };
}
