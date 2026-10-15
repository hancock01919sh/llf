# Labeling brief: fridge/freezer photos for the Long Live Food model eval

You are labeling photos for an eval of an ingredient-extraction feature. A user uploads a photo of their fridge; the model must list the food ingredients it can see. Your labels are the answer key.

Catalog: catalog.txt lists every allowed slug as `slug: Title (synonyms)`. Use ONLY these slugs. Anything not in the catalog (beer, soda, wine, water, generic "leftovers", unlabeled opaque containers) is simply not labeled.

For each image, view it (use the view tool on the absolute path) and decide:
- expectedSlugs: catalog ingredients that are CLEARLY identifiable in the photo — a careful human would name them confidently from the photo alone (visible produce, eggs, a milk jug, labeled packaging that is legible, an identifiable cut of meat, etc.). Be conservative: if you'd hesitate, it is not expected.
- acceptableSlugs: catalog ingredients that are plausibly present but not certain (partially hidden, small, blurry, ambiguous container, could be one of two things — put both). A model naming these is neither rewarded nor punished. Also put here generic matches a model may reasonably make (e.g. `cheese` for an unclear yellow block, `sauce`-type condiments in door bottles you can't read).
- No overlap between expected and acceptable. No duplicates.
- readable: true if the photo shows food a user could extract ingredients from; false if there's essentially no identifiable food (then expectedSlugs must be []).
- notes: one short line on anything tricky.

Rules: don't guess brands into ingredients unless the label is legible. Don't label things only implied (e.g. a closed egg carton IS eggs if clearly an egg carton). Condiment bottles: only expected if clearly identifiable (red squeeze bottle shaped like ketchup with legible label, yellow mustard bottle).

Output: write a JSON array to the output path given to you, one object per image:
{"id": "fridge-001", "readable": true, "expectedSlugs": [...], "acceptableSlugs": [...], "notes": "..."}
Then reply with just "done <n>".
Do not read any other labels files in  — your pass must be independent.
