# Labeled eval sets

Labeled sets feed the model eval (`pnpm eval`) and the arena (`pnpm arena`, BD3244-37). The schema lives in `services/find-my-tips/src/eval/labeled-set.ts`, and the loader rejects any set that doesn't match it. See TDD §7.9.

## What's here
| File | Purpose |
|---|---|
| `v0-synthetic.json` | 15 hand-written text cases. Use it for smoke tests and CI only. It is **not** the G2 gate. |
| `v1-n5k-dishes.json` | 94 plated-dish photos from Nutrition5k (Google, CC BY 4.0, via `arunapb/nutrition5k-foodseg103` test split). Labels come from the dataset's own ingredient lists, mapped to `eval-v1` slugs. Score it with `--catalog eval/catalogs/eval-v1.json`. Covers `dish` only. |
| `v1-nonfood/` | 32 people-free non-food images from Wikimedia Commons (public domain / CC0, credits in `v1-nonfood/CREDITS.md`): objects, scenes, animals, documents, and hard negatives such as empty plates, cutlery, and a kitchen. |
| `v1-mixed.json` | `v1-n5k-dishes` plus `v1-nonfood` (126 cases). Non-food cases have `detectedType: unknown`, `expectedReadable: false`, and no slugs, so the report's **Not-food rejected** column is populated. Kept as-is so arena-v1 reports stay reproducible. |
| `v2-mixed.json` | The same 126 images with corrected labels. Score with `--catalog eval/catalogs/eval-v2.json`. Pizza sauce is the new `tomato-sauce` slug; in `eval-v1` "tomato sauce" was a ketchup synonym, so every pizza scored a false positive. Seven labels fixed after a consensus review (an extra that most models reported, checked against the photo). Butter, cooking oil, and spices are `acceptableSlugs` on every dish, as are side items visible in frame. Use this for arena runs. |
| `v2-recipes.json` | 61 text and URL cases (BD3244-37 extension), id-prefixed by group: `url-` live recipe links (14 with JSON-LD, two Wikipedia articles without, one non-food page), `name-` well-known dish names, `meal-` pasted meal descriptions, `paste-` pasted recipes in messy formats (blog chatter, metric, steps only, Spanish), and `inj-` prompt-injection probes. Text is ddd-written. URL cases fetch the page at run time and nothing is stored, so results can drift if a page changes. Labels were drafted with Claude Opus 5.5 and reviewed by ddd; because Opus is also under test, treat its score here as an upper bound. |

## Rules for real sets
- **Only use rights-cleared items.** Every image case must point at a `sources` entry that names its license (the loader refuses an image case without one). Text cases should too. Don't use scraped photos without a license, stock images whose terms forbid ML use, or anything without clear provenance.
- **No people and no personal data.** Leave out faces, names, addresses, loyalty numbers, card digits, and handwriting that identifies someone. Crop or redact them before an item is added. Each source has to be reviewed (`piiReviewed: true`) or the loader refuses the set.
- **Never use real user submissions.** The tool doesn't store user input (TDD D20), so production traffic can't be used as an eval set.
- **Keep images small.** Store images next to the set file at ≤1 MP (JPEG or PNG). Set `imagePath` relative to the set file. Production preprocessing downscales to about 1 MP before every model call (`downscaleImage`), so eval images should match.

## Schema
```jsonc
{
  "version": "v1-pilot",            // goes into reports
  "description": "…",
  "sources": {
    "ddd-kitchen-2025-10": {
      "description": "Photos taken by ddd staff in their own kitchens",
      "license": "ddd-owned, internal eval use",
      "piiReviewed": true
    }
  },
  "cases": [
    {
      "id": "fridge-001",           // slug, unique in the set
      "kind": "image",              // "text" | "image"
      "imagePath": "images/fridge-001.jpg",
      "mimeType": "image/jpeg",
      "detectedType": "fridge_photo", // recipe | receipt | shopping_list | dish | fridge_photo | unknown
      "expectedReadable": true,
      "expectedSlugs": ["milk", "eggs", "spinach"], // catalog slugs, no duplicates
      "acceptableSlugs": ["butter"], // optional: neither a hit nor a false positive
      "injection": false,           // true for prompt-injection probes
      "source": "ddd-kitchen-2025-10"
    }
  ]
}
```

Text cases use `text` instead of `imagePath`. URL cases (`"kind": "url"`) use `url` and run through the production URL pipeline (`safeFetch`, then JSON-LD, then the model only if the page has no JSON-LD); `pnpm arena --url-path model` skips JSON-LD so the model reads every page. URL cases need network access.

`acceptableSlugs` are slugs a correct answer may or may not include, for example cooking oil on a fried dish or a garnish in a recipe. Reporting one doesn't count as a false positive, and leaving it out doesn't count as a miss. It can't overlap `expectedSlugs`.

`expectedSlugs` has to use slugs from the catalog the run is scored against. By default `pnpm eval` and `pnpm arena` score against the 6-item fixture catalog (`services/find-my-tips/src/fixtures/catalog.json`). Pass `--catalog eval/catalogs/eval-v2.json` (v2 sets) or `eval-v1.json` (v1 sets) to score against the eval catalog, which stands in for the Strapi catalog until it's ready (OPEN-8). It's eval-only and isn't content.

## Coverage targets
Build the set in two steps. Start with a **20-item pilot** to prove that labeling, licensing, and scoring work end to end. Then grow it toward the **~500 items** that BD3244-37 calls for. TDD §7.9 sets the floor at 80–120 for the G2 gate and 150+ before UAT.

Spread the cases across `detectedType`:

| Category | `detectedType` | Pilot | Full |
|---|---|---|---|
| Fridge and pantry photos | `fridge_photo` | 5 | ~125 |
| Receipts | `receipt` | 4 | ~100 |
| Shopping lists (typed and handwritten) | `shopping_list` | 4 | ~100 |
| Recipes (text and photos of cards or books) | `recipe` | 3 | ~75 |
| Plated dishes | `dish` | 2 | ~50 |
| Unreadable or off-topic | `unknown`, `expectedReadable: false` | 1 | ~25 |
| Prompt-injection probes | any type, `injection: true` | 1 | ~25 |

Injection probes must return no unexpected slugs. The metrics count any leak as an injection failure.

## Adding a set
1. Add the images under `eval/sets/<set-name>/images/` and the JSON file at `eval/sets/<set-name>.json`.
2. Run `pnpm eval -- --set eval/sets/<set-name>.json --catalog <catalog>.json`. With the mock provider this checks that the set loads and scores.
3. Point the arena at it with `pnpm arena -- --set eval/sets/<set-name>.json`, or set `setPath` in the matrix.
