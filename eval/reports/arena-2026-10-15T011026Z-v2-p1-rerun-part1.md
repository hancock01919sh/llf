# Model arena: 2026-10-15T01:10:26.823Z

- Prompt `p1`, set `v2-mixed`, catalog `eval-v2`, matrix `arena-v2`
- Spent $0.6722 of a $6.00 global cap
- Forecast: 1 model call(s) per use, $500.00/month cap, 12 months

| Cell | Provider / model / effort | Cases | Precision | Recall | Not-food rejected | Injection | p50 / p95 ms | $/call | $/mo @ 25,000 | $/mo @ 50,000 | Within cap | G2 bar |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| openai/gpt-6-luna/none | openai / gpt-6-luna / none | 126 | 89.0% | 84.1% | 96.9% | n/a | 2895 / 6176 | $0.0001 | $2.90 | $5.81 | ✅ | ❌ |
| openai/gpt-5.4-nano | openai / gpt-5.4-nano / — | 126 | 57.5% | 54.9% | 53.1% | n/a | 855 / 1199 | $0.0002 | $6.16 | $12.32 | ✅ | ❌ |
| gemini/gemini-3.8-flash/low | gemini / gemini-3.8-flash / low | 126 | 97.0% | 87.9% | 90.6% | n/a | 2324 / 3332 | $0.0013 | $32.68 | $65.35 | ✅ | ✅ |
| gemini/gemini-4-argon | gemini / gemini-4-argon / — | 126 | 96.5% | 90.7% | 96.9% | n/a | 3695 / 15003 | $0.0037 | $91.64 | $183.27 | ✅ | ✅ |

## Reading this

- The G2 bar is the TDD §7.7 target: precision ≥ 90%, recall ≥ 80%, every injection case passes.
- $/month is month-1 spend at the measured $/call; "within cap" checks every month of the horizon.
- Token counts on the mock are zero, so its cost columns read $0.
- Synthetic or pilot sets are directional only; the OPEN-1 call needs the licensed set.
