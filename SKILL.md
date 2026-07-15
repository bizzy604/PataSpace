---
name: fintech-money-patterns
description: Rules and patterns for writing any code that touches money, balances, payments, escrow, M-Pesa, wallets, ledgers, refunds, fees, or currency. ALWAYS use this skill when generating, reviewing, or modifying code involving monetary amounts, payment callbacks/webhooks, escrow holds and releases, transaction records, reconciliation jobs, or financial database schemas. Also use when designing API endpoints that create or move money, even if the task seems small (e.g. "add a top-up endpoint", "handle the Daraja callback", "release escrow to poster").
---

# Fintech Money Patterns

Patterns for code that handles money. Built for a mobile-first marketplace with
M-Pesa payments and a credit escrow system (KES primary currency), but the rules
are general.

## The three laws (every rule below serves one of these)

1. **No invented money.** Duplicates, double-credits, and clamped balances mint
   money from nothing. Never allow them.
2. **No lost data.** Every movement, timestamp, payload, and rounding residual
   is recorded. History is never edited or deleted.
3. **No trust.** Verify external providers (M-Pesa/Daraja, KYC vendors),
   internal components, and even our own prior state. Fail loudly on broken
   assumptions.

---

## 1. Representing money

- **NEVER use float/double for money.** Not in code, not in DB columns, not in
  JSON. No `FLOAT`, `DOUBLE`, `REAL` columns. No JavaScript bare numbers for
  amounts.
- **Store amounts as integers in minor units.** KES 1,250.50 → `125050` (cents).
  Column type: `BIGINT`. Look up minor-unit digits per ISO 4217 — do not assume
  2 everywhere.
- **Serialize money as a string or integer minor units in JSON**, never a bare
  decimal number (`"1250.50"` or `125050`, never `1250.50`). A bare JSON number
  becomes an IEEE-754 double in most parsers.
- **Use a Money type** that packs `{amount, currency}` together. Reject
  arithmetic between different currencies at compile time or with a runtime
  guard that throws.
- **Validate currency codes at the boundary** against a controlled set (start
  with `["KES"]`). Never accept arbitrary codes from requests.
- **Rounding is explicit and happens once, at the edge.** Keep full precision
  through intermediate math (use decimal/BigDecimal-style types for
  computation); round only before persisting or displaying, with a named,
  deliberate strategy (e.g. `ROUND_DOWN` for amounts we pay out,
  `ROUND_HALF_EVEN` for statistics). If a split's parts don't sum to the whole
  after rounding, book the residual explicitly — never drop it.

## 2. Ledger and records

