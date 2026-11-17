# Build from repo root: docker build -f services/find-my-tips/Dockerfile .
# The Find My Tips tool for AWS Fargate. Until its handlers move into Next.js route handlers
# (BD3244-87, TDD D36), it runs as a sidecar container in the web task and Next.js proxies `/api/*`
# to it on localhost (TIPS_URL=http://localhost:8787). It runs from source with tsx, as on Render.
# Provider, model and keys are runtime env from the ECS task definition; no secrets at build time.
FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable

FROM base AS build
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY services/find-my-tips/package.json services/find-my-tips/
COPY packages/config/package.json packages/config/
COPY packages/contracts/package.json packages/contracts/
COPY packages/matching/package.json packages/matching/
RUN pnpm fetch
COPY packages/contracts packages/contracts
COPY packages/matching packages/matching
COPY services/find-my-tips services/find-my-tips
RUN pnpm install --frozen-lockfile --offline --filter @llf/find-my-tips...
# A self-contained copy with production dependencies only, as in apps/cms/Dockerfile.
RUN pnpm deploy --filter @llf/find-my-tips --prod /out

FROM base AS runtime
ENV NODE_ENV=production TOOL_PORT=8787
WORKDIR /app
COPY --from=build --chown=node:node /out ./
USER node
EXPOSE 8787
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s CMD wget -qO- http://127.0.0.1:8787/api/find-tips/status || exit 1
CMD ["node_modules/.bin/tsx", "src/server.ts"]
