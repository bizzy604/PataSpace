# Fintech Money Patterns Audit

Audit of `apps/api` money-handling code against `SKILL.md` (fintech-money-patterns).
Date: 2026-07-10. Scope: credits, purchases (M-Pesa STK + Stellar), unlock spend,
refunds, success fees, commissions, B2C payouts, callbacks, reconciliation, controls.
Status: findings identified, none fixed in this pass.

## System overview

NestJS modular monolith (`apps/api`) on Prisma/Postgres (RLS enabled, FORCE) with Redis
cache and cron jobs. Money flows: credit top-up via Daraja STK push or Stellar
(`CreditTransaction` PENDING then callback/reconcile settles), unlock spend, refunds
(dispute, report-dead, listing invalidation), success-fee settlement from credits, and
poster commission payout via Daraja B2C plus a result callback. Credits peg 1 credit =
KES 1. Amounts are integers everywhere (whole KES, not cents).

## Compliance scorecard vs SKILL.md

| # | Skill section | Verdict |
|---|---|---|
| 1 | Representing money | PARTIAL. Integer amounts and integer JSON serialization pass. Whole-KES (not ISO minor units) is undocumented. No Money type, no currency guard. Stellar path does float math on XLM. |
| 2 | Ledger and records | FAIL. `Credit.balance` is a directly written column and is the source of truth. `CreditTransaction` is single-entry, and rows are mutated (status, balances) instead of append-only. One `createdAt` per row, no value/booking/settlement split. No DB-level UPDATE/DELETE revocation. Raw phone numbers land in transaction metadata. |
| 3 | Escrow / reservation | PARTIAL by design (prepaid credits, instant spend, no holds). Commission lifecycle has an explicit enum, stale-PROCESSING recovery, and dispute blocks: good. Spend check is an atomic conditional decrement: good. Unsettled `SuccessFee` rows get DELETEd on refund: fail. |
| 4 | Idempotency | FAIL on the top-up endpoint. `POST /credits/purchase` has no idempotency key and its pending-check is check-then-insert. The idempotency interceptor exists, is registered globally, and is applied to zero endpoints. Unlock purchase is naturally idempotent (unique key + P2002 recovery): good. Callback settlement claims are atomic: good. |
| 5 | Callbacks | FAIL. Raw payloads are never persisted; unmatched callbacks are dropped. STK success credits from the callback body (mitigated by shared secret + expected-amount check). Processing is synchronous in-request. Shared-secret caller check with timing-safe compare: acceptable for Daraja. Ordering safety (late failure cannot overwrite success): good. |
| 6 | Multi-step flows | PARTIAL. Commission state machine, advisory locks, persisted OriginatorConversationID before send: good. But PAID is written on B2C acceptance (not settlement), the result callback cannot correct PAID/FAILED rows, the retry status query misreads an async API, and env templates point the ResultURL at a route that does not exist. Purchase creation has two unrecoverable crash windows. No structured log of outbound provider requests/responses. |
| 7 | Reconciliation | PARTIAL. 5-minute job resolves stale PENDING purchases by querying Daraja/Horizon: good. No post-PAID verification for B2C, no ledger-vs-provider statement compare, no clearing/suspense concept, no breaks queue. |
| 8 | Controls | PARTIAL. RBAC + RLS + audit rows on commission events: good. No four-eyes on dispute-resolution refunds. No audited manual-adjustment path (break-glass would be raw SQL). |
| 9 | Testing | PARTIAL. Duplicate-callback, amount-mismatch, concurrent-unlock, refund, and reconcile-outcome tests exist. Missing: concurrent-duplicate tests for purchase/settle/refund, crash-injection tests, balance-vs-transactions invariant property test, historical payload fixture suite. |
| 10 | Red flags | Present: balance-column source of truth, UPDATE/DELETE on posted rows, credit-from-webhook-body, endpoint without idempotency key, webhook processing before persisting raw, single created_at, PII in money records, catch-and-ignore in the M-Pesa reconcile loop. Absent (good): floats in KES amounts, non-atomic balance check+debit, `CHECK (balance >= 0)`, negative-balance clamping. |

## Issues found: 15 (3 CRITICAL, 6 HIGH, 6 MEDIUM) plus 5 LOW notes

All issues: STATUS: IDENTIFIED, NOT FIXED.

---

### C1. Double-refund race mints credits

SEVERITY: CRITICAL. CATEGORY: Data Integrity.

