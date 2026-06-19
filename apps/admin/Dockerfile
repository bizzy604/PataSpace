# Purpose: Production container image for the @pataspace/admin Vite/React console.
# Why important: Builds the SPA to static assets and serves them via nginx, the
#   standard lean way to ship a Vite app.
# Used by: infra/docker/docker-compose.prod.yml and .github/workflows/docker-publish.yml.
#
# Build context is the repo root so the pnpm workspace resolves.

# ---- Builder: install the workspace and produce the static bundle ----
FROM node:20-slim AS builder
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm --filter @pataspace/contracts build \
  && pnpm --filter @pataspace/admin build

# ---- Runner: nginx serving the built SPA ----
FROM nginx:1.27-alpine AS runner
COPY apps/admin/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/admin/dist /usr/share/nginx/html
EXPOSE 80
