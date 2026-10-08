import { describe, expect, it } from 'vitest';

import { MemoryCounterStore } from './cache';
import { createQuota } from './quota';

describe('createQuota', () => {
  it('is exhausted once the daily limit is spent', async () => {
    const now = () => Date.UTC(2025, 5, 1, 12);
    const quota = createQuota(new MemoryCounterStore({ now }), 2, now);
    expect(await quota.exhausted('text')).toBe(false);
    await quota.consume('text');
    expect(await quota.exhausted('text')).toBe(false);
    await quota.consume('text');
    expect(await quota.exhausted('text')).toBe(true);
  });

  it('keeps a separate budget per input type', async () => {
    const now = () => Date.UTC(2025, 5, 1, 12);
    const quota = createQuota(new MemoryCounterStore({ now }), 1, now);
    await quota.consume('image');
    expect(await quota.exhausted('image')).toBe(true);
    expect(await quota.exhausted('text')).toBe(false);
    expect(await quota.exhausted('url')).toBe(false);
  });

  it('resets at midnight UTC', async () => {
    let time = Date.UTC(2025, 5, 1, 23, 59);
    const now = () => time;
    const quota = createQuota(new MemoryCounterStore({ now }), 1, now);
    await quota.consume('url');
    expect(await quota.exhausted('url')).toBe(true);
    time = Date.UTC(2025, 5, 2, 0, 0);
    expect(await quota.exhausted('url')).toBe(false);
  });
});
