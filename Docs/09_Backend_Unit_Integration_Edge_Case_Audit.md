# Backend Unit + Integration Edge Case Audit

Generated: 2026-03-25  
Repository: `PataSpace`

## Scope

- Unit tests under `apps/api/src/**/*.spec.ts`
- Integration tests under `apps/api/test/integration/**/*.spec.ts`
- E2E and smoke tests are referenced only when they still carry coverage that is not yet duplicated below the e2e layer.

## Validation Run

Commands executed:

```bash
pnpm --filter @pataspace/api test:unit
pnpm --filter @pataspace/api test:integration
pnpm --filter @pataspace/api test
```

Results:

- Unit: 20/20 suites passed, 105/105 tests passed
- Integration: 2/2 suites passed, 4/4 tests passed
- Direct unit + integration baseline: 22/22 suites, 109/109 tests
- Full API suite: 32/32 suites, 133/133 tests

## Executive Summary

- The high-priority gaps from the 2026-03-24 audit have mostly been closed.
- Unit coverage is now strong across auth, payments, unlocks, refunds, listing rules, confirmations, disputes, background jobs, idempotency, logging, and HTTP error behavior.
- Integration coverage improved, but it is still materially thinner than unit coverage. The backend still relies on unit tests and e2e tests more heavily than Prisma-backed integration flows.
- The main remaining direct gap is resend-OTP behavior, which is not currently implemented in the API surface, so it cannot be closed with tests alone.

## Auth And Identity

Covered and passing:

- Duplicate verified registration. Evidence: `apps/api/src/modules/auth/auth.service.spec.ts` -> `rejects registration when the phone is already verified`.
- Banned unverified account cannot re-register. Evidence: `apps/api/src/modules/auth/auth.service.spec.ts` -> `rejects registration when an unverified account is banned`.
- Duplicate email on registration is blocked. Evidence: `apps/api/src/modules/auth/auth.service.spec.ts` -> `rejects registration when the email already belongs to another user`.
- Wrong password login is rejected. Evidence: `apps/api/src/modules/auth/auth.service.spec.ts` -> `rejects login when the password is incorrect`.
- Login before phone verification is rejected. Evidence: `apps/api/src/modules/auth/auth.service.spec.ts` -> `rejects login when the phone number is not verified`.
- Inactive-account login is rejected. Evidence: `apps/api/src/modules/auth/auth.service.spec.ts` -> `rejects login when the account is inactive`.
- Banned-account login is rejected. Evidence: `apps/api/src/modules/auth/auth.service.spec.ts` -> `rejects login when the account is banned`.
- OTP mismatch increments attempts. Evidence: `apps/api/src/modules/auth/auth.service.spec.ts` -> `increments OTP attempts when verification fails`.
- Expired OTP is rejected and stale OTP records are cleared. Evidence: `apps/api/src/modules/auth/auth.service.spec.ts` -> `rejects OTP verification when the latest code is expired and clears stale records`.
- OTP max-attempt lockout is rejected and exhausted records are cleaned up. Evidence: `apps/api/src/modules/auth/auth.service.spec.ts` -> `rejects OTP verification when the max attempts are already exhausted`.
- Refresh token rotation works. Evidence: `apps/api/src/modules/auth/auth.service.spec.ts` -> `rotates refresh tokens on refresh`.
- Expired refresh tokens are rejected. Evidence: `apps/api/src/modules/auth/auth.service.spec.ts` -> `rejects refresh when the token is expired`.
- Logout invalidates the provided refresh token. Evidence: `apps/api/src/modules/auth/auth.service.spec.ts` -> `invalidates the provided refresh token on logout`.
- Expired, verified, and exhausted OTP cleanup is covered. Evidence: `apps/api/src/modules/auth/auth.cleanup.service.spec.ts` -> `cleans up expired, verified, and exhausted OTP codes`.
- Expired refresh-token cleanup is covered. Evidence: `apps/api/src/modules/auth/auth.cleanup.service.spec.ts` -> `cleans up expired refresh tokens`.

Remaining at unit or integration level:

- Resend-OTP behavior and resend-specific throttling are not covered.
- The reason is implementation scope, not only test scope: there is no resend-OTP route or service method in the current API/contracts surface.

## Cross-Cutting Safety And Validation

Covered and passing:

- Kenyan phone normalization is covered. Evidence: `apps/api/src/common/security/encryption.util.spec.ts` -> `normalizes Kenyan phone numbers into +254 format`.
- Stable phone lookup hashing is covered. Evidence: `apps/api/src/common/security/encryption.util.spec.ts` -> `creates stable lookup hashes`.
- Encrypted PII round-trip is covered. Evidence: `apps/api/src/common/security/encryption.util.spec.ts` -> `round-trips encrypted fields`.
- Cached idempotent response replay is covered. Evidence: `apps/api/src/common/idempotency/idempotency.interceptor.spec.ts` -> `replays cached responses with X-Idempotent metadata`.
- In-progress idempotent request rejection is covered. Evidence: `apps/api/src/common/idempotency/idempotency.interceptor.spec.ts` -> `rejects requests already in progress for the same key`.
- Reused idempotency keys with a different fingerprint are rejected. Evidence: `apps/api/src/common/idempotency/idempotency.interceptor.spec.ts` -> `rejects reused idempotency keys when the payload fingerprint changes`.
- JWT guard public-route bypass and private-route auth behavior are covered. Evidence: `apps/api/src/common/guards/jwt-auth.guard.spec.ts`.
- Optional JWT behavior is covered. Evidence: `apps/api/src/common/guards/optional-jwt-auth.guard.spec.ts`.
- Role authorization and forbidden-role behavior are covered. Evidence: `apps/api/src/common/guards/roles.guard.spec.ts`.
- Standardized validation-envelope behavior is covered. Evidence: `apps/api/src/common/pipes/zod-validation.pipe.spec.ts`.
- Structured logging shape is covered. Evidence: `apps/api/src/common/interceptors/logging.interceptor.spec.ts` -> `sets response timing headers and logs the structured request event`.
- Request-ID propagation and exception-filter error envelopes are covered at integration level. Evidence: `apps/api/test/integration/cross-cutting-http.integration.spec.ts` -> `propagates request IDs through the exception filter envelope`.
- Rate-limit behavior is covered below the e2e layer. Evidence: `apps/api/test/integration/cross-cutting-http.integration.spec.ts` -> `enforces endpoint rate limits with the standard error envelope`.

Remaining at unit or integration level:

- No major uncovered branch was identified in the currently implemented cross-cutting infrastructure after this pass.

## Credits And Payments

Covered and passing:

- STK push failure marks the purchase as failed. Evidence: `apps/api/src/modules/payment/payment.service.spec.ts` -> `marks a purchase as failed when sandbox STK push fails`.
- Duplicate pending purchase rejection is covered. Evidence: `apps/api/src/modules/payment/payment.service.spec.ts` -> `rejects duplicate pending purchases after reconciliation`.
- Purchase rejection for phone-unverified users is covered. Evidence: `apps/api/src/modules/payment/payment.service.spec.ts` -> `rejects purchases when the phone number is not verified`.
- Purchase rejection for inactive users is covered. Evidence: `apps/api/src/modules/payment/payment.service.spec.ts` -> `rejects purchases when the account is inactive`.
- Purchase rejection for banned users is covered. Evidence: `apps/api/src/modules/payment/payment.service.spec.ts` -> `rejects purchases when the account is banned`.
- Successful callback credits the user and updates transaction state. Evidence: `apps/api/src/modules/payment/payment.service.spec.ts` -> `credits the user balance when a sandbox callback succeeds`.
- Cancelled callback does not credit the user. Evidence: `apps/api/src/modules/payment/payment.service.spec.ts` -> `marks cancelled callbacks without crediting the user`.
- Amount-mismatch callback rejection is covered. Evidence: `apps/api/src/modules/payment/payment.service.spec.ts` -> `marks amount-mismatched callbacks as failed without crediting the user`.
- Non-cancelled failure callback handling is covered. Evidence: `apps/api/src/modules/payment/payment.service.spec.ts` -> `marks non-cancelled failed callbacks without crediting the user`.
- Duplicate callback idempotency and non-pending callback ignore are covered. Evidence: `apps/api/src/modules/payment/payment.service.spec.ts` -> `ignores callbacks for transactions that are already non-pending`.
- Missed callback reconciliation succeeds through STK status query. Evidence: `apps/api/src/modules/payment/payment.service.spec.ts` -> `reconciles successful stale pending purchases when the callback is missed`.
- Reconciliation to failed is covered. Evidence: `apps/api/src/modules/payment/payment.service.spec.ts` -> `reconciles stale pending purchases to failed when STK status reports a non-cancelled failure`.
- Reconciliation to cancelled is covered. Evidence: `apps/api/src/modules/payment/payment.service.spec.ts` -> `reconciles stale pending purchases to cancelled when STK status reports cancellation`.
- Reconciliation query failure handling is covered. Evidence: `apps/api/src/modules/payment/payment.service.spec.ts` -> `skips reconciliation updates when the STK status query fails`.
- End-to-end persistence of completed purchases and balance history is covered. Evidence: `apps/api/test/integration/prisma-domain-flows.integration.spec.ts` -> `persists purchase completion and balance history through service calls`.
- Cached balance retrieval is covered. Evidence: `apps/api/src/modules/credit/credit.service.spec.ts` -> `returns cached balances without querying Prisma`.
- Balance hydration and caching are covered. Evidence: `apps/api/src/modules/credit/credit.service.spec.ts` -> `hydrates missing balances from Prisma and caches the result`.
- Insufficient credits at the balance-decrement layer are covered. Evidence: `apps/api/src/modules/credit/credit.service.spec.ts` -> `throws a payment-required error when credits are insufficient`.
- Transaction-history pagination mapping is covered. Evidence: `apps/api/src/modules/credit/credit.service.spec.ts` -> `maps paginated transaction history from Prisma results`.

