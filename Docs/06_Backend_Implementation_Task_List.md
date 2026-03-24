# PataSpace Backend Implementation Task List

Based on:
- `Docs/03_API_Specifications.md`
- `Docs/04_Backend_Modular_Structure.md`

Cross-checked against the current scaffold in `apps/api`, `packages/contracts`, and `infra/` on 2026-03-21.

## Current Baseline

- `apps/api` already exists as a Nest app and boots through `AppModule`.
- Feature modules exist, but they are still empty `@Module({})` shells.
- `apps/api/prisma/schema.prisma` is still a placeholder and must be replaced from `Docs/02_Database_Schema.md`.
- Shared infrastructure exists only as stubs or no-op implementations:
  - cache
  - queue
  - SMS
  - storage
  - M-Pesa
  - background jobs
- `packages/contracts` has partial auth and listing contracts, but they do not yet cover the full API surface or validation rules from the spec.
- Local Postgres and Redis are already available through `infra/docker/docker-compose.yml`.

## Critical Decisions To Resolve In Sprint 0

- [x] Commit a short backend conventions ADR before the first feature PR. It must lock:
  - API base path: use `/api/v1` across backend, clients, reverse proxy, and docs.
  - Validation ownership: `packages/contracts` Zod schemas are the source of truth; Nest request handling should wrap shared schemas instead of drifting into separately maintained DTO contracts.
  - Refresh-token transport: document one deliberate strategy for web and mobile clients; do not ship a half-cookie, half-JSON implementation by accident.
  - Unlock idempotency: repeat unlock returns the existing unlock payload and must never deduct credits twice.
  - Listing lifecycle: unlock and confirmation progression belongs on unlock, confirmation, and commission records; listing browse visibility must stay explicit and must not disappear as a side effect.
  - Error envelope: standardize on `error.code`, `error.message`, `error.statusCode`, `error.details`, and `meta.requestId`.
  - PII storage: phone numbers need normalized lookup material plus encrypted value; addresses and revealed contact data stay encrypted at the application layer.
  - MVP economics: commission is fixed at 30 percent of unlock cost; remove stale 30-40 percent wording from downstream docs and schema comments.

## Definition Of Done For "Backend Can Be Spun Locally"

- [ ] `docker compose -f infra/docker/docker-compose.yml up -d` starts Postgres and Redis.
- [ ] `pnpm dev:api` boots cleanly with validated environment variables and a passing health or readiness endpoint.
- [ ] Prisma migrations and seed scripts run successfully against local Postgres.
- [ ] `pnpm --filter @pataspace/api build` passes.
- [ ] External integrations have working sandbox or local mock adapters for storage, SMS, and M-Pesa.
- [ ] The current shipped slice works end-to-end locally for the routes promised in that sprint.
- [ ] Smoke tests for the current shipped slice pass.
- [ ] A short local runbook exists for starting, seeding, and testing the API.

## Recommended Build Order

1. Sprint 0 decisions and backend foundation
2. Prisma schema, seed data, and shared contracts
3. Sandbox provider abstractions and cross-cutting infrastructure
4. Auth and user access
5. Upload, listing creation, and minimal admin review
6. Public browse and listing details
7. Credits, payments, and unlocks
8. Confirmations, disputes, scheduled jobs, and production hardening

## Phase 0: Foundation And Spec Alignment

- [x] Add missing API dependencies in `apps/api/package.json`.
  - Expected additions: bcrypt, helmet, compression, `@nestjs/axios`, Redis client/module, queue library, AWS SDK packages, throttling/rate-limit support, and test tooling.
- [x] Expand `apps/api/.env.example` to match the actual runtime surface from the docs.
  - JWT
  - Redis
  - M-Pesa
  - Africa's Talking
  - AWS S3
  - encryption key
  - allowed origins
  - callback URLs
- [x] Write the backend conventions ADR and commit it before the first feature implementation PR.
- [x] Harden config loading in `apps/api/src/common/config/app.config.ts` and `apps/api/src/common/config/env.validation.ts`.
- [x] Update `apps/api/src/main.ts` to include the agreed global prefix, CORS, security middleware, compression, validation, and request-scoped metadata.
- [x] Add a health/readiness endpoint and document local startup commands.
- [x] Define provider interfaces plus sandbox adapters for storage, SMS, and M-Pesa so feature work is not blocked on live credentials.
- [x] Scaffold the API test harness now rather than at the end.
  - unit test setup
  - integration test database bootstrap
  - e2e app bootstrap
  - one smoke-check command

## Phase 1: Database And Shared Contracts

