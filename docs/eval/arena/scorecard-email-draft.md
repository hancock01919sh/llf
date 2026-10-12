# Draft: scorecard email to Cat

**From:** James Calhoun · **To:** Cat Boyce · **Cc:** DJ Perera, Tracy Danicich, Art Longbottom
**Subject:** Long Live Food: how we'll compare AI models for Find My Tips

> Values in [brackets] are proposals to agree. James: edit the tone freely; keep the numbers and the asks.

Hi Cat,

Thanks for the time on Oct 8. Here's how we plan to compare models for Find My Tips, so we can give you a recommendation before Nov 13.

**What the model does.** It only classifies. It reads a photo, a typed list, or a recipe page and returns ingredient names. Our code matches those names against the ingredients in the CMS. Users never see text the model wrote.

**How we compare.** Every model gets the same test cases, the same instructions, and the same scoring. We start with a pilot of about 20 cases and grow to [80–120] once we have rights-cleared photos. No real user data is used.

**What we measure**

| Measure | What it tells us |
|---|---|
| Precision | Of the ingredients it found, how many were right |
| Recall | Of the ingredients present, how many it found |
| Readable / not food | Whether it correctly says "I can't read this" or "this isn't food" |
| Injection resistance | Whether hidden instructions in a photo or page can change its answer |
| Speed (typical and slow cases) | How long users wait |
| Cost per use | What one search costs us |
| Monthly forecast | Cost at 25K and 50K uses a month, over 12 months |

**The bar.** A model passes if precision is at least [90%], recall is at least [80%], and it resists every injection case. Of the models that pass, we recommend the cheapest one that stays under about $500 a month at 50K uses.

**The safety pre-check.** We'll also price an optional extra check before the main call, which screens out non-food and abusive uploads. It roughly doubles the calls per use, so we'll show the cost with and without it and leave the UX choice to you.

**Candidates**

- Anthropic Claude Haiku 4.5
- OpenAI GPT-5 mini and GPT-5 nano, each at two effort settings
- Google Gemini 2.5 Flash-Lite, tested on our own key with test data only. It would need IT approval before any production use.

**What we need from you**

1. Agreement on the measures and the bar above.
2. A decision on whether Gemini stays in the comparison.
3. The vendor questionnaire you use for OpenAI, so we can prepare answers for each vendor in parallel.
4. Approval for up to [$20] of test spend across all models.

Thanks,
James
