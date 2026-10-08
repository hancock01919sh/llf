import type { InputType } from '@llf/contracts/find-tips';

import type { CounterStore } from './cache';

export type RateLimitConfig = { windowMs: number; url: number; model: number };

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

/**
 * Fixed-window per-IP limit (TDD §7.6). Image and text share the model
 * budget; URLs get a larger one because most resolve via JSON-LD or cache.
 */
export function createRateLimiter(store: CounterStore, config: RateLimitConfig, now = Date.now) {
  return async function check(ip: string, inputType: InputType): Promise<RateLimitResult> {
    const bucket = inputType === 'url' ? 'url' : 'model';
    const limit = bucket === 'url' ? config.url : config.model;
    const { count, resetAt } = await store.increment(`rl#${bucket}#${ip}`, config.windowMs);
    if (count <= limit) return { allowed: true };
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((resetAt - now()) / 1000)) };
  };
}
