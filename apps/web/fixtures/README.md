# CMS fixtures

Strapi 5 REST responses (`{ data, meta }`) used when `CMS_FIXTURES=1`: local dev without Strapi, unit tests, and CI builds (TDD §9.2). The copy is placeholder text, not campaign content.

- One file per collection, shaped like `GET /api/<collection>?populate=…` with the populate in `lib/cms.ts`.
- Every entry must pass the Zod schemas in `@llf/contracts` and the block registry, or the build fails. That's deliberate: fixtures double as a contract test.
- When the CMS schema changes (BD3244-11), update these in the same PR.
- TODO(BD3244-24): regenerate from the seed once it lands so fixtures and seed stay in step.
