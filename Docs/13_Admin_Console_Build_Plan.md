# Admin Console Build Plan

## Scope date

- July 12, 2026

## Context

The web app (`apps/web`) is admin-only; clients use the mobile app. The design
target is the 10 wireframes in
`Docs/Wireframes/PataSpace Design Screens/Admin Web Screens/`. A partial
console already ships at `/admin` (Clerk-gated, fails closed, API enforces
`Role.ADMIN` independently): Dashboard, Listings (moderation + CRUD), Users
(ban/unban), Disputes (queue + investigate/resolve/close).

This plan maps each wireframe to what the API backend has today, names every
gap, and sequences the work into phases per
`.claude/rules/delivery-phasing.md` (one phase at a time, validated before the
next starts).

## Gap matrix: wireframe screen vs backend vs web

| # | Wireframe screen | Backend today | Web today | Gap size |
|---|------------------|---------------|-----------|----------|
| 1 | Admin Dashboard Overview | `GET /admin/metrics` (users, listings, unlocks, disputes, commissions, tickets, trust metrics — point-in-time counts) | `/admin` page exists | Small: no activity feed, no growth time-series, no monthly revenue trend |
| 2 | Listing Approval Queue | `GET /admin/listings/pending`, `POST /admin/listings/:id/approve\|reject`, `GET/PATCH/DELETE /admin/listings` | `moderation-queue.tsx` + `listings-panel.tsx` | Small: no photo quick-preview panel, no "request changes" action |
| 3 | User Management | `GET /admin/users` (+detail, ban/unban, `creditBalance` in contract) | `users-panel.tsx` | Small: no credit-adjust action, no verification filter |
| 4 | Support Query Workspace | Only user-facing: `POST /support/tickets`, `GET /support/tickets/me`, `GET /support/tickets/:id`. `SupportTicket` has single `message` + `adminNotes`; no thread, no priority, no assignment, no status transitions via API | Nothing | Large: schema + module + page |
| 5 | Financial Reconciliation & Payouts | Data exists (`Commission`, `SuccessFee`, `CreditTransaction`, B2C payout jobs, `payment-reconciliation.job`) but zero admin read endpoints and no retry/trigger action | Nothing | Medium: read endpoints + one action + page |
| 6 | Marketplace Analytics | Only point-in-time `/admin/metrics` | Nothing | Medium: aggregation endpoints + page |
| 7 | Audit Logs & Security | `AuditLog` model written by admin/dispute/listing services and jobs; no read endpoint | Nothing | Small-medium: query endpoint + CSV export + page |
| 8 | System Configuration & Pricing | `SystemConfig` model exists and is seeded (`commission_rate`, `unlock_cost_percentage`, `confirmation_period_days`) but **nothing reads it at runtime** — pricing values are hardcoded | Nothing | Medium-large: runtime config service + admin CRUD + page |
| 9 | Notification Template Manager | No `NotificationTemplate` model; SMS copy hardcoded in services/jobs; SMS provider still sandbox | Nothing | Large; low urgency until Africa's Talking lands |
| 10 | Help Center Content CMS | No models, no endpoints; mobile help center is static | Nothing | Large: CMS models + admin CRUD + public read API + mobile consumption |

Cross-cutting notes:

- Wireframes show `SuperAdmin` / `Moderator` roles; the system has a single
  `Role.ADMIN`. Sub-roles are out of scope for this plan; the audit log
  records the acting admin either way.
- Every new endpoint follows the existing pattern: Zod schema in
  `packages/contracts/src/schemas/`, thin controller + application service in
  `apps/api/src/modules/admin/`, Swagger docs models, gate tests, typed
  fetcher in `apps/web/lib/api/admin.ts`, panel component under
  `components/admin/`, nav entry in `admin-shell.tsx`.
- Mutating admin endpoints write `AuditLog` rows (pattern already exists in
  `admin-user.service.ts` / `admin-listing.service.ts`).

## Phases

### Phase 1 — Financial reconciliation and payouts — DONE (2026-07-13)

Highest ops value and closest to the in-flight money work
(`fix/api-money-phase-2`, `Docs/FINTECH_MONEY_AUDIT.md`).

Shipped:
- `GET /admin/finance/summary` — pending / failed / paid-this-month /
  paid-YTD buckets, all live DB aggregates, plus a distinct-partner count.
- `GET /admin/finance/transactions` — paginated commission payout ledger with
  status filter + search (id, M-Pesa ref, unlock, neighborhood).
