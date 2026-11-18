# Gemini proxy (dev only)

A small Express service on Render dev for developers who can't reach Google from mainland China (TDD D39, BD3244-121). It runs on the `llf-gemini-relay-dev` service and URL, and replaced the relay (D38). It's **never** deployed to staging or prod: those run the tool in Next.js route handlers and call Vertex AI from AWS (D36, D37).

Behind one personal token (`Authorization: Bearer …` or `x-goog-api-key`):

- `GET /api/find-tips/status` and `POST /api/find-tips/extract`: the **full Find My Tips API**, from the `find-my-tips` handler, Gemini only, locked by default to the arena's pick (Gemini 3.8 Flash, `p3`, thinking off).
- `POST /v1beta/models/{model}:generateContent`: the **relay**, for a locally run `find-my-tips`. It swaps the token for ddd's dev key, for allow-listed models, under a shared daily cap.
- `GET /healthz` and `GET /docs` need no token.

No tool logic lives here: it's all in `services/find-my-tips`. Logs carry the route, status, caller's token position, model and latency only. No bodies, tokens or keys (D20).

Setup, endpoints, error states and token handling are in [`docs/runbooks/gemini-proxy.md`](../../docs/runbooks/gemini-proxy.md).

```sh
pnpm --filter @llf/gemini-proxy test
pnpm dev:proxy        # needs GEMINI_API_KEY and RELAY_TOKENS (or PROXY_TOKENS) in .env; port 8790
pnpm proxy:check      # checks GEMINI_PROXY_URL + GEMINI_PROXY_TOKEN from .env against a running proxy
```
