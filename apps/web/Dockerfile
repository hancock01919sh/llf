# Build from repo root: docker build -f apps/web/Dockerfile .
# Next.js standalone server for AWS Fargate (TDD D36). Pages render on request with ISR, so the
# build needs no Strapi and no secrets: CMS_URL, CMS_TOKEN, TIPS_URL and the rest are runtime env
# from the ECS task definition (Secrets Manager / SSM for the secret ones).
FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH NEXT_TELEMETRY_DISABLED=1
RUN corepack enable

FROM base AS build
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
COPY packages/config/package.json packages/config/
COPY packages/contracts/package.json packages/contracts/
COPY packages/matching/package.json packages/matching/
COPY packages/ui/package.json packages/ui/
RUN pnpm fetch
COPY packages packages
COPY apps/web apps/web
RUN pnpm install --frozen-lockfile --offline --filter @llf/web...
ENV NODE_ENV=production
# `postbuild` copies .next/static and public next to the standalone server, so one process serves
# everything behind CloudFront.
RUN pnpm --filter @llf/web build

FROM base AS runtime
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build --chown=node:node /repo/apps/web/.next/standalone ./
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --start-period=30s CMD wget -qO- http://127.0.0.1:3000/healthz || exit 1
CMD ["node", "apps/web/server.js"]
