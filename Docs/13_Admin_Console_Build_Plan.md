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

### Phase 1 — Financial reconciliation and payouts

Highest ops value and closest to the in-flight money work
(`fix/api-money-phase-2`, `Docs/FINTECH_MONEY_AUDIT.md`).

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

### Phase 2 — Support query workspace

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

### Phase 3 — Audit logs and security

- API: `GET /admin/audit-logs` — filters: action, entityType/entityId, admin
  user, date range; paginated; returns oldValue/newValue for diff rendering.
  `GET /admin/audit-logs/export` — CSV stream with the same filters.
- Contracts + web `/admin/audit-logs` page: filter bar, diff-style payload
  column, CSV export button, nav entry.
- Outcome: every admin mutation shipped in Phases 1-2 (and existing
  ban/approve/resolve actions) is inspectable; export works for compliance.

### Phase 4 — System configuration and pricing

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
