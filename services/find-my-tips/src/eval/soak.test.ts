import { describe, expect, it } from 'vitest';

import type { ExtractionInput, ExtractionProvider } from '../extract';
import { ToolError } from '../http';
import { runSoak, summarizeSoak, type SoakOptions, type SoakRecord } from './soak';

const OK = { readable: true, detectedType: 'fridge_photo', items: [] };
const inputs: ExtractionInput[] = [
  { kind: 'text', text: 'milk' },
  { kind: 'text', text: 'eggs' },
];

type Script = (call: number) => number | 'ok';

/** Latency is real but tiny; `script(callNumber)` returns an HTTP status to fail with, or 'ok'. */
function fakeProvider(script: Script, latencyMs = 5) {
  const state = { calls: 0, inFlight: 0, peak: 0 };
  const provider: ExtractionProvider = {
    name: 'fake',
    async extract() {
      state.calls += 1;
      const call = state.calls;
      state.inFlight += 1;
      state.peak = Math.max(state.peak, state.inFlight);
      await new Promise((done) => setTimeout(done, latencyMs));
      state.inFlight -= 1;
      const verdict = script(call);
      if (verdict !== 'ok') throw Object.assign(new Error(`HTTP ${verdict}`), { status: verdict });
      return { result: OK, usage: { inputTokens: 1000, outputTokens: 100 } };
    },
  };
  return { provider, state };
}

const base = (provider: ExtractionProvider): SoakOptions => ({
  provider,
  model: 'm',
  promptVersion: 'p3',
  timeoutMs: 1000,
  inputs,
  plan: [{ name: 's', concurrency: 2, calls: 6 }],
  pricing: { inputPerMTok: 1, outputPerMTok: 10 },
  retries: { max: 0, baseDelayMs: 10 },
});

