# Model arena: 2026-10-14T23:41:48.686Z

- Prompt `p3`, set `v2-recipes`, catalog `eval-v2`, matrix `arena-recipes-v1`, URL path `model`
- Spent $1.5893 of a $6.00 global cap
- Forecast: 1 model call(s) per use, $500.00/month cap, 12 months

| Cell | Provider / model / effort | Cases | Precision | Recall | Not-food rejected | Injection | p50 / p95 ms | $/call | $/mo @ 25,000 | $/mo @ 50,000 | Within cap | G2 bar |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mock | mock / mock-1 / — | 61 | 81.4% | 47.5% | 0.0% | 33.3% | 1 / 279 | $0.0000 | $0.00 | $0.00 | ✅ | ❌ |
| openai/gpt-6-luna/none | openai / gpt-6-luna / none | 61 | 100.0% | 99.3% | 100.0% | 100.0% | 1528 / 2495 | $0.0002 | $4.52 | $9.03 | ✅ | ✅ |
| gemini/gemini-3.5-flash-lite | gemini / gemini-3.5-flash-lite / — | 61 | 99.3% | 100.0% | 100.0% | 100.0% | 1177 / 1761 | $0.0009 | $23.18 | $46.37 | ✅ | ✅ |
| gemini/gemini-3.8-flash | gemini / gemini-3.8-flash / — | 61 | 100.0% | 82.5% | 100.0% | 100.0% | 2535 / 7836 | $0.0020 | $50.80 | $101.61 | ✅ | ✅ |
| gemini/gemini-3.8-flash/none | gemini / gemini-3.8-flash / none | 61 | 99.7% | 99.7% | 100.0% | 100.0% | 1832 / 4744 | $0.0015 | $37.77 | $75.54 | ✅ | ✅ |
| gemini/gemini-3.8-flash/low | gemini / gemini-3.8-flash / low | 61 | 100.0% | 99.7% | 100.0% | 100.0% | 1895 / 3615 | $0.0015 | $36.72 | $73.44 | ✅ | ✅ |
| anthropic/claude-sonnet-5-5 | anthropic / claude-sonnet-5-5 / — | 61 | 100.0% | 99.7% | 100.0% | 100.0% | 2146 / 4813 | $0.0067 | $166.96 | $333.91 | ✅ | ✅ |
| anthropic/claude-opus-5-5 (reference) | anthropic / claude-opus-5-5 / — | 61 | 100.0% | 99.7% | 100.0% | 100.0% | 3399 / 6778 | $0.0133 | $331.40 | $662.79 | ❌ | ✅ |

## What the budget buys

Reference: **anthropic/claude-opus-5-5**, precision 100.0%, recall 99.7%, not-food rejected 100.0%, $331.40/mo @ 25,000, $662.79/mo @ 50,000 (over the $500.00/month cap).

Best within the $500.00/month cap: **gemini/gemini-3.8-flash/low**, precision 100.0% (±0.0 pp), recall 99.7% (±0.0 pp), $36.72/mo @ 25,000, $73.44/mo @ 50,000.

| Cell | Precision | vs ref | Recall | vs ref | Not-food rejected | vs ref | $/mo @ 25,000 | $/mo @ 50,000 | Within cap |
|---|---|---|---|---|---|---|---|---|---|
| **anthropic/claude-opus-5-5** (reference) | 100.0% | — | 99.7% | — | 100.0% | — | $331.40 | $662.79 | ❌ |
| openai/gpt-6-luna/none | 100.0% | ±0.0 pp | 99.3% | −0.3 pp | 100.0% | ±0.0 pp | $4.52 | $9.03 | ✅ |
| gemini/gemini-3.5-flash-lite | 99.3% | −0.7 pp | 100.0% | +0.3 pp | 100.0% | ±0.0 pp | $23.18 | $46.37 | ✅ |
| gemini/gemini-3.8-flash/low | 100.0% | ±0.0 pp | 99.7% | ±0.0 pp | 100.0% | ±0.0 pp | $36.72 | $73.44 | ✅ |
| gemini/gemini-3.8-flash/none | 99.7% | −0.3 pp | 99.7% | ±0.0 pp | 100.0% | ±0.0 pp | $37.77 | $75.54 | ✅ |
| gemini/gemini-3.8-flash | 100.0% | ±0.0 pp | 82.5% | −17.2 pp | 100.0% | ±0.0 pp | $50.80 | $101.61 | ✅ |
| anthropic/claude-sonnet-5-5 | 100.0% | ±0.0 pp | 99.7% | ±0.0 pp | 100.0% | ±0.0 pp | $166.96 | $333.91 | ✅ |

Candidates are sorted by cost. "Best" is the highest F1 (precision and recall combined) among candidates within the cap. The reference shows what quality is possible, whatever it costs.

### What gemini/gemini-3.8-flash/low misses out on

- **Ingredients missed** that the reference found: 1 (`beef`)
- **Wrong ingredients added** that the reference avoided: 0
- **Non-food images treated as food** that the reference rejected: 0
- **Failed calls** where the reference answered: 0
- In the other direction, gemini/gemini-3.8-flash/low found 1 ingredient(s) the reference missed, avoided 0 wrong one(s) the reference added, and rejected 0 non-food image(s) the reference accepted.

Largest gaps by case:

| Case | Missed | Wrongly added |
|---|---|---|
| `meal-sunday-roast` | `beef` | — |

## Reading this

- The G2 bar is the TDD §7.7 target: precision ≥ 90%, recall ≥ 80%, every injection case passes.
- $/month is month-1 spend at the measured $/call; "within cap" checks every month of the horizon.
- Token counts on the mock are zero, so its cost columns read $0.
- Synthetic or pilot sets are directional only; the OPEN-1 call needs the licensed set.