- **Use double-entry movements.** Every movement has a debit account, a credit
  account, and an amount. Money is only moved, never created. External parties
  (M-Pesa, Safaricom fees, the platform's revenue) get their own accounts.
- **Never store balance as an updatable column that code writes to directly.**
  Balance is derived from movements (may be cached/snapshotted for
  performance, but the movements are the source of truth).
- **No `UPDATE` or `DELETE` on posted ledger rows. Ever.** Ledger tables are
  append-only. Enforce at the DB level (revoke UPDATE/DELETE) where possible.
- **Corrections are new compensating entries**, linked to the original via a
  `reverses_entry_id` / `corrected_by_entry_id` pair. Never edit the original.
- **Record multiple timestamps**, not one `created_at`:
  - `value_time` — when the transaction economically happened
  - `booking_time` — when we recorded it
  - `settlement_time` — when money actually moved (nullable)
- **Every sensitive change gets an audit record**: what, when (value + booking
  time), who/what triggered it, and why (a reference to the order, callback, or
  operator action that caused it). This applies to money movements AND to
  config changes (fee schedules, limits) and permission changes.
- **Keep PII out of immutable records.** Ledger rows reference users by opaque
  internal IDs only. Names, phone numbers, ID documents live in a separate,
  mutable store (GDPR/DPA erasure then never requires rewriting the ledger).

## 3. Escrow / funds reservation

Escrow is a long-lived funds reservation. Rules:

- **Two balances per wallet**: `total` and `available = total − reserved`. All
  spend checks and new reservations check `available`, never `total`.
- **Check-and-reserve must be atomic/linearizable.** One DB transaction with
  row locking (`SELECT ... FOR UPDATE`) or an equivalent serializable
  mechanism. Never a read-then-write across two round trips — two concurrent
  requests would both pass the check and double-spend.
- **Every reservation must resolve.** Each hold ends in exactly one of:
  `settled` or `released`. Model reservation state as an explicit enum
  (`ACTIVE | SETTLED | RELEASED`) and write a background job that flags
  long-lived `ACTIVE` holds for investigation. An orphaned hold locks a user's
  money — conservative, but a support fire.
- **Reserve the estimate, settle the actual.** When the final amount can differ
  (fees, charges), reserve the estimated amount, settle what was actually
  charged, release the remainder — all as explicit movements.
- **Do NOT enforce `balance >= 0` by construction** (no unsigned integers, no
  `CHECK (balance >= 0)`). The external world can force an overdraft (a fee
  settles higher, a reversal lands after funds left). The system must be able
  to *represent* a negative balance, *detect* it (monitoring/reconciliation),
  and *book the recovery* explicitly. Clamping to zero mints money.

## 4. Idempotency

- **Every money-creating or money-moving endpoint requires an idempotency
  key**, supplied by the client, scoped to (user, operation type). Store it
  with the result; on a repeat key, return the stored result without
  re-processing.
- **The idempotency check must be atomic.** Use a unique constraint on the key
  and rely on the constraint violation to detect the duplicate — never
  check-then-insert. Two duplicate requests in the same millisecond must
  collapse to one effect.
- **Do not dedupe by payload similarity.** Two genuine payments of the same
  amount from the same user on the same day are normal. Explicit keys only.
- **No idempotency time windows** (e.g. dedupe only within 24h) unless forced
  by scale, and then flag it loudly as a correctness trade-off.
- **Permanent errors replay as-is** (a validation failure is the idempotent
  result); transient errors (network) may reprocess.
- **Handle out-of-order retries.** A stale "place hold" retry arriving after
  the hold was already settled/released must be a no-op that returns the
  original result — never a new hold.

## 5. M-Pesa / Daraja callbacks (and all webhooks)

Treat every callback as a *hint that something happened*, not a fact.

Processing order (do not reorder):
1. **Verify the caller** — validate the signature/credentials over the RAW
   bytes received, not a re-serialized body.
2. **Persist the raw payload verbatim** to a `callback_events` table
   (raw body, headers, received_at) BEFORE any processing. This is the audit
   trail and the reprocessing source.
3. **Acknowledge fast** — return 2xx as soon as the raw event is durably
   stored. Do the real work asynchronously (queue/worker).
4. **Query the API for authoritative state** — do not credit a wallet or
   settle escrow from the callback body alone. Use the callback as a trigger
   to query Daraja transaction status. The API may lag the callback; retry
   with backoff.
5. **Process idempotently** — dedupe on the provider's transaction ID
   (`MpesaReceiptNumber` / `CheckoutRequestID`) with a unique constraint. A
   re-delivered "success" credits once.

Additional rules:
- **Never assume ordering.** A late "failed" callback must not overwrite a
  confirmed "success"; reconcile against known state, don't blind-overwrite.
- **Never assume delivery.** A missing callback is normal; reconciliation
  (section 7) is the safety net, not optional.
- **Store the provider's reference ID on our transaction row** — matching in
  reconciliation must be a join, not a heuristic.

## 6. Multi-step money flows (withdrawal, escrow release, payout)

- **Model long flows as persisted state machines.** Explicit status enum,
  state stored in the DB, each step's completion committed before the next
  step starts. Never hold flow progress only in memory.
- **Assume a crash between every two steps.** A half-finished flow must land
  in a recoverable state. Write a resumer job (scheduler/poller) that picks up
  stalled flows and pushes them forward — a crashed worker must not strand a
  flow forever.
- **Every step must be safe to re-run** (idempotent). On resume, a step may
  re-execute after partially happening — e.g. before re-sending an M-Pesa B2C
  payout, query for an existing transaction with our reference first.
- **External effects cannot be rolled back.** Once an STK push or payout is
  initiated, a DB rollback does not un-call it. Either retry forward to
  completion, or post explicit compensating movements (saga pattern). Never
  wrap an external call inside a DB transaction expecting rollback to undo it.
- **Store every external request and response** (endpoint, payload sent, payload
  received, timestamps) in a structured, queryable table. This is evidence in
  disputes and the material for reprocessing after a bug.

## 7. Reconciliation

- **Every payments integration ships with a reconciliation job.** Compare our
  ledger against provider records (Daraja statements/API) on a schedule
  (daily minimum for M-Pesa flows).
- **Match on stored provider IDs** (join on `mpesa_receipt_number`), never on
  amount+time heuristics unless there is no ID.
- **Bake expected delays into the logic** — do not alert on transactions that
  are simply inside the normal settlement window.
- **Handle one-to-many** — a single settlement can cover many transactions.
- **Never auto-fix a discrepancy by overwriting our data.** Each break is
  surfaced for investigation and fixed through first-class means: a linked
  correction entry, or reprocessing the stored raw callback.
- **Route in-flight money through a clearing/suspense account.** Money
  captured by the provider but not yet settled to our bank is float — book it
  to a clearing account, not directly to final accounts.

## 8. Controls

- **Four-eyes on sensitive operations.** Manual ledger corrections, large or
  manual payouts, fee/limit changes: require a second approver in code
  (maker–checker), record requester and approver, and enforce
  requester ≠ approver.
- **Least privilege, role-based.** Prefer roles over per-person grants.
  Granting/revoking access is itself an audited event (what, who, why, when).
- **Break-glass paths are explicit and heavily audited**, never a backdoor.

## 9. Testing requirements for generated code

When generating money-handling code, also generate or update tests that:

1. **Assert invariants, not just outputs** — e.g. "for any sequence of
   movements, debits == credits" (property-based testing where the stack
   supports it).
2. **Replay every operation twice** and assert the second call has no
   additional effect (idempotency test).
3. **Inject a crash between each pair of steps** in multi-step flows and
   assert the resumer completes the flow exactly once.
4. **Round-trip serialize money values** (encode→decode) and assert no
   precision loss.
5. **Test concurrent duplicates** — fire the same idempotency key / the same
   reservation check in parallel and assert exactly one effect.
6. **Keep old-format payload fixtures** (real historical callback shapes) and
   assert current code still parses them.

## 10. Red flags — reject or rewrite code that does any of these

- `float`/`double`/bare JSON numbers for amounts
- `UPDATE wallets SET balance = balance + ?` as the source of truth
- `UPDATE` or `DELETE` on ledger/posted rows
- Crediting a wallet directly from a webhook body
- Balance check and debit in separate, non-atomic steps
- `CHECK (balance >= 0)` or unsigned balance columns
- Clamping a negative balance to zero
- Catch-and-ignore around external payment calls
- A payment endpoint without an idempotency key
- A webhook handler that processes before persisting the raw payload
- An escrow hold with no settlement/release path or stall detection
- A single `created_at` where value/booking/settlement times diverge
- PII embedded in immutable ledger rows

When in doubt, prefer the conservative failure: locked money (recoverable)
over lost or invented money (unrecoverable).
