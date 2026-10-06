# Long Live Food / Finish the Fridge — Project Context

> Context document for coding agents working on the Ad Council "Ending Wasted Food" digital product.
> Last updated: 2026-10-06. Sources: the kickoff call with Ad Council (Oct 1; full transcript), the CMS walkthrough with the previous TBWA developers (Sep 29), and the project email threads up to Oct 5.
>
> **Confidence labels used below:**
> - **[CONFIRMED]** stated by the client or in the repo or handoff.
> - **[FROM WALKTHROUGH]** seen in the previous dev team's screen share. Check it against the code before relying on it.
> - **[PROPOSED]** our recommended approach, not yet approved by the client.
> - **[OPEN]** undecided. Don't make assumptions about it; flag it instead.

> **Update, Oct 6 (TDD v0.3).** Where this document and the [TDD](./TDD.md) disagree, **the TDD wins**. The tech lead has since decided ([TDD §14](./TDD.md#14-decision-log)):
> - **Hosting in two phases.** Phase A: local + **Render** (ddd's account) for dev and staging only. Phase B: **Ad Council AWS** from Beta (Dec 8), and always for prod.
> - **Postgres in every environment**, a separate CMS per environment, and content seeded by scrape → JSON → import.
> - **Tailwind CSS + shadcn/ui**, WCAG 2.1 AA.
> - **CMS admin on its own domain behind an IP allow-list.**
> - **Branches `dev` → `staging` → `prod`.** The repo moves to Ad Council's GitHub by Oct 16; the China team works from Jira tickets.
> - **AI in dev runs on ddd's Anthropic key** (pending IT acceptance, OPEN-2); the production provider is still OPEN-1 ("most likely Anthropic" at kickoff).
> - **Hybrid content model (D21).** The CMS holds collections, Global, Tool Copy, long-form rich text, and asset slots (such as hero images). Site strings live in typed files in `apps/web/content/`; designed routes use code templates; a dynamic zone of blocks is used only for generic pages. There's **no Microcopy type**. Copy changes to strings go issue → Copilot coding agent → PR → Render preview (OPEN-32). This supersedes the Strings and Page notes in §5 below.
> - The **V2 timeline**, QA rounds, and decision deadlines are in [TDD §12](./TDD.md#12-delivery-plan).

---

## 1. What we're building

A consumer website, **longlivefood.org**, that helps households waste less food. The main feature is a **"Find My Tips" tool**. A user gives it something they already have (a recipe link, a receipt photo, a shopping list, or eventually a photo of their fridge), and the site shows practical food-waste tips for the ingredients it finds. For example: "use your broccoli stems in a slaw or pesto."

- **Client:** The Ad Council, on behalf of the **Long Live Food coalition**: EPA, Ad Council, WWF, ReFED, and WRAP. [CONFIRMED]
- **Creative agency:** TBWA. They made the campaign and the approved designs. [CONFIRMED]
- **Development:** dotdotdash (ddd, part of Omnicom). We took over from TBWA's developers (Dan Johnston and Dave Lee), who have since moved to other work. [CONFIRMED]
- **Campaign vs. site:** "Finish the Fridge" is the current creative campaign. "Long Live Food" is the coalition's brand and the permanent site, so the site has to keep working if the campaign changes. `finishthefridge` domains will redirect to longlivefood.org. [CONFIRMED]
- **Main goal:** get people from the PSAs, social posts, PR, and local grant programs to the site and using the tool. [CONFIRMED]

### What the product is not
- **Not a recipe site.** It doesn't try to compete with NYT Cooking, Allrecipes, or Martha Stewart. It adds to them. [CONFIRMED]
- **Not about composting.** Composting is handled by other programs funded by the same EPA grant. The site covers keeping food out of both the trash and the compost. [CONFIRMED]
- **Not a chatbot.** There's no open-ended AI conversation. [PROPOSED]

---

## 2. Timeline and team

| Item | Detail |
|---|---|
| **Go-live** | **January 8, 2027.** Moved up from Jan 18. [CONFIRMED] |
| **Development start** | October 8, 2026, with the ddd China team, starting on local environments. [CONFIRMED] |
| **Design** | All designs are approved and locked **except the mobile toolkit page**. Copy and images can still change, but functionality can't. [CONFIRMED] |
| **QA** | ddd internal QA, then Ad Council content QA, then the coalition clicks through for **development bugs only, with no design feedback**. QA is tracked in our Jira. [CONFIRMED] |
| **UAT** | May overlap the Christmas and New Year period. [CONFIRMED] |

**People (for reference in tickets and comments):**
- **Ad Council:** Cat Boyce (Director, Digital Product Management, the day-to-day contact), Tracy Danicich and Hilary Landa (campaign and issue experts), and an AI tools lead / Chief Media Officer who will join the AI decision.
- **TBWA / OMC production:** Courtney Coyne and Megan Jenkins.
- **ddd:** Danish Aziz (PM), Adam Paikowsky (analytics and accounts), James Calhoun and Art Longbottom (tech leads), James Steele (AWS and DevOps), Colleen Miller (image selection), and Eva Fan, Alessandro Grena, and Maggie Ding (China dev team).

---

## 3. Repos, infrastructure, and access

| System | Status |
|---|---|
| **GitHub** | `AdCouncil/ending-wasted-food-strapi` holds the Strapi CMS scaffolding. It's committed and in theory ready to deploy. [CONFIRMED] There's **no frontend repo from Ad Council yet**. Dan's prototype frontend ("test") was never committed to a repo, and we've only been given the middleware and API querying approach. [CONFIRMED] |
| **AWS** | Ad Council's account. TBWA planned **CodePipeline → Elastic Beanstalk** for Strapi plus a database, but **nothing is deployed**. [CONFIRMED] Admin access is requested for James S, James C, and Art and is still pending. At kickoff, James C's **IAM user** (username and password, not SSO) could create a CodeBuild project but **couldn't list users or pipelines**; James S is checking whether his account has admin, and Danish's account is on hold until permissions are fixed (OPEN-3). The China team doesn't need AWS for weeks; they deploy to Render dev with PR previews. Ad Council is changing DevOps partners, so deployment processes may change before launch. [OPEN] |
| **Strapi environment** | Not deployed yet. We'll need to stand it up in AWS. The China team needs CMS access. [CONFIRMED] Strapi is self-hosted, so access means admin accounts on our cms-dev instance (Super Admin for team leads, Editor for the rest), not invites to a SaaS platform. Schema changes and migrations go through code and deploys. [PROPOSED] |
| **OpenAI** | **There's no production account.** We only have TBWA's **test key with a $20 spending cap**. Ad Council IT has to approve OpenAI before Ad Council creates an account. [CONFIRMED] Which provider we use is still **[OPEN]** (see §7). |
| **Project tracking** | ddd uses Jira for development and QA, and Ad Council can get visibility into it. Ad Council uses Asana and Slack (Slack Connect with ddd). [CONFIRMED] |
| **New tools** | Any new SaaS or tool needs **Ad Council IT approval** first. So far: GitHub, AWS, Strapi, and OpenAI. **Don't add third-party services** without flagging them. [CONFIRMED] |

**Rules for agents:**
- Never commit secrets. Locally, use `.env` files that are git-ignored. In AWS, keys go in **Secrets Manager**. [PROPOSED]
- The OpenAI test key has a hard $20 cap. Tests and CI must **mock model calls** and use recorded fixtures. Only run against the live API when someone deliberately runs the evaluation suite. [PROPOSED]

---

## 4. Tech stack

| Layer | Choice |
|---|---|
| CMS | **Strapi** (headless). [CONFIRMED] |
| Frontend | **Next.js / React** (the handoff described the stack as "Strapi/Next.js/OpenAI"). Pages are pre-rendered from the Strapi pages API. [CONFIRMED stack / FROM WALKTHROUGH pattern] |
| AI service | A small separate service, most likely **AWS Lambda** behind API Gateway. [PROPOSED] |
| Hosting | AWS (Elastic Beanstalk for Strapi was planned; the frontend host is undecided). [OPEN] |
| Analytics | **Google Tag Manager + GA4**, driven by a data layer. [CONFIRMED] |
| Language | TypeScript throughout. [PROPOSED] |

---

## 5. CMS content model [FROM WALKTHROUGH — check against the repo schema]

> **Checked against the repo on 2026-10-06** (`AdCouncil/ending-wasted-food-strapi` at `f753967`). Several items below don't match the code: there's no Strings type, no Accordion or Modal module, Ingredient uses `title` instead of `name`, and `synonyms` is a single string. See [TDD §5.1](./TDD.md#51-audit-of-the-existing-strapi-repo) for the full audit and the proposed v1 schema.

Content types Dan built in Strapi:

- **Tip:** the main content item. It relates to:
  - **Tip Behavior**: one of the coalition's 7 food-waste-reduction behaviors, such as plan meals, make a list, shop with intention, or portion food. Probably used as a search filter.
  - **Tip Motivator**: why someone cares (money, environment, values). Probably used as a filter.
  - **Tip Type**: the kind of tip.
  - **Ingredient**: the ingredient the tip is about.
- **Ingredient**
  - `name` (for example "chorizo")
  - `image`
  - `synonyms`: alternate names editors can add, such as "sausage," to improve matching against AI output. Partly built.
  - `wasted`: a 1–5 score (5 = commonly wasted, 1 = rarely wasted), used for sorting.
- **Category**, for example "chicken and rice balls"
  - Contains multiple ingredients.
  - Has a toggle: show **all tips for its ingredients**, or show **specific chosen tips**.
  - Can be its own page, with per-page SEO fields that override the defaults.
- **Group**, for example "Weeknight dinner staples": a collection of categories that some part of the UX needs.
- **Strings / microcopy**: single-string entries so editors can change UI copy without a developer. *(Superseded by TDD D21: site strings live in code, in `apps/web/content/`.)*
- **Page**: has a **dynamic zone** of modules editors can drag and drop *(TDD D21: designed pages use code templates with CMS slots; the dynamic zone of blocks is kept only for generic pages)*:
  - Ad Council–specific modules: **Primary Hero** (displays the page title), **Find My Tips Tool**, custom search.
  - Generic modules: **Teaser** (title, choice of heading level, rich text, links (related, overridden, or custom), image, and a layout variant such as quote-centered with a circular image or left-aligned), **Link List**, **Accordion**, **Modal**, and **Hero Carousel** (**which design has dropped, so remove or ignore it**).
  - Example: a "ULD homepage" Page entry.
- There's a **typeahead ingredient search** in the admin UI. It's only partly working.

**Known gaps:** Some modules from the approved designs aren't built. One example is Harvey's **scroll-lock section**: the page pins in place while the inner content scrolls, then releases at the end. There's no list of what was finished and what wasn't, so **use the Figma designs as the source of truth** and treat the existing code as reference.

---

## 6. Frontend rendering pattern [FROM WALKTHROUGH]

- At build time, fetch every Page from the Strapi pages API, pre-render it, and resolve the page's data with Strapi's specific query/populate syntax. TBWA provided documentation on that syntax.
- Render the dynamic zone by mapping each module's `__component` type to a React component, in the order editors set.
- Treat the module registry as the single place for adding new modules. It maps each type to a component and a data-fetching adapter.

**Requirements:**
- **Accessibility: WCAG 2.1 AA is the minimum.** That covers semantic headings (respect the heading level chosen in the CMS), keyboard navigation, focus management in modals and carousels, alt text from the CMS, color contrast, and `prefers-reduced-motion`, which matters especially for the scroll-lock module. [CONFIRMED]
- **SEO and AI-search readiness.** Ad Council cares about being found through search and AI answer engines:
  - schema.org JSON-LD where it fits (Organization, WebSite, FAQPage, HowTo/Article for tips, BreadcrumbList).
  - Clean URLs, per-page metadata overrides from the CMS, sitemap, canonical URLs.
  - An FAQ or About section that explains "Finish the Fridge" so people who search for the campaign name land on the site. [CONFIRMED]
- It must **not look like a government website**. The tone is aspirational, appetizing, and witty. [CONFIRMED]

---

## 7. The AI feature: "Find My Tips"

### 7.1 Inputs [CONFIRMED with some PROPOSED scope]
- **Recipe URL** that the user pastes.
- **Uploaded image**: a receipt, a shopping list (typed or handwritten), or a recipe. **Fridge photos** are a stated future goal; treat them as a stretch goal unless someone confirms they're in scope.
- Possibly pasted text.

### 7.2 Architecture: retrieval, not generation [PROPOSED — recommended to the client]

```
input ─▶ [1] Extract ─▶ [2] Normalize ─▶ [3] Match (code only) ─▶ [4] Return CMS tips
```

1. **Extract.** A vision model returns **only structured JSON**: the ingredient list. It never returns text that users will see.
   - For recipe URLs, **first try to parse the page's schema.org `Recipe` JSON-LD** (`recipeIngredient`) without calling the model. Fall back to the model only when that data is missing.
2. **Normalize.** Give the model the current list of ingredient names (and synonyms) from Strapi so it maps what it finds to our exact names where it can. Example: `"BNLS CHKN BRST" → "chicken breast"`.
3. **Match.** Our code matches the extracted names against Strapi Ingredient `name` and `synonyms`. It's case-insensitive, handles plurals, and can do a light fuzzy match. **No AI is involved in this step.**
4. **Return** the approved Tips from the CMS for the matched ingredients, sorted by the `wasted` score (and any other relevance rules).
5. **Log unmatched ingredients** as anonymous counts so the content team can see gaps and add synonyms or tips. That could be a Strapi collection or a simple data store. [PROPOSED]

**Why this matters (non-negotiable unless the client changes it):**
- **The AI never writes or edits tip content.** Everything users see comes from the CMS or the repo's typed site strings (TDD D21), never from the model, so it's covered by coalition review. That rules out invented food-safety advice from an EPA-backed brand.
- It limits the damage from prompt injection, for example a malicious recipe page or text hidden in an image. The model's output is just data that we check against a fixed list, so injected text can never reach the page.
- It lets us use a cheaper, smaller model.

**Possible phase 2 (not for launch):** let the model **choose and order approved tips**, for example for a whole-fridge photo, using only CMS tips as its source (RAG over the tips library). Still no free-form generation.

**Recipes:** whether the site shows full recipes, and **who owns them** (old Ad Council campaign content, coalition partners such as WRAP, newly written content, or a licensing partner) is **[OPEN]**. Don't build recipe generation.

### 7.3 Extraction output schema [PROPOSED]

```ts
type ExtractionResult = {
  inputType: "receipt" | "shopping_list" | "recipe" | "fridge_photo" | "unknown";
  ingredients: Array<{
    raw: string;            // as seen, e.g. "BNLS CHKN BRST"
    name: string;           // normalized, e.g. "chicken breast"
    matchedCatalogName?: string; // exact Strapi ingredient name if the model mapped it
    confidence: number;     // 0..1
  }>;
  nonFoodItemsIgnored?: number;
  readable: boolean;        // false → show "couldn't read" state
};
```
Use the provider's strict structured-output / JSON-schema mode, and validate the response with Zod before using it.

### 7.4 Model provider [OPEN]
- **Default plan: OpenAI**, because the prototype used it. We've recommended a mid-tier model and will benchmark it against a cheaper tier using an evaluation set, then use **the cheapest model that meets the quality bar**.
- **Alternative: Anthropic Claude.** Ad Council already uses Claude internally, so it may get through IT approval faster. It could run through AWS Bedrock in their account.
- **Requirement:** put every model call behind **one provider-agnostic interface**, for example `extractIngredients(input): Promise<ExtractionResult>`, with an adapter per provider. Choose the model with configuration, not by changing code.

### 7.5 Abuse and cost controls [PROPOSED]
- Rate-limit per IP and per session, with AWS WAF in front of the endpoint.
- A bot check before the upload is processed. The product must be approved by Ad Council IT first (see §3).
- Limit upload size and type: images only, resized and compressed in the browser before upload, with a server-side limit.
- Cap model output tokens and set request timeouts.
- Cache results for recipe URLs, keyed on the normalized URL.
- Set a spending cap and alerts on the provider account.
- **Don't store uploaded images.** Process them in memory and discard them, unless the client decides otherwise. That decision is [OPEN] and affects the privacy policy.
- Keep personal data and uploaded images out of logs.

### 7.6 Evaluation [PROPOSED]
- Keep an **evaluation set** in the repo: receipts (including value and rural grocers), handwritten and typed lists, recipe URLs with and without JSON-LD, and fridge photos, each with the expected ingredients.
- Track **precision and recall of matched ingredients** for each model and prompt version, and re-run the set whenever the prompt, schema, or model changes.
- TBWA's prototype script (`node index.mjs`) and its sample receipts are reference material only.

### 7.7 UX states to handle
Loading (extraction can take seconds), success, **partial match**, **no match**, **unreadable image**, rate-limited, and error. The copy for no-match and unreadable states is [OPEN] and will be needed from the client. Users often arrive in a hurry ("my plans changed and I have broccoli to use up"), so the tool has to be fast and work well on mobile.

---

## 8. Analytics [CONFIRMED approach / PROPOSED events]
- **GTM + GA4.** Ad Council's analyst will provide or co-create a **tagging matrix**. ddd implements it in GTM.
- Implement it through a **dynamic `dataLayer`** so new CMS content and modules are tracked **without developer work**. For example, generic `module_view` and `cta_click` events whose parameters come from CMS data.
- Proposed tool events: `tips_tool_start` (input_type), `tips_tool_submit`, `tips_tool_result` (ingredients_found, ingredients_matched, tips_shown), `tips_tool_no_match`, `tips_tool_error` (reason), `tip_view`, `tip_interaction`.
- **No personal data in the data layer.** Don't send raw ingredient text if it could identify someone. Matched catalog names are fine.

---

## 9. Content and brand guidelines (affects UI, images, and copy)
- **Audience:** young adults and parents with children under 18 at home. Busy people with little time to change plans.
- **Representation:** reflect a wide range of people, foods, stores, and kitchens, **including low-income and rural communities**. Not just farmers-market shoppers.
- **Images:** aspirational and appetizing, never preachy. **Avoid showing food being thrown away.** If it can't be avoided, show it going in the **compost, never the trash**.
- **Tone:** fun, witty, "make the invisible visible." No blaming or shaming.
- Coalition feedback always comes to us **consolidated through Ad Council**, as one voice.

---

## 10. Open questions (flag these; don't guess)
1. Which AI provider (OpenAI or Claude/Bedrock), and when will IT approve it?
2. Is there an interim development key so the China team isn't blocked on Oct 8?
3. What AWS permissions will we have, and how will the DevOps partner transition affect deployment?
4. Where will the frontend be hosted?
5. Will uploaded images be kept? (This drives the privacy policy and FAQ.)
6. Are recipes in scope, and who owns them?
7. Are fridge photos in scope for launch?
8. What copy should appear for no-match and unreadable results? What accuracy is "good enough" for launch?
9. Who designs the mobile toolkit page?
10. Which modules from the designs are still unbuilt? (Audit the code against Figma.)

---

## 11. Rules for coding agents
- **Figma is the source of truth** for the UI. TBWA's code is reference only.
- **Never show AI-generated text to users.** Tip content comes only from Strapi.
- Keep the AI provider **swappable** behind one interface.
- **Mock all model calls** in tests and CI. The current test key has a $20 cap.
- **Don't add new SaaS, npm packages that call outside services, or third-party scripts** without flagging them. Each one needs Ad Council IT approval.
- Treat accessibility (WCAG 2.1 AA) and SEO structured data as part of every component's definition of done.
- Strapi schema changes must stay friendly to content editors. Content belongs in CMS fields and short UI strings in `apps/web/content/` (TDD D21); never inline copy in components.
- Never commit secrets. Use Secrets Manager in AWS and git-ignored `.env` files locally.
