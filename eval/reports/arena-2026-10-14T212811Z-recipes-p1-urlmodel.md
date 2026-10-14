# Model arena: 2026-10-14T21:28:11.003Z

- Prompt `p1`, set `v2-recipes`, catalog `eval-v2`, matrix `arena-recipes-v1`, URL path `model`
- Spent $1.4428 of a $6.00 global cap
- Forecast: 1 model call(s) per use, $500.00/month cap, 12 months

| Cell | Provider / model / effort | Cases | Precision | Recall | Not-food rejected | Injection | p50 / p95 ms | $/call | $/mo @ 25,000 | $/mo @ 50,000 | Within cap | G2 bar |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mock | mock / mock-1 / — | 61 | 80.6% | 46.4% | 0.0% | 33.3% | 1 / 257 | $0.0000 | $0.00 | $0.00 | ✅ | ❌ |
| openai/gpt-6-luna/none | openai / gpt-6-luna / none | 61 | 98.3% | 94.7% | 100.0% | 100.0% | 1719 / 2506 | $0.0002 | $4.19 | $8.37 | ✅ | ✅ |
| gemini/gemini-3.5-flash-lite | gemini / gemini-3.5-flash-lite / — | 61 | 96.7% | 97.4% | 0.0% | 100.0% | 1125 / 1994 | $0.0009 | $21.89 | $43.78 | ✅ | ✅ |
| gemini/gemini-3.8-flash | gemini / gemini-3.8-flash / — | 61 | 98.9% | 90.5% | 100.0% | 100.0% | 4187 / 12926 | $0.0026 | $65.06 | $130.13 | ✅ | ✅ |
| anthropic/claude-sonnet-5-5 | anthropic / claude-sonnet-5-5 / — | 61 | 99.7% | 95.1% | 100.0% | 100.0% | 2910 / 5187 | $0.0067 | $168.62 | $337.24 | ✅ | ✅ |
| anthropic/claude-opus-5-5 (reference) | anthropic / claude-opus-5-5 / — | 61 | 99.0% | 95.7% | 100.0% | 100.0% | 3994 / 7200 | $0.0133 | $331.56 | $663.12 | ❌ | ✅ |

## What the budget buys

Reference: **anthropic/claude-opus-5-5**, precision 99.0%, recall 95.7%, not-food rejected 100.0%, $331.56/mo @ 25,000, $663.12/mo @ 50,000 (over the $500.00/month cap).

Best within the $500.00/month cap: **anthropic/claude-sonnet-5-5**, precision 99.7% (+0.7 pp), recall 95.1% (−0.7 pp), $168.62/mo @ 25,000, $337.24/mo @ 50,000.

| Cell | Precision | vs ref | Recall | vs ref | Not-food rejected | vs ref | $/mo @ 25,000 | $/mo @ 50,000 | Within cap |
|---|---|---|---|---|---|---|---|---|---|
| **anthropic/claude-opus-5-5** (reference) | 99.0% | — | 95.7% | — | 100.0% | — | $331.56 | $663.12 | ❌ |
| openai/gpt-6-luna/none | 98.3% | −0.7 pp | 94.7% | −1.0 pp | 100.0% | ±0.0 pp | $4.19 | $8.37 | ✅ |
| gemini/gemini-3.5-flash-lite | 96.7% | −2.2 pp | 97.4% | +1.6 pp | 0.0% | −100.0 pp | $21.89 | $43.78 | ✅ |
| gemini/gemini-3.8-flash | 98.9% | −0.1 pp | 90.5% | −5.3 pp | 100.0% | ±0.0 pp | $65.06 | $130.13 | ✅ |
| anthropic/claude-sonnet-5-5 | 99.7% | +0.7 pp | 95.1% | −0.7 pp | 100.0% | ±0.0 pp | $168.62 | $337.24 | ✅ |

Candidates are sorted by cost. "Best" is the highest F1 (precision and recall combined) among candidates within the cap. The reference shows what quality is possible, whatever it costs.

### What anthropic/claude-sonnet-5-5 misses out on

- **Ingredients missed** that the reference found: 14 (`onion` ×2, `beef`, `bell-pepper`, `celery`, `cooking-oil`, `egg`, `eggplant`, `fish`)
- **Wrong ingredients added** that the reference avoided: 0
- **Non-food images treated as food** that the reference rejected: 0
- **Failed calls** where the reference answered: 0
- In the other direction, anthropic/claude-sonnet-5-5 found 12 ingredient(s) the reference missed, avoided 2 wrong one(s) the reference added, and rejected 0 non-food image(s) the reference accepted.

Largest gaps by case:

| Case | Missed | Wrongly added |
|---|---|---|
| `url-wiki-ratatouille` | `bell-pepper`, `eggplant`, `garlic`, `onion`, `tomato`, `zucchini` | — |
| `paste-spanish-tortilla` | `cooking-oil`, `egg`, `onion`, `potato` | — |
| `url-wiki-tuna-salad` | `celery`, `fish`, `mayonnaise` | — |
| `paste-steps-only-bolognese` | `beef` | — |

## Reading this

- The G2 bar is the TDD §7.7 target: precision ≥ 90%, recall ≥ 80%, every injection case passes.
- $/month is month-1 spend at the measured $/call; "within cap" checks every month of the horizon.
- Token counts on the mock are zero, so its cost columns read $0.
- Synthetic or pilot sets are directional only; the OPEN-1 call needs the licensed set.
