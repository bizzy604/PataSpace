# 13. Clerk Removal — Email + Password Auth Migration

Remove Clerk from all three apps and make the NestJS API the only identity
provider: email + password credentials, phone-OTP verification and recovery,
NextAuth (Auth.js) managing sessions on the web app only. This is the
planning doc the delivery-phasing rule points at: work one phase at a time,
validate, mark the phase complete here, then start the next.

## Why (what Clerk cost us)

- @clerk/expo v3.6+ ships native modules: every SDK bump now requires a full
  dev-client + APK rebuild, and Expo Go is permanently unusable (see the
  2026-07-10 `Cannot find native module 'ClerkExpo'` incident).
- Clerk is a second identity system bolted onto an API that already owns a
  complete auth stack (`/auth/register|verify-otp|resend-otp|login|refresh|
  logout`, own JWT strategy, `passwordHash` on User). Two token formats,
  two user-sync paths (`clerk-jwt.strategy.ts` account linking), double the
  failure surface.
- Clerk-owned flows (password reset, account lockout) blocked the mobile
  redesign from building the designed screens (12_Mobile_Redesign_Plan
  skipped forgot_password_phone / reset_password_form / account_locked).

## Decisions (settled with Amoni, 2026-07-11)

1. **Login identifier is email + password.** Registration also collects the
   phone number (the product needs it: listings, contact unlock, M-Pesa) and
   verifies it with the existing SMS OTP flow. Email is unique and required
   for new accounts.
2. **NextAuth runs on the web app only.** It cannot run inside Expo. Web
   uses a NextAuth Credentials provider that calls `POST /auth/login`;
   mobile calls the API's JWT endpoints directly and stores tokens in
   SecureStore. The API stays the single source of truth for identity.
3. **Google/Apple SSO is dropped entirely.** Credential-only accounts. SSO
   can return later via expo-auth-session + API-side token exchange.
4. **Clean cutover, no user migration.** No real users exist in Clerk.
   Accounts with a `clerkId` and no `passwordHash` are test accounts; they
   either get wiped or set a password through the new reset flow.
