# 15 — Mobile Production Fix Plan (2026-07-16)

Root-cause audit of the field-test failures reported on 2026-07-16, plus the fix plan.
Every issue below was traced to specific lines. Statuses: IDENTIFIED, not fixed yet.

## System snapshot

- Mobile (Expo, `apps/mobile`) boots all provider state from mock data in `src/data/mock-listings.ts`, then `use-mobile-api-sync.ts` overwrites it from the API. Every API failure is swallowed with `.catch(() => {})`, so the mock data silently stays.
- API (`apps/api`) stores media as plain public URLs at confirm time. Reads are never presigned.
- Admin console (`apps/web`) approves listings from a text-only queue.

---

## ISSUE 1 — Photos/videos invisible everywhere (mobile, admin, home)
SEVERITY: CRITICAL. Three stacked causes; all three must be fixed.

**Cause A (API, blocks everything):** unsigned S3 read URLs.
`apps/api/src/infrastructure/storage/providers/s3-storage.provider.ts:61-62` builds
`https://<bucket>.s3.<region>.amazonaws.com/<key>` (default from
`apps/api/src/common/config/app.config.ts:139-152` when `STORAGE_PUBLIC_BASE_URL` is unset).
Uploads work because the PUT is presigned; reads 403 because the bucket blocks public access.
That is why the objects exist in S3 but nobody (mobile, admin, web) can render them.

Verify on VPS: `curl -sI <stored thumbnailUrl>` returns 403.

**Fix A (pick one, recommended first):**
1. Bucket policy allowing `s3:GetObject` on the `listings/*` prefix only (5-minute change, no code). Keep evidence/private media on a different prefix.
2. Later: CloudFront with OAC, set `STORAGE_PUBLIC_BASE_URL`/`STORAGE_CDN_BASE_URL` to the CDN domain. Existing rows store absolute URLs, so a backfill of stored `thumbnailUrl`/photo `url` values is required when the base changes.

**Cause B (mobile):** the app never fetches listing media.
`apps/mobile/src/features/mobile-app/use-mobile-api-sync.ts:53,61` maps every API listing with
`galleryMedia: []` and `photoCount: '— photos'`. `ListingDetailsScreen.tsx` and the gallery
(`ExploreScreens.tsx:295-359`) render only that preview. `fetchListingById` exists
(`src/lib/api/listings.ts:30-35`) but has zero callers.

**Fix B:** on `ListingDetailsScreen` (and `MyListingDetailsScreen` / gallery), fetch
`/listings/:id`, map `photos[].url` and `videoUrl` into `galleryMedia`, real `photoCount`.

**Cause C (admin):** `apps/web/components/admin/moderation-queue.tsx:84` renders only
`{listing.photos.length} photos`. No image is ever displayed, so the admin cannot verify.

**Fix C:** render a photo grid (and video link) in the moderation card from `listing.photos`.

---

## ISSUE 2 — Demo listings on home; approved listing "not found" / "demo data" message
SEVERITY: CRITICAL

**Root cause:** mock state + silent one-shot sync + wrong API URL in the tested build.
- Provider boots with `featuredListings`, `initialMyListingRows`, `initialSavedListingIds`, `initialTransactions`, wallet 5000 (`mobile-app-provider.tsx:227-238`).
- `fetchListings()` runs once on mount and swallows failure (`use-mobile-api-sync.ts:175-180`). No refetch on focus, no pull-to-refresh, no error UI. If the first call fails, demo data stays for the whole session.
- The build under test pointed at a LAN IP: `apps/mobile/.env:4` has `EXPO_PUBLIC_API_BASE_URL=http://172.20.248.132:3001/api/v1`; the production URL is commented out. On any phone not on that Wi-Fi with the dev API running, every call fails, which reproduces exactly: demo listings on home, real listing "not found", "no longer available in the current demo data" (`MyListingDetailsScreen.tsx:107`), saves not sticking, wallet fake.

**Fix:**
1. Delete the mock listing/transaction/unlock/saved/notification seeds from provider state. Boot empty, add loading + error + retry states. Keep mocks only for Storybook/tests if needed.
2. Refetch the feed on app foreground and add pull-to-refresh on home/my-listings/saved.
3. Build against `https://api.dalakenya.com/api/v1` (EAS env var per STORE_RELEASE.md). Add a visible dev-only banner showing the API base so a wrong-URL build is spotted in seconds.
4. Gate test: provider renders empty state (not demo rows) when the feed fetch rejects.

