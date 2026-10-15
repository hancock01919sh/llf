# Model arena: 2026-10-15T00:14:24.502Z

- Prompt `p3`, set `v2-recipes`, catalog `eval-v2`, matrix `arena-recipes-v1`, URL path `model`
- Spent $1.5732 of a $6.00 global cap
- Forecast: 1 model call(s) per use, $500.00/month cap, 12 months

| Cell | Provider / model / effort | Cases | Precision | Recall | Not-food rejected | Injection | p50 / p95 ms | $/call | $/mo @ 25,000 | $/mo @ 50,000 | Within cap | G2 bar |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mock | mock / mock-1 / — | 61 | 81.3% | 47.5% | 0.0% | 33.3% | 1 / 239 | $0.0000 | $0.00 | $0.00 | ✅ | ❌ |
| openai/gpt-6-luna/none | openai / gpt-6-luna / none | 61 | 100.0% | 100.0% | 100.0% | 100.0% | 1720 / 3288 | $0.0002 | $4.52 | $9.04 | ✅ | ✅ |
| gemini/gemini-3.5-flash-lite | gemini / gemini-3.5-flash-lite / — | 61 | 100.0% | 99.7% | 100.0% | 100.0% | 1041 / 1827 | $0.0009 | $23.10 | $46.20 | ✅ | ✅ |
| gemini/gemini-3.8-flash | gemini / gemini-3.8-flash / — | 61 | 100.0% | 85.7% | 100.0% | 100.0% | 3687 / 15001 | $0.0019 | $46.50 | $93.00 | ✅ | ✅ |
| gemini/gemini-3.8-flash/none | gemini / gemini-3.8-flash / none | 61 | 100.0% | 98.0% | 100.0% | 100.0% | 2247 / 6217 | $0.0014 | $35.40 | $70.80 | ✅ | ✅ |
| gemini/gemini-3.8-flash/low | gemini / gemini-3.8-flash / low | 61 | 100.0% | 100.0% | 100.0% | 100.0% | 2085 / 3933 | $0.0015 | $37.51 | $75.01 | ✅ | ✅ |
| anthropic/claude-sonnet-5-5 | anthropic / claude-sonnet-5-5 / — | 61 | 100.0% | 100.0% | 100.0% | 100.0% | 2275 / 4836 | $0.0067 | $166.91 | $333.83 | ✅ | ✅ |
| anthropic/claude-opus-5-5 (reference) | anthropic / claude-opus-5-5 / — | 61 | 100.0% | 100.0% | 100.0% | 100.0% | 3193 / 7600 | $0.0132 | $330.80 | $661.59 | ❌ | ✅ |

## What the budget buys

Reference: **anthropic/claude-opus-5-5**, precision 100.0%, recall 100.0%, not-food rejected 100.0%, $330.80/mo @ 25,000, $661.59/mo @ 50,000 (over the $500.00/month cap).

Best within the $500.00/month cap: **openai/gpt-6-luna/none**, precision 100.0% (±0.0 pp), recall 100.0% (±0.0 pp), $4.52/mo @ 25,000, $9.04/mo @ 50,000.

| Cell | Precision | vs ref | Recall | vs ref | Not-food rejected | vs ref | $/mo @ 25,000 | $/mo @ 50,000 | Within cap |
|---|---|---|---|---|---|---|---|---|---|
| **anthropic/claude-opus-5-5** (reference) | 100.0% | — | 100.0% | — | 100.0% | — | $330.80 | $661.59 | ❌ |
| openai/gpt-6-luna/none | 100.0% | ±0.0 pp | 100.0% | ±0.0 pp | 100.0% | ±0.0 pp | $4.52 | $9.04 | ✅ |
| gemini/gemini-3.5-flash-lite | 100.0% | ±0.0 pp | 99.7% | −0.3 pp | 100.0% | ±0.0 pp | $23.10 | $46.20 | ✅ |
| gemini/gemini-3.8-flash/none | 100.0% | ±0.0 pp | 98.0% | −2.0 pp | 100.0% | ±0.0 pp | $35.40 | $70.80 | ✅ |
| gemini/gemini-3.8-flash/low | 100.0% | ±0.0 pp | 100.0% | ±0.0 pp | 100.0% | ±0.0 pp | $37.51 | $75.01 | ✅ |
| gemini/gemini-3.8-flash | 100.0% | ±0.0 pp | 85.7% | −14.3 pp | 100.0% | ±0.0 pp | $46.50 | $93.00 | ✅ |
| anthropic/claude-sonnet-5-5 | 100.0% | ±0.0 pp | 100.0% | ±0.0 pp | 100.0% | ±0.0 pp | $166.91 | $333.83 | ✅ |

Candidates are sorted by cost. "Best" is the highest F1 (precision and recall combined) among candidates within the cap. The reference shows what quality is possible, whatever it costs.

### What openai/gpt-6-luna/none misses out on

- **Ingredients missed** that the reference found: 0
- **Wrong ingredients added** that the reference avoided: 0
- **Non-food images treated as food** that the reference rejected: 0
- **Failed calls** where the reference answered: 0
- In the other direction, openai/gpt-6-luna/none found 0 ingredient(s) the reference missed, avoided 0 wrong one(s) the reference added, and rejected 0 non-food image(s) the reference accepted.

## Reading this

- The G2 bar is the TDD §7.7 target: precision ≥ 90%, recall ≥ 80%, every injection case passes.
- $/month is month-1 spend at the measured $/call; "within cap" checks every month of the horizon.
- Token counts on the mock are zero, so its cost columns read $0.
- Synthetic or pilot sets are directional only; the OPEN-1 call needs the licensed set.
