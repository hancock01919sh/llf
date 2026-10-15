# v3-product: how the Commons photos were labeled

Claude Opus 5.5 labeled each photo twice, in two independent passes that couldn't see each other (brief: `LABEL_BRIEF.md`; catalog: `eval/catalogs/eval-v2.json`). Adjudication is mechanical:

- **expected** = slugs both passes called clearly visible;
- **acceptable** = every other slug either pass named, so a model isn't penalised for a plausible call either way;
- photos where the passes disagreed on `readable` are dropped.

Passes agreed on 117 of 128 expected slugs (91%); 0 photo(s) dropped.

**Bias caveat:** Opus is also under test. Report the `commons-product` cases separately from the synthetic cases (labeled by construction) and read Opus's score on them as an upper bound.