---

## ISSUE 3 — M-Pesa STK push not sent
SEVERITY: CRITICAL

**Root cause:** the API runs the sandbox M-Pesa provider. `MPESA_MODE` defaults to `sandbox`
(`apps/api/src/common/config/env.validation.ts:49`), and `mpesa.module.ts:16-26` picks the
sandbox provider which fakes the push without calling Daraja. Same failure class as the
storage sandbox misconfig we hit earlier on this VPS.

**Fix (mostly ops, no code):**
1. Set on VPS: `MPESA_MODE=live`, `MPESA_BASE_URL=https://api.safaricom.co.ke`, consumer key/secret, shortcode, passkey, `MPESA_CALLBACK_URL=https://api.dalakenya.com/api/v1/payments/mpesa/callback` (plus callback secret, initiator, security credential). Boot validation already enforces the full set when mode is live (`env.validation.ts:145-158`).
2. Recreate the API container (env changes need recreate, not restart): `docker compose up -d --force-recreate api`.
3. Confirm the boot log shows the live provider, then run one real KES top-up end to end.
4. Prereq: production Daraja app with the paybill/till approved by Safaricom. If those credentials do not exist yet, this is BLOCKED on Safaricom, not on code.

Mobile purchase flow itself is already correct (idempotency key + poll-until-credited, current branch).

---

## ISSUE 4 — Dark mode throws "Could not find a navigation context"
SEVERITY: HIGH

**Root cause:** duplicated react-navigation module instances in the pnpm tree. `node_modules/.pnpm`
holds 6 physical copies of `@react-navigation/native@7.1.34` and 2 of
`@react-navigation/core@7.16.2` (one keyed against `react@19.1.0`, one against `react@19.2.7`,
the same react duplication that broke Expo Go before). App code contains zero
`useNavigation`/`NavigationContainer` references; the throw comes from expo-router internals.
Switching the theme makes NativeWind re-render every css-interop-wrapped component; wrapped
navigation components resolve the navigation context from a different physical copy than the
one the running `Stack` provided, so the context lookup returns null. Identical failure class
to the css-interop split-registry bug fixed in da573b2.

**Fix:**
1. Find what still drags in `react@19.2.7` (`pnpm why react` / lockfile) and align it to 19.1.0 so a single `@react-navigation/core` instance remains, then `pnpm install` and verify `.pnpm` holds one copy.
2. Gate test in `expo-sdk-alignment.test.ts` style: `require.resolve('@react-navigation/native')` from `apps/mobile` and from `expo-router` must realpath to the same file.
3. Re-test theme switch on device.

---

## ISSUE 5 — Saved listings do not appear on the Saved page
SEVERITY: HIGH

**Root cause:** Saved is computed as feed ∩ savedIds, and the save API call fails on mock ids.
- `savedListings = browseListings.filter(id ∈ savedListingIds)` (`mobile-app-provider.tsx:260-261`). Anything not in the current 20-item feed page can never appear as saved.
- With the feed stuck on mock data (Issue 2), tapping save sends a demo id to the real API, gets 404, and the optimistic flip reverts (`toggleSaved`, provider:326-345). So nothing sticks.

**Fix:** build the Saved page from `fetchMySavedListings` responses directly. The
saved-listing API already returns embedded listing data including `thumbnailUrl`
(`apps/api/src/modules/saved-listing/saved-listing.service.ts:155`). Store previews, not just ids. Issue 2's fix removes the mock-id 404s.

---

## ISSUE 6 — Report an issue: evidence images cannot be uploaded
SEVERITY: MEDIUM

**Root cause:** it was never built. `apps/mobile/src/screens/CreditScreens.tsx:725-739` renders
"Photo evidence upload is coming soon." The upload module only presigns listing photos/videos.

**Fix:** add an `evidence` upload kind in the upload module on a private prefix (never
public-read), accept confirmed keys on dispute create, extend the dispute contract with
attachments, render them in the admin disputes panel via short-TTL presigned GET URLs.

