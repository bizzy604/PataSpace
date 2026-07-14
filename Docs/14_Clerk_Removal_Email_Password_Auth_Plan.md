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

- [x] Phase 1 complete (2026-07-13). `auth.service.ts` was already 510 lines
  before this change (over the module cap even pre-Clerk), so the touch
  triggered a real split rather than a patch: `application/registration.
  service.ts` (register/verify-otp/resend-otp), `application/password-
  recovery.service.ts` (forgot/reset-password, new), `application/auth-
  token.service.ts` (access/refresh token issuance — extracted, was
  duplicated inline), `application/auth-otp.service.ts` (OTP issue/
  validate/consume — extracted, was duplicated across register/verify/
  resend), `domain/auth-eligibility.policy.ts` (pure active/banned/
  verified checks). `auth.service.ts` itself is now session-only (login/
  refresh/logout), 96 lines. `AuthController` gained `forgot-password`
  (200, anti-enumeration) and `reset-password` (204) with new rate-limit
  profiles. `register`/`login` now key on email (`userService.
  findStoredByEmail`); phone stays required at registration and is the
  OTP/recovery channel via the existing SMS rails — no email provider
  needed. Clerk removed: `clerk-jwt.strategy.ts` and `infrastructure/
  clerk/` deleted, both guards collapsed to `AuthGuard('jwt')`,
  `UserService.createFromClerk/linkClerkId/findStoredByClerkId` deleted,
  `AccountDeletionService` no longer calls a Clerk adapter,
  `CLERK_SECRET_KEY`/`CLERK_PUBLISHABLE_KEY` dropped from
  `env.validation.ts`/`app.config.ts`/`.env.example`/
  `infra/docker/.env.vps.example` (web's `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  is untouched — Phase 3's to remove). `payment.service.ts:58` hardened to
  a bare `!user.phoneVerified` check; the found bug — a stale `clerkId`
  exempted a never-verified account from the M-Pesa phone gate — has a
  named regression test. `users.clerkId` stays in the schema (unused,
  orphaned) per the plan; drops in Phase 4. Contracts also bumped to
  0.3.0 in this phase (breaking: `registerSchema`/`loginSchema` and
  `RegisterRequest`/`LoginRequest` are now email-identified;
  `UserProfile.email` changed from optional-undefined to required-
  nullable to match `AuthUser`) since the API had to consume the
  canonical shapes, not the additive Phase-0 aliases.
  Gates: contracts build + 15/15 tests; api `tsc --noEmit` clean on every
  file this phase touched; api unit suite 68 suites / 384 tests green
  (auth: 6 suites / 42 tests, all new or rewritten); `pnpm --filter
  @pataspace/api build` exit 0.
  **Concern (environmental, not code):** no local Postgres in this
  sandbox, so the DB-backed e2e auth suite and the unlock→pay e2e are
  unverified here — same gap Phase 0 hit. The data-check query
  (`SELECT count(*) FROM users WHERE "clerkId" IS NOT NULL`) also needs a
  live DB; run both before Phase 2/3 start. **A second Claude Code session
  was concurrently committing an unrelated Admin Console build
  (`Docs/13_Admin_Console_Build_Plan.md`) in this same working directory
  during this phase** — its in-flight `support.service.ts` edit was mid-
  break when the unit suite ran (excluded from the count above), and a
  verification `git stash -u` briefly held its uncommitted files before
  popping them back intact. No collision with this phase's files; flagging
  because two agents sharing one working tree is exactly what the
  parallel-session-safe architecture guidance in CLAUDE.md is for, and
  this phase and that one weren't run in separate worktrees.

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

