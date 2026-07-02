# PataSpace Production Readiness Audit

Date: 2026-06-28
Scope: `apps/api`, `apps/web`, `apps/admin`, `apps/mobile`, `packages/*`, `infra/*`, CI.
Method: static review of auth, money paths, RLS, config, infra, CI; dependency
audit (`pnpm audit`); secret scan.

## Verdict

The backend is well-engineered for production. The money paths (M-Pesa STK,
B2C payouts, Stellar, credit ledger) are idempotent and transactional, the RLS
layer is real and enforced per-query, secrets are encrypted (AES-256-GCM) with
HMAC blind indexes, webhook callbacks use timing-safe auth and fail closed, and
the infra (multi-stage images, non-root user, least-privilege DB roles,
healthchecks, one-shot migration owner) is sound.

It is **not ship-ready as-is** because of three things that are independent of
code quality: a large unpatched dependency surface (4 critical / 68 high), no
logging of unhandled 500s (you cannot debug a prod incident), and a config gap
where `CLERK_SECRET_KEY` is not validated at startup so a prod deploy can boot
with all Clerk auth silently broken.

Status: **DONE_WITH_CONCERNS** — audit complete, findings below with severity,
evidence, and fix. No code was changed.

---

## P0 — Block release

### 1. Dependency vulnerabilities: 4 critical, 68 high, 77 moderate

`pnpm audit` reports 158 advisories. The ones that matter for this app:

| Package | Sev | Advisory | Where it bites |
|---|---|---|---|
| `@clerk/nextjs` / `@clerk/shared` | critical | Middleware route-protection bypass (GHSA) | `apps/web` (`@clerk/nextjs ^7.1.0`) |
| `@clerk/backend` | high | same family | `apps/api` token verification (`^3.4.9`) |
| `handlebars` | critical | JS injection via AST type confusion | transitive |
| `shell-quote` | critical | `quote()` newline escape bypass | transitive |
| `multer` | high | DoS via deeply nested field names | `apps/api` uploads (>=1 <2.2.0) |
| `axios` | high | 11 paths | API + clients |
| `undici` | high | WebSocket DoS (<6.27.0) | transitive |
| `next` | high | 8 paths | `apps/web` |

Mitigant on the Clerk critical: `apps/web` has **no `middleware.ts`** — route
protection is not done via Clerk middleware, the API is the trust boundary
(RLS + guards verify the token on every request). So the web blast radius is
limited, but the packages still must be updated.

Fix:
- Bump `@clerk/nextjs`, `@clerk/backend`, `@clerk/expo` to the patched majors.
- Bump `multer >=2.2.0`, `undici >=6.27.0`, `axios`, `next` to current.
- Add a pinned override for transitive `handlebars`/`shell-quote` or update the
  parent (`@xmldom/xmldom`, EAS/expo tooling) that pulls them.
- Re-run `pnpm audit --audit-level high` until clean, then `pnpm test` + build.

### 2. Unhandled 500s are never logged with a stack trace

`apps/api/src/common/filters/all-exceptions.filter.ts` catches everything and
returns a generic `{ code: INTERNAL_SERVER_ERROR, message: "Internal server
error" }`, but it **does not log the exception**. `LoggingInterceptor`
(`logging.interceptor.ts:38`) logs the request line with `statusCode: 500` and
nothing else. Net effect: a production 500 leaves a log saying "something
returned 500" with no error, no stack, no cause. Incidents become guesswork.

Fix: in `AllExceptionsFilter.catch`, when `status >= 500` (or the exception is
not an `HttpException`), `this.logger.error(message, stack)` with the requestId,
sanitized path, and userId from `RequestContextService`. Keep the client
response generic; log the detail server-side. Add a test asserting a thrown
non-HTTP error produces an `error`-level log.

### 3. `CLERK_SECRET_KEY` is not validated at startup

`app.config.ts:64` reads `process.env.CLERK_SECRET_KEY`, and
`clerk-jwt.strategy.ts` defaults it to `''` when unset. It is **absent from**
`env.validation.ts`. A production deploy missing the key passes env validation,
boots green, and then rejects every Clerk-authenticated request (web + mobile
login) with a generic 401 — `verifyToken` throws on an empty secret. Fails
closed (good) but with no startup signal (bad).

Fix: add `CLERK_SECRET_KEY: z.string().min(1).optional()` to the schema and a
`superRefine` rule requiring it in production (and/or whenever the Clerk auth
path is expected). Mirror `CLERK_PUBLISHABLE_KEY` handling on the web side.

---

## P1 — Fix before scale / next release

### 4. RLS fails open when request context is missing

`prisma.service.ts` (`withRlsTransactionScope`, `getCurrentRlsContext`) and
`rls-context.util.ts` `buildRlsContext(null)` default a missing request context
to `accessMode: 'internal'` — full god-mode access that bypasses RLS. This is
intentional for background jobs, but it means any HTTP path that loses its
async-local context (a bug, a stray `setImmediate`, a library that breaks
`AsyncLocalStorage`) silently escalates to internal access instead of denying.

