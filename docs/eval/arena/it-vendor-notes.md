# IT vendor notes

Working notes for Ad Council IT approval (BD3244-37). Cat has a questionnaire for OpenAI; once we have it, we answer it for each vendor in parallel.

## Vendor status

| Vendor | Use | Approval for this use | Next step |
|---|---|---|---|
| OpenAI | Candidate for production; TBWA test key for the arena | Planned production provider; questionnaire in progress | Get Cat's questionnaire and TBWA's capped test key |
| Anthropic | Dev and Phase A on ddd's key; arena candidate | Pending (OPEN-2). Internal staff use only today | IT acceptance of ddd's dev key |
| Google (Gemini) | Arena candidate on ddd's own key (dev/eval, test data only) | Pending (like Anthropic). Not approved for production | IT acceptance of ddd's key for eval; IT approval before any production use |
| AWS Bedrock | Option to run models in Ad Council's AWS | AWS is approved; model terms vary | Decide after OPEN-1 |

## Questionnaire tracker

| Vendor | Sent | Answers drafted | Returned to IT | Notes |
|---|---|---|---|---|
| OpenAI | | | | Cat's template |
| Anthropic | | | | |
| Google | | | | Only if Gemini is considered for production |

## Answers we can give for our side

- **Data sent:** one photo, typed list, or recipe-page text per request. Nothing about the user.
- **Data stored:** none from photos or typed text. For recipe URLs, a hash of the URL and the extracted terms.
- **Output use:** structured ingredient names only, validated and matched against the CMS. No generated text is shown.
- **Keys:** stored in Secrets Manager or SSM on AWS and in Render env groups for dev. Never in code, tickets, or chat.
- **Spend controls:** see [`cost-controls.md`](cost-controls.md).
- **Swapping vendors:** a config change (`AI_PROVIDER`, `AI_MODEL`), with no code change (TDD [§7.7](../../TDD.md#77-provider-abstraction)).
