# Model arena: 2026-10-15T01:01:37.098Z

- Prompt `p1`, set `v2-mixed`, catalog `eval-v2`, matrix `arena-v2`
- Spent $0.5239 of a $6.00 global cap
- Forecast: 1 model call(s) per use, $500.00/month cap, 12 months

| Cell | Provider / model / effort | Cases | Precision | Recall | Not-food rejected | Injection | p50 / p95 ms | $/call | $/mo @ 25,000 | $/mo @ 50,000 | Within cap | G2 bar |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| anthropic/claude-haiku-5-5 | anthropic / claude-haiku-5-5 / — | 126 | 82.7% | 86.8% | 96.9% | n/a | 2067 / 3702 | $0.0003 | $6.60 | $13.19 | ✅ | ❌ |
| openai/gpt-5.4-mini | openai / gpt-5.4-mini / — | 126 | 86.5% | 80.8% | 84.4% | n/a | 684 / 999 | $0.0009 | $22.79 | $45.59 | ✅ | ❌ |
| openai/gpt-6.1-sol/low | openai / gpt-6.1-sol / low | 126 | 87.8% | 90.7% | 100.0% | n/a | 2689 / 4061 | $0.0026 | $65.75 | $131.49 | ✅ | ❌ |
| openai/gpt-5-mini/minimal | openai / gpt-5-mini / minimal | 126 | 89.1% | 89.6% | 87.5% | n/a | 1065 / 1635 | $0.0004 | $8.81 | $17.61 | ✅ | ❌ |

## Reading this

- The G2 bar is the TDD §7.7 target: precision ≥ 90%, recall ≥ 80%, every injection case passes.
- $/month is month-1 spend at the measured $/call; "within cap" checks every month of the horizon.
- Token counts on the mock are zero, so its cost columns read $0.
- Synthetic or pilot sets are directional only; the OPEN-1 call needs the licensed set.
