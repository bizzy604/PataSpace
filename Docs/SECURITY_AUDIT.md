# PataSpace Application Security Audit

Date: 2026-06-28
Scope: whole application — `apps/api`, `apps/web`, `apps/admin`, `apps/mobile`,
`packages/*`, `infra/*`. Focus: authentication, authorization (IDOR), payment /
money-out integrity, injection, secret handling, PII exposure, config security.
Method: manual code review of every auth/money path, endpoint authorization
survey, raw-SQL review, committed-secret scan, dependency review.

## Summary

The application has a strong baseline: RLS enforced per-request, AES-256-GCM PII
encryption with HMAC blind indexes, bcrypt(12) passwords, hashed+peppered
refresh tokens with rotation, timing-safe webhook auth that fails closed,
parameterized SQL only, contact info gated behind unlock, per-viewer caching,
helmet, Swagger off by default, and OTP attempt limits + rate limiting.

One **critical, directly-monetizable** flaw breaks that baseline: Stellar credit
purchases grant credits without ever verifying the amount paid. Below, ranked by
exploitability and financial impact.

Status: **DONE_WITH_CONCERNS** — audit complete, no code changed.

---

## C1 — CRITICAL: Stellar credit purchases never verify the amount paid

**Where**
- `apps/api/src/infrastructure/stellar/stellar.types.ts` — `StellarPaymentRecord`
  has `transactionHash, from, memo, settledAt` and **no amount and no asset field**.
- `apps/api/src/infrastructure/stellar/providers/live-stellar.provider.ts:35-56`
  — `findIncomingPayment` matches on `tx.successful && tx.memo === req.memo`
  only. No amount, no asset type, no direction (in vs out of treasury) check.
- `apps/api/src/modules/payment/stellar-purchase.service.ts:69-73` — on a memo
  match it calls `fulfillment.processSuccessfulPayment(tx.id, { amountPaid: null, … })`.
- `apps/api/src/modules/payment/payment-fulfillment.service.ts` — the amount
  guard is `if (expectedAmount !== null && record.amountPaid !== null && expectedAmount !== record.amountPaid)`.
  With `amountPaid: null` the whole check is skipped and `tx.amount` credits are granted.

**Exploit**
1. Attacker requests a purchase, `paymentMethod: 'stellar'`, `package: '20_credits'`
   (expected ~117 XLM). The API returns the treasury address and a memo (the
   transaction id).
2. Attacker sends **1 stroop (0.0000001 XLM)** — or any worthless amount — to the
   treasury with that memo.
3. Reconciliation (`reconcilePending`, also runs per-user on the next purchase)
   finds a successful tx with the memo, calls `processSuccessfulPayment` with
   `amountPaid: null`, the amount check is bypassed, and 20 credits are granted.

**Impact — real cash out, not just free credits.** Credits unlock listings; once
buyer and seller both confirm (`confirmation.service.ts`), a `Commission`
(`amountKES`) is created and paid out to the landlord via **M-Pesa B2C**
(`commission-callback.service.ts`, `CommissionPayoutJob`). An attacker who owns
both a "landlord" and a "tenant" account mints near-free credits, unlocks their
own listing, both accounts confirm, and PataSpace pays real KES to an
attacker-controlled M-Pesa number. Direct, repeatable treasury drain.

**Precondition:** `STELLAR_MODE` is `testnet` or `live` (default is `disabled`,
`stellar.module.ts`). The flaw is latent today but ships the moment crypto
payments are switched on, and the `live` provider has the identical gap.

**Fix**
- Add `amountXLM` (and `assetCode`/`assetIssuer`) to `StellarPaymentRecord`.
- In `findIncomingPayment`, load the transaction's **payment operations**, sum
  only those whose destination is the treasury and whose asset is native XLM,
  and return that sum.
- Pass the real `amountPaid` into `processSuccessfulPayment` and make the guard
  fail-closed: reject when `amountPaid` is null/undefined, and require
  `amountPaid >= expectedXLM` (with a small tolerance for fee/rounding).
- Add a regression test: a memo-matching payment below the expected amount must
  mark the transaction FAILED and grant zero credits. Add an eval covering
  underpayment, wrong-asset, and treasury-outbound transactions.

---

## H1 — HIGH: OTP falls back to a fixed code (`123456`) in production

**Where** `auth.service.ts` `generateOtpCode()` returns `this.sandboxOtpCode`
(default `123456`) whenever `smsProvider === 'sandbox'`. `env.validation.ts`
`superRefine` (line 73) enforces `ALLOWED_ORIGINS` and HTTPS in production but
**never requires `SMS_PROVIDER === 'africastalking'`**, and the schema defaults
`SMS_PROVIDER` to `sandbox` (line 36).

