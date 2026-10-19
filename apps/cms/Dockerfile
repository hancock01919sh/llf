# Build from repo root: docker build -f apps/cms/Dockerfile .
FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH STRAPI_TELEMETRY_DISABLED=true
RUN corepack enable

FROM base AS build
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/cms/package.json apps/cms/
# pnpm deploy resolves the root importer, whose devDependency @llf/config must exist in the workspace.
COPY packages/config/package.json packages/config/
RUN pnpm fetch
COPY apps/cms apps/cms
RUN pnpm install --frozen-lockfile --offline --filter @llf/cms...
ENV NODE_ENV=production
RUN pnpm --filter @llf/cms build
RUN pnpm deploy --filter @llf/cms --prod /out && rm -rf /out/build && cp -r apps/cms/build /out/build

FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /out ./
USER node
EXPOSE 1337
HEALTHCHECK --interval=15s --timeout=3s --start-period=60s CMD wget -qO- http://127.0.0.1:1337/_health || exit 1
CMD ["node_modules/.bin/strapi", "start"]
