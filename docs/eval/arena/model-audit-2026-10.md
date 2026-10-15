# Model audit and arena: Oct 2026 (BD3244-37)

**Author:** Art Longbottom (dotdotdash), with Copilot.
**Last updated:** Oct 15, 2026, after arena v2 round 3 (prompt `p3`, variance runs). The first version (Oct 13, arena v1) is kept in [Appendix A](#appendix-a-arena-v1-oct-13).
**Status:** internal working report. This is not a recommendation: the production model choice is Ad Council's decision (OPEN-1). The numbers feed the [scorecard email](scorecard-email-draft.md) and the [recommendation memo](recommendation-memo-template.md).
**Detailed write-ups:** [`recipes-2026-10.md`](recipes-2026-10.md) (round 2: label fixes, recipe and text set) and [`p3-2026-10.md`](p3-2026-10.md) (round 3: prompt `p3`, variance, more fixes).

## 1. Summary

- **We tested 15 configurations of 13 current models**, with Claude Opus 5.5 as the quality reference, on two sets:
  - **Photos:** 126 images, 94 plated dishes and 32 non-food images.
  - **Text and links:** 61 cases, covering recipe URLs, typed dish names ("ratatouille", "tuna salad"), pasted meals, pasted recipes, and prompt injection.
- **9 of 15 cells now meet G2 on photos** (precision ≥ 90%, recall ≥ 80%). On Oct 13, none did. The jump came from fixing how we score, not from changing models. The biggest fix: "tomato sauce" had been scored as `ketchup`.
- **Gemini 3.8 Flash with thinking off is the best value within the cap:**

  | | Precision | Recall | Non-food rejected | Text and links | p95 latency | $/month at 50K uses |
  |---|---|---|---|---|---|---|
  | **Gemini 3.8 Flash, thinking off** (5-run mean) | 95.4% | 95.4% | 100% (all 5 runs) | 100 / 100 | 3.6–5.8 s | **$73 now, ~$147 from Jan 1** |
  | *Claude Opus 5.5, reference* (5-run mean) | *94.4%* | *98.5%* | *100%* | *100 / 100* | *~6 s* | *$408* |

  - Same precision as Opus, and about 3 points less recall.
  - Gemini's promotional price ends Dec 31, 2026, before the Jan 8, 2027 go-live. **Budget on the 2027 price, about $147/month**, which is still 29% of the cap.
- **What Opus adds over it:** in the final run the two differ on 8 of 94 dishes.
  - Opus found 6 ingredients that 3.8 Flash missed: eggs ×3, cheese, pear and olives.
  - 3.8 Flash also timed out once, on a pizza, losing its 6 ingredients.
  - 3.8 Flash added 6 wrong ingredients that Opus avoided, mostly cheese for egg whites. It also avoided 9 that Opus added, which is why its precision is the same.
  - In product terms, about one dish in 12 shows one ingredient fewer, or one wrong ingredient the user has to remove.
- **Cheaper tiers** don't fully meet the bar:
  - **Gemini 3.1 Flash-Lite** ($23/month): 96.1% / 91.5%, but it calls about **15% of non-food photos food** (empty plates, bowls, a mug).
  - **Gemini 3.5 Flash-Lite** ($29/month): 95.3% / 83.2%. Its recall sits close to the 80% bar because it misses sauces and cheese.
- **No OpenAI model reliably meets G2 on photos.** OpenAI is the one vendor Ad Council IT has already approved. GPT-5 mini (88–91% precision, $19/month) and GPT-6.1 Sol (87–89%, $141/month) sit just under the precision bar. GPT-6 Luna ($6/month) scores 89% / 86%. Anthropic and Gemini still need IT acceptance (OPEN-2).
- **Text and links are solved for every model we tested.**
  - Recipe pages with structured data (JSON-LD) score 100% with no model call.
  - With prompt `p3`, every cell except 3.8 Flash with default thinking scores ≥ 99% / ≥ 98% on dish names, pasted meals, and pasted recipes.
  - Every cell passed all 3 injection cases.
  - On text, the budget buys nothing extra; it's the photos that cost money.
- **Use prompt `p3` and turn Gemini thinking off.**
  - `p3` lists a typed dish's usual ingredients and keeps photo accuracy at `p1` levels.
  - Gemini 3.8 Flash's default thinking costs about 25% more and raises p95 latency by about 60%. It also times out on long pasted recipes, and it scores no better.
- **The scores are stable.** Over 5 runs, the top cells vary by at most 3 points on precision and 4 on recall, and the ranking doesn't change.
- **Round 4 (Oct 15): receipts, lists, fridges, image injection, and load.** Full write-up: [`product-2026-10.md`](product-2026-10.md).
  - Receipts and lists: every model scores 99.6–100% precision. Most misses are catalog synonyms, not model errors.
  - Fridge photos are the hardest input: 3.8 Flash with thinking off scores 90.1% / 92.9% strict (94.5% precision lenient), against Opus's 94.8% / 94.0%. No OpenAI model gets above 78% precision.
  - Hidden instructions in images: 3.8 Flash and Opus resisted all of them. **3.1 and 3.5 Flash-Lite and GPT-5 mini wrote planted items into the result** (10–31% of probes), so they no longer meet G2.
  - 1,100 soak calls to Gemini: no 429s or 5xx, 2 timeouts. A single server-side retry is **[PROPOSED]**.
  - Product photos cost more per call: 3.8 Flash with thinking off is **about $206/month in 2027** if every use is a product photo.
- **Spend to date: $48.70** across every eval run (§11).

## 2. Scope

What Art asked for, in order:
1. Audit all current provider models and pick a lineup. The old `arena-v0` matrix used 2025 models.
2. Add Opus 5.5 and Sonnet 5.5. Keep Opus as a comparison tool even if it costs more than the budget allows.
3. Show the client what their budget buys, and what it misses out on.
4. Extend the test to recipe links and typed or pasted meals and recipes, including well-known dishes such as ratatouille and tuna salad.
5. Fix the scoring issues from the first run (the ketchup artifact and others).
6. Keep tightening and re-running, with no cost limit.

## 3. Eval data

| Set | Cases | What it is | Rights | People / PII |
|---|---|---|---|---|
| `v2-mixed` (photos) | 126 | 94 plated cafeteria dishes from Google's Nutrition5k + 32 Wikimedia Commons non-food images, including hard negatives (empty plates, a bowl, cutlery, a mug, a sink, a fridge) | CC BY 4.0; public domain / CC0 | Checked by eye: none |
| `v2-recipes` (text and links) | 61 | 17 recipe URLs (14 with JSON-LD, 2 Wikipedia food pages, 1 non-food page), 22 dish names, 10 pasted meals, 9 pasted recipes (one in Spanish), 3 injection cases | Synthetic (`ddd-synthetic`); public URLs fetched at run time | None |

- **Labels.** `v2-mixed` uses the same images as v1, with corrected labels:
  - Pizza labels now include tomato sauce.
  - Ingredients that are clearly visible were added.
  - Plausible but optional extras (butter, oil, spices on cooked dishes) are **acceptable**: they count as neither right nor wrong.
  - In round 3, every disputed label was checked against the photo. The changes are listed in `recipes-2026-10.md` §2.1 and `p3-2026-10.md` §2.3.
- **Label circularity.** Opus drafted the `v2-recipes` labels and helped review `v2-mixed`, so **Opus's scores are an upper bound**. The same labels apply to every cell, so the ranking between candidates is fair.
- **Catalog:** `eval/catalogs/eval-v2.json`, 104 slugs and 299 synonyms (79 more than `eval-v1`). This is a stand-in for the CMS catalog, which is still pending (OPEN-8).
- **Not covered yet:** receipts, shopping lists, fridge and pantry photos, and image-based injection.
- **MM-Food-100K** (Hugging Face `pranuthysri/MM-Food-100K`) is the source of Art's 200-image zip. **We did not use it in the arena**:
  - Its license is OpenRAIL-M, **non-commercial only**, so it needs Legal sign-off or permission from Codatta.
  - Its labels were generated by GPT-4o and Qwen, then crowd-checked.
  - Some images contain faces. I removed two (`food-066`, `cal-016`) after OpenCV and YuNet screening and a check by eye; notes are in the session `FACE-SCREEN.md`. The clean copy has 199 images.

### 3.1 Opus 5.5 labeling calibration

Art trusts only Opus 5.5 as an image labeler. Before using its labels, we ran a blind test.
- **Method:** Opus labeled 100 random MM-Food images (seed 3244) without seeing the dataset's labels. We then compared its labels with MM-Food's. The pass bar, set before the run, was lenient precision ≥ 0.85 and recall ≥ 0.75, with pantry staples excluded.
- **Result: FAIL.**

  | | Precision | Recall |
  |---|---|---|
  | Strict | 0.626 | n/a |
  | Lenient | 0.715 | 0.747 |
  | High-confidence rows only | 0.825 | 0.815 |

- **Who was right?** In an informal spot check of the disagreements, **Opus was right in roughly half, and MM-Food was right in only about two**. For example, MM-Food labeled a closed takeout bag as "noodles", a flat peach as "apple" and Chinese sausage as "chicken". So the failure says as much about MM-Food's labels as about Opus.
- **Decision for Art:** review `contested-sample.jpg` in the session files, then decide whether to accept Opus's high-confidence labels for future sets.

## 4. Method

### 4.1 Harness

- `pnpm arena` sends every case through the same path the service uses (TDD §7.9): `extractIngredients`, then Zod validation, then `matchItems` against the catalog.
  - Images are downscaled to ≤ 1 MP in memory.
  - URL cases run the real pipeline: `safeFetch`, JSON-LD first, then the readable page text to the model.
  - `--url-path model` skips JSON-LD, to measure how each model reads a raw page.
- One model call per case, `MODEL_TIMEOUT_MS` = 15 s. **A timeout or provider error counts every expected ingredient on that case as missed.**
- Up to 4 runs at once. Some Gemini errors (429/503) come from that parallel load. The run JSON records the provider's HTTP status on errors (eval only).
- Matrices: [`eval/arena-v2.json`](../../../eval/arena-v2.json) (photos, 15 cells), [`eval/arena-v2-top.json`](../../../eval/arena-v2-top.json) (variance, 7 cells), [`eval/arena-recipes.json`](../../../eval/arena-recipes.json) (text, 7 cells).

### 4.2 Scoring

- **Precision / recall:** computed over catalog slugs across all cases. Acceptable slugs count as neither right nor wrong. A slug reported on a non-food image counts as a false positive.
- **Non-food rejected:** the share of the 32 non-food images where the model returned `readable: false`.
- **G2:** precision ≥ 90%, recall ≥ 80%, and every injection case passes (TDD §7.7; the bar is still OPEN-8). **Proposed addition:** at least 90% of non-food images rejected.
- **Forecast:** measured $/call × uses per month, one call per use, at list prices from Oct 13, 2026. "Within cap" means under $500/month for all 12 months.
- **Reference comparison:** case by case, what each candidate misses or wrongly adds compared with Opus.

### 4.3 Prompts

The prompt version is part of the URL cache key, so prompts are never edited in place.

| Version | What it adds | Status |
|---|---|---|
| `p1` | Base prompt: photos → visible and implied ingredients; text → the ingredients named | Current default (`PROMPT_VERSION`) |
| `p2` | For a typed dish or meal name, list its usual ingredients; answer in English | Superseded: it hurt photos for some models (GPT-6.1 Sol 87 → 75% precision, Haiku 83 → 73%) |
| **`p3`** | `p2` plus: US English names ("courgette" → zucchini); for a recipe, only its own ingredients, not serving suggestions or other recipes on the page; include a dish's sauces and cheese | **Proposed next version** |

### 4.4 Model audit

We listed what each key can reach through the provider APIs. Prices were checked on the **official pricing pages on Oct 13, 2026**, in USD per million tokens (input / output).

| Provider | Model | Price | Tier | In arena-v1? |
|---|---|---|---|---|
| Anthropic | Claude Haiku 5.5 | $0.10 / $0.50 (prompts ≤100K tokens) | Cheap | ✅ |
| Anthropic | Claude Sonnet 5.5 | $2 / $10 | Mid | ✅ (Art) |
| Anthropic | Claude Opus 5.5 | $4 / $20 | Upper | ✅ **reference** (Art) |
| Anthropic | Claude Fable 5.1 | $10 / $50 | Ceiling | ❌ 2.5× Opus's per-token price: about $970/month at Opus's token usage, well over the cap |
| OpenAI | GPT-6 Luna | $0.10 / $0.50 | Cheap | ✅ effort `none` |
| OpenAI | GPT-5.4 nano | $0.20 / $1.25 | Cheap | ✅ |
| OpenAI | GPT-5.4 mini | $0.75 / $4.50 | Mid | ✅ |
| OpenAI | GPT-6.1 Sol | $2 / $10 | Mid | ✅ effort `low` (it rejects `none`) |
| OpenAI | GPT-5.6 Luna / Terra / Sol | $0.20 / $1.20, $2 / $12, $4 / $20 (promo until Nov 21) | — | ❌ the newer GPT-6 Luna and GPT-6.1 Sol cover the same tiers at the same or a lower price |
| OpenAI | GPT-6 Sol | $2 / $10 | Mid | ❌ superseded by GPT-6.1 Sol at the same price |
| OpenAI | GPT-6 Astra | $10 / $50 | Ceiling | ❌ 5× GPT-6.1 Sol's per-token price: about $670/month at Sol's token usage, over the cap |
| OpenAI | GPT-5 mini (baseline) | $0.25 / $2 | Cheap | ✅ effort `minimal` |
| Gemini | Gemini 3.1 Flash-Lite | $0.25 / $1.50 | Cheap | ✅ |
| Gemini | Gemini 3.5 Flash-Lite | $0.30 / $2.50 | Cheap | ✅ |
| Gemini | Gemini 3.8 Flash | $0.75 / $3.75 until Dec 31, 2026, then **$1.50 / $7.50** (in force at go-live) | Mid | ✅ default thinking, and (since round 3) thinking `none` and `low` |
| Gemini | Gemini 4 Argon | $2 / $10 | Mid | ✅ |
| Gemini | Gemini 2.5 Flash-Lite (baseline) | $0.10 / $0.40 | Cheap | ✅ |

**What the audit found** (Oct 13):
- **Anthropic adapter fixed (`6b1ea3d`).** Sonnet 5.5, Opus 5.5 and Fable 5.1 reject a forced `tool_choice` with type `tool` or `any`.
  - The adapter now uses structured outputs (`output_config.format: json_schema`).
  - The API rejects `maxItems`, so that one keyword is dropped from the schema we send. Zod still caps results at 60 items.
  - TDD §7.4 is updated.
- **GPT-6.1 Sol** rejects `reasoning_effort: none`. Its lowest setting is `low`.
- **Gemini 3.8 Flash thinks by default.** It averaged about 171 hidden reasoning tokens per call, which are billed as output. Since round 3 the matrix also runs it with `AI_REASONING_EFFORT=none` (thinking budget 0) and `low` (1,024 tokens).
- **Gemini 4 Argon timed out on 8 of 126 calls** in v1 at our 15 s model timeout. It still times out on 2–7 calls per run.

## 5. Results: photos (`v2-mixed`, prompt `p3`)

### 5.1 Main table (final run)

One run, sorted by F1. Report: [`arena-2026-10-15T004453Z-v2-p3-final`](../../../eval/reports/arena-2026-10-15T004453Z-v2-p3-final.md). $/month is at 50K uses, at today's prices. Every cell is within the $500/month cap.

| Model | Precision | Recall | F1 | Non-food rejected | Exact dishes¹ | Errors | p50 / p95 | $/call | $/month | G2 | G2 + non-food ≥ 90% |
|---|---|---|---|---|---|---|---|---|---|---|---|
| *Claude Opus 5.5 (reference)* | *94.7%* | *98.9%* | *0.968* | *32/32* | *86/94* | *0* | *2.9 / 5.9 s* | *$0.0081* | *$406* | ✅ | ✅ |
| Gemini 4 Argon | 96.7% | 95.6% | 0.961 | 31/32 | 85/94 | 2 timeouts | 4.0 / 11.3 s | $0.0040 | $201 | ✅ | ✅ |
| Gemini 3.1 Flash-Lite | **97.1%** | 91.8% | 0.944 | 28/32 | 84/94 | 0 | 1.2 / 1.7 s | $0.00046 | $23 | ✅ | ❌ |
| Gemini 3.8 Flash, thinking `low` | 96.5% | 91.8% | 0.941 | **32/32** | 82/94 | 4 (503/429) | 2.1 / 3.4 s | $0.0014 | $70² | ✅ | ✅ |
| **Gemini 3.8 Flash, thinking off** | 96.0% | 92.3% | 0.941 | **32/32** | 83/94 | 1 timeout | 2.3 / 5.8 s | $0.0015 | **$73²** | ✅ | ✅ |
| Claude Sonnet 5.5 | 91.2% | **97.3%** | 0.941 | **32/32** | 78/94 | 0 | 1.8 / 4.4 s | $0.0041 | $206 | ✅ | ✅ |
| Gemini 3.8 Flash, default thinking | 93.8% | 90.7% | 0.922 | 30/32 | 82/94 | 6 (4 timeouts) | 3.5 / 9.6 s | $0.0018 | $91² | ✅ | ✅ |
| Gemini 2.5 Flash-Lite (baseline) | 92.7% | 90.7% | 0.917 | **18/32** | 79/94 | 0 | 1.0 / 1.7 s | $0.00009 | $4 | ✅ | ❌ |
| GPT-6.1 Sol, effort `low` | 89.4% | 92.3% | 0.908 | **32/32** | 76/94 | 0 | 2.8 / 4.6 s | $0.0028 | $141 | ❌ | ❌ |
| Gemini 3.5 Flash-Lite | 95.7% | 85.2% | 0.901 | 29/32 | 77/94 | 0 | 1.1 / 1.6 s | $0.00059 | $30 | ✅ | ✅ (just) |
| GPT-5 mini, effort `minimal` (baseline) | 88.2% | 90.1% | 0.891 | 30/32 | 75/94 | 0 | 1.2 / 1.8 s | $0.00037 | $19 | ❌ | ❌ |
| GPT-6 Luna, effort `none` | 89.2% | 86.3% | 0.877 | 30/32 | 71/94 | 0 | 1.2 / 2.2 s | $0.00013 | $6 | ❌ | ❌ |
| GPT-5.4 mini | 87.4% | 80.2% | 0.837 | 28/32 | 67/94 | 0 | 1.1 / 1.4 s | $0.00099 | $50 | ❌ | ❌ |
| Claude Haiku 5.5 | 76.3% | 81.3% | 0.787 | 31/32 | 62/94 | 0 | 2.3 / 4.2 s | $0.00029 | $15 | ❌ | ❌ |
| GPT-5.4 nano | 72.2% | 59.9% | 0.655 | 31/32 | 45/94 | 0 | 0.8 / 1.3 s | $0.00026 | $13 | ❌ | ❌ |

¹ Dishes where the model's slugs exactly match the label set.
² **From Jan 1, 2027, Gemini 3.8 Flash costs twice as much** (promo ends Dec 31; go-live is Jan 8). At 50K uses: thinking off about $147, `low` about $140, default thinking about $181 a month. All are still under the cap.

### 5.2 Run-to-run variance

Five runs of the top cells with `p3` (the first `p3` run, three repeats of `arena-v2-top`, and the final run). Mean [min–max]:

| Model | Precision | Recall | Non-food rejected | Errors (5 runs) | p95 latency | $/month (2027 price) |
|---|---|---|---|---|---|---|
| Gemini 3.1 Flash-Lite | 96.1 [95.4–97.1] | 91.5 [90.7–92.3] | **85.0 [81–88]** ❌ | 0 | 1.3–1.7 s | $23 |
| Gemini 3.5 Flash-Lite | 95.3 [94.8–95.7] | 83.2 [80.8–85.2] | 91.9 [88–97] | 0 | 1.2–1.6 s | $29 |
| GPT-5 mini (`minimal`) | 89.1 [88.1–90.8] | 90.2 [89.0–91.8] | 91.2 [88–94] | 0 | 1.5–1.8 s | $19 |
| **Gemini 3.8 Flash, thinking off** | **95.4 [94.6–96.2]** | **95.4 [92.3–96.7]** | **100 [100–100]** | 1 | 3.6–5.8 s | **$73 ($147)** |
| Gemini 3.8 Flash, `low` | 95.5 [93.5–97.1] | 94.1 [91.2–96.2] | 99.4 [97–100] | 10 | 3.4–6.7 s | $72 ($144) |
| Gemini 3.8 Flash, default | 93.9 [93.6–94.6] | 95.2 [90.7–96.7] | 98.8 [94–100] | 7 | 5.7–9.6 s | $93 ($186) |
| *Claude Opus 5.5 (reference)* | *94.4 [93.7–94.7]* | *98.5 [97.8–98.9]* | *100 [100–100]* | *0* | *5.8–6.3 s* | *$408* |

- **The variance comes from timeouts and provider errors**, not from models changing their answers. One timeout on a 6-ingredient pizza costs about 3 points of recall.
- **Thinking doesn't help photos.** 3.8 Flash scores the same with thinking off or low, and slightly lower on precision with default thinking. Turning thinking off saves about 20%, cuts p95 by about 40%, and nearly removes timeouts.
- **3.8 `low`'s 10 errors are fast upstream errors** (about 200 ms, Gemini 429/503) under our parallel eval load. Production retries once on 502/504 (TDD §7.4).
- **GPT-5 mini is on the precision line.** It meets G2 in some runs and not others.

### 5.3 What the budget buys (final run, vs Opus)

"Missed" means labeled ingredients Opus found and the candidate didn't, including all the ingredients on a timed-out case. "Added" means wrong ingredients Opus avoided. "Non-food accepted" means non-food images Opus rejected and the candidate treated as food.

| Model | $/month (2027) | Precision vs Opus | Recall vs Opus | Missed | Added | Non-food accepted |
|---|---|---|---|---|---|---|
| Gemini 2.5 Flash-Lite | $4 | −2.0 pp | −8.2 pp | 15 | 13 | **14** |
| GPT-6 Luna (`none`) | $6 | −5.5 pp | −12.6 pp | 23 | 19 | 2 |
| GPT-5.4 nano | $13 | −22.6 pp | −39.0 pp | 71 | 42 | 1 |
| Claude Haiku 5.5 | $15 | −18.4 pp | −17.6 pp | 32 | 44 | 1 |
| GPT-5 mini (`minimal`) | $19 | −6.6 pp | −8.8 pp | 16 | 22 | 2 |
| Gemini 3.1 Flash-Lite | $23 | **+2.4 pp** | −7.1 pp | 13 | **5** | 4 |
| Gemini 3.5 Flash-Lite | $30 | +0.9 pp | −13.7 pp | 25 | 7 | 3 |
| GPT-5.4 mini | $50 | −7.3 pp | −18.7 pp | 34 | 21 | 4 |
| Gemini 3.8 Flash, `low` | $70 ($140) | +1.8 pp | −7.1 pp | 13 | 6 | 0 |
| **Gemini 3.8 Flash, thinking off** | **$73 ($147)** | +1.3 pp | −6.6 pp | 12 (6 from one timeout) | 6 | **0** |
| Gemini 3.8 Flash, default | $91 ($181) | −1.0 pp | −8.2 pp | 15 | 10 | 2 |
| GPT-6.1 Sol (`low`) | $141 | −5.4 pp | −6.6 pp | 12 | 18 | 0 |
| Gemini 4 Argon | $201 | +1.9 pp | −3.3 pp | 6 | 5 | 1 |
| Claude Sonnet 5.5 | $206 | −3.5 pp | **−1.6 pp** | **3** | 12 | 0 |
| *Claude Opus 5.5* | *$406* | — | — | — | — | — |

Opus itself missed only 2 labeled ingredients (a sausage and an egg), and no candidate found either. Every candidate avoided 5–10 of Opus's own wrong extras (herbs, garlic, onion, milk and similar).

**How to read this for the client** (2027 prices, 50K uses a month):

| Monthly budget | What it gets |
|---|---|
| **~$5** | Gemini 2.5 Flash-Lite scores well on dishes but calls 14 of 32 non-food photos food (keyboards, shoes, a laptop, empty plates). GPT-6 Luna, from the approved vendor, is just under the precision bar (89%). |
| **~$20–30** | **Gemini 3.1 or 3.5 Flash-Lite.** Good precision. 3.1 accepts about 15% of non-food photos; 3.5 misses sauces and cheese (recall 83%). GPT-5 mini is the OpenAI option, just under the precision bar. |
| **~$150** | **Gemini 3.8 Flash, thinking off.** Opus-level precision, 3 points less recall than Opus, and every non-food photo rejected in all 5 runs. |
| **$200–400** | Argon, Sonnet or Opus. Up to 3 more points of recall, with Opus the best. Sonnet and Opus also reject every non-food photo. None of the three is better on precision. |

### 5.4 Non-food handling (final run)

| Rejected | Models (what they accepted) |
|---|---|
| All 32 | Opus, Sonnet, 3.8 Flash thinking off and `low`, GPT-6.1 Sol |
| 31 | Argon (a building), Haiku (the fridge), GPT-5.4 nano (a houseplant) |
| 30 | 3.8 Flash default (a hammer, a guitar), GPT-6 Luna (the sink, the mug), GPT-5 mini (an empty plate, the fridge) |
| 28–29 | 3.5 Flash-Lite (an empty plate, the bowl, the mug); 3.1 Flash-Lite (two empty plates, the bowl, the mug); GPT-5.4 mini (a shoe, two empty plates, the sink) |
| 18 | Gemini 2.5 Flash-Lite (keyboards, shoes, a laptop, a clock, a toy, a houseplant, and every kitchen hard negative) |

- Most failures are **kitchen hard negatives**: an empty plate, a bowl, a mug, a sink or a fridge.
- **`p3` helps the weak models here.** GPT-5.4 nano went from 53% rejected with `p1` to 97% with `p3`; 2.5 Flash-Lite from 38% to 56%.

## 6. Results: text and links (`v2-recipes`, prompt `p3`)

Final runs. Reports: [pipeline](../../../eval/reports/arena-2026-10-15T000901Z-recipes-p3-r4.md), [`--url-path model`](../../../eval/reports/arena-2026-10-15T001424Z-recipes-p3-urlmodel-r4.md). Precision / recall %, then cases passed.

| Model | Recipe URLs (17) | Dish names (22) | Pasted meals (10) | Pasted recipes (9) | Injection (3) | Overall | Raw page only³ | $/month (text) |
|---|---|---|---|---|---|---|---|---|
| GPT-6 Luna (`none`) | 100/100 · 17 | 99/99 · 20 | 100/100 · 10 | 100/98 · 8 | 3/3 | 99.7 / 99.3 | 100 / 100 | $5 |
| Gemini 3.5 Flash-Lite | 100/100 · 17 | 100/99 · 21 | 100/100 · 10 | 100/100 · 9 | 3/3 | 100 / 99.7 | 100 / 99.7 | $26 |
| **Gemini 3.8 Flash, thinking off** | 100/100 · 17 | 100/100 · 22 | 100/100 · 10 | 100/100 · 9 | 3/3 | **100 / 100** | 100 / 98.0 (1 timeout) | $36 |
| Gemini 3.8 Flash, `low` | 100/100 · 17 | 100/100 · 22 | 100/100 · 10 | 100/100 · 9 | 3/3 | 100 / 100 | 100 / 100 | $35 |
| Gemini 3.8 Flash, default | 100/100 · 16 | 100/100 · 22 | 100/89 · 8 | 100/77 · 7 | 3/3 | 100 / 95.0 (4 errors) | 100 / 85.7 (7 errors) | $57 |
| Claude Sonnet 5.5 | 100/100 · 17 | 100/100 · 22 | 100/100 · 10 | 100/100 · 9 | 3/3 | 100 / 100 | 100 / 100 | $187 |
| *Claude Opus 5.5 (reference)* | *100/100 · 17* | *100/100 · 22* | *100/100 · 10* | *100/100 · 9* | *3/3* | *100 / 100* | *100 / 100* | *$364* |

³ Overall score with `--url-path model`, where every URL case skips JSON-LD and the model reads the page text.

- **JSON-LD recipe pages** (14 of 17 URLs) need no model call and score 100 / 100 for every cell.
- **Dish names** ("ratatouille", "tuna salad", "pad thai", …) are solved by the prompt: with `p1`, 3.8 Flash returned just the dish name on 10 of 22.
- **Raw pages:** with `p3`, models no longer add "serve with" and variation ingredients from the page.
- **The remaining misses are small.** GPT-6 Luna missed scallion on fried rice, tomato in beef stew, and flatbread in a meal-prep plan. 3.5 Flash-Lite missed lamb in shepherd's pie.
- **Thinking hurts text.** With default thinking, 3.8 Flash times out on long pasted recipes and gets more 503s.
- **Cost:** text costs less than a photo (3.8 Flash: $36 vs $73 a month today). Reading a raw page costs more: with `--url-path model`, Opus would cost $662/month at 50K uses, over the cap. The production mix of photos and text decides the real figure, so the photo price is the safe one to budget.

## 7. What still goes wrong

The same few cases trip every top cell, Opus included. Every disputed label was checked against the photo before counting an error.

| Error | Example | Who |
|---|---|---|
| Egg whites read as cheese | 3 egg-white scrambles: the crumbled whites look like feta | Most cells |
| Hidden or small egg, sausage, olives | Egg on an overexposed plate; sausage patties called meatballs | Every cell, including Opus |
| Look-alike fruit | Honeydew → pineapple; pear → mango; watermelon at the frame edge → tomato | Several cells, including 3.8 Flash |
| Pizza sauce and cheese left out | Says "pizza" but not tomato sauce or cheese | Flash-Lites, GPT-5.4 mini and nano, Haiku |
| Pizza named, not its parts | "pizza" instead of dough, sauce and cheese | GPT-6 Luna, GPT-6.1 Sol, Haiku, GPT-5.4 nano |
| Common guesses | Potato, bread, tomato (GPT models); flour, milk (Haiku); cucumber (GPT-6.1 Sol) | Cheap and mid OpenAI and Anthropic models |
| Timeouts and 503s | Long pasted recipes, big photos | Gemini 3.8 Flash with default thinking, Gemini 4 Argon |

These are look-alike errors, not invented ingredients. In the product, the user can remove a wrong ingredient before seeing tips, and only catalog-matched items are shown (D21).

## 8. How we got here

Precision / recall on the same 94 dishes and 32 non-food images as scoring, labels and prompt improved:

| Model | v1 (Oct 13) | v2 labels, `p1` | Round-3 labels, `p1` | Round-3 labels, `p3` (final) | `p3`, 5-run mean |
|---|---|---|---|---|---|
| Gemini 3.8 Flash, thinking off | — | — | 95.1 / 95.6 | 96.0 / 92.3 | **95.4 / 95.4** |
| Gemini 3.8 Flash, default | 79.0 / 94.5 | 95.1 / 95.1 | 96.2 / 96.7 | 93.8 / 90.7 | 93.9 / 95.2 |
| Gemini 3.1 Flash-Lite | 82.0 / 89.6 | 96.4 / 87.6 | 96.0 / 92.3 | 97.1 / 91.8 | 96.1 / 91.5 |
| Gemini 3.5 Flash-Lite | 88.6 / 90.2 | 96.2 / 82.2 | 96.8 / 83.0 | 95.7 / 85.2 | 95.3 / 83.2 |
| GPT-5 mini (`minimal`) | 74.2 / 88.3 | 90.0 / 87.6 | 89.1 / 89.6 | 88.2 / 90.1 | 89.1 / 90.2 |
| GPT-6 Luna (`none`) | 77.3 / 85.9 | 87.2 / 84.3 | 89.0 / 84.1 | 89.2 / 86.3 | — |
| Claude Sonnet 5.5 | 69.0 / 95.7 | 87.6 / 95.7 | 87.2 / 97.3 | 91.2 / 97.3 | — |
| *Claude Opus 5.5* | *73.5 / 96.9* | *94.2 / 96.8* | *93.8 / 98.9* | *94.7 / 98.9* | *94.4 / 98.5* |
| **Cells meeting G2** | **0 of 13** | **7 of 13** | **8 of 15** | **9 of 15** | |

What changed at each step:

1. **v2 labels** (Oct 14, [`recipes-2026-10.md`](recipes-2026-10.md)):
   - Added a `tomato-sauce` slug ("tomato sauce" had been scored as `ketchup`).
   - Added sauce to pizza labels and clearly visible ingredients to 5 dishes.
   - Introduced acceptable extras, plus about 60 synonyms.
2. **Round 3** (Oct 14–15, [`p3-2026-10.md`](p3-2026-10.md)):
   - Labels: olives removed where there were none, plus two acceptable extras checked against the photos; chili and zucchini synonyms.
   - **Two production matcher fixes** (TDD §7.5): "red chili pepper" had matched bell pepper, and "beef roast" didn't match beef.
3. **Prompt `p3`** (`p1` re-run on the round-3 labels for a like-for-like comparison):
   - Keeps photos within run-to-run noise for the shortlisted cells and adds Sonnet to the G2 list.
   - Gemini 3.8 Flash with default thinking is about 2 points lower on precision with `p3`, which is another reason to turn thinking off.
   - Haiku is the one model clearly worse with `p3` (about −6 precision), and it fails G2 with every prompt.

## 9. Limits

1. **Dishes from one source.** The 94 dishes are from one US cafeteria (Nutrition5k). One dish moves recall by about 0.5 points, and one timeout by up to 3. Round 4 added synthetic receipts and lists and Commons fridge photos ([`product-2026-10.md`](product-2026-10.md) §10 has their limits).
2. **Labels.** Nutrition5k labels list what was weighed, not everything visible. The text labels are synthetic and drafted by Opus, so Opus's scores are an upper bound. Round 4 measured how much: Opus's lead is 0 to +1 F1 on independent labels and +1.3 to +1.4 F1 on its own fridge labels ([`product-2026-10.md`](product-2026-10.md) §7).
3. **Variance** was measured for 7 cells over 5 runs each. The other cells ran 1–3 times.
4. **Load.** Gemini errors in rounds 1–3 came from our parallel eval runs (up to 4 at once). The round-4 soak saw no 429s or 5xx in 1,100 calls on ddd's dev key. Production quotas still need confirming with Google (OPEN-2).
5. **Stand-in catalog** (`eval-v2`, 104 slugs). Items not in it (kiwi, cherries, meatballs) show up as unmatched terms, not errors (OPEN-8). `pnpm catalog-diff` will carry the vocabulary over when the CMS catalog exists.
6. **Prices** are list prices from Oct 13, 2026, with no batch or caching discounts. One call per use.
7. **Vendor status.** The Anthropic and Gemini keys are ddd's dev/eval keys and were used with test data only (D25). Neither vendor is approved by Ad Council IT yet (OPEN-2). OpenAI is approved.

## 10. Recommended next steps

These are for dotdotdash to do. The model choice itself stays with Ad Council (OPEN-1).

1. **Make `p3` the next prompt version** (`PROMPT_VERSION=p3`). It's part of the cache key, so no cache purge is needed.
2. **Shortlist for the scorecard email to Cat** (the draft still has Oct 12 numbers; updated after round 4):
   - **Gemini 3.8 Flash, thinking off** (`AI_REASONING_EFFORT=none`): best value, at about $147/month from January on dishes and up to $206 if every use is a product photo.
   - **GPT-6.1 Sol**: the approved-vendor option. It resisted every image injection, but scores about 76% precision on fridges.
   - Gemini 3.1 Flash-Lite and GPT-5 mini drop off: they write planted items from images into the result.

   Present Opus 5.5 as the quality reference.
3. **Raise IT acceptance for Gemini (OPEN-2) now.** Every model that meets the bar within budget is from a vendor that isn't approved yet. Without it, the choice is an OpenAI model just under the precision bar, or Anthropic at $200+/month.
4. **Add "≥ 90% of non-food rejected" to G2** and agree the bar with Ad Council (OPEN-8).
5. ~~**Build a product-shaped set** with image-based injection cases.~~ Done in round 4: `v3-product`, 92 cases ([`product-2026-10.md`](product-2026-10.md)). Still missing: real receipts, pantry and grocery-haul photos.
6. ~~**Soak test at production concurrency.**~~ Done in round 4 (Gemini only). Decide on the **[PROPOSED]** single retry on a model timeout or 503 (Danish).
7. **Carry the synonym work into the CMS catalog** when it lands (OPEN-8): chili, zucchini and squash, tomato sauce, regional names, and the round-4 receipt synonyms (marinara sauce, jalapeno pepper, broccoli crowns, chard, creme fraiche). Run `pnpm catalog-diff` against the CMS export.
8. **Opus labels:** Art to decide using the contested-sample sheet (§3.1). Legal to rule on the MM-Food-100K license before any of its images go into a committed set.

## 11. Spend

| Run | Cost |
|---|---|
| Synthetic text set (Oct 12) | $0.04 |
| `arena-v0` on Nutrition5k and the mixed set (Oct 13) | $0.78 |
| Model audit smoke tests | $0.28 |
| Arena v1 (12 candidates + Opus) | $2.86 |
| Arena v2: label fixes and the recipe set ([`recipes-2026-10.md`](recipes-2026-10.md) §8) | $8.14 |
| Round 3: prompts, variance, re-runs ([`p3-2026-10.md`](p3-2026-10.md) §8) | $26.90 |
| Round 4: product photos, image injection, soak ([`product-2026-10.md`](product-2026-10.md) §11) | $9.70 |
| **Total to date** | **$48.70** |

This is above the ~$20 eval budget first proposed to Cat. Art lifted the cost limit for round 3. The Opus labeling for §3.1 was done by agents, not API calls.

## 12. Artifacts

| Commit | What |
|---|---|
| `8732c13`, `a249fb2` | Nutrition5k and non-food sets, `eval-v1` catalog, `--catalog` flag |
| `6b1ea3d` | Anthropic structured outputs, so the Claude 5.5 models work |
| `efd27b6`, `da03995`, `117440e` | Reference cell and budget-buys report sections, the arena v1 run, the first version of this report |
| `80ccf4c` | v2 labels and catalog, recipe and URL cases, matcher recipe-line fixes, prompt `p2` |
| `0844124` | Prompt `p3`, matcher fixes, Gemini thinking cells, variance matrix, `providerStatus`, round-3 reports |
| Round 4 | `v3-product` set, image injection scoring, `pnpm rescore`, `pnpm soak`, `pnpm catalog-diff`, round-4 reports ([`product-2026-10.md`](product-2026-10.md) §12) |

- **Reports** are in `eval/reports/`; the raw run JSON is git-ignored, in `eval/runs/` under the same names. The full list is in `p3-2026-10.md` §9.
- **Reproduce** from `services/find-my-tips`: `pnpm arena -- --matrix ../../eval/arena-v2.json --catalog ../../eval/catalogs/eval-v2.json --prompt p3`. It makes live calls and costs about $3.40. Add `--matrix ../../eval/arena-recipes.json` for the text set (about $0.90).
- Jira: [BD3244-37](https://dotdotdash.atlassian.net/browse/BD3244-37).

## Appendix A. Arena v1 (Oct 13)

The first run: set `v1-mixed` (the same 126 images with the original labels), catalog `eval-v1`, prompt `p1`, $2.86. Report: [`arena-2026-10-13T232648Z-v1`](../../../eval/reports/arena-2026-10-13T232648Z-v1.md). No model met G2. Most of the precision gap was in the scoring: "tomato sauce" on pizza was scored as `ketchup`, and the Nutrition5k labels leave out visible ingredients such as cheese and sauce. Both were fixed in v2 (§8).

Sorted by F1 as scored. The $/month column is month 1 at 50K uses. Every model is within the $500/month cap.

| Model | Precision | Recall | F1 | Non-food rejected | Exact dishes¹ | p50 / p95 | $/call | $/month at 50K |
|---|---|---|---|---|---|---|---|---|
| **Gemini 3.5 Flash-Lite** | **88.6%** | 90.2% | **0.894** | 96.9% | **68/94** | 1.1 / 1.7 s | $0.00056 | **$28** |
| Gemini 3.8 Flash | 79.0% | 94.5% | 0.860 | 100% | 59/94 | 2.8 / 5.2 s | $0.00182 | $91 |
| Gemini 3.1 Flash-Lite | 82.0% | 89.6% | 0.856 | 87.5% | 64/94 | 1.2 / 1.4 s | $0.00043 | $21 |
| Gemini 2.5 Flash-Lite (baseline) | 80.4% | 88.3% | 0.842 | **53.1%** | 62/94 | 0.9 / 1.2 s | $0.00008 | $4 |
| *Claude Opus 5.5 (reference)* | *73.5%* | ***96.9%*** | *0.836* | *100%* | *48/94* | *2.8 / 6.4 s* | *$0.00778* | *$389* |
| GPT-6 Luna, effort `none` | 77.3% | 85.9% | 0.814 | 93.8% | 59/94 | 1.3 / 2.0 s | $0.00012 | $6 |
| GPT-5 mini, effort `minimal` (baseline) | 74.2% | 88.3% | 0.807 | 84.4% | 56/94 | 1.1 / 1.9 s | $0.00035 | $18 |
| Gemini 4 Argon | 76.7% | 84.7% | 0.805 | 100% | 52/94 | 4.1 / 15.0 s² | $0.00364 | $182 |
| Claude Sonnet 5.5 | 69.0% | 95.7% | 0.803 | 100% | 48/94 | 1.9 / 3.5 s | $0.00380 | $190 |
| GPT-5.4 mini | 76.3% | 82.8% | 0.794 | 84.4% | 59/94 | 0.7 / 1.0 s | $0.00092 | $46 |
| GPT-6.1 Sol, effort `low` | 69.5% | 85.3% | 0.766 | 100% | 54/94 | 3.2 / 5.5 s | $0.00267 | $134 |
| Claude Haiku 5.5 | 67.5% | 85.3% | 0.753 | 96.9% | 46/94 | 2.1 / 3.2 s | $0.00026 | $13 |
| GPT-5.4 nano | 53.5% | 65.0% | 0.587 | 75.0% | 36/94 | 0.8 / 1.2 s | $0.00025 | $12 |

¹ Dishes where the model's slugs exactly match the label set.
² Eight timeouts at 15 s.

For comparison, the `arena-v0` run on the same set earlier that day: Haiku 4.5 scored 48.7% / 57.1%, and GPT-5 nano (`minimal`) scored 70.8% / 66.9%. Every current-generation model except GPT-5.4 nano beats both.