WHAT IS BROKEN:
`refundUnlock` in `apps/api/src/modules/unlock/unlock-refund.service.ts:74-191` reads the
unlock, checks `unlock.isRefunded` in application code, then increments the buyer's
balance. There is no atomic claim and no row lock on the unlock row.

IMPACT:
Two concurrent refund triggers both pass the `isRefunded` check and both credit the
buyer. Balance gains 2x `creditsSpent`, two REFUND transactions are written. Invented
money (skill law 1).

ROOT CAUSE:
Check-then-act across a read and a write. Three independent callers can target the same
unlock: dispute resolution (`dispute.service.ts:279`), report-dead, and
`refundUnlocksForListingInvalidation` (admin rejection / cleanup job). Under Postgres
READ COMMITTED both transactions read `isRefunded = false` and both commit.

REPRODUCTION:
Resolve a dispute for unlock U while the cleanup job invalidates U's listing. Both paths
call `refundUnlock(U)` within the same window.

FIX:
Claim first, inside the transaction, exactly like `payment-fulfillment.service.ts:47`:
`db.unlock.updateMany({ where: { id, isRefunded: false }, data: { isRefunded: true, ... } })`
and return if `count === 0`. Move the credit increment after a successful claim.

WHY THIS FIX: same proven pattern already used for payment settlement; ~10 lines.
BACKWARDS COMPATIBILITY: none broken.

---

### C2. Concurrent success-fee settlement double-charges the mover

SEVERITY: CRITICAL. CATEGORY: Data Integrity.

WHAT IS BROKEN:
`settleFromCredits` in `apps/api/src/modules/confirmation/success-fee.service.ts:115-207`
computes `remainingKes` and checks balance outside the transaction, then inside the
transaction spends and does `cashCollectedKes: { increment: remainingKes }` with no
status guard on the `successFee.update`.

IMPACT:
Two concurrent settle requests (double-tap, mobile retry) each spend `remainingKes`.
The mover is charged twice; `cashCollectedKes` becomes 2x the fee. The code comment
claims the flow is idempotent; it is only sequentially idempotent.

ROOT CAUSE:
Read-then-act: the fee row is read at :116, the decision is made from that stale copy,
and the update at :169 is unconditional on status.

REPRODUCTION:
Fire two `settleFromCredits` for the same unlock in parallel with balance >= 2x remaining.

FIX:
Inside the transaction, claim with a guarded update:
`db.successFee.updateMany({ where: { id, status: { not: SETTLED }, cashCollectedKes: fee.cashCollectedKes }, data: ... })`
and only call `spendCredits` after `count === 1` (or re-read the row `FOR UPDATE` inside
the tx and recompute remaining there).

WHY THIS FIX: optimistic-concurrency guard on the fields the decision was based on;
avoids adding raw SQL locks.
BACKWARDS COMPATIBILITY: none broken.

---

### C3. B2C payout: acceptance recorded as settlement, and nothing can correct it

SEVERITY: CRITICAL. CATEGORY: Data Integrity / Reliability.

WHAT IS BROKEN (three legs, one flow):
1. `processSingleCommission` in `apps/api/src/jobs/commission-payout.job.ts:300-317` calls
   `mpesaClient.b2c()` and immediately calls `markCommissionPaid`. Daraja's synchronous
   B2C response only means "request accepted"; settlement arrives later at the ResultURL.
   `paidAt` is stamped at acceptance and the PAID row usually has no receipt number.
2. The result callback (`commission-callback.service.ts:97,145`) only claims rows in
   `[PROCESSING, DUE]`. A failure result for a row already marked PAID is a no-op; a
   success result for a row that dead-lettered to FAILED is also a no-op.
3. The retry-confirm path is dead code: `queryB2CTransaction` in
   `live-mpesa.provider.ts:137-148` reads `ResultCode` from the synchronous ack of
   `/mpesa/transactionstatus/v1/query`. That API is itself async (result goes to the
   ResultURL); the sync ack has no `ResultCode`, so the function returns `pending`
   every time and the comment at :140 is wrong.

IMPACT:
A payout that Safaricom accepts but later fails (wrong number, org balance, limits)
stays PAID forever. The poster never receives money, our records say they did, and no
job re-checks PAID rows. Inverse case: a real payout that dead-lettered stays FAILED and
could be manually re-paid, which is a double payout.