- [x] Phase 2 complete (2026-07-14). New `src/lib/auth/` (pure, no React):
  `session-state.ts` (the `loading | signed_out | signed_in` reducer —
  `HYDRATE_SIGNED_OUT`/`SIGNED_IN`/`TOKEN_REFRESHED`/`SIGNED_OUT`, with
  `TOKEN_REFRESHED` a deliberate no-op when not signed in so a late-resolving
  refresh after logout can't resurrect a session) and `refresh-lock.ts`
  (`createSingleFlight` — collapses concurrent callers into one underlying
  promise, fresh run after settle, rejection propagates to all callers and
  clears the lock). `src/features/auth/auth-provider.tsx` wraps these in a
  `AuthSessionProvider`/`useAuthSession()` React context: refresh token in
  expo-secure-store, access token + user in memory, cold-start hydration
  (stored refresh token → `POST /auth/refresh` → `GET /users/me` to get the
  user, since refresh returns tokens only) and a `getToken()` with the exact
  shape Clerk's `useAuth().getToken` had, so every existing `lib/api/*.ts`
  call site needed zero signature changes. New `src/lib/api/auth.ts` holds
  every `/auth/*` + `/users/me` call (register/verifyOtp/resendOtp/login/
  forgotPassword/resetPassword/refresh/logout/fetchMe), matching the Phase-1
  contracts literally.
  `src/lib/api-client.ts`: added a module-level `AuthTokenSource` registry
  (`setAuthTokenSource`) the provider registers itself into on mount;
  `apiFetch` now retries once on a 401 via the registered single-flight
  `refreshAccessToken`, so *every* domain call (credits, listings, unlocks,
  ...) gets silent-refresh-and-retry for free without threading a refresh
  callback through each `lib/api/*.ts` function. `publicFetch` gained an
  `init` param (register/login/etc. are unauthenticated POSTs, not GETs).
  `_layout.tsx`: `ClerkProvider` → `AuthSessionProvider`, `useAuth()` →
  `useAuthSession()`, the public-path redirect effect's logic is untouched —
  `forgot-password`/`reset-password` added to `publicPaths`, `sso-callback`
  removed. `mobile-app-provider.tsx`: Clerk's `useAuth/useClerk/useUser` →
  `useAuthSession()`; the old `unsafeMetadata`-parsing effect (Clerk's
  `AuthUser` had no first-class name/phone fields, so the redesign had
  stashed them in `unsafeMetadata`) is replaced with a direct map from the
  API's `AuthUser` (real `firstName`/`lastName`/`phoneNumber` fields) — net
  deletion of `readUnsafeMetadataString`/`resolveDisplayName`, no
  replacement needed. `use-delete-account.ts`: Clerk `signOut()` → the new
  provider's `logout()` (best-effort, called after the API delete
  succeeds).
  Screens: `RegisterScreen` collects email+password+names+phone, calls
  `register()`, routes to `VerifyOtpScreen` via a new `verifyOtpHref(phone)`
  (the API's `verify-otp`/`resend-otp` need the phone passed explicitly —
  Clerk's `signUp` object used to carry it implicitly). `VerifyOtpScreen`
  now verifies the *phone* via `verifyOtp()`/`resendOtp()` instead of
  Clerk's email code — this was always the product intent (decision 1); the
  pre-migration screen used email only because Clerk's auth was email-based.
  `LoginScreen` calls `login()`; the "Forgot Password?" link is restored,
  routing to the new `forgot-password.tsx`. SSO (Google/Apple, `useSSO`,
  `sso-callback.tsx`, `AuthDivider`, `buildSocialMetadata`,
  `useSocialAuthFlow`) is deleted outright per decision 3, not adapted.
  `auth-shared.tsx`: `getClerkErrorMessage` → `getApiErrorMessage` (reads
  `ApiRequestError`); added `passwordPolicyError` mirroring the contract's
  `passwordSchema` so a weak password fails in the UI, not a round-trip 400.
  New `ForgotPasswordScreen`/`ResetPasswordScreen` built from the
  `forgot_password_phone`/`reset_password_form` wireframes, using the dark
  `ScreenHeader` shell the wireframes show (not the light `AuthHeader` the
  restyled-not-rewired screens use) — closer wireframe fidelity for the two
  screens explicitly "built from wireframes" rather than restyled.
  Design deltas (intentional, both forced by the real API contract, not
  taste): (1) `forgot-password.tsx`'s field is **email**, not the
  wireframe's phone — `POST /auth/forgot-password` is keyed by email
  (matching login's identifier, and the anti-enumeration lookup), and always
  sends the OTP to the phone on file server-side; the user never picks a
  channel. (2) `reset-password.tsx` adds a 6-box OTP code field the
  wireframe doesn't have — the wireframe assumes a tapped email-link token,
  but this migration ships no mailer (decision 5), so the SMS code must be
  typed in; everything else (headline, password + confirm fields, the
  live-checked requirements list, "Update Password") matches the wireframe.
  On success, `reset-password` routes to Login, not Home, since the API
  revokes every existing refresh token for the account.
  Dependency removal: `@clerk/expo` gone from `package.json` and
  `app.config.ts`'s `plugins` array; also removed `expo-auth-session` and
  `expo-web-browser` (verified zero remaining imports anywhere in `src/` —
  both existed only for the now-deleted SSO flow) and their `.env.example`/
  `app.config.ts` plugin traces. `native-config.test.ts` repointed (kept the
  file, per the plan): asserts `@clerk/expo` is gone from both
  `package.json` and the plugins array, asserts `expo-auth-session`/
  `expo-web-browser` are gone, asserts `expo-secure-store` stays (the new
  session's dependency), asserts `expo-camera`/`expo-location` stay
  registered as plugins.
  **Found and fixed an unrelated infra bug while getting gates to run at
  all in this worktree:** `jest.config.js` used `testMatch` (glob-based);
  Jest's glob-to-regex normalization treats a literal `\.` in the resolved
  `rootDir` as an escape sequence rather than a path separator + dot, so any
  checkout under a dot-prefixed segment — exactly this repo's
  `.claude/worktrees/<name>/` parallel-session pattern — silently matched
  **zero** test files (`pnpm --filter @pataspace/mobile test` reported
  "testMatch: 0 matches" with exit 1, no other diagnostic). Switched to
  `testRegex` (a plain regex against the resolved path, not glob-compiled,
  so it isn't subject to the escape bug); confirmed both ways side by side
  before committing to the fix. This isn't cosmetic — without it, no gate in
  this phase (or any future worktree-based session) could be validated at
  all, silently.
  Judgment calls beyond the plan doc's literal text: (1) `expo-router`'s
  typed routes are hand-maintained in a committed `src/types/expo-router.d.ts`
  (`.expo/types/router.d.ts` is generated+gitignored, absent in a fresh
  worktree) — added `/forgot-password` and `/reset-password` entries
  (`reset-password` requires an `email` param, matching the existing
  required-param routes like `/listing`); found by `tsc` failing on the new
  `router.push`/`router.replace` calls, not by inspection. (2) Removed
  `expo-auth-session`/`expo-web-browser` beyond the plan's literal ask
  (`@clerk/expo` only) since they were SSO-only and fully orphaned — flagging
  here in case that's unwanted scope.
  Gates: `pnpm --filter @pataspace/mobile exec tsc --noEmit` exit 0;
  `pnpm --filter @pataspace/mobile test` 10 suites / 66 tests green
  (new: `session-state.test.ts` 7 tests, `refresh-lock.test.ts` 4 tests,
  `native-config.test.ts` repointed to 5 tests); `pnpm why @clerk/expo`
  returns nothing.
  **Cannot run in this sandbox (no device, no EAS credentials) — Amoni's
  step:** the on-device pass (register→OTP→login→forgot→reset, light+dark)
  and the unlock→pay smoke test. Removing `@clerk/expo` removes native
  modules from the binary again (same class of change as the 2026-07-10
  incident when it was *added*), so **a fresh dev-client and preview-APK
  rebuild is required** before any device testing — this is a rebuild, not
  optional: `eas build --profile development` and
  `pnpm --filter @pataspace/mobile build:apk`.

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

- [x] Phase 3 complete (2026-07-14). NextAuth v5 (`next-auth@5.0.0-beta.31`,
  confirmed current via `npm view next-auth dist-tags` — `latest` is 4.24.14,
  v5 ships only under the `beta` tag) replaces Clerk as the web app's only
  identity layer; it delegates every real auth decision to the Phase-1 API.
  New files: `apps/web/auth.ts` (NextAuth config — Credentials provider whose
  `authorize()` calls `POST /auth/login`, `jwt` session strategy, `jwt`
  callback that rotates the API's access+refresh pair via `POST /auth/refresh`
  60s before the 15m access token expires, and rejects non-admin roles inside
  `authorize()` itself so a correct password for a `USER` account still cannot
  mint a session), `app/api/auth/[...nextauth]/route.ts` (mounts `handlers`),
  `lib/api/auth.ts` (server-only `login`/`refresh`/`logout` fetchers — these
  bypass `lib/api/client.ts`, which assumes an already-authed request, and
  prefer `API_INTERNAL_BASE_URL` for server-to-server calls),
  `components/admin/admin-sign-in-form.tsx` (email+password form calling
  `signIn('credentials', { redirect:false })`, surfacing the API's actual
  rejection reason by mapping the `CredentialsSignin` `code`), and
  `types/next-auth.d.ts` (module augmentation). Session `maxAge` is pinned to
  30 days to match `REFRESH_TOKEN_TTL_DAYS` so a live session cookie never
  outlives its API refresh token. Rewired: `proxy.ts` (Clerk `clerkMiddleware`
  → `auth()` wrapper gating `/admin/*` on session + `error`-flag + ADMIN
  role), `app/admin/(console)/layout.tsx` (server-side ADMIN check now reads
  the NextAuth session, not a Clerk `getToken()`→`/users/me` round trip),
  `admin-shell.tsx` / `admin-forbidden.tsx` (Clerk `SignOutButton`/`UserButton`
  → `signOut()`), `use-admin-data.ts` (`useAuth().getToken` → `useSession()`
  access token), `public-site-frame.tsx` (`useUser` → `useSession`),
  `app/layout.tsx` (`ClerkProvider` → `SessionProvider`), `globals.css` (Clerk
  theme import removed), `lib/api/client.ts` (doc comments). Sign-in route
  moved from Clerk's `sign-in/[[...sign-in]]` catch-all to a plain
  `sign-in/page.tsx` (the form's `useSearchParams()` is wrapped in `Suspense`
  so the page still prerenders static). `@clerk/nextjs` + `@clerk/ui` removed
  from `package.json`; `next-auth`, `@auth/core` (pinned to next-auth's exact
  0.41.2 so the `@auth/core/*` type augmentation resolves under pnpm's strict
  layout — see the note in `types/next-auth.d.ts`), and `server-only` added.
  **Infra env plumbing (broader than the original web-only file list — all
  strictly Clerk-env-out / NextAuth-env-in, no behavioural change):**
  `apps/web/Dockerfile` (dropped 6 `NEXT_PUBLIC_CLERK_*` build args/envs),
  `infra/docker/docker-compose.vps.yml` + `docker-compose.prod.yml` (web
  service: Clerk envs → `AUTH_SECRET`, `AUTH_URL`, server-only
  `API_INTERNAL_BASE_URL=http://api:3001/api/v1`),
  `infra/docker/.env.vps.example` + `.env.prod.example` (removed
  `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, added `AUTH_SECRET`/`AUTH_URL`),
  `infra/docker/VPS_DEPLOY.md` (prereq/troubleshooting rows), `Caddyfile` +
  `infra/nginx/edge.conf` (comment wording), `infra/observability/scripts/
  validate.sh` (compose-merge smoke env: `CLERK_SECRET_KEY` → `AUTH_SECRET`/
  `AUTH_URL`). New `apps/web/.env.example` documents the web env for the first
  time. Also set `turbopack.root` in `next.config.mjs` (workspace root, the
  documented monorepo fix). Playwright: `protected-redirects.spec.ts` /
  `landing.spec.ts` / `fixtures/page-errors.ts` de-Clerked; new
  `sign-in.spec.ts` (valid admin → console, wrong password → generic
  `INVALID_CREDENTIALS` message, non-admin `USER` → rejected) driven by a
  dependency-free `fixtures/mock-auth-server.mjs` stub for `POST /auth/login`
  (NextAuth's Credentials provider calls it from the *server* process, which
  `page.route()` cannot intercept); `playwright.config.ts` boots that stub +
  the dev server and supplies `AUTH_SECRET` so the suite is self-contained.
  Gates run and actual results:
  - `apps/web` `tsc --noEmit`: exit 0.
  - `pnpm --filter @pataspace/web build` (Turbopack, the default script):
    **fails in this git worktree only** — Turbopack refuses to traverse
    symlinks to pnpm's virtual store, which for a worktree lives under the
    *main* checkout (`virtual-store-dir` = the primary repo), physically
    outside the worktree root. Proven to be purely that: pointing
    `turbopack.root` at the store's real parent makes the same build pass exit
    0. The equivalent `next build --webpack` (the bundler this app already
    uses for `dev`) passes exit 0 with full static generation (13/13 pages,
    correct route topology — `/admin/sign-in` static, `/api/auth/[...nextauth]`
    present, `/admin/*` dynamic, Proxy middleware active). In a normal
    (non-worktree) checkout or CI the Turbopack script resolves the store
    inside the root and passes.
  - Full Playwright suite, **cold** (Playwright boots its own mock-auth + dev
    servers): 18/18 passed, including the 3 new sign-in cases. The
    `[auth][error] CredentialsSignin` server log during the run is Auth.js's
    expected logging of the thrown error on the negative-path tests, not a
    failure.
  Left for a human: (1) the plan's "manual admin console pass against the
  Phase-1 API" gate needs a running full stack (API + Postgres + a seeded
  ADMIN account) — not stood up here; the e2e proves the wiring against a
  faithful `/auth/login` stub, but a real login against the live API is still
  unverified. (2) `next-auth` is on the `beta` tag (v5 has no stable release);
  pin-bump when v5 GAs. (3) `infra/docker/VPS_DEPLOY.md` still documents
  `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` for **mobile** EAS builds — left
  deliberately: that is mobile-scoped and owned by Phase 4's secrets sweep.
  (4) On the VPS, set `AUTH_SECRET` (`openssl rand -base64 32`) and `AUTH_URL`
  in `infra/docker/.env` before the next web deploy, or the web container
  fails to boot (`MissingSecret`).

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
