import { describe, expect, it } from 'vitest';

import { MemoryCacheStore, MemoryCounterStore } from './cache';

describe('MemoryCacheStore', () => {
  it('expires entries after their TTL', async () => {
    let time = 0;
    const cache = new MemoryCacheStore({ now: () => time });
    await cache.set('a', '1', 100);
    time = 99;
    expect(await cache.get('a')).toBe('1');
    time = 100;
    expect(await cache.get('a')).toBeUndefined();
  });

  it('evicts the oldest entry when full', async () => {
    const cache = new MemoryCacheStore({ maxEntries: 2 });
    await cache.set('a', '1', 60_000);
    await cache.set('b', '2', 60_000);
    await cache.set('a', '1b', 60_000);
    await cache.set('c', '3', 60_000);
    expect(await cache.get('b')).toBeUndefined();
    expect(await cache.get('a')).toBe('1b');
    expect(await cache.get('c')).toBe('3');
  });
});

describe('MemoryCounterStore', () => {
  it('counts within a window and resets after it', async () => {
    let time = 0;
    const counters = new MemoryCounterStore({ now: () => time });
    expect(await counters.increment('k', 1_000)).toEqual({ count: 1, resetAt: 1_000 });
    time = 500;
    expect(await counters.increment('k', 1_000)).toEqual({ count: 2, resetAt: 1_000 });
    time = 1_000;
    expect(await counters.increment('k', 1_000)).toEqual({ count: 1, resetAt: 2_000 });
  });

  it('peeks without incrementing', async () => {
    let time = 0;
    const counters = new MemoryCounterStore({ now: () => time });
    expect(await counters.peek('k')).toBe(0);
    await counters.increment('k', 1_000);
    expect(await counters.peek('k')).toBe(1);
    expect(await counters.peek('k')).toBe(1);
    time = 1_000;
    expect(await counters.peek('k')).toBe(0);
  });
});