ROOT CAUSE:
Acceptance conflated with settlement, and the state machine has no path from
PAID/FAILED once the truth arrives.

REPRODUCTION:
Issue a B2C to a number that fails after acceptance (sandbox result code != 0 on the
result callback). Observe commission stays PAID, callback returns `no_state_change`.

FIX (direction):
Job transitions DUE -> PROCESSING and sends B2C; PAID is written only by the result
callback (or by a reconcile query that sees a final state). Add
`SETTLEMENT_PENDING`-style semantics to PROCESSING, keep `paidAt` = settlement time,
store the receipt from the callback. Add a reconcile step that flags PROCESSING rows
older than 24h for ops. Handle the timeout callback. Fix or remove
`queryB2CTransaction`'s success mapping (the sync ack must map to `submitted`, never
`success`).

WHY THIS FIX: aligns the state machine with Daraja's actual async contract; the callback
service was already written to do exactly this ("transitions PROCESSING to PAID").
BACKWARDS COMPATIBILITY: payouts now show PROCESSING for seconds-to-minutes instead of
instantly PAID. SMS should move to the callback path (it already exists there).

---

### H1. Every env template routes B2C results (and timeouts) to a route that does not exist

SEVERITY: HIGH. CATEGORY: Reliability / Config.

WHAT IS BROKEN:
The only registered webhook routes are `/payments/mpesa-callback` and
`/payments/mpesa-b2c-callback` (`payment.controller.ts:92,116`). But
`apps/api/.env.example:75-76`, `infra/docker/.env.vps.example:111-112`, and
`.github/workflows/ci.yml:92-93` all set `MPESA_RESULT_URL` to
`.../payments/mpesa-result` and `MPESA_TIMEOUT_URL` to `.../payments/mpesa-timeout`.
Both 404. Additionally no template appends the `?token=` secret, and Safaricom does not
send custom headers, so in production (`MPESA_CALLBACK_SECRET` set, fail-closed check in
`payment.controller.ts:127-146`) even a corrected URL would be rejected 401 unless the
operator knows to add the query token. Nothing at boot validates that these URLs point
at real routes.

IMPACT:
In a deployment configured from these templates, B2C result callbacks never arrive, so
the C3 premature-PAID path is the only thing "settling" payouts, and STK callbacks would
401, leaving every top-up to the 5-minute reconcile job (which carries H5).

FIX:
Correct all templates to the real routes with `?token=${MPESA_CALLBACK_SECRET}`; add a
boot-time env validation that asserts the configured callback paths match the
registered routes; add a timeout-callback route.

---

### H2. Top-up endpoint has no idempotency key; duplicate-purchase guard is a race

SEVERITY: HIGH. CATEGORY: Data Integrity.

WHAT IS BROKEN:
`createPurchase` (`payment.service.ts:70-79`) does `findFirst` for a PENDING purchase and
then creates a new one. No unique constraint backs this, so two concurrent requests both
pass and trigger two STK pushes. The skill requires a client idempotency key on every
money-creating endpoint; none exists. The `@Idempotent()` framework
(`common/idempotency/`, registered in `app.module.ts:123`) is applied to zero
endpoints, and it stores results in Redis with a 24h TTL rather than a DB unique
constraint, which the skill calls out (no time windows, constraint-based dedupe).

IMPACT:
Double STK prompts, double PENDING rows, and with H3, double stuck states. Client
retries after network errors re-execute instead of replaying.

FIX:
Add `idempotencyKey` to `CreditTransaction` with `@@unique([userId, idempotencyKey])`,
require the header on `POST /credits/purchase` (contract + mobile change, schema version
bump), insert-first and catch P2002 to return the stored result. Keep the Redis
interceptor as a fast-path replay layer only.

---

### H3. Purchase flow crash windows: bricked purchasing and paid-but-uncredited orphans

SEVERITY: HIGH. CATEGORY: Data Integrity / Reliability.

WHAT IS BROKEN:
`createPurchase` writes the PENDING row, then updates paymentMethod, then calls
`executeStkPush`, which calls Daraja and then writes `mpesaTransactionId`
(`payment.service.ts:86-125`, `mpesa-purchase.service.ts:30-61`). Two windows:
(a) Crash after the PENDING insert and before the STK call: the row has no
`mpesaTransactionId`. `reconcilePending` skips such rows (`mpesa-purchase.service.ts:107`),
so it is PENDING forever, and `PURCHASE_ALREADY_PENDING` (`payment.service.ts:77-79`)
then blocks that user from ever purchasing again.
(b) STK call succeeds but the follow-up DB update throws: the catch block marks the
transaction FAILED. The user can still pay on their phone; the callback then cannot
match (no stored `CheckoutRequestID`, and the STK callback does not echo
AccountReference), so `handleCallback` drops it at `mpesa-purchase.service.ts:67-69`.
Money taken, no credits, no linked record.