Fix: make the HTTP default fail closed. Distinguish "job/bootstrap" (explicitly
internal) from "no context at all" (should be `anonymous`). Have jobs set
`databaseAccessMode: 'internal'` explicitly and default the unknown case to
`anonymous`. Add a test that a query with no context cannot read another user's
rows.

### 5. Per-query RLS wraps every read in a transaction (2 round-trips)

`runQueryWithRlsContext` runs `SELECT app.set_rls_context(...)` + the query as a
2-statement `$transaction` for **every** single query outside an explicit
transaction. Correct and secure, but it doubles DB round-trips and forces a txn
for trivial reads. Under load this is the first thing that will hurt p99.

Fix options (pick one, measure first): use a pgbouncer-compatible
session/`SET LOCAL` pattern, batch reads into explicit service-level
transactions, or cache hot read paths (balance lookups already use a cache —
extend that pattern). Add a load test before and after so the win is measured.

### 6. Frontend has almost no tests; CI only builds it

55 spec files total: 52 in `apps/api`, 3 in `apps/web`, **0 in `apps/admin` and
`apps/mobile`**. CI (`.github/workflows/ci.yml`) runs `test` only for the API;
the `frontend` job runs `build` for web + admin and never tests them. The admin
console operates on money and disputes with no test coverage.

Fix: add component/integration tests for admin money/dispute flows and the web
wallet/unlock flows; wire `pnpm --filter @pataspace/web test` and admin/mobile
into the CI frontend job. At minimum, smoke-test the critical user journeys.

### 7. No dependency scanning or audit gate in CI

No `pnpm audit` step, no Dependabot/Renovate config (`.github/dependabot.yml`
absent), no SAST. Finding #1 would have been caught automatically. Today
nothing stops a new critical advisory from shipping.

Fix: add a `pnpm audit --audit-level high` step to CI (non-blocking first, then
blocking once #1 is cleared) and a `.github/dependabot.yml` (or Renovate) for
weekly updates. Consider `github/codeql-action` for the TS code.

---

## P2 — Hardening / hygiene

### 8. Redis has no auth in the prod stack
`infra/docker/docker-compose.prod.yml` starts `redis:7` with no `requirepass`
and `REDIS_PASSWORD` empty. Mitigated because Redis is on the internal compose
network with no published ports, but defense-in-depth wants `requirepass` set
and `REDIS_PASSWORD` wired through, in case the network boundary changes.

### 9. No security headers at the edge
`infra/nginx/edge.conf` sets no `Strict-Transport-Security`, `X-Frame-Options`,
or CSP. The API gets `helmet()` (`configure-app.ts`), but static web/admin
responses served through nginx do not. Add HSTS + a baseline CSP at the edge
(or confirm Caddy in `infra/docker/Caddyfile` terminates TLS and sets them).

### 10. CORS allows requests with no `Origin`
`configure-app.ts` `enableCors` calls back `true` when `origin` is undefined.
Standard (covers same-origin/native/server-to-server) and `credentials: false`
limits the risk, but worth a conscious confirmation rather than an implicit one.

### 11. Image vs video upload size cap is identical
`upload.service.ts:19-20` sets both `MAX_IMAGE_SIZE_BYTES` and
`MAX_VIDEO_SIZE_BYTES` to 10 MB. Likely a copy-paste — videos will be rejected
at image size. Confirm the intended video limit.

---

## What's already done right (keep it)

- **Money idempotency**: `payment-fulfillment.service.ts` and
  `commission-callback.service.ts` claim state via `updateMany` with a status
  guard inside `$transaction`, so redelivered callbacks are safe no-ops.
- **Webhook auth**: `payment.controller.ts` uses `timingSafeEqual` and fails
  closed in production when `MPESA_CALLBACK_SECRET` is unset.
- **Amount verification**: fulfillment fails the transaction on amount mismatch
  before granting credits.
- **PII at rest**: `encryption.util.ts` AES-256-GCM with random IV + auth tag,
  HMAC-peppered blind index for phone lookups.
- **RLS enforced** per request with role-derived access modes; least-privilege
  app/migrator Postgres roles bootstrapped in the prod compose.
- **Infra**: multi-stage Dockerfile, non-root `USER node`, scoped prod install,
  one-shot migration service, healthchecks, internal-only service exposure.
- **Config validation**: Zod env schema with production HTTPS + ALLOWED_ORIGINS
  enforcement and provider-conditional required fields.

---

## Suggested order of work

1. P0-2 (500 logging) — small, unblocks debugging everything else.
2. P0-3 (Clerk env validation) — small, prevents a silent-auth-outage deploy.
3. P0-1 (dependency bumps) — larger, needs regression testing.
4. P1-7 then P1-4 (CI audit gate + RLS fail-closed) — prevent regressions.
5. P1-6, P1-5, then P2 items.
