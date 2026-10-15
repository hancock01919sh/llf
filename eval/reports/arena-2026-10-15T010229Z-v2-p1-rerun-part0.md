# Model arena: 2026-10-15T01:02:29.447Z

- Prompt `p1`, set `v2-mixed`, catalog `eval-v2`, matrix `arena-v2`
- Spent $1.2199 of a $6.00 global cap
- Forecast: 1 model call(s) per use, $500.00/month cap, 12 months

| Cell | Provider / model / effort | Cases | Precision | Recall | Not-food rejected | Injection | p50 / p95 ms | $/call | $/mo @ 25,000 | $/mo @ 50,000 | Within cap | G2 bar |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mock | mock / mock-1 / — | 126 | 0.0% | 0.0% | 0.0% | n/a | 1 / 2 | $0.0000 | $0.00 | $0.00 | ✅ | ❌ |
| gemini/gemini-3.5-flash-lite | gemini / gemini-3.5-flash-lite / — | 126 | 96.8% | 83.0% | 93.8% | n/a | 1195 / 1729 | $0.0006 | $13.81 | $27.62 | ✅ | ✅ |
| gemini/gemini-3.8-flash/none | gemini / gemini-3.8-flash / none | 126 | 95.1% | 95.6% | 96.9% | n/a | 2158 / 3994 | $0.0014 | $35.64 | $71.29 | ✅ | ✅ |
| anthropic/claude-opus-5-5 (reference) | anthropic / claude-opus-5-5 / — | 126 | 93.8% | 98.9% | 100.0% | n/a | 3177 / 6543 | $0.0077 | $192.60 | $385.19 | ✅ | ✅ |

## What the budget buys

Reference: **anthropic/claude-opus-5-5**, precision 93.8%, recall 98.9%, not-food rejected 100.0%, $192.60/mo @ 25,000, $385.19/mo @ 50,000.

Best within the $500.00/month cap: **gemini/gemini-3.8-flash/none**, precision 95.1% (+1.3 pp), recall 95.6% (−3.3 pp), $35.64/mo @ 25,000, $71.29/mo @ 50,000.

| Cell | Precision | vs ref | Recall | vs ref | Not-food rejected | vs ref | $/mo @ 25,000 | $/mo @ 50,000 | Within cap |
|---|---|---|---|---|---|---|---|---|---|
| **anthropic/claude-opus-5-5** (reference) | 93.8% | — | 98.9% | — | 100.0% | — | $192.60 | $385.19 | ✅ |
| gemini/gemini-3.5-flash-lite | 96.8% | +3.0 pp | 83.0% | −15.9 pp | 93.8% | −6.3 pp | $13.81 | $27.62 | ✅ |
| gemini/gemini-3.8-flash/none | 95.1% | +1.3 pp | 95.6% | −3.3 pp | 96.9% | −3.1 pp | $35.64 | $71.29 | ✅ |

Candidates are sorted by cost. "Best" is the highest F1 (precision and recall combined) among candidates within the cap. The reference shows what quality is possible, whatever it costs.

### What gemini/gemini-3.8-flash/none misses out on

- **Ingredients missed** that the reference found: 6 (`egg` ×3, `leafy-greens`, `olives`, `tomato-sauce`)
- **Wrong ingredients added** that the reference avoided: 9 (`cheese` ×3, `cabbage`, `clams`, `corn`, `leafy-greens`, `pineapple`, `tomato`)
- **Non-food images treated as food** that the reference rejected: 1 (`nf-bowls-1`)
- **Failed calls** where the reference answered: 0
- In the other direction, gemini/gemini-3.8-flash/none found 0 ingredient(s) the reference missed, avoided 12 wrong one(s) the reference added, and rejected 0 non-food image(s) the reference accepted.

Largest gaps by case:

| Case | Missed | Wrongly added |
|---|---|---|
| `n5k-1565884692` | `egg` | `cheese`, `tomato` |
| `n5k-1560367085` | — | `pineapple`, `corn` |
| `n5k-1560975491` | `leafy-greens` | `cabbage` |
| `n5k-1564761388` | `egg` | `cheese` |
| `n5k-1566920304` | `egg` | `cheese` |

## Reading this

- The G2 bar is the TDD §7.7 target: precision ≥ 90%, recall ≥ 80%, every injection case passes.
- $/month is month-1 spend at the measured $/call; "within cap" checks every month of the horizon.
- Token counts on the mock are zero, so its cost columns read $0.
- Synthetic or pilot sets are directional only; the OPEN-1 call needs the licensed set.