FIX:
(a) In `reconcilePending`, expire PENDING rows older than the timeout that have no
`mpesaTransactionId` (mark FAILED with reason), which also releases the purchase block.
(b) In `executeStkPush`, only mark FAILED when the Daraja call itself failed; if the
call succeeded and the DB write failed, retry the write and leave the row PENDING.
Persist the request/response pair (see Phase 4) so a support fix is possible.

---

### H4. No raw callback persistence; unmatched callbacks vanish

SEVERITY: HIGH. CATEGORY: Data Integrity / Auditability.

WHAT IS BROKEN:
Skill section 5 step 2: persist the raw payload before any processing. There is no
`callback_events` table in `schema.prisma`. `handleCallback`
(`mpesa-purchase.service.ts:63-88`) parses and acts directly; if no transaction matches,
it returns Accepted and persists nothing. The B2C handler logs a warning for unknown
commissions and drops the payload. Only parsed fragments survive, inside the matched
row's JSON metadata.

IMPACT:
No audit trail for disputes with Safaricom, no reprocessing source after a parsing or
matching bug, and H3(b)'s orphaned payments leave zero server-side evidence.

FIX:
`callback_events` table (source, raw body, headers, receivedAt, processedAt, outcome,
provider ids extracted for lookup, unique on provider event identity). Insert first,
ack, process from the stored event (queue exists in `infrastructure/queue`).

---

### H5. Missing ResultCode in the STK status query is treated as success

SEVERITY: HIGH. CATEGORY: Data Integrity.

WHAT IS BROKEN:
`queryStkPush` maps `resultCode: Number(response.data.ResultCode ?? 0)`
(`live-mpesa.provider.ts:184`). `reconcilePending` credits when
`query.resultCode === 0 && fallbackAmount !== null` (`mpesa-purchase.service.ts:124`),
with `amountPaid` set to our own expected amount, so the fulfillment amount check can
never catch it.

IMPACT:
Any 2xx response from Daraja that lacks `ResultCode` (shape drift, gateway edge cases)
grants credits for a payment that may never have happened. The B2C query at :137-141
already defaults the other way; this one defaults to "paid".

FIX:
Treat missing `ResultCode` as pending: skip the row and let the next tick retry.
`resultCode: response.data.ResultCode != null ? Number(response.data.ResultCode) : null`
and only settle on an explicit 0. Keep a fixture test with a ResultCode-less body.

---

### H6. Raw phone numbers written into money records

SEVERITY: HIGH. CATEGORY: Security / Compliance (Kenya DPA).

WHAT IS BROKEN:
The skill keeps PII out of immutable money records (hashes/opaque ids only, PII in a
mutable store). Users' phones are encrypted at rest on `users`
(`phoneNumberEncrypted`), but plaintext numbers are written into
`CreditTransaction.metadata`: `requestedPhoneNumber`/`callbackPhoneNumber` at
`payment.service.ts:100`, and the full `settlementRecord` (with `phoneNumber`) merged at
`payment-fulfillment.service.ts:86` and in the failure path at :139.

IMPACT:
Erasure requests require rewriting financial records; any read of transaction metadata
exposes subscriber MSISDNs.

FIX:
Store only `phoneNumberHash` in metadata (the column already exists); strip
`phoneNumber` from persisted settlement records; keep the raw value in the encrypted
user store or the callback_events table with its own retention rules. One-off migration
to scrub existing metadata.

---

### Medium findings

M1. **Metadata wipe + silent catch in the M-Pesa path.**
`mpesa-purchase.service.ts:56` calls `mergeMetadata(null, { failureReason })` on STK
failure, destroying `paymentAmountKES`, package info, and phone fields on the row
(`payment-metadata.util.ts:13-18` treats null base as empty). And the reconcile loop's
`catch { continue }` at :131-133 swallows provider errors with no log (red flag:
catch-and-ignore around payment calls). Fix: pass the existing metadata; log with tx id.