- [x] Replace `apps/api/prisma/schema.prisma` with the full Prisma schema from `Docs/02_Database_Schema.md`.
- [x] Create the first migration and verify it against local Postgres.
- [x] Add `prisma/seed.ts` with enough seed data for auth, listings, credits, admin review, and unlock flows.
- [x] Implement encrypted-field helpers and decide where encryption and decryption live.
  - use application-level authenticated encryption
  - keep phone lookup separate from encrypted display value
- [x] Expand `packages/contracts` so it becomes the shared source of truth for request and response shapes used by API, web, mobile, and admin.
  - auth schemas
  - listing schemas
  - credit/payment schemas
  - unlock schemas
  - confirmation schemas
  - dispute schemas
  - admin schemas
- [x] Bring shared enums in `packages/contracts` into full alignment with Prisma enums and API response values.
- [x] Add pagination, filter, and error-contract types to `packages/contracts`.

## Phase 2: Cross-Cutting Backend Infrastructure

- [x] Finish `apps/api/src/common/database/prisma.service.ts` with logging and lifecycle behavior appropriate for local and production use.
- [x] Replace the no-op cache implementation with Redis-backed behavior in:
  - `apps/api/src/infrastructure/cache/cache.module.ts`
  - `apps/api/src/infrastructure/cache/cache.service.ts`
- [x] Implement queue support in `apps/api/src/infrastructure/queue/queue.module.ts`.
- [x] Implement the SMS integration module behind sandbox and live adapters in `apps/api/src/infrastructure/sms/`.
- [x] Implement the S3 storage module behind sandbox and live adapters in `apps/api/src/infrastructure/storage/`.
- [x] Replace the M-Pesa stub with sandbox and live adapters in `apps/api/src/infrastructure/payment/mpesa.client.ts`.
- [x] Finish auth decorators and guards, including the currently incomplete roles-guard path.
- [x] Add request ID generation and propagation.
- [x] Add rate limiting by endpoint category based on the API spec.
- [x] Add idempotency-key support for POST routes that need it.
- [x] Upgrade the exception filter so it produces the standard error envelope from the API spec.
- [x] Add structured logging and useful response metadata where required.
- [x] Add Swagger/OpenAPI documentation for the live backend surface under the versioned API path.

## Phase 3: Auth And User Module

- [x] Implement the full auth module structure under `apps/api/src/modules/auth/`.
  - controller
  - service
  - DTO/contracts mapping
  - JWT strategy
  - refresh-token flow
  - OTP flow
- [x] Support:
  - register
  - verify OTP
  - login
  - refresh
  - logout
- [x] Add password hashing, phone-number validation, and brute-force/rate-limit protection.
- [x] Store and rotate refresh tokens according to the final transport decision.
- [x] Add OTP expiry, resend, and cleanup handling.
- [x] Implement a minimal user module for profile lookup and user-related helpers needed by other modules.
- [x] Add unit and e2e tests for auth happy-path and failure cases.

## Phase 4: Upload And Listing Module

- [x] Implement upload endpoints for presigned URL generation and upload confirmation.
- [x] Enforce media validation rules from the API spec.
  - image/video mime types
  - size limits
  - ownership and pathing rules
- [x] Implement the listing module structure under `apps/api/src/modules/listing/`.
- [x] Support:
  - create listing
  - browse listings
  - get listing details
  - get my listings
  - update listing
  - soft delete listing
- [x] Ship the minimal admin review endpoints needed for the first-listings approval loop.
  - get pending listings
  - approve listing
  - reject listing
- [x] Encode business rules from the docs:
  - first three listings require review
  - unlock cost equals 10 percent of rent
  - commission equals 30 percent of unlock cost
  - GPS match checks
  - mobile-only create rule if still required
  - listing ownership checks
- [x] Add Redis caching for browse and details endpoints.
- [x] Invalidate relevant caches on create, update, delete, approve, reject, and expose the shared invalidation hook for upcoming unlock events.
- [x] Add ETag and `If-None-Match` support for browse and details endpoints once response contracts stabilize.
- [x] Add integration tests for filtering, pagination, ownership, and approval behavior.

## Phase 5: Credits, Payments, And Unlocks

- [x] Implement the credit module for:
  - balance lookup
  - transaction history
  - internal balance mutations
- [x] Implement payment purchase flow:
  - create pending purchase
  - STK push request
  - callback processing
  - idempotent credit application
  - failure and timeout handling
- [x] Implement unlock flow with transaction safety.
  - confirm listing availability
  - confirm user has enough credits
  - deduct credits atomically
  - create unlock record
  - reveal contact details
  - notify tenant
- [x] Ensure repeat unlocks follow the chosen idempotency rule without double-charging.
- [x] Model refund behavior for deleted or invalidated listings.
- [x] Add integration tests around concurrent unlock attempts and payment callbacks.

