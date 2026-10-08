/**
 * Key/value store for the URL cache (TDD §7.5). Phase A: Render Key Value;
 * Phase B: DynamoDB with TTL. The scaffold ships the in-memory version.
 */
export interface CacheStore {
  get(key: string): Promise<string | undefined>;
  set(key: string, value: string, ttlMs: number): Promise<void>;
}

type Entry = { value: string; expiresAt: number };

export class MemoryCacheStore implements CacheStore {
  readonly #entries = new Map<string, Entry>();
  readonly #now: () => number;
  readonly #maxEntries: number;

  constructor(options: { now?: () => number; maxEntries?: number } = {}) {
    this.#now = options.now ?? Date.now;
    this.#maxEntries = options.maxEntries ?? 5000;
  }

  async get(key: string): Promise<string | undefined> {
    const entry = this.#entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= this.#now()) {
      this.#entries.delete(key);
      return undefined;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlMs: number): Promise<void> {
    this.#entries.delete(key);
    if (this.#entries.size >= this.#maxEntries) {
      const oldest = this.#entries.keys().next().value;
      if (oldest !== undefined) this.#entries.delete(oldest);
    }
    this.#entries.set(key, { value, expiresAt: this.#now() + ttlMs });
  }
}

/** Atomic counters for rate limits and quotas (Redis INCR / DynamoDB ADD). */
export interface CounterStore {
  /** Increment `key` by 1 and return the new value; the window starts on first increment. */
  increment(key: string, windowMs: number): Promise<{ count: number; resetAt: number }>;
  peek(key: string): Promise<number>;
}

type Counter = { count: number; resetAt: number };

export class MemoryCounterStore implements CounterStore {
  readonly #counters = new Map<string, Counter>();
  readonly #now: () => number;

  constructor(options: { now?: () => number } = {}) {
    this.#now = options.now ?? Date.now;
  }

  async increment(key: string, windowMs: number): Promise<Counter> {
    const now = this.#now();
    const current = this.#counters.get(key);
    const next =
      current && current.resetAt > now
        ? { count: current.count + 1, resetAt: current.resetAt }
        : { count: 1, resetAt: now + windowMs };
    this.#counters.set(key, next);
    this.#sweep(now);
    return next;
  }

  async peek(key: string): Promise<number> {
    const current = this.#counters.get(key);
    if (!current || current.resetAt <= this.#now()) return 0;
    return current.count;
  }

  #sweep(now: number): void {
    if (this.#counters.size < 10_000) return;
    for (const [key, counter] of this.#counters) {
      if (counter.resetAt <= now) this.#counters.delete(key);
    }
  }
}
