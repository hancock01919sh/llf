# Model arena: 2026-10-14T23:36:52.914Z

- Prompt `p3`, set `v2-recipes`, catalog `eval-v2`, matrix `arena-recipes-v1`, URL path `pipeline`
- Spent $0.8572 of a $6.00 global cap
- Forecast: 1 model call(s) per use, $500.00/month cap, 12 months

| Cell | Provider / model / effort | Cases | Precision | Recall | Not-food rejected | Injection | p50 / p95 ms | $/call | $/mo @ 25,000 | $/mo @ 50,000 | Within cap | G2 bar |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mock | mock / mock-1 / — | 61 | 97.8% | 59.1% | 0.0% | 33.3% | 1 / 280 | $0.0000 | $0.00 | $0.00 | ✅ | ❌ |
| openai/gpt-6-luna/none | openai / gpt-6-luna / none | 61 | 99.7% | 99.7% | 100.0% | 100.0% | 1387 / 1950 | $0.0001 | $2.29 | $4.57 | ✅ | ✅ |
| gemini/gemini-3.5-flash-lite | gemini / gemini-3.5-flash-lite / — | 61 | 100.0% | 99.7% | 100.0% | 100.0% | 1121 / 1452 | $0.0005 | $12.62 | $25.23 | ✅ | ✅ |
| gemini/gemini-3.8-flash | gemini / gemini-3.8-flash / — | 61 | 100.0% | 90.4% | 100.0% | 33.3% | 2343 / 5771 | $0.0011 | $27.32 | $54.64 | ✅ | ❌ |
| gemini/gemini-3.8-flash/none | gemini / gemini-3.8-flash / none | 61 | 99.7% | 99.3% | 100.0% | 100.0% | 1639 / 3150 | $0.0007 | $17.81 | $35.63 | ✅ | ✅ |
| gemini/gemini-3.8-flash/low | gemini / gemini-3.8-flash / low | 61 | 100.0% | 99.7% | 100.0% | 100.0% | 1659 / 3319 | $0.0007 | $18.26 | $36.53 | ✅ | ✅ |
| anthropic/claude-sonnet-5-5 | anthropic / claude-sonnet-5-5 / — | 61 | 100.0% | 100.0% | 100.0% | 100.0% | 2033 / 4646 | $0.0037 | $91.39 | $182.79 | ✅ | ✅ |
| anthropic/claude-opus-5-5 (reference) | anthropic / claude-opus-5-5 / — | 61 | 100.0% | 100.0% | 100.0% | 100.0% | 2264 / 4337 | $0.0073 | $181.62 | $363.24 | ✅ | ✅ |

## What the budget buys

Reference: **anthropic/claude-opus-5-5**, precision 100.0%, recall 100.0%, not-food rejected 100.0%, $181.62/mo @ 25,000, $363.24/mo @ 50,000.

Best within the $500.00/month cap: **anthropic/claude-sonnet-5-5**, precision 100.0% (±0.0 pp), recall 100.0% (±0.0 pp), $91.39/mo @ 25,000, $182.79/mo @ 50,000.

| Cell | Precision | vs ref | Recall | vs ref | Not-food rejected | vs ref | $/mo @ 25,000 | $/mo @ 50,000 | Within cap |
|---|---|---|---|---|---|---|---|---|---|
| **anthropic/claude-opus-5-5** (reference) | 100.0% | — | 100.0% | — | 100.0% | — | $181.62 | $363.24 | ✅ |
| openai/gpt-6-luna/none | 99.7% | −0.3 pp | 99.7% | −0.3 pp | 100.0% | ±0.0 pp | $2.29 | $4.57 | ✅ |
| gemini/gemini-3.5-flash-lite | 100.0% | ±0.0 pp | 99.7% | −0.3 pp | 100.0% | ±0.0 pp | $12.62 | $25.23 | ✅ |
| gemini/gemini-3.8-flash/none | 99.7% | −0.3 pp | 99.3% | −0.7 pp | 100.0% | ±0.0 pp | $17.81 | $35.63 | ✅ |
| gemini/gemini-3.8-flash/low | 100.0% | ±0.0 pp | 99.7% | −0.3 pp | 100.0% | ±0.0 pp | $18.26 | $36.53 | ✅ |
| gemini/gemini-3.8-flash | 100.0% | ±0.0 pp | 90.4% | −9.6 pp | 100.0% | ±0.0 pp | $27.32 | $54.64 | ✅ |
| anthropic/claude-sonnet-5-5 | 100.0% | ±0.0 pp | 100.0% | ±0.0 pp | 100.0% | ±0.0 pp | $91.39 | $182.79 | ✅ |

Candidates are sorted by cost. "Best" is the highest F1 (precision and recall combined) among candidates within the cap. The reference shows what quality is possible, whatever it costs.

### What anthropic/claude-sonnet-5-5 misses out on

- **Ingredients missed** that the reference found: 0
- **Wrong ingredients added** that the reference avoided: 0
- **Non-food images treated as food** that the reference rejected: 0
- **Failed calls** where the reference answered: 0
- In the other direction, anthropic/claude-sonnet-5-5 found 0 ingredient(s) the reference missed, avoided 0 wrong one(s) the reference added, and rejected 0 non-food image(s) the reference accepted.

## Reading this

- The G2 bar is the TDD §7.7 target: precision ≥ 90%, recall ≥ 80%, every injection case passes.
- $/month is month-1 spend at the measured $/call; "within cap" checks every month of the horizon.
- Token counts on the mock are zero, so its cost columns read $0.
- Synthetic or pilot sets are directional only; the OPEN-1 call needs the licensed set.