M2. **No ledger.** `Credit.balance` is the written source of truth
(`credit.service.ts:168-272`), transactions are single-entry with no accounts for
M-Pesa/platform/Safaricom, posted rows are mutated (PURCHASE rows rewritten on
settlement at `payment-fulfillment.service.ts:76-88`, SPEND rows rewritten on refund at
`unlock-refund.service.ts:155-169`), one `createdAt` stands in for value/booking/
settlement times (settlement time only inside JSON metadata), and nothing at the DB
level prevents UPDATE/DELETE on `credit_transactions` (no REVOKE/trigger in any
migration). This is the largest structural gap vs skill section 2.

M3. **History erased or rewritten around refunds and re-confirmation.**
`unlock-refund.service.ts:146-153` DELETEs unsettled `success_fees` rows (record loss;
should be a VOIDED/CANCELLED status). `success-fee.service.ts:90-104`'s commission
upsert overwrites `amountKES` unconditionally, including on rows already PAID (e.g.
`ensureCommissionForUnlock` invoked from the dispute flow after payout), making the
stored amount diverge from what was actually paid. Guard the update with
`status notIn [PAID, CANCELLED]` (as `settleFromCredits` already does at :182-192).

M4. **Reconciliation stops at PENDING.** The 5-minute job only resolves stale PENDING
purchases. Nothing verifies COMPLETED purchases or PAID commissions against provider
records, PAID-at-acceptance rows lack receipt numbers so a join-based match is
impossible, and there is no breaks table/queue. Skill section 7 requires a scheduled
ledger-vs-provider compare with surfaced discrepancies.

M5. **No four-eyes.** Dispute resolution refunds money on a single admin's action
(`dispute.service.ts:279`). No maker-checker, no second approver, and no audited
manual-adjustment endpoint at all, so any true correction would be raw SQL (an
unaudited break-glass). Skill section 8.

M6. **Stellar float arithmetic and unbooked residuals.**
`stellar-purchase.service.ts:97-100` compares `Number(record.amountXLM)` against
`Number(expectedAmountXLM)` with a float tolerance; `kesToXlm` (:146-148) is float
division. Use stroops (integer 1e-7 XLM). Underpayments are rejected but the received
XLM is kept with no accounting entry; overpayment excess is silently kept (skill: book
residuals explicitly).

### Low notes

L1. Whole-KES integer units instead of ISO-4217 minor units, and `Int` rather than
`BIGINT`, with no written decision record; no Money type or currency validation
(single-currency today, `paymentMethod` != currency).
L2. Contract schemas hard-require nonnegative balances
(`packages/contracts/src/schemas/payment.ts:8,18-19`), so an overdraft state (which the
skill says must be representable) cannot round-trip the API.
L3. Webhook handlers do all work in-request, including SMS sends, before acking
(skill: persist, ack 2xx, process async).
L4. Payout rounding is implicit `Math.round` half-up (`pricing.policy.ts:61,70`); the
skill wants a named strategy, ROUND_DOWN for amounts we pay out, and the 30% platform
share is never booked anywhere.
L5. `commission-payout.job.ts` is 498 lines; repo rule caps files at 200. Next change
must split it (Phase 2 will).

### Test gaps (skill section 9)

Present and good: duplicate-callback e2e, failed/cancelled/mismatched-amount paths,
concurrent unlock without double-charge, refund flows, reconcile outcomes.
Missing: concurrent-duplicate tests for `createPurchase`, `settleFromCredits`,
`refundUnlock` (all three races would have been caught); crash-injection between
purchase steps; a property/invariant test asserting per-user
`sum(completed transaction amounts) == balance`; a historical Daraja payload fixture
directory (including ResultCode-less and metadata-less shapes).

---

## Implementation plan

Phased per `.claude/rules/delivery-phasing.md`: one phase at a time, each ships with its
gate tests in the same diff, validated before the next starts.

### Phase 1: Correctness hotfixes (no schema changes)
Fixes: C1, C2, H5, M1.
- Claim-based refund in `unlock-refund.service.ts` (updateMany on `isRefunded: false`).
- Guarded, in-transaction settlement in `success-fee.service.ts` (recompute remaining
  under the claim; status/cash guard on the update).
- Conservative `ResultCode` mapping in `live-mpesa.provider.ts` + skip-on-null in
  `mpesa-purchase.service.ts`.
