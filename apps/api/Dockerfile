# Purpose: Production container image for the NestJS @pataspace/api backend.
# Why important: The immutable, reproducible runtime artifact used to provision
#   the API everywhere (local compose, registry-based deploys, CI image checks).
# Used by: infra/docker/docker-compose.prod.yml and .github/workflows/docker-publish.yml.
#
# Build context is the repo root so the pnpm workspace (packages/contracts) resolves.
# The runner re-installs ONLY the API's dependency closure, so the image excludes the
# web/admin/mobile dependency trees while keeping the Prisma CLI + ts-node that the
# migration step needs.

# ---- Builder: install the workspace and compile the API ----
FROM node:20-slim AS builder
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
# OpenSSL is required by Prisma's query engine at generate and runtime.
RUN corepack enable \
  && apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm --filter @pataspace/contracts build \
  && pnpm --filter @pataspace/api prisma:generate \
  && pnpm --filter @pataspace/api build

# ---- Runner: API-scoped install + built artifacts only ----
FROM node:20-slim AS runner
ENV NODE_ENV=production
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV PORT=3001
RUN corepack enable \
  && apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Workspace manifests + lockfile are needed for a deterministic scoped install.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY apps/admin/package.json apps/admin/
COPY apps/mobile/package.json apps/mobile/
COPY packages/contracts/package.json packages/contracts/
COPY packages/design-tokens/package.json packages/design-tokens/

# Install only the API closure (incl. prisma CLI + ts-node for migrations); the
# shared BuildKit store cache makes this reuse the builder's downloads.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts --filter @pataspace/api...

# Built artifacts + Prisma schema/bootstrap scripts from the builder.
COPY --from=builder /app/packages/contracts/dist packages/contracts/dist
COPY --from=builder /app/apps/api/dist apps/api/dist
COPY --from=builder /app/apps/api/prisma apps/api/prisma
COPY apps/api/tsconfig*.json apps/api/

# Generate the Prisma client against the installed @prisma/client.
RUN pnpm --filter @pataspace/api prisma:generate

EXPOSE 3001
USER node

# Default command runs the API. The compose "api-migrate" service overrides this
# to run `prisma:migrate:deploy` as a separate, single-owner release step.
CMD ["node", "apps/api/dist/main.js"]
