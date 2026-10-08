# Find My Tips service

The tool API behind Find My Tips (TDD §7). It accepts a shopping list as text, a photo, or a recipe URL. It extracts ingredient names, matches them against the CMS ingredient catalog, and returns catalog slugs plus an `unmatchedCount`. It never returns model text (TDD D21).

- **Contract:** `packages/contracts/src/find-tips.ts`, with Zod schemas for the request, response, and error shapes.
- **Matching:** `packages/matching`.

## Run it
```sh
pnpm --filter @llf/find-my-tips dev     # watch mode; reads the root .env
pnpm --filter @llf/find-my-tips start   # no watch
pnpm --filter @llf/find-my-tips test
```
`CMS_FIXTURES=1 pnpm dev:fe` from the repo root starts this service and the web app together. The web app forwards `/api/*` to this service: through rewrites in `next dev` (`next.config.ts`), and through `server.mjs` in `pnpm --filter @llf/web start`. Set `TIPS_URL` to point it at a different host.

## Environment
All keys are optional and every one has a default. Empty values are treated as unset. The full list is in `src/config.ts`.

| Key | Default | Notes |
|---|---|---|
| `AI_PROVIDER` | `mock` | `mock` \| `anthropic` \| `openai` \| `bedrock`. Live adapters are stubs until BD3244-33. |
| `AI_MODEL` | `mock-1` | Passed to the provider and included in the URL cache key. |
| `FIND_TIPS_MODE` | `live` | Kill switch (TDD §7.7). `jsonld-only` makes no model calls; `off` returns 503 `unavailable`. |
| `TOOL_PORT` / `PORT` | `8787` | `TOOL_PORT` takes precedence. Render sets `PORT`. |
| `CATALOG_URL` / `CATALOG_FILE` | bundled `src/fixtures/catalog.json` | Catalog source, refreshed every `CATALOG_REFRESH_MS` (60 s). |
| `QUOTA_DAILY_MODEL_CALLS` | `3000` | Counted per input type and reset at 00:00 UTC. When a type's budget is spent, URLs fall back to JSON-LD only and text or image return 503 `unavailable`. |
| `RATE_LIMIT_*` | 30 URL / 10 model per 5 min per IP | |
| `URL_CACHE_TTL_MS` | 24 h | Caches only the extracted terms, keyed by the URL's SHA-256. |

## API
| Route | Method | Notes |
|---|---|---|
| `/api/find-tips/status` | GET, HEAD | `{ mode, catalogVersion }` |
| `/api/find-tips/extract` | POST only | Other methods return 405. Bodies over 4 MiB (`BODY_MAX_BYTES`) return 413. |

```sh
curl -s localhost:8787/api/find-tips/status

# Text: up to 5,000 characters
curl -s -X POST localhost:8787/api/find-tips/extract -H 'content-type: application/json' \
  -d '{"inputType":"text","text":"milk, eggs, spinach, bananas"}'

# Recipe URL: uses JSON-LD when the page has a Recipe, and the model otherwise
curl -s -X POST localhost:8787/api/find-tips/extract -H 'content-type: application/json' \
  -d '{"inputType":"url","url":"https://cookieandkate.com/healthy-banana-bread-recipe/"}'

# Image: base64, jpeg/png/webp, up to 3 MiB decoded
curl -s -X POST localhost:8787/api/find-tips/extract -H 'content-type: application/json' \
  -d "{\"inputType\":\"image\",\"mimeType\":\"image/jpeg\",\"imageBase64\":\"$(base64 < list.jpg)\"}"
```

The response always has the same shape:

```json
{ "requestId": "…", "detectedType": "recipe", "readable": true,
  "matches": [{ "slug": "banana", "title": "Banana", "inferred": false }],
  "unmatchedCount": 10, "source": "jsonld", "catalogVersion": "…" }
```

`source` is `jsonld`, `model`, or `cache`. Errors return `{ requestId, code }`, with the HTTP status mapped in `src/http.ts`. For example, `url_not_allowed` returns 422 and `upstream_error` returns 502.

## Rules (from AGENTS.md)
- **No user input is stored or logged (D20).** Logs are one JSON line per request with counts, codes, latency, and the URL hash, and never input text, image bytes, or URLs. Don't add a log field that carries user input.
- **Every model call goes through `src/extract`.** The adapter is chosen by `AI_PROVIDER`, and the output is validated with Zod before use. Don't call an SDK from anywhere else.
- **Recipe URLs are fetched only through `src/url/safe-fetch.ts`.** It allows http/https on ports 80 and 443, resolves DNS and blocks private ranges, pins the connection to the checked IP, and re-checks every redirect (3 max, 3 MiB, 5 s). `127.0.0.1`, metadata IPs, and similar addresses return `url_not_allowed`.

## Known behavior
- **Bot-protected recipe sites return `upstream_error` (502).** For example, Allrecipes and Simply Recipes return 403 to our user agent. Use sites that serve JSON-LD for demos and evals, such as cookieandkate.com or budgetbytes.com.
- The in-memory cache, counters, and rate limits reset on restart. Shared stores replace them on Render and AWS behind the same interfaces (`src/cache.ts`).
- `src/lambda.ts` is the Phase B entry point for API Gateway and Lambda. `src/server.ts` is the Node http entry point for local and Render.