---

## ISSUE 7 — Credit packages: lowest must be 500, selectable tiers
SEVERITY: PRIORITY (product)

**Current:** hardcoded in two places. API `CREDIT_PACKAGES` at
`apps/api/src/modules/payment/purchase-response.util.ts:23-26` (5,000 / 10,000 / 20,000 KES) and
mobile mock `walletPackages` at `apps/mobile/src/data/mock-listings.ts:589-614`. Contract enum
`CreditPurchasePackage` at `packages/contracts/src/types/payment.ts:3`.

**Fix (keep server-priced packages; never accept a client-supplied amount):**
1. New tiers, e.g. 500 / 1,000 / 2,500 / 5,000 / 10,000 / 20,000 (credits = KES 1:1, bonuses on top tiers). Contract enum extended, both sides bumped together.
2. Add `GET /credits/packages` returning the package list; mobile renders from that instead of the mock, so future price changes are server-only.
3. Confirm unlock economics still work with a 500 balance (unlock cost vs package floor) before locking tier values. Flag to Amoni if unlock cost exceeds 500, since the smallest package must still buy something usable.

---

## ISSUE 8 — Resend email verification (6-digit code + magic link), claude.ai-style
SEVERITY: PRIORITY (new feature)

**Current state:** no email infrastructure exists anywhere in the API. Registration is
email-identified but phone-OTP verified, with sandbox OTP 123456 (`app.config.ts:64-66`).

**Build plan:**
1. `apps/api/src/infrastructure/email/` following the exact sms/storage provider pattern: `EMAIL_PROVIDER=sandbox|resend`, sandbox logs the mail, resend provider calls the Resend REST API (`RESEND_API_KEY`, `EMAIL_FROM=PataSpace <no-reply@dalakenya.com>`). dalakenya.com domain must be verified in Resend (SPF/DKIM) before go-live.
2. Email verification flow in the auth module: issue a 6-digit code (reuse OTP hashing/TTL/attempt rules) plus a signed magic-link token in the same mail; either path verifies. Endpoints: request-email-verification, verify-email-code, verify-email-link. Rate-limited like the phone OTP.
3. Template: single branded HTML template, code displayed large, one button for the magic link, both expiring together (10 min).
4. Mobile: verification screen accepts the 6-digit code; magic link deep-links into the app (`https://dalakenya.com/verify-email?...` universal link with a web fallback page).
5. Tests: provider unit tests, flow integration tests, e2e covering code path, link path, expiry, replay, rate limit. Sandbox provider keeps CI free of real sends.

---

## Contact support details (Medium)
Update the contact-support screen constants: WhatsApp 0796861525, call 0796861525,
email info@dalakenya.com. Verify the WhatsApp/tel/mailto links open correctly on device.

---

## Execution order (each phase ships complete with tests before the next starts)

| Phase | Scope | Size |
|---|---|---|
| 1 | Media read path: bucket policy (ops) + verify stored URLs render; admin moderation photo grid; mobile detail-fetch with real gallery | 1 day |
| 2 | Kill mock fallback: empty/error/retry states, focus refetch, pull-to-refresh, Saved page from saved-listings API, prod API URL in build, gate tests | 1 day |
| 3 | Ops go-live: MPESA_MODE=live + credentials + container recreate + one real STK test; confirm STORAGE_PROVIDER=s3 stayed correct | 0.5 day + Safaricom dependency |
| 4 | Dark mode dedupe (react 19.2.7 stragglers) + realpath gate test | 0.5 day |
| 5 | Credit package tiers (500 floor) + GET /credits/packages + mobile wiring | 0.5 day |
| 6 | Resend email verification (infra + flow + template + mobile + e2e) | 1.5 days |
| 7 | Dispute evidence upload (private prefix + contract + admin render) | 1 day |

Phases 1-4 are the production blockers. 5-7 follow immediately after.

**Standing prerequisite for anything touching VPS env:** recreate the container, do not restart it
(prior incident: env edits invisible after restart).

**Branch note:** `fix/api-money-phase-3` has uncommitted idempotency work (mobile idempotency lib +
e2e edits). Land that first so these fixes start from a clean tree.