5. **No email delivery in this migration.** The API has an SMS adapter
   (sandbox OTP 123456 until Africa's Talking lands) and no mailer.
   Verification and password reset ride the phone-OTP rails. Email
   *verification* (mailer + verified-email flag) is explicitly deferred.

## Ground rules for every phase

- **Contracts first.** Auth schema changes land in `packages/contracts`
  with a version bump before either side consumes them. No side imports the
  other's internals.
- **API rules apply:** backend-modular-monolith (200-line cap, header
  comments, controllers never touch Prisma), tests + evals in the same
  commit as the feature.
- **Mobile screens keep the redesigned look.** Auth screens change wiring,
  not chrome, except the two new screens (forgot/reset password) which are
  built from their wireframes (`forgot_password_phone`, `reset_password_form`
  in Docs/Wireframes/PataSpace Design Screens).
- **Money flows are the regression canary.** Every phase's validation ends
  with the unlock→pay path exercised against the phase's auth changes.
- **Clerk keys stay live until Phase 4.** Rollback at any earlier phase is
  `git revert` + old binaries; nothing is deleted from the Clerk dashboard
  or env stores until the sweep.
- CI is dead (GitHub Actions billing lock), so every gate runs locally.

## Phase 0 — Contracts: email-identifier auth schemas

`packages/contracts/src/schemas/auth.ts` (+ types):

- `registerSchema`: `email` required (unique identifier), `password`,
  `firstName`, `lastName`, `phoneNumber` (kept required — OTP target).
- `loginSchema`: `email` + `password` (was `phoneNumber` + `password`).
- New: `forgotPasswordSchema` (`email`), `resetPasswordSchema` (`email`,
  `otp`, `newPassword`). Reuses the OTP length/format rules already defined
  for verify-otp.
- `AuthSessionResponse` unchanged (accessToken/refreshToken/user) — confirm
  and lock with a schema test so web/mobile don't need response changes.

Gates: contracts build, schema unit tests (valid/invalid email, password
rules, OTP shape), version bump noted in the package changelog.

- [x] Phase 0 complete (2026-07-13). Landed as **additive** schemas rather
  than replacing `registerSchema`/`loginSchema` in place: `emailSchema`,
  `emailRegisterSchema`, `emailLoginSchema`, `forgotPasswordSchema` +
  `forgotPasswordResponseSchema` (anti-enumeration shape, no userId),
  `resetPasswordSchema` (OTP shape shared with verify-otp) in
  `schemas/auth.ts`, mirrored in `types/auth.ts`
  (`EmailRegisterRequest`/`EmailLoginRequest`/`ForgotPasswordRequest`/
  `ForgotPasswordResponse`/`ResetPasswordRequest`). `authUserSchema`/
  `AuthUser` gained an optional nullable `email` so existing sessions still
  parse. Phone-identifier schemas are untouched — Phase 1 swaps the API to
  the email schemas and deletes them, matching the "contracts first, then
  consume" ground rule without a broken intermediate state. New test lane:
  `pnpm --filter @pataspace/contracts test` (jest + ts-jest, added since
  the package had none), 15 gate tests in
  `schemas/__tests__/auth.schemas.test.ts` covering email normalization,
  password-policy rejection cases, OTP shape, and the anti-enumeration
  response shape. Version bumped 0.1.0 → 0.2.0, `CHANGELOG.md` added (the
  package had none).
  Gates: `pnpm --filter @pataspace/contracts build` exit 0; contracts jest
  15/15; `apps/mobile` `tsc --noEmit` exit 0 against the updated package;
  `apps/api` unit suite 373/373 (67 suites) unaffected — a pre-existing
  `admin-finance` typecheck error and 4 DB-backed e2e/integration auth
  tests (no local Postgres in this sandbox) are unrelated to this change,
  confirmed by reproducing both with the contracts diff stashed out.

## Phase 1 — API: native auth goes email-first, Clerk strategy dies

Auth module (`apps/api/src/modules/auth/`):

- `register`: key the pending account on email (unique), hash password
  (keep the existing hasher), still dispatch phone OTP; conflict rules for
  re-registering an unverified email.
- `login`: look up by email; identical lockout/rate-limit behaviour
  (`ApiRateLimit('authRegister')` etc. stay).
- New endpoints: `POST /auth/forgot-password` (sends OTP to the account's
  verified phone; responds 200 regardless of account existence to avoid
  enumeration) and `POST /auth/reset-password` (email + OTP + new password,
  revokes all refresh tokens on success). Same OTP store + cleanup service
  the register flow uses.
- `verify-otp` / `resend-otp` / `refresh` / `logout`: unchanged semantics.

Clerk removal (API side):

- `common/guards/jwt-auth.guard.ts` + `optional-jwt-auth.guard.ts`:
  `AuthGuard(['jwt', 'clerk-jwt'])` → `AuthGuard('jwt')`.
- Delete `common/auth/clerk-jwt.strategy.ts`, `infrastructure/clerk/`
  (module + account adapter).
- `user.service`: delete `createFromClerk`, `linkClerkId`,
  `findStoredByClerkId`; `account-deletion.service`: drop the
  `clerkAccount.deleteUser` step (local delete only).
- `payment.service.ts:58`: the M-Pesa gate currently exempts Clerk users
  from `phoneVerified` (`!user.phoneVerified && !user.clerkId`). Becomes a
  hard `!user.phoneVerified` check — write the regression test proving a
  never-verified account cannot start an STK push.
- Env: drop `CLERK_SECRET_KEY` from `env.validation.ts`, `app.config.ts`,
  `.env.example`, `infra/docker/.env.vps.example` (delete from the VPS in
  Phase 4, not now).
- Prisma: `clerkId` column is **kept but orphaned** this phase (dropped in
  Phase 4) so rollback stays cheap.

Data check before merge: `SELECT count(*) FROM users WHERE "clerkId" IS NOT
NULL` — wipe test accounts or leave them for the reset flow, per decision 4.

Gates: full api jest suite; new tests for email register/login/forgot/reset,
enumeration-safe responses, refresh-token revocation on reset; e2e auth
suite; unlock→pay e2e against a natively-authed user; `pnpm --filter
@pataspace/api build`.

- [ ] Phase 1 complete

## Phase 2 — Mobile: SecureStore JWT auth, Clerk SDK deleted

Provider + client:

- New `src/features/auth/` provider: holds session (access/refresh/user),
  persists refresh token in expo-secure-store, silent refresh via
  `POST /auth/refresh` on 401 (single-flight so concurrent 401s refresh
  once), logout revokes server-side.
- `src/lib/api-client.ts`: token source becomes the provider (was Clerk
  `getToken`). Everything downstream (credits, listings, payments) is
  untouched — same Bearer header, new mint.
- `_layout.tsx`: `ClerkProvider` → the new provider; the public-path
  routing effect keeps its exact logic, driven by the new `isSignedIn`.

Screens (wiring only, chrome stays):

- Register: email + password + names + phone → `POST /auth/register` →
  existing VerifyOtp screen (`verify-otp` endpoint, unchanged UI).
- Login: email + password → `POST /auth/login`; error-state design kept.
  SSO buttons (Google/Apple) removed; `sso-callback.tsx` route deleted.
- New from wireframes: `forgot-password.tsx` (phone-OTP request; design
  `forgot_password_phone`) and `reset-password.tsx` (design
  `reset_password_form`); "Forgot Password?" link restored on Login (was
  omitted because Clerk owned it).
- `use-delete-account.ts`: drops Clerk sign-out; calls the API delete +
  local session clear.

Dependency removal:

- Remove `@clerk/expo` from package.json, the `'@clerk/expo'` plugin from
  app.config.ts, and retire the Clerk assertions in
  `src/lib/__tests__/native-config.test.ts` (keep the test file — repoint
  it at whatever native-module deps remain, e.g. expo-secure-store).
- **Binary rebuild required** (native modules removed): new dev client +
  preview APK via EAS, same profiles as the 2026-07-10 builds.

Gates: `tsc --noEmit`; jest (auth provider reducer/refresh logic gets pure
gate tests); on-device pass of register→OTP→login→forgot→reset, light+dark;
unlock→pay smoke on the new binary.

- [ ] Phase 2 complete

## Phase 3 — Web: NextAuth Credentials over the API

- NextAuth v5 (Auth.js) route handler in `apps/web/app/api/auth/[...nextauth]`:
  Credentials provider calls `POST /auth/login`, session strategy `jwt`,
  session carries the API access/refresh tokens + role; token rotation in
  the `jwt` callback when the API access token nears expiry.
- Middleware protects `/admin/*`; role gate replaces the Clerk-based checks
  in `admin-shell.tsx` / `use-admin-data.ts` / `admin/(console)/layout.tsx`.
- `admin/sign-in/[[...sign-in]]/page.tsx`: Clerk widget → credentials form
  (email + password) posting through NextAuth `signIn()`.
- `lib/api/client.ts`: Bearer token from the NextAuth session (was Clerk).
- Remove `@clerk/nextjs` from package.json, `ClerkProvider` from
  `app/layout.tsx`, Clerk styles from `globals.css`, Clerk env from
  Dockerfile/`proxy.ts`; add `AUTH_SECRET` (+ `AUTH_URL` for the VPS).
- Playwright: `protected-redirects.spec.ts` + `landing.spec.ts` rewired to
  the NextAuth flow; add a sign-in e2e (valid, invalid, non-admin role).

Gates: `pnpm --filter @pataspace/web build`; full Playwright suite locally;
manual admin console pass against the Phase-1 API.

- [ ] Phase 3 complete

## Phase 4 — Sweep and decommission

- Prisma migration: drop `users.clerkId` (after confirming the Phase-1 data
  check came back clean/wiped).
- Purge every remaining `clerk` reference: env examples, `test/setup-env.ts`,
  README files, CI workflow env blocks, `Docs/` mentions where they state
  current behaviour (historic plan docs stay as history).
- Secrets rotation: delete `CLERK_SECRET_KEY` from the VPS env +
  `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` from EAS envs (development/preview/
  production) and local `.env` files; deactivate the Clerk application in
  its dashboard (do not delete the org — keeps audit history).
- `pnpm why @clerk/backend @clerk/expo @clerk/nextjs` returns nothing in
  any workspace; lockfile contains no `@clerk/*`.
- Final full-stack smoke on real infra: web admin login, mobile
  register→verify→login→unlock→pay→confirm, account deletion.
- Update this doc + README auth sections; add memory note that Expo Go
  works again for the app **only if** no other native module blocks it
  (expo-camera etc. still require the dev client — verify and record the
  true answer).

Gates: all workspace test suites green; `docker compose` stack boots with
the new env; the four money paths pass on the final binaries.

- [ ] Phase 4 complete

## Sequencing and parallelism

Phase 0 → Phase 1 are strictly serial (contracts, then API). Phases 2 and 3
consume the same Phase-1 API and share no files — run them as parallel
sessions/worktrees. Phase 4 starts only after both merge.

## Risks

- **RLS request context.** Both strategies set
  `requestContext`/`databaseAccessMode`; the native `jwt.strategy.ts`
  already does this correctly, but the deleted clerk strategy's 'internal'
  elevation for first-login user creation disappears — registration path
  must be confirmed to create users under the auth-path internal marking.
- **Token lifetime mismatch on web.** NextAuth session maxAge must not
  outlive the API refresh token or admins get silent 401 loops; align and
  test the expiry path explicitly.
- **Existing device sessions.** Old binaries with Clerk tokens get 401s
  after Phase 1 deploys. Acceptable pre-launch; note it in the deploy
  message.
- **Enumeration.** `forgot-password` and `register` conflict responses must
  not reveal whether an email exists; tests assert identical status/body
  for both cases.

## Measurable outcome

- `grep -ri clerk apps packages infra --include='*.ts*'` (excluding Docs
  history) returns zero after Phase 4.
- Auth-related dependency count drops by 3 SDKs; mobile binary no longer
  needs a rebuild for identity-provider updates.
- Register→verify→login→reset all pass e2e in every app, and the unlock→pay
  money path is green at every phase boundary.

## Session protocol

One phase per session. Start by reading this doc and the phase's checklist;
end by ticking the phase checkbox, committing, and pushing. Phase 1 must not
start until Phase 0 is merged; Phases 2/3 fork only after Phase 1 is
validated against a running API.