- `POST /admin/finance/commissions/:id/retry` — FAILED-only, claim-guarded
  flip to DUE that preserves `paymentAttempts` (so the processor's
  confirm-before-resend guard still fires — no double payout), audit-logged as
  `commission.payout_retried`, then runs the processor inline and returns the
  live outcome.
- Web: `/admin/finance` page (summary tiles + ledger + retry), Finance nav
  entry.
- Tests: `admin-finance.service.spec.ts`, `admin-payout-retry.service.spec.ts`
  (8 unit tests), plus a live-app e2e in `public-admin-api-surface.e2e.spec.ts`
  covering the ledger, summary, retry 409/404 guards, and the 403 admin gate.

Scope decision: the ledger is the **commission payout ledger only** (what the
wireframe's "Transaction Ledger" shows and what retry operates on). A unified
ledger that also folds in tenant credit purchases was dropped from Phase 1 —
mixing two differently-shaped tables breaks clean pagination and the retry
action only makes sense for payouts. Credit-purchase history is a separate
future ledger, noted here rather than forced into this one.

- API: new `admin-finance.controller.ts` + `application/admin-finance.service.ts`
  - `GET /admin/finance/summary` — pending payout total/count, paid this
    month, PataSpace commission YTD; all DB aggregates.
  - `GET /admin/finance/transactions` — unified paginated ledger over
    commissions (payouts) and credit purchases with M-Pesa receipt/refs,
    status, partner, search + status filter.
  - `POST /admin/finance/commissions/:id/retry` — re-enqueue a FAILED payout
    through the existing commission-payout queue; audit-logged.
- Contracts: `admin-finance.ts` schemas.
- Web: `/admin/finance` page + `finance-panel.tsx` (summary cards, ledger
  table, retry action), nav entry.
- Explicitly NOT building the wireframe's "Execute Batch Payout" button as a
  manual trigger beyond retry — payouts are cron-driven and settlement-gated
  (PAID only on settlement signal, per recent commits). Manual batch execution
  would bypass those guards.
- Outcome: failed B2C payouts become visible and retryable from the console;
  evidence = ledger page shows the same totals as the DB aggregates.

### Phase 2 — Support query workspace — DONE (2026-07-14)

Shipped:
- Prisma: `priority` (LOW/MEDIUM/HIGH default MEDIUM) + `assignedToId` on
  `SupportTicket`; new `SupportTicketMessage` table (ticketId, authorId,
  authorRole, body, createdAt). Migration `20260713000000_add_support_ticket_threads`
  backfills each existing ticket's body as the first thread message. New
  tickets seed the same first message on create, so every ticket's thread is
  self-consistent (no empty thread on a fresh ticket).
- Admin API: `GET /admin/support/tickets` (status/priority/search),
  `GET /admin/support/tickets/:id` (reporter profile with decrypted phone +
  full thread), `POST .../messages` (admin reply, pulls OPEN → IN_REVIEW),
  `POST .../status` (transition map refuses illegal jumps, keeps resolvedAt
  honest, audit-logged), `POST .../priority` (audit-logged).
- Tenant API: `GET/POST /support/tickets/:id/messages` — a user reads and
  replies on their own thread; a reply reopens a RESOLVED ticket.
- Web: `/admin/support` workspace (queue with filters/search + detail pane
  with reporter card, thread bubbles, status/priority actions, reply
  composer), Support nav entry.
- Tests: 20 unit specs (queue mapping/filters, detail + decrypted phone,
  transition map, ownership guards, reopen, thread seeding). A live-app e2e
  is written but currently blocked: a concurrent auth refactor in the working
  tree (email-identifier / Clerk removal, Docs/14 Phase 0) changed the shared
  `/auth/register` contract the test fixture uses. The app boots and the
  endpoints work; the e2e will pass once auth stabilizes.

Deferred within Phase 2: ticket assignment UI (the `assignedToId` column
exists and is returned, but no assign action shipped — single-admin ops does
not need it yet). The wireframe's "Refund" button is left to the Phase 1
finance surface.

Original plan (for reference):

- Prisma: add `priority` (LOW/MEDIUM/HIGH), `assignedToId` to `SupportTicket`;
  new `SupportTicketMessage` table (ticketId, authorId, body, createdAt) so
  the thread in the wireframe is real. Migration backfills existing
  `message` as the first thread message.
- API: `admin-support.controller.ts`
  - `GET /admin/support/tickets` — full queue with status/priority filters.
  - `GET /admin/support/tickets/:id` — ticket + thread + reporter profile +
    related unlock/listing context.
  - `POST /admin/support/tickets/:id/messages` — admin reply.
  - `POST /admin/support/tickets/:id/status` — OPEN → IN_REVIEW → RESOLVED →
    CLOSED transitions, audit-logged.
  - Mobile-side additions (same module): tenant can read the thread and post
    replies on their own ticket.
- Web: `/admin/support` three-pane workspace (queue list, ticket detail,
  reply composer + context cards), nav entry.
- The wireframe's "Refund" button links to Phase 1's finance surface (view
  related transactions); actual refund flows stay out of scope until a refund
  policy exists in the money workstream.
- Outcome: open-ticket count on the dashboard becomes actionable; a ticket
  can go OPEN → RESOLVED entirely in the console.

### Phase 3 — Audit logs and security — DONE (2026-07-14)

Shipped:
- API: `GET /admin/audit-logs` — filters by action, entityType, entityId,
  adminUserId, and a from/to date range; paginated; returns
  oldValue/newValue/metadata for diff rendering plus the admin actor (null for
  system rows). `GET /admin/audit-logs/export` — same filters, streams
  `text/csv` with an attachment disposition, capped at 10k rows so one click
  can't pull the whole table into memory.
- CSV assembly is a pure `toAuditCsv` helper (deterministic space): header +
  CRLF rows, JSON payloads stringified, commas/quotes/newlines escaped.
- Contracts + web `/admin/audit-logs`: filter bar (action, entity type/ID,
  date range), a before → after payload-diff table, CSV export button (fetched
  with the bearer token, downloaded via Blob), Audit logs nav entry.
- Tests: 7 unit (filter composition, admin-join mapping, export cap, CSV
  escaping) + a live-app e2e (admin ban writes a row → filtered list surfaces
  it with the actor → CSV export returns text/csv with the row; non-admin gets
  403). All green.
- Outcome: every admin mutation from Phases 1-2 and the existing
  ban/approve/resolve/commission actions is inspectable and exportable.

Original plan (for reference):

- API: `GET /admin/audit-logs` — filters: action, entityType/entityId, admin
  user, date range; paginated; returns oldValue/newValue for diff rendering.
  `GET /admin/audit-logs/export` — CSV stream with the same filters.
- Contracts + web `/admin/audit-logs` page: filter bar, diff-style payload
  column, CSV export button, nav entry.
- Outcome: every admin mutation shipped in Phases 1-2 (and existing
  ban/approve/resolve actions) is inspectable; export works for compliance.

### Phase 4 — System configuration and pricing — DONE (2026-07-14)

Shipped (design decisions confirmed with Amoni: layered DB-over-env config;
real pricing-model knobs, not the wireframe's simplified single-cost fields):

- `SystemConfigService` (`modules/system-config/`) resolves an effective
  `PricingConfig` as the deploy-time env values overlaid with any
  `SystemConfig` DB rows, cached in-process and invalidated on write. With no
  rows the resolved config is byte-identical to today's env defaults, so the
  screen is additive and reversible. A `config-registry.ts` declares every
  editable key once (group, label, unit, kind, bounds) with pure parse/validate.
- The four pricing consumers (ListingService create + update, SuccessFeeService,
  SuccessFeeSettlementService, ListingSeedService) plus the confirmation
  earnings estimate and the mover-poster reminder job now resolve pricing
  per-call instead of capturing it at construction, so edits take effect with
  no restart. Snapshots are unchanged: unlock cost and success fee are still
  frozen onto the listing at create, so edits only affect NEW listings.
- API: `GET /admin/config` (effective values + default/override source +
  updatedAt), `PUT /admin/config/:key` (per-key range/kind validation, a
  floor≤cap cross-check, audit-logged `config.updated` with old/new). Admin
  key namespace: `pricing.*` (5 unlock bands, successFeePct, feeFloorKes,
  feeCapKes, splitPoster) and `referral.rewardCredits`.
- Web: `/admin/config` — Pricing & Revenue and Incentives & Logistics cards,
  per-key inline edit + save, default/override badges. Config nav entry.
- Tests: 15 unit (registry validation; resolver env-base/override/out-of-range;
  list; setValue validation + audit + invalidation) + a live-app e2e (a
  pricing edit changes the next 2BR listing's snapshot with no restart while
  the earlier listing keeps its snapshot; bad values 400; non-admin 403).
  All 422 API unit tests green — the rewire preserved every existing money
  path exactly.

Deliberately NOT done (kept as consts to avoid touching commission-eligibility
timing this phase): `COMMISSION_WAIT_DAYS` (7) and `AUTO_CONFIRM_AFTER_DAYS`
(14). The legacy seed rows (`commission_rate`, `unlock_cost_percentage`,
`confirmation_period_days`) are unrelated to the new key namespace and were
left untouched; they remain unread.

Original plan (for reference):

The real fix is making runtime behavior read `SystemConfig`, not just
building a settings form over a dead table.

- API: `ConfigService` (admin module or `common/`) — typed accessors with
  cache + invalidation on write; wire the pricing call sites (unlock cost,
  commission rate, confirmation period) to read from it with the current
  hardcoded values as defaults. Each call site change ships with a regression
  test proving the config value is honored.
- `GET /admin/config`, `PUT /admin/config/:key` — validated per-key (number
  ranges, units), audit-logged with old/new values (matches the wireframe's
  inline audit trail, served by Phase 3's endpoint).
- Web: `/admin/config` page — Pricing & Revenue and Incentives & Logistics
  cards, inline recent-changes rail, nav entry.
- Risk: changing live pricing paths. Mitigation: defaults identical to
  current hardcoded values, migration seeds any missing keys, e2e test on the
  unlock pricing flow before/after.

### Phase 5 — Marketplace analytics

- API: `GET /admin/analytics?range=30d` — revenue and unlock time-series,
  unlocks by neighborhood (group by listing location), credit usage breakdown
  (group `CreditTransaction` by type), top earning partners (commission sums
  by poster). All deterministic DB aggregates; no new tables.
- Web: `/admin/analytics` page with charts (follow the dataviz skill), range
  picker, top-partners table, nav entry.
- Dashboard upgrade lands here too: growth sparkline + recent-activity feed
  (reads latest audit-log entries via Phase 3's endpoint).

### Phase 6 — Notification template manager

Gated on real SMS templates mattering, i.e. Africa's Talking integration
replacing the sandbox provider.

- Prisma: `NotificationTemplate` (key, channel, language, body, status,
  version). API: admin CRUD + preview render with sample variables;
  `SmsService` and jobs resolve copy through a `TemplateRenderer` that falls
  back to current hardcoded strings when no template row exists.
- Web: `/admin/templates` editor with variable chips + live preview.

### Phase 7 — Help center CMS

- Prisma: `HelpCategory`, `HelpArticle` (status draft/published, audience,
  ordering). API: admin CRUD + public `GET /help/categories|articles` for the
  mobile app. Web: `/admin/help-center` tree + editor + publish flow. Mobile
  app switches its static FAQ to the public endpoints (separate mobile task,
  coordinated at the contract boundary).

### Phase 8 — Console polish to wireframe spec

- Listing approval: photo quick-preview panel, GPS-verified badge (data
  already on the listing), optional "request changes" (new listing status —
  Confusion Protocol check with Amoni before adding a state).
- User management: credit-adjust endpoint (audit-logged, reason required),
  verification filter.
- Visual pass to the dark-shell design language in the wireframes' DESIGN.md
  (Poppins/DM Sans, Eerie Black shell, teal accents) across all console pages.

## Per-phase definition of done

Every phase ships in one PR-sized unit containing:

1. Contracts schemas (`packages/contracts`) — both sides import them.
2. API module code following `.claude/rules/backend-modular-monolith.md`
   (thin controllers, application services, docs models, <200-line files).
3. Gate tests: service specs for every new endpoint and every state
   transition, plus web component tests for the new panel.
4. Web page wired through `lib/api/admin.ts` typed fetchers only.
5. Audit-log writes on every mutation.
6. Docs: this file's phase marked complete; `apps/web/README.md` and admin
   module README updated.
7. Validation before the next phase starts: `pnpm build`, API + web test
   suites, and a manual pass of the new page against the wireframe. CI is
   dead (GitHub Actions billing lock) — verify locally.

## Sequencing rationale

Finance first because the money workstream is active and failed payouts are
currently invisible. Support second because it is the only wireframe with
zero backend and real user pain (tickets already accumulate). Audit logs
third because Phases 1-2 multiply the number of admin mutations worth
inspecting. Config fourth because it changes live pricing paths and benefits
from the audit surface existing first. Analytics, templates, and CMS are
additive and carry no operational risk, so they trail.
