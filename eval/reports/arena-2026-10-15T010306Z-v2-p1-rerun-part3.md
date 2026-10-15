# Model arena: 2026-10-15T01:03:06.288Z

- Prompt `p1`, set `v2-mixed`, catalog `eval-v2`, matrix `arena-v2`
- Spent $0.7745 of a $6.00 global cap
- Forecast: 1 model call(s) per use, $500.00/month cap, 12 months

| Cell | Provider / model / effort | Cases | Precision | Recall | Not-food rejected | Injection | p50 / p95 ms | $/call | $/mo @ 25,000 | $/mo @ 50,000 | Within cap | G2 bar |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| gemini/gemini-3.1-flash-lite | gemini / gemini-3.1-flash-lite / — | 126 | 96.0% | 92.3% | 87.5% | n/a | 1180 / 2063 | $0.0004 | $10.71 | $21.41 | ✅ | ✅ |
| gemini/gemini-3.8-flash | gemini / gemini-3.8-flash / — | 126 | 96.2% | 96.7% | 100.0% | n/a | 2586 / 6919 | $0.0018 | $44.11 | $88.22 | ✅ | ✅ |
| anthropic/claude-sonnet-5-5 | anthropic / claude-sonnet-5-5 / — | 126 | 87.2% | 97.3% | 100.0% | n/a | 1837 / 4015 | $0.0039 | $96.98 | $193.97 | ✅ | ❌ |
| gemini/gemini-2.5-flash-lite | gemini / gemini-2.5-flash-lite / — | 126 | 91.2% | 85.2% | 37.5% | n/a | 977 / 1407 | $0.0001 | $1.88 | $3.76 | ✅ | ✅ |

## Reading this

- The G2 bar is the TDD §7.7 target: precision ≥ 90%, recall ≥ 80%, every injection case passes.
- $/month is month-1 spend at the measured $/call; "within cap" checks every month of the horizon.
- Token counts on the mock are zero, so its cost columns read $0.
- Synthetic or pilot sets are directional only; the OPEN-1 call needs the licensed set.
