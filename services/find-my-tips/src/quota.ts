import type { InputType } from '@llf/contracts/find-tips';

import type { CounterStore } from './cache';

const DAY_MS = 24 * 60 * 60_000;

function utcDay(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

function msUntilNextUtcDay(now: number): number {
  return DAY_MS - (now % DAY_MS);
}

/**
 * Daily model-call budget per input type, reset at 00:00 UTC (TDD §7.7).
 * When a budget is spent the tool degrades to jsonld-only for that type.
 */
export function createQuota(store: CounterStore, dailyLimit: number, now = Date.now) {
  const key = (inputType: InputType) => `quota#${inputType}#${utcDay(now())}`;
  return {
    async exhausted(inputType: InputType): Promise<boolean> {
      return (await store.peek(key(inputType))) >= dailyLimit;
    },
    async consume(inputType: InputType): Promise<void> {
      await store.increment(key(inputType), msUntilNextUtcDay(now()));
    },
  };
}

export type Quota = ReturnType<typeof createQuota>;