describe('runSoak', () => {
  it('runs each stage in order with the planned call count and cap', async () => {
    const { provider, state } = fakeProvider(() => 'ok');
    const run = await runSoak({
      ...base(provider),
      plan: [
        { name: 'a', concurrency: 3, calls: 9 },
        { name: 'b', ratePerSec: 200, durationSec: 0.05 },
      ],
    });
    expect(run.records.map((r) => r.stage).filter((s) => s === 'a')).toHaveLength(9);
    expect(run.records.filter((r) => r.stage === 'b')).toHaveLength(10);
    expect(state.calls).toBe(19);
    expect(run.records.slice(0, 9).every((r) => r.stage === 'a')).toBe(true);
    expect(run.peakInFlight).toBeLessThanOrEqual(64);
    expect(run.records[0]?.costUsd).toBeCloseTo(0.002);
  });

  it('respects the concurrency cap', async () => {
    const { provider, state } = fakeProvider(() => 'ok');
    await runSoak({ ...base(provider), plan: [{ name: 's', concurrency: 4, calls: 20 }] });
    expect(state.peak).toBe(4);
  });

  it('records errors without retries', async () => {
    const { provider } = fakeProvider((n) => (n % 2 === 0 ? 429 : 'ok'));
    const run = await runSoak(base(provider));
    const [s] = summarizeSoak(run.records);
    expect(s?.calls).toBe(6);
    expect(s?.firstAttemptErrorRate).toBeCloseTo(0.5);
    expect(s?.finalErrorRate).toBeCloseTo(0.5);
    expect(s?.byProviderStatus).toEqual({ '429': 3 });
  });

  it('retries 429/503 with backoff and separates first-attempt from final errors', async () => {
    const { provider, state } = fakeProvider((n) => (n === 1 ? 429 : n === 2 ? 503 : 'ok'));
    const sleeps: number[] = [];
    const run = await runSoak({
      ...base(provider),
      plan: [{ name: 's', concurrency: 1, calls: 2 }],
      retries: { max: 3, baseDelayMs: 100 },
      random: () => 1,
      sleep: async (ms) => {
        sleeps.push(ms);
      },
    });
    expect(state.calls).toBe(4);
    expect(sleeps).toEqual([100, 200]);
    const [first, second] = run.records;
    expect(first).toMatchObject({
      attempts: 3,
      outcome: 'ok',
      firstOutcome: 'upstream_error',
      firstProviderStatus: 429,
    });
    expect(second).toMatchObject({ attempts: 1, outcome: 'ok' });
    const [s] = summarizeSoak(run.records);
    expect(s?.firstAttemptErrorRate).toBeCloseTo(0.5);
    expect(s?.finalErrorRate).toBe(0);
    expect(s?.retriedCalls).toBe(1);
  });

  it('gives up after max retries and does not retry non-retryable statuses', async () => {
    const always = fakeProvider(() => 503);
    const run = await runSoak({
      ...base(always.provider),
      plan: [{ name: 's', concurrency: 1, calls: 1 }],
      retries: { max: 2, baseDelayMs: 1 },
    });
    expect(run.records[0]).toMatchObject({
      attempts: 3,
      outcome: 'upstream_error',
      providerStatus: 503,
    });

    const bad = fakeProvider(() => 400);
    const run2 = await runSoak({
      ...base(bad.provider),
      plan: [{ name: 's', concurrency: 1, calls: 1 }],
      retries: { max: 2, baseDelayMs: 1 },
    });
    expect(run2.records[0]?.attempts).toBe(1);
  });

  it('does not retry timeouts', async () => {
    const { provider, state } = fakeProvider(() => 'ok', 50);
    const run = await runSoak({
      ...base(provider),
      timeoutMs: 5,
      plan: [{ name: 's', concurrency: 1, calls: 1 }],
      retries: { max: 2, baseDelayMs: 1 },
    });
    expect(state.calls).toBe(1);
    expect(run.records[0]).toMatchObject({ outcome: 'timeout', attempts: 1 });
  });

  it('stops launching calls once the budget is spent', async () => {
    const { provider } = fakeProvider(() => 'ok');
    const run = await runSoak({
      ...base(provider),
      plan: [
        { name: 'a', concurrency: 1, calls: 10 },
        { name: 'b', concurrency: 1, calls: 5 },
      ],
      budgetUsd: 0.0045,
    });
    expect(run.stoppedEarly).toBe(true);
    expect(run.records).toHaveLength(3);
    expect(run.skipped).toBe(12);
  });
});

describe('summarizeSoak', () => {
  it('computes percentiles, throughput and cost per stage', () => {
    const records: SoakRecord[] = Array.from({ length: 10 }, (_, i) => ({
      stage: 'x',
      startedAtMs: i * 1000,
      latencyMs: (i + 1) * 100,
      outcome: i === 9 ? 'timeout' : 'ok',
      attempts: 1,
      firstOutcome: i === 9 ? 'timeout' : 'ok',
      inputTokens: 0,
      outputTokens: 0,
      costUsd: 0.01,
    }));
    const [s] = summarizeSoak(records);
    expect(s).toMatchObject({
      calls: 10,
      ok: 9,
      latencyP50Ms: 500,
      latencyP95Ms: 1000,
      latencyMaxMs: 1000,
    });
    expect(s?.finalErrorRate).toBeCloseTo(0.1);
    expect(s?.byOutcome).toEqual({ timeout: 1 });
    expect(s?.throughputPerSec).toBeCloseTo(10 / 10);
    expect(s?.costUsd).toBeCloseTo(0.1);
  });

  it('counts ToolError codes without a status', async () => {
    const provider: ExtractionProvider = {
      name: 'f',
      async extract() {
        throw new ToolError('upstream_error');
      },
    };
    const run = await runSoak({
      ...base(provider),
      plan: [{ name: 's', concurrency: 1, calls: 2 }],
    });
    expect(summarizeSoak(run.records)[0]?.byOutcome).toEqual({ upstream_error: 2 });
  });
});
