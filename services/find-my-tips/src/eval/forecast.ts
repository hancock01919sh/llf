/**
 * 12-month AI spend forecast for the arena scorecard (BD3244-37, TDD §9.5).
 * Ad Council's planning numbers from the Oct 8 call: about $500/month in
 * tokens at 25K–50K tool uses/month.
 */
export type ForecastOptions = {
  /** Measured mean $ per model call, from the eval Summary. */
  costPerCallUsd: number;
  /** Model calls per tool use: 1 today, 2 with a separate guardrail pre-check. */
  callsPerUse?: number;
  monthlyCapUsd?: number;
  usesPerMonth?: readonly number[];
  months?: number;
  /** Month-over-month growth in uses, e.g. 0.05 for 5%. */
  monthlyGrowth?: number;
};

export type ForecastRow = {
  usesPerMonth: number;
  /** Spend in month 1. */
  monthlyUsd: number;
  /** Spend over the whole horizon, with growth applied. */
  totalUsd: number;
  /** Highest single month over the horizon. */
  peakMonthlyUsd: number;
  withinCap: boolean;
};

export type Forecast = {
  costPerUseUsd: number;
  callsPerUse: number;
  monthlyCapUsd: number;
  months: number;
  monthlyGrowth: number;
  rows: ForecastRow[];
  /** Uses per month the cap covers at this cost; null when cost is zero. */
  maxUsesUnderCap: number | null;
};

export const DEFAULT_FORECAST = {
  callsPerUse: 1,
  monthlyCapUsd: 500,
  usesPerMonth: [25_000, 50_000],
  months: 12,
  monthlyGrowth: 0,
} as const;

export function forecast(options: ForecastOptions): Forecast {
  const callsPerUse = options.callsPerUse ?? DEFAULT_FORECAST.callsPerUse;
  const monthlyCapUsd = options.monthlyCapUsd ?? DEFAULT_FORECAST.monthlyCapUsd;
  const usesPerMonth = options.usesPerMonth ?? DEFAULT_FORECAST.usesPerMonth;
  const months = options.months ?? DEFAULT_FORECAST.months;
  const monthlyGrowth = options.monthlyGrowth ?? DEFAULT_FORECAST.monthlyGrowth;
  const costPerUseUsd = options.costPerCallUsd * callsPerUse;

  const rows = usesPerMonth.map((uses) => {
    const monthlyUsd = uses * costPerUseUsd;
    let totalUsd = 0;
    let peakMonthlyUsd = 0;
    for (let month = 0; month < months; month += 1) {
      const spend = monthlyUsd * (1 + monthlyGrowth) ** month;
      totalUsd += spend;
      peakMonthlyUsd = Math.max(peakMonthlyUsd, spend);
    }
    return {
      usesPerMonth: uses,
      monthlyUsd,
      totalUsd,
      peakMonthlyUsd,
      withinCap: peakMonthlyUsd <= monthlyCapUsd,
    };
  });

  return {
    costPerUseUsd,
    callsPerUse,
    monthlyCapUsd,
    months,
    monthlyGrowth,
    rows,
    maxUsesUnderCap: costPerUseUsd > 0 ? Math.floor(monthlyCapUsd / costPerUseUsd) : null,
  };
}
