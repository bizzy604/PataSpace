# Purpose: Production container image for the @pataspace/web Next.js site.
# Why important: Ships the public browsing experience as a small, self-contained
#   standalone server image for compose / registry-based deploys.
# Used by: infra/docker/docker-compose.prod.yml and .github/workflows/docker-publish.yml.
#
# Build context is the repo root so the pnpm workspace resolves. Requires
# `output: 'standalone'` + `outputFileTracingRoot` in apps/web/next.config.mjs.

# ---- Builder: install the workspace and produce the standalone bundle ----
FROM node:20-slim AS builder

ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

RUN corepack enable
WORKDIR /app

COPY . .
RUN pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm --filter @pataspace/contracts build \
  && pnpm --filter @pataspace/web build

# ---- Runner: only the standalone output, static assets, and public files ----
FROM node:20-slim AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
WORKDIR /app

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000
USER node
CMD ["node", "apps/web/server.js"]
