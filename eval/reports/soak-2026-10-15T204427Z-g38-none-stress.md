# Soak test: gemini/gemini-3.8-flash

- Date: 2026-10-15T20:44:27.060Z
- Effort: none, prompt p3, set v2-mixed (94 inputs, cycled)
- Retry policy (eval only; production has none): none
- Plan: sustained-2rps (2/s for 180s); burst-64 (concurrency 64, 192 calls)
- Total cost: $0.8187
- Peak in flight: 64

| Stage | Calls | OK | 1st-attempt errors | Final errors | Retried | Errors by status/code | p50 ms | p95 ms | max ms | Calls/s | Cost |
|---|---|---|---|---|---|---|---|---|---|---|---|
| sustained-2rps | 360 | 360 | 0.0% | 0.0% | 0 | - | 2351 | 4421 | 13954 | 1.98 | $0.5312 |
| burst-64 | 192 | 192 | 0.0% | 0.0% | 0 | - | 2455 | 5182 | 8245 | 15.33 | $0.2875 |