Remaining at unit or integration level:

- The remaining risk in this area is depth, not branch absence: failed and cancelled reconciliation outcomes are unit-covered, but not yet backed by richer Prisma integration flows.

## Unlocks And Refunds

Covered and passing:

- Unlocking your own listing is rejected. Evidence: `apps/api/src/modules/unlock/unlock.service.spec.ts` -> `rejects attempts to unlock the user’s own listing`.
- Missing listing unlock attempts are rejected. Evidence: `apps/api/src/modules/unlock/unlock.service.spec.ts` -> `rejects missing listings`.
- No-longer-unlockable listings are rejected. Evidence: `apps/api/src/modules/unlock/unlock.service.spec.ts` -> `rejects listings that are no longer unlockable`.
- Listing availability is rechecked inside the transaction before spending credits. Evidence: `apps/api/src/modules/unlock/unlock.service.spec.ts` -> `rechecks listing availability inside the transaction before spending credits`.
- Repeat unlock idempotency at the service boundary is covered. Evidence: `apps/api/src/modules/unlock/unlock.service.spec.ts` -> `returns an existing unlock without charging credits again`.
- Refunded-unlock repeat access is covered. Evidence: `apps/api/src/modules/unlock/unlock.service.spec.ts` -> `rejects repeat access when the existing unlock was refunded`.
- Insufficient-credits behavior at the unlock-service boundary is covered. Evidence: `apps/api/src/modules/unlock/unlock.service.spec.ts` -> `propagates insufficient-credit failures from the unlock service boundary`.
- Concurrent duplicate unlock handling and unique-constraint recovery are covered. Evidence: `apps/api/src/modules/unlock/unlock.service.spec.ts` -> `recovers concurrent duplicate unlocks when the unique constraint is hit`.
- Disputed unlock history status is mapped correctly. Evidence: `apps/api/src/modules/unlock/unlock.service.spec.ts` -> `returns disputed unlocks with the disputed history status`.
- Refund flow behavior is covered:
  - credits restored to buyer
  - linked spend transaction marked `REFUNDED`
  - pending commission cancelled
  Evidence: `apps/api/src/modules/unlock/unlock.service.spec.ts` -> `refunds an unlock, marks the spend as refunded, and cancels pending commission`.
- Refund rejection after commission is already paid is covered. Evidence: `apps/api/src/modules/unlock/unlock.service.spec.ts` -> `rejects unlock refunds once the commission has already been paid`.
- Integration persistence of unlock, commission, dispute, and audit relations is covered. Evidence: `apps/api/test/integration/prisma-domain-flows.integration.spec.ts` -> `persists unlock, commission, dispute, and audit relations through services`.

Remaining at unit or integration level:

- Concurrency behavior is now unit-covered, but not yet backed by a dedicated Prisma integration or stress-style concurrency test.

## Listings And Moderation

Covered and passing:

