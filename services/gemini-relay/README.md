# Gemini relay (dev only)

A small relay on Render dev for developers who can't reach Google's API from mainland China (TDD D38, BD3244-109). It is **never** deployed to staging or prod: those call Gemini directly from AWS (D37).

- Accepts `POST /v1beta/models/{model}:generateContent` with a personal relay token in `x-goog-api-key`.
- Checks the token, swaps in ddd's capped Gemini dev key, and forwards the call to Google.
- Allows only the models in `RELAY_MODELS`, up to `RELAY_DAILY_CALLS` calls per UTC day in total, with size and time limits.
- Logs the status, model, latency, and the caller's token position only. No bodies, tokens, or keys (D20).

The tool uses it with `GEMINI_BASE_URL` and the relay token as `GEMINI_API_KEY` ([run-locally](../../docs/runbooks/run-locally.md#from-mainland-china-dev-only-tdd-d38)). Tokens are issued and revoked in [render-dev](../../docs/runbooks/render-dev.md#gemini-relay-tokens-tdd-d38). Every setting is listed in [`.env.example`](../../.env.example).

```sh
pnpm --filter @llf/gemini-relay test
pnpm --filter @llf/gemini-relay dev   # needs GEMINI_API_KEY and RELAY_TOKENS
```
