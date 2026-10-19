# IT vendor notes

Working notes for Ad Council IT approval (BD3244-37). Cat has a questionnaire for AI vendors; once we have it, we answer it for each vendor in parallel. **Anthropic is the only authorized AI vendor; OpenAI is not** (confirmed Oct 19).

## Vendor status

| Vendor | Use | Approval for this use | Next step |
|---|---|---|---|
| Anthropic | Dev and Phase A on ddd's key; recommended backup model (Claude Opus 5.5) | **Authorized** (confirmed Oct 19) | Client account and production key (OPEN-1) |
| Google (Gemini) | Recommended primary model (Gemini 3.8 Flash); ddd's own key for dev/eval, test data only | **Not authorized** for production | IT approval (OPEN-2) |
| OpenAI | Arena comparison only, on TBWA's capped test key | **Not authorized** | None unless Ad Council asks |
| AWS Bedrock | Option to run models in Ad Council's AWS | AWS is approved; model terms vary | Decide after OPEN-1 |

## Questionnaire tracker

| Vendor | Sent | Answers drafted | Returned to IT | Notes |
|---|---|---|---|---|
| Google | | | | Primary model candidate |
| Anthropic | | | | Authorized; confirm production terms |

## Answers we can give for our side

- **Data sent:** one photo, typed list, or recipe-page text per request. Nothing about the user.
- **Data stored:** none from photos or typed text. For recipe URLs, a hash of the URL and the extracted terms.
- **Output use:** structured ingredient names only, validated and matched against the CMS. No generated text is shown.
- **Keys:** stored in Secrets Manager or SSM on AWS and in Render env groups for dev. Never in code, tickets, or chat.
- **Spend controls:** see [`cost-controls.md`](cost-controls.md).
- **Swapping vendors:** a config change (`AI_PROVIDER`, `AI_MODEL`), with no code change (TDD [§7.7](../../TDD.md#77-provider-abstraction)).