- First-three-listings review rule is covered. Evidence: `apps/api/src/modules/listing/listing.service.spec.ts` -> `requires admin review for a user's first three listings`.
- GPS mismatch rejection is covered. Evidence: `apps/api/src/modules/listing/listing.service.spec.ts` -> `rejects listing creation when photo GPS does not match the listing coordinates`.
- Mobile-only listing creation is covered. Evidence: `apps/api/src/modules/listing/listing.service.spec.ts` -> `requires a mobile device for listing creation`.
- Ownership checks for listing update are covered. Evidence: `apps/api/src/modules/listing/listing.service.spec.ts` -> `blocks listing updates from non-owners`.
- Ownership checks for listing delete are covered. Evidence: `apps/api/src/modules/listing/listing.service.spec.ts` -> `blocks deletion attempts from non-owners`.
- Listing deletion is allowed once unlock activity is fully resolved. Evidence: `apps/api/src/modules/listing/listing.service.spec.ts` -> `allows owners to delete listings once unlock activity is fully resolved`.
- Listing deletion is blocked while unresolved unlock activity exists. Evidence: `apps/api/src/modules/listing/listing.service.spec.ts` -> `blocks deletion while unresolved unlock activity still exists`.
- Locking critical listing fields after unlock is covered. Evidence: `apps/api/src/modules/listing/listing.service.spec.ts` -> `locks critical listing fields after the listing has been unlocked`.
- Resubmission after rejection is covered. Evidence: `apps/api/src/modules/listing/listing.service.spec.ts` -> `resubmits rejected listings for review when they are edited`.
- Approve or reject only while pending is covered. Evidence: `apps/api/src/modules/listing/listing.service.spec.ts` -> `blocks approving listings unless they are still pending` and `blocks rejecting listings unless they are still pending`.
- Browse filtering and browse-cache population are covered. Evidence: `apps/api/src/modules/listing/listing.service.spec.ts` -> `applies browse filters and caches the browse response`.
- ETag behavior is directly covered below e2e for browse responses. Evidence: `apps/api/src/modules/listing/listing.controller.spec.ts` -> `returns 304 without a payload when the ETag matches If-None-Match`.
- Hard-delete cleanup of aged soft-deleted listings is covered. Evidence: `apps/api/src/jobs/listing-cleanup.job.spec.ts` -> `hard deletes aged soft-deleted listings after deleting storage objects`.
- Cleanup failure leaves the listing record in place and records diagnostics. Evidence: `apps/api/src/jobs/listing-cleanup.job.spec.ts` -> `records cleanup failures without deleting the listing record`.

Remaining at unit or integration level:

- Listing detail-route ETag behavior is still primarily exercised by smoke and e2e coverage rather than a dedicated unit or integration spec.
- Listing-specific admin-route authorization remains indirectly covered through generic role-guard tests and e2e flows rather than a dedicated listing-controller integration test.

## Confirmations, Disputes, Commissions, And Jobs

Covered and passing:

