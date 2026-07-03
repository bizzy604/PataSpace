# Critical Product Patches (Engineering Spec v1.1/v1.2)

This document describes the patch set that moves the backend from the v1.0
model (unlock = 10% of rent, commission = 30% of unlock, raw contact reveal)
to the spec v1.1/v1.2 model. It supplements `02_Database_Schema.md`,
`03_API_Specifications.md`, and `05_Workflows_State_Machines.md`.

## 1. Two-part pricing (spec section 4.3)

- **Part A — unlock fee**: flat credit bands by unit type, refundable,
  anti-spam only. STUDIO/BEDSITTER 100, 1BR 200, 2BR 300, 3BR 400,
  4BR+/MANSION 500. Source: `apps/api/src/modules/listing/domain/pricing.policy.ts`.
- **Part B — success fee**: `clamp(10% x rent, 1,000, 5,000)` KES, paid by the
  mover only at confirmed move-in. Snapshot stored on `listings.successFeeKes`
  at create/update; shown free pre-unlock on every listing card.
- **Split**: 70% poster / 30% platform. `listings.commission` now holds the
  poster share of the full fee (display), while `commissions.amountKES` is
  70% of *collected-so-far* and rises as the fee settles.
- Config (env, remote-tunable): `UNLOCK_BAND_BEDSITTER`, `UNLOCK_BAND_1BR`,
  `UNLOCK_BAND_2BR`, `UNLOCK_BAND_3BR`, `UNLOCK_BAND_4BR_PLUS`,
  `SUCCESS_FEE_PCT`, `FEE_FLOOR_KES`, `FEE_CAP_KES`, `SPLIT_POSTER`.
- Snapshots are never recomputed for existing rows; a price change only
  affects new listings/fees.

## 2. Success-fee settlement (spec section 4.4)

- When both sides confirm, `success_fees` row is created (unique per unlock):
  `feeDueKes` snapshot, the mover's spent unlock credits captured as
  `creditsApplied`, status `PARTIAL` or `SETTLED`.
- `POST /confirmations/settle-fee { unlockId }` applies wallet credits to the
  full remaining balance (top up the exact shortfall via the normal credit
  purchase STK flow first). Idempotent; updates the commission to 70% of the
  fully collected fee.
- **Gating**: movers with an unsettled fee get `402 SUCCESS_FEE_UNSETTLED` on
  new unlocks until they settle.
- A refunded unlock deletes its unsettled fee (no fee is owed for a move-in
  that fell through) and cancels the commission.
- Owner: `apps/api/src/modules/confirmation/success-fee.service.ts`.

## 3. Report-dead with reason codes (spec section 4.2)

- `POST /unlocks/:id/report-dead { reason, comment? }` with reason
  `OCCUPIED | FAKE | UNRESPONSIVE | LANDLORD_DECLINED`; refunds credits
  synchronously and stores `unlocks.deadReason`.
- `LANDLORD_DECLINED` is a market-structure signal, not poster fraud; its
  refund share is a first-class pilot metric (threshold 20%).
- Owner: `apps/api/src/modules/unlock/report-dead.service.ts`,
  refund engine in `unlock-refund.service.ts`.

## 4. Landlord-awareness layer (spec section 5)

- Listing creation requires the attestation `landlordAware: true`
  (`400 LANDLORD_AWARENESS_REQUIRED` otherwise). Not verified in v1; it is the
  accountability anchor for `landlord_declined` refunds.
- `listings.posterRole` (`OUTGOING_TENANT | CARETAKER | LANDLORD | SCOUT`,
  default outgoing tenant) is exposed on cards for the role badge.

## 5. Mover-to-poster flywheel (spec section 4.6)

- Confirming movers get `vacatedListingPrompt` in the confirmation response:
  the confirmation id + earnings estimate (70% of the clamped fee; the new
  home's rent is the estimate basis until rent-history profiles exist).
- `POST /listings/from-confirmation { confirmationId }` returns the seed
  payload; the normal capture flow then posts with `seededFromConfirmationId`
  (unique - one listing per confirmation).
- One reminder SMS at +24h (never again) via `MoverPosterReminderJob`
  (hourly cron, marker on `confirmations.posterPromptSmsAt`).
- Metric: `flywheel.moverToPosterRate` in `GET /admin/metrics`
  (target > 0.25).

## 6. Masked contact layer groundwork (spec section 4.5)

- `proxy_sessions` maps an unlock to a pooled virtual number. Masking turns on
  when `CONTACT_MASKING_ENABLED=true` and `CONTACT_VIRTUAL_NUMBERS` (comma
  list) is provisioned; until then unlocks fall back to the legacy direct
  reveal (`contactMode: 'direct'` in the response).
- When masked: `contactInfo.phoneNumber` is the virtual number, the raw
  number never leaves the server, and `contactExpiresAt` tracks the session
  (72h default, extended to 7 days on confirmed move-in, expired on refund).
- `POST /webhooks/voice` (Africa's Talking Voice callback) bridges the caller
  to the unlock's other party or plays a closed prompt; stale mappings never
  bridge. Optional shared token via `CONTACT_VOICE_WEBHOOK_TOKEN`.
- Poster response telemetry (`firstPosterResponseAt`, `callCount`) accrues for
  the future "responds fast" badge.

## 7. Metrics (spec section 1)

`GET /admin/metrics` gains:

- `trust.landlordDeclinedShare` — landlord_declined share of refunds
  (alert threshold 0.2).
- `flywheel.moverToPosterRate` — seeded listings / confirmed move-ins
  (target > 0.25).
- `successFees` — partial/settled counts and total collected KES.

## 8. Migration

`apps/api/prisma/migrations/20260703000000_two_part_pricing_and_trust_patches`
adds the enums, columns, `success_fees`, and `proxy_sessions` (with RLS
policies reusing `app.can_access_participant_unlock`), and backfills
`listings.successFeeKes` with the clamp formula for existing rows.
Deploy with `pnpm --filter @pataspace/api prisma:migrate:deploy`.

## 9. Deliberately out of scope (tracked)

- STK push *inside* the move-in-code flow (signal A). Settlement reuses the
  existing credit purchase STK machinery; the code-screen flow lands with the
  move-in-code milestone (M2).
- Move-in codes, unlock HELD/72h escrow states, unlock slot caps + queue,
  listing auto-expiry/reconfirm, capture signing/attestation, pHash dedup,
  tiered KYC, and the fraud rules engine - unchanged from v1.0 baseline;
  see spec sections 4.2, 5, 6, 7, 8 and build order section 12.
