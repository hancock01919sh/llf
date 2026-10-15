# Soak test: gemini/gemini-3.8-flash

- Date: 2026-10-15T20:40:11.637Z
- Effort: none, prompt p3, set v2-mixed (94 inputs, cycled)
- Retry policy (eval only; production has none): none
- Plan: steady (0.05/s for 120s); peak (0.5/s for 120s); burst-8 (concurrency 8, 48 calls); burst-16 (concurrency 16, 64 calls); burst-32 (concurrency 32, 96 calls)
- Total cost: $0.4111
- Peak in flight: 32

| Stage | Calls | OK | 1st-attempt errors | Final errors | Retried | Errors by status/code | p50 ms | p95 ms | max ms | Calls/s | Cost |
|---|---|---|---|---|---|---|---|---|---|---|---|
| steady | 6 | 6 | 0.0% | 0.0% | 0 | - | 2510 | 3998 | 3998 | 0.06 | $0.0088 |
| peak | 60 | 60 | 0.0% | 0.0% | 0 | - | 2731 | 5339 | 6934 | 0.49 | $0.0898 |
| burst-8 | 48 | 48 | 0.0% | 0.0% | 0 | - | 2656 | 4629 | 6727 | 2.57 | $0.0720 |
| burst-16 | 64 | 64 | 0.0% | 0.0% | 0 | - | 2446 | 4646 | 8206 | 3.95 | $0.0971 |
| burst-32 | 96 | 95 | 1.0% | 1.0% | 0 | timeout×1 | 2340 | 4555 | 15003 | 6.40 | $0.1435 |