- Both confirmation sides create commission eligibility through persisted services. Evidence: `apps/api/test/integration/prisma-domain-flows.integration.spec.ts` -> `persists unlock, commission, dispute, and audit relations through services`.
- 14-day one-sided auto-confirm is covered. Evidence: `apps/api/src/modules/confirmation/confirmation.service.spec.ts` -> `auto-confirms stale one-sided unlocks and creates commission eligibility`.
- Auto-confirm skips unlocks blocked by an open dispute. Evidence: `apps/api/src/modules/confirmation/confirmation.service.spec.ts` -> `skips stale auto-confirmation when a dispute is still open`.
- Duplicate confirmation rejection is covered. Evidence: `apps/api/src/modules/confirmation/confirmation.service.spec.ts` -> `rejects duplicate confirmations from the same side`.
- Unauthorized confirmation rejection is covered. Evidence: `apps/api/src/modules/confirmation/confirmation.service.spec.ts` -> `rejects manual confirmations from unauthorized users`.
- Refunded unlock cannot be confirmed. Evidence: `apps/api/src/modules/confirmation/confirmation.service.spec.ts` -> `rejects confirmations for refunded unlocks`.
- Manual confirmation blocked by an open dispute is covered. Evidence: `apps/api/src/modules/confirmation/confirmation.service.spec.ts` -> `blocks manual confirmations while a dispute is open`.
- Dispute creation and retrieval persistence is covered. Evidence: `apps/api/test/integration/prisma-domain-flows.integration.spec.ts` -> `persists unlock, commission, dispute, and audit relations through services`.
- Dispute investigate flow is covered. Evidence: `apps/api/src/modules/dispute/dispute.service.spec.ts` -> `moves open disputes into investigation and records the audit trail`.
- Duplicate dispute creation rejection is covered. Evidence: `apps/api/src/modules/dispute/dispute.service.spec.ts` -> `rejects duplicate dispute creation for the same unlock`.
- Dispute participant authorization for create is covered. Evidence: `apps/api/src/modules/dispute/dispute.service.spec.ts` -> `rejects dispute creation for non-participants`.
- Dispute participant authorization for lookup is covered. Evidence: `apps/api/src/modules/dispute/dispute.service.spec.ts` -> `rejects dispute lookup for users who are not participants or admins`.
- Dispute resolution with full refund is covered. Evidence: `apps/api/src/modules/dispute/dispute.service.spec.ts` -> `resolves disputes with refunds through the unlock refund flow`.
- No-refund dispute resolution restoring commission eligibility is covered. Evidence: `apps/api/src/modules/dispute/dispute.service.spec.ts` -> `restores commission eligibility after a no-refund resolution when both sides had confirmed`.
- Closing resolved disputes is covered. Evidence: `apps/api/src/modules/dispute/dispute.service.spec.ts` -> `closes resolved disputes`.
- Invalid state transitions are covered:
  - investigate on non-open dispute
  - resolve on non-open dispute
  - close on non-resolved dispute
  Evidence: `apps/api/src/modules/dispute/dispute.service.spec.ts`.
- Commission payout of due commissions is covered. Evidence: `apps/api/src/jobs/commission-payout.job.spec.ts` -> `promotes eligible commissions and pays due commissions`.
- Commission payout retry and dead-letter behavior is covered. Evidence: `apps/api/src/jobs/commission-payout.job.spec.ts` -> `requeues transient payout failures and dead-letters terminal ones`.
- Commission payout blocking by dispute is covered. Evidence: `apps/api/src/jobs/commission-payout.job.spec.ts` -> `skips commissions blocked by open disputes`.
- Commission payout dispute race after claim is covered. Evidence: `apps/api/src/jobs/commission-payout.job.spec.ts` -> `returns a claimed commission to due when a blocking dispute appears after the payout claim`.
- Stale `PROCESSING` commission recovery is covered. Evidence: `apps/api/src/jobs/commission-payout.job.spec.ts` -> `recovers stale processing commissions before scanning due payouts`.
- Notification alert fan-out once-only behavior is covered. Evidence: `apps/api/src/jobs/notification.job.spec.ts` -> `sends admin alerts once for background failures`.
- Notification deduplication is covered. Evidence: `apps/api/src/jobs/notification.job.spec.ts` -> `skips alerts that were already sent`.
- Notification behavior when there are no admin recipients is covered. Evidence: `apps/api/src/jobs/notification.job.spec.ts` -> `skips alerts when there are no active admins to notify`.

Remaining at unit or integration level:

- The main remaining weakness here is integration depth. State transitions and side effects are now unit-covered, but dispute lifecycle persistence still has far fewer Prisma-backed integration assertions than the service layer has unit assertions.

## Overall Assessment

- The backend no longer has the same edge-case blind spots that existed in the 2026-03-24 audit.
- The previous highest-priority gaps around payment callbacks, unlock refunds, confirmation/dispute transitions, stale processing recovery, notification no-admin handling, listing rules, and cross-cutting HTTP behavior are now covered.
- Unit coverage is materially stronger than before and now covers most implemented business branches that were previously missing.
- Integration coverage improved from 1 file with 2 tests to 2 files with 4 tests, but it is still the thinnest part of the test pyramid.

## Remaining Priority Work

1. If product scope requires OTP resend, implement the missing resend-OTP endpoint/service/contracts first, then add unit and integration coverage for resend behavior and resend throttling.
2. Add deeper Prisma-backed integration coverage for failed or cancelled payment reconciliation outcomes, refund side effects, and dispute lifecycle persistence so those areas rely less on mocks.
3. Add dedicated listing-controller integration coverage for admin-route authorization and detail-route cache or ETag behavior if direct below-e2e coverage is required there.
