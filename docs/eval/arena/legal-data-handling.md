# Data handling summary for Legal

Draft for Ad Council Legal (BD3244-37). James Calhoun owns it; Art reviews it. Fill the vendor columns once the vendors confirm their terms.

## What Find My Tips does with user input

- **Photos and typed text** are processed in memory and sent to the model provider for one request. We never store or log them (TDD D20).
- **Recipe URLs:** we fetch the public page. We cache only a hash of the URL and the ingredient terms taken from that page.
- **The model only classifies.** It returns ingredient names. Our code matches them against the CMS catalog. Users never see text the model wrote.
- **Unmatched items** are shown as a count, never as the model's words.
- **Analytics** carry no personal data or user text: no search terms, ingredients, or submitted URLs (TDD §8).
- **No accounts and no sign-in.** We don't know who a user is.
- User text never goes in a URL, so it doesn't end up in CDN or WAF logs.

## Test data for model comparison

- Synthetic text, public recipe pages, and photos that we own or that are licensed for this use.
- No people, faces, or personal data in any photo. Each image records its source and rights, and the harness refuses any set with an unreviewed source.
- No real user input is ever used for testing.

## What we need to confirm per vendor

| Question | Anthropic | OpenAI | Google | AWS Bedrock |
|---|---|---|---|---|
| Is API data used to train models? | | | | |
| How long is input retained, and can retention be zero? | | | | |
| Where is data processed and stored? | | | | |
| Is a data processing agreement (DPA) available? | | | | |
| Which subprocessors are involved? | | | | |
| Security certifications (for example SOC 2, ISO 27001) | | | | |
| Abuse-monitoring access to inputs | | | | |
| Already approved by Ad Council for this use? | | | | |

> Claude and Copilot are approved for internal staff use only. Every provider, including those two, needs approval for this public use case.
