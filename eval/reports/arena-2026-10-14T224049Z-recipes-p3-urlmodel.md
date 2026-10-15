# Model arena: 2026-10-14T22:40:49.013Z

- Prompt `p3`, set `v2-recipes`, catalog `eval-v2`, matrix `arena-recipes-v1`, URL path `model`
- Spent $1.6297 of a $6.00 global cap
- Forecast: 1 model call(s) per use, $500.00/month cap, 12 months

| Cell | Provider / model / effort | Cases | Precision | Recall | Not-food rejected | Injection | p50 / p95 ms | $/call | $/mo @ 25,000 | $/mo @ 50,000 | Within cap | G2 bar |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mock | mock / mock-1 / — | 61 | 81.1% | 46.9% | 0.0% | 33.3% | 1 / 221 | $0.0000 | $0.00 | $0.00 | ✅ | ❌ |
| openai/gpt-6-luna/none | openai / gpt-6-luna / none | 61 | 99.7% | 99.0% | 100.0% | 100.0% | 1489 / 2464 | $0.0002 | $4.51 | $9.02 | ✅ | ✅ |
| gemini/gemini-3.5-flash-lite | gemini / gemini-3.5-flash-lite / — | 61 | 99.3% | 99.7% | 100.0% | 100.0% | 977 / 1514 | $0.0009 | $23.29 | $46.59 | ✅ | ✅ |
| gemini/gemini-3.8-flash | gemini / gemini-3.8-flash / — | 61 | 99.7% | 97.0% | 100.0% | 100.0% | 3468 / 10450 | $0.0025 | $63.19 | $126.39 | ✅ | ✅ |
| gemini/gemini-3.8-flash/none | gemini / gemini-3.8-flash / none | 61 | 99.3% | 99.7% | 100.0% | 100.0% | 2048 / 3933 | $0.0015 | $37.71 | $75.42 | ✅ | ✅ |
| gemini/gemini-3.8-flash/low | gemini / gemini-3.8-flash / low | 61 | 100.0% | 99.7% | 100.0% | 100.0% | 2157 / 3407 | $0.0015 | $37.98 | $75.97 | ✅ | ✅ |
| anthropic/claude-sonnet-5-5 | anthropic / claude-sonnet-5-5 / — | 61 | 99.7% | 99.7% | 100.0% | 100.0% | 2226 / 5560 | $0.0067 | $168.03 | $336.06 | ✅ | ✅ |
| anthropic/claude-opus-5-5 (reference) | anthropic / claude-opus-5-5 / — | 61 | 99.7% | 99.7% | 100.0% | 100.0% | 3667 / 6948 | $0.0133 | $333.17 | $666.34 | ❌ | ✅ |

## What the budget buys

Reference: **anthropic/claude-opus-5-5**, precision 99.7%, recall 99.7%, not-food rejected 100.0%, $333.17/mo @ 25,000, $666.34/mo @ 50,000 (over the $500.00/month cap).

Best within the $500.00/month cap: **gemini/gemini-3.8-flash/low**, precision 100.0% (+0.3 pp), recall 99.7% (±0.0 pp), $37.98/mo @ 25,000, $75.97/mo @ 50,000.

| Cell | Precision | vs ref | Recall | vs ref | Not-food rejected | vs ref | $/mo @ 25,000 | $/mo @ 50,000 | Within cap |
|---|---|---|---|---|---|---|---|---|---|
| **anthropic/claude-opus-5-5** (reference) | 99.7% | — | 99.7% | — | 100.0% | — | $333.17 | $666.34 | ❌ |
| openai/gpt-6-luna/none | 99.7% | ±0.0 pp | 99.0% | −0.7 pp | 100.0% | ±0.0 pp | $4.51 | $9.02 | ✅ |
| gemini/gemini-3.5-flash-lite | 99.3% | −0.3 pp | 99.7% | ±0.0 pp | 100.0% | ±0.0 pp | $23.29 | $46.59 | ✅ |
| gemini/gemini-3.8-flash/none | 99.3% | −0.3 pp | 99.7% | ±0.0 pp | 100.0% | ±0.0 pp | $37.71 | $75.42 | ✅ |
| gemini/gemini-3.8-flash/low | 100.0% | +0.3 pp | 99.7% | ±0.0 pp | 100.0% | ±0.0 pp | $37.98 | $75.97 | ✅ |
| gemini/gemini-3.8-flash | 99.7% | ±0.0 pp | 97.0% | −2.6 pp | 100.0% | ±0.0 pp | $63.19 | $126.39 | ✅ |
| anthropic/claude-sonnet-5-5 | 99.7% | ±0.0 pp | 99.7% | ±0.0 pp | 100.0% | ±0.0 pp | $168.03 | $336.06 | ✅ |

Candidates are sorted by cost. "Best" is the highest F1 (precision and recall combined) among candidates within the cap. The reference shows what quality is possible, whatever it costs.

### What gemini/gemini-3.8-flash/low misses out on

- **Ingredients missed** that the reference found: 0
- **Wrong ingredients added** that the reference avoided: 0
- **Non-food images treated as food** that the reference rejected: 0
- **Failed calls** where the reference answered: 0
- In the other direction, gemini/gemini-3.8-flash/low found 0 ingredient(s) the reference missed, avoided 1 wrong one(s) the reference added, and rejected 0 non-food image(s) the reference accepted.

## Reading this

- The G2 bar is the TDD §7.7 target: precision ≥ 90%, recall ≥ 80%, every injection case passes.
- $/month is month-1 spend at the measured $/call; "within cap" checks every month of the horizon.
- Token counts on the mock are zero, so its cost columns read $0.
- Synthetic or pilot sets are directional only; the OPEN-1 call needs the licensed set.
