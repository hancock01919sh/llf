import { describe, expect, it } from 'vitest';

import { MemoryCounterStore } from './cache';
import { createRateLimiter } from './rate-limit';

function setup() {
  let time = 1_000_000;
  const now = () => time;
  const limiter = createRateLimiter(
    new MemoryCounterStore({ now }),
    { windowMs: 60_000, url: 3, model: 2 },
    now,
  );
  return { limiter, advance: (ms: number) => (time += ms) };
}

describe('createRateLimiter', () => {
  it('allows requests up to the limit, then reports when to retry', async () => {
    const { limiter, advance } = setup();
    expect(await limiter('1.1.1.1', 'text')).toEqual({ allowed: true });
    expect(await limiter('1.1.1.1', 'text')).toEqual({ allowed: true });
    advance(15_500);
    expect(await limiter('1.1.1.1', 'text')).toEqual({ allowed: false, retryAfterSeconds: 45 });
  });

  it('resets after the window', async () => {
    const { limiter, advance } = setup();
    await limiter('1.1.1.1', 'text');
    await limiter('1.1.1.1', 'text');
    advance(60_000);
    expect(await limiter('1.1.1.1', 'text')).toEqual({ allowed: true });
  });

  it('shares one model bucket between image and text', async () => {
    const { limiter } = setup();
    await limiter('1.1.1.1', 'image');
    await limiter('1.1.1.1', 'text');
    expect((await limiter('1.1.1.1', 'image')).allowed).toBe(false);
    expect(await limiter('1.1.1.1', 'url')).toEqual({ allowed: true });
  });

  it('gives URL input its own, larger bucket', async () => {
    const { limiter } = setup();
    for (let i = 0; i < 3; i += 1)
      expect(await limiter('1.1.1.1', 'url')).toEqual({ allowed: true });
    expect((await limiter('1.1.1.1', 'url')).allowed).toBe(false);
  });

  it('keeps buckets per client address', async () => {
    const { limiter } = setup();
    await limiter('1.1.1.1', 'text');
    await limiter('1.1.1.1', 'text');
    expect(await limiter('2.2.2.2', 'text')).toEqual({ allowed: true });
  });

  it('never asks for a retry in under a second', async () => {
    const { limiter, advance } = setup();
    await limiter('1.1.1.1', 'text');
    await limiter('1.1.1.1', 'text');
    advance(59_999);
    expect(await limiter('1.1.1.1', 'text')).toEqual({ allowed: false, retryAfterSeconds: 1 });
  });
});