- Metadata merge fix in `executeStkPush` failure path; log reconcile-loop errors.
- Tests: parallel double-refund, parallel double-settle, ResultCode-less query fixture,
  metadata-preservation assertion.
- Outcome: the three double-money paths become structurally unreachable; measured by the
  new concurrency gate tests.

### Phase 2: B2C settlement truth
Fixes: C3, H1, part of M4, L5.
- Job leaves commissions PROCESSING after acceptance; PAID only from the result
  callback or a verified reconcile; store the receipt; `paidAt` = settlement time.
- Add the timeout-callback route; fix `MPESA_RESULT_URL`/`MPESA_TIMEOUT_URL` in
  `.env.example`, `.env.vps.example`, `ci.yml` (with `?token=`); boot-time validation
  that callback env URLs match registered routes.
- Reconcile step flags PROCESSING > 24h to ops; make `queryB2CTransaction` honest
  (`submitted`, never `success`, from the sync ack).
- Split `commission-payout.job.ts` (>200-line rule).
- Tests: acceptance-then-failure callback flips to FAILED; late success after crash
  lands PAID exactly once; env-validation test for URL paths.
- Outcome: zero commissions can sit PAID without a Safaricom receipt; measurable as
  `count(PAID with null mpesaReceiptNumber) == 0` after rollout.

### Phase 3: Purchase-flow idempotency and crash safety
Fixes: H2, H3.
- `idempotencyKey` column on `credit_transactions`, `@@unique([userId, idempotencyKey])`,
  required `Idempotency-Key` header on `POST /credits/purchase`; insert-first, P2002
  replay. Contracts bump + mobile client change (send a UUID per purchase attempt).
- Expire no-`mpesaTransactionId` PENDING rows in reconcile (releases the purchase
  block); distinguish pre-call vs post-call failures in `executeStkPush` (post-call DB
  write retries instead of marking FAILED).
- Tests: same-key parallel purchase collapses to one row/one STK; crash injection
  between each pair of steps (row insert, STK call, id write) with the resumer
  completing or expiring each; stuck-PENDING user can purchase again after timeout.
- Outcome: a user can no longer be permanently blocked from purchasing; no duplicate
  STK per key. Metric: stale PENDING count trends to zero.

### Phase 4: Callback durability and PII
Fixes: H4, H6, L3.
- `callback_events` table; persist-first in both webhooks; ack after durable insert;
  process via the existing queue; unknown events retained and surfaced (ops metric).
- `mpesa_api_calls` table logging every outbound request/response (STK, query, B2C)
  with correlation ids, per skill section 6.
- Strip raw phones from transaction metadata (hash only); scrub migration for existing
  rows.
- Tests: unmatched callback is stored and queryable; replayed stored event settles
  idempotently; metadata contains no `phoneNumber`/`requestedPhoneNumber` keys.
- Outcome: every callback ever received is reproducible; PII scan of
  `credit_transactions.metadata` returns zero raw MSISDNs.

### Phase 5: Ledger, reconciliation, controls (structural)
Fixes: M2, M3, M4 remainder, M5, M6, L1, L2, L4.
- Double-entry tables (`ledger_accounts`, `ledger_entries` with debit/credit legs,
  value/booking/settlement timestamps, `reverses_entry_id`), append-only enforced with
  REVOKE UPDATE/DELETE + trigger; `Credit.balance` becomes a cached projection
  reconciled against entries; corrections are reversal entries; success-fee rows get
  VOIDED instead of DELETE; commission upsert guarded against PAID.
- Daily reconciliation job: our entries vs Daraja by stored ids, breaks table, never
  auto-fix; clearing account for in-flight M-Pesa money.
- Maker-checker for dispute-resolution refunds and any manual adjustment endpoint
  (requester != approver, both audited).
- Stroop-integer Stellar math; document the whole-KES unit decision (or move to cents);
  drop `nonnegative()` from balance response schemas; name rounding strategies
  (ROUND_DOWN on payouts) and book the platform share + residuals.
- Tests: property test debits == credits over generated movement sequences; invariant
  sum(entries) == projected balance; reconciliation break detection fixture.
- Outcome: balances derivable from movements alone; daily break count visible; every
  correction traceable to a reversal entry.

Phase order rationale: 1 and 2 stop money being invented or misrecorded today, 3 and 4
remove the operational traps and evidence gaps, 5 is the structural rebuild the skill
actually specifies. Phases 1-4 are small, independent diffs; Phase 5 is the big one and
should be its own design doc before code.
