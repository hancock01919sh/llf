import { describe, expect, it } from 'vitest';
import { DEFAULT_FORECAST, forecast } from './forecast';

describe('forecast', () => {
  it('uses the Oct 8 planning defaults: $500 cap, 25K and 50K uses, 12 months', () => {
    const f = forecast({ costPerCallUsd: 0.001 });
    expect(f.monthlyCapUsd).toBe(500);
    expect(f.months).toBe(12);
    expect(f.rows.map((row) => row.usesPerMonth)).toEqual([...DEFAULT_FORECAST.usesPerMonth]);
    expect(f.rows[0]).toEqual({
      usesPerMonth: 25_000,
      monthlyUsd: 25,
      totalUsd: 300,
      peakMonthlyUsd: 25,
      withinCap: true,
    });
    expect(f.rows[1]?.monthlyUsd).toBe(50);
    expect(f.maxUsesUnderCap).toBe(500_000);
  });

  it('doubles cost per use when a guardrail pre-check adds a second call', () => {
    const f = forecast({ costPerCallUsd: 0.006, callsPerUse: 2 });
    expect(f.costPerUseUsd).toBeCloseTo(0.012);
    expect(f.rows[0]?.monthlyUsd).toBeCloseTo(300);
    expect(f.rows[0]?.withinCap).toBe(true);
    expect(f.rows[1]?.monthlyUsd).toBeCloseTo(600);
    expect(f.rows[1]?.withinCap).toBe(false);
    expect(f.maxUsesUnderCap).toBe(41_666);
  });

  it('applies monthly growth and checks the peak month against the cap', () => {
    const f = forecast({
      costPerCallUsd: 0.01,
      usesPerMonth: [40_000],
      months: 3,
      monthlyGrowth: 0.25,
    });
    const row = f.rows[0];
    expect(row?.monthlyUsd).toBeCloseTo(400);
    expect(row?.peakMonthlyUsd).toBeCloseTo(625);
    expect(row?.totalUsd).toBeCloseTo(400 + 500 + 625);
    expect(row?.withinCap).toBe(false);
  });

  it('returns null break-even volume when the cost is zero (mock runs)', () => {
    const f = forecast({ costPerCallUsd: 0 });
    expect(f.maxUsesUnderCap).toBeNull();
    expect(f.rows.every((row) => row.withinCap && row.totalUsd === 0)).toBe(true);
  });
});