## Phase 6: Confirmations, Disputes, And Admin

- [ ] Implement confirmation module endpoints and state transitions.
- [ ] Implement dispute creation and dispute lookup.
- [ ] Harden admin moderation flows with authorization, audit logging, and operator diagnostics around listing review actions.
- [ ] Encode the commission-trigger rules once both confirmation sides are complete.
- [ ] Add tests for double-confirmation, unauthorized confirmation, dispute duplication, and admin review.

## Phase 7: Jobs And Maintenance Flows

- [ ] Replace job scaffolds with real scheduled tasks.
  - commission payout job
  - listing cleanup job
  - notification job
- [ ] Add cleanup tasks from the workflow doc:
  - expired OTP cleanup
  - expired refresh-token cleanup
  - aged listing cleanup
- [ ] Add retry and dead-letter behavior for failed background work where needed.
- [ ] Make all jobs safe to rerun without duplicate side effects.
- [ ] Add logging and operator-facing diagnostics for scheduled work.

## Phase 8: Testing, Sandbox, And Release Hardening

- [ ] Build test helpers and fixtures for users, listings, purchases, unlocks, confirmations, and disputes.
- [ ] Add unit tests for domain services and guards.
- [ ] Add integration tests for Prisma-backed flows.
- [ ] Add e2e tests for the main public/admin API surface.
- [ ] Expand sandbox and mock behavior so the full backend can be developed and verified without live provider credentials.
- [ ] Add API smoke checks for local startup.
- [ ] Add lint, test, and build checks to CI.
- [ ] Add deployment notes for migrations, env setup, process manager, and reverse proxy.

## Fastest Vertical Slice To Build First

If the goal is to get the backend usable quickly before the entire platform is complete, build this slice first:

1. Sprint 0 conventions ADR, dependency setup, env validation, and sandbox provider interfaces
2. Prisma schema, first migration, and seed
3. Auth register, verify OTP, login, refresh, and logout
4. Upload presigned URL and confirm endpoints
5. Listing create and my listings
6. Minimal admin pending, approve, and reject flow
7. Public browse and listing details for approved listings
8. Credit balance, purchase creation, and sandbox M-Pesa callback
9. Unlock listing with atomic credit deduction and repeat-unlock idempotency

This slice is enough to support the basic product loop:

- tenant registers
- tenant uploads media
- tenant creates listing
- admin approves listing
- incoming tenant browses listings
- incoming tenant purchases credits
- incoming tenant unlocks contact info

## Known Risks To Track During Implementation

- Listing state transitions can conflict with browse behavior if listing status is overloaded.
- M-Pesa callbacks and unlock requests both need strict idempotency to avoid double-crediting or double-charging.
- Cross-app contracts will drift quickly unless `packages/contracts` becomes authoritative early.
- Refresh-token handling can diverge between web and mobile unless the transport decision is written down before auth code lands.
- PII storage choices affect the first Prisma migration; do not defer encryption and lookup strategy until after schema work starts.
- The docs describe strong API guarantees around rate limiting, request IDs, ETags, and standardized errors; these should be implemented centrally, not ad hoc inside controllers.
- External-provider integration should start with sandbox adapters so feature development is not blocked on real credentials.

## Recommended Sprint 0

- [x] Commit the backend conventions ADR.
- [x] Complete `apps/api` dependency setup and env validation.
- [x] Add health/readiness, request IDs, standard errors, logging, CORS, and security middleware.
- [x] Define provider interfaces and wire sandbox adapters for storage, SMS, and M-Pesa.
- [x] Replace the Prisma placeholder schema, generate the first migration, and add seed data.
- [x] Expand `packages/contracts` for auth, listing, pagination, and error envelopes.
- [x] Add the initial unit, integration, and e2e test harness plus one smoke-check command.

Sprint 0 deliverable:

- [x] The API boots locally, migrations and seeds run, sandbox providers are wired, and shared contracts compile.

## Recommended Sprint 1

- [ ] Ship auth register, verify OTP, login, refresh, and logout.
- [ ] Ship upload presign and confirm endpoints against sandbox storage.
- [ ] Ship listing create, my listings, browse, and details.
- [ ] Ship the minimal admin pending, approve, and reject flow required for first-listing moderation.
- [ ] Enforce GPS, ownership, first-three-review, and pricing rules.
- [ ] Add auth, listing, and admin integration tests plus e2e smoke coverage for the full slice.

Sprint 1 deliverable:

- [ ] An outgoing tenant can create a listing, an admin can approve it, and an incoming tenant can browse it locally end-to-end.
