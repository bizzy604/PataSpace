# Purpose: Edge reverse-proxy image fronting the API and web containers.
# Why important: Gives the stack a single public entrypoint, routing /api/* to
#   the backend and everything else to the Next.js site.
# Used by: infra/docker/docker-compose.prod.yml and .github/workflows/docker-publish.yml.

FROM nginx:1.27-alpine
COPY infra/nginx/edge.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