**Exploit** A production deploy that forgets to set `SMS_PROVIDER` boots green
with sandbox SMS: every OTP is `123456`. `verifyOtp` issues a **full auth
session on OTP alone (no password)**, so an attacker can register-and-verify any
unregistered phone number they do not control (and complete any pending
verification) by entering `123456`. Phone ownership — the platform's core
identity proof for M-Pesa payouts — becomes forgeable.

**Fix** In `superRefine`, when `NODE_ENV === 'production'` require
`SMS_PROVIDER === 'africastalking'` (and its `AT_*` credentials). Optionally
refuse to start if `OTP_SANDBOX_CODE` is set alongside a live provider.

---

## H2 — HIGH: RLS fails open to full access when request context is missing

**Where** `apps/api/src/common/database/rls-context.util.ts` `buildRlsContext(null)`
returns `accessMode: 'internal'`; `prisma.service.ts` `withRlsTransactionScope`
defaults a missing context to `'internal'`. Internal mode bypasses row-level
security entirely.

**Risk** Any HTTP execution path that loses its `AsyncLocalStorage` context (a
bug, a library that breaks async context, an unawaited call) silently escalates
from per-user scoping to **full-database access** instead of denying. Security
posture should fail closed.

**Fix** Default unknown/HTTP contexts to `'anonymous'`; require jobs and
bootstrap to set `'internal'` explicitly. Add a test proving a query with no
context cannot read another user's rows.

---

## H3 — HIGH: Vulnerable dependencies (4 critical / 68 high)

`pnpm audit` flags, among others, `@clerk/nextjs` + `@clerk/shared` (**critical**
— middleware route-protection bypass), `@clerk/backend` (high — token path in the
API), `multer` (high — upload DoS, API uses it), plus `axios`, `undici`, `next`,
`handlebars`, `shell-quote`. Web blast radius on the Clerk critical is limited
because `apps/web` has no `middleware.ts` (the API is the trust boundary), but
the packages still must be patched. See `Docs/PRODUCTION_AUDIT.md` #1 for the
full table and remediation; add a `pnpm audit --audit-level high` gate + a
Dependabot/Renovate config so this cannot regress.

---

## M1 — MEDIUM: `CLERK_SECRET_KEY` not validated at startup

`clerk-jwt.strategy.ts` defaults the secret to `''`; it is absent from
`env.validation.ts`. A prod deploy missing it boots green and rejects every
Clerk login with a generic 401 (fails closed, but silently). Add it to the
schema and require it in production. (Also in `Docs/PRODUCTION_AUDIT.md` #3.)

---

## M2 — MEDIUM: CORS allows requests with no `Origin`

`configure-app.ts` `enableCors` returns `true` when `origin` is undefined.
Standard and mitigated by `credentials: false`, but confirm it is intentional
rather than implicit; consider denying unknown origins outright for browser
paths.

---

## Verified controls (working as intended — keep them)

- **Money idempotency**: `payment-fulfillment.service.ts` and
  `commission-callback.service.ts` claim state via `updateMany` guarded by
  status inside `$transaction`; redelivered callbacks are safe no-ops.
- **M-Pesa amount check**: STK-push fulfillment fails the transaction on amount
  mismatch before granting credits (the check the Stellar path skips).
- **Webhook auth**: `payment.controller.ts` uses `timingSafeEqual` and fails
  closed in production when the callback secret is unset.
- **Authorization**: resource controllers scope by `@CurrentUser('id')`;
  admin/dispute mutations are `@Roles(Role.ADMIN)`; listing detail returns
  `contactInfo` (exact address/phone/coords) only when the viewer owns it, is an
  admin, or holds a non-refunded unlock — public map coords are rounded.
- **Cache isolation**: listing detail/browse cache keys are per-viewer
  (`getViewerCacheKey`), so contact info is never served across users.
- **Injection**: only `Prisma.sql` tagged-template raw queries; no string
  concatenation; `$queryRawUnsafe` is a constant `SELECT 1` health probe.
- **Secrets**: no real secrets committed (only `.env.example` placeholders);
  `.gitignore` blocks real env files; no secret logging found.
- **Auth primitives**: bcrypt cost 12, refresh tokens random-48-byte,
  hashed with a server pepper, rotated on use; OTP attempts capped and rate
  limited (3/hour register/verify/resend, 5/hour login).

---

## Suggested order of work

1. **C1** (Stellar amount verification) — before any crypto-payment launch.
2. **H1** (force real SMS provider in prod) and **M1** (Clerk env) — small env
   guards, prevent silent-auth-compromise deploys.
3. **H2** (RLS fail-closed) — defense in depth on the core data boundary.
4. **H3** (dependency patch + CI audit gate).
5. **M2** and hardening.
