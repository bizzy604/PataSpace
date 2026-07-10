# Mobile App

## Purpose

`apps/mobile` is the Expo and React Native client for listing creation, browsing, unlock flows, confirmations, and tenant actions.

## Stack

- Expo
- Expo Router
- React Native
- NativeWind

## Design system (2026 redesign)

The rebuild follows `Docs/12_Mobile_Redesign_Plan.md` and is complete: Phase 0
laid the foundation, Phases 1-6 rebuilt every designed surface (auth, browse,
payments, post-a-listing, connections/profile, engagement/support), and Phase 7
swept dead code and shipped. Restyle-only throughout: screens keep their route
files and API/business logic.

**Token pipeline (three files, kept in sync).** Change a colour in all three:

- `global.css` — light + dark CSS variable blocks (`--primary`, `--surface-*`,
  `--outline`, status colours). This is the runtime source of truth; the `.dark`
  block is a derived palette (the designs are light-only).
- `tailwind.config.js` — maps each `--token` to a Tailwind colour via
  `rgb(var(--token) / <alpha-value>)`, plus the DESIGN.md typography scale
  (`text-headline-sm`, `text-body-md`, …) and font families.
- `src/lib/theme.ts` — the imperative palette for non-className consumers
  (status bar, maps, `placeholderTextColor`).

Primary teal is `#00667e`; `#28809a` is the pressed/container tone
(`primary-container`). Radii: inputs/media 12px, cards/buttons 16px, chips
full-pill. Status colours (`success`/`warning`/`danger`) render their icons
with the shared hex constants where cva tints are not available.

**Fonts.** Poppins (600/700) and DM Sans (400/500/700) load in
`src/app/_layout.tsx` via `useFonts`. On React Native each weight is its own
family, so use the family utility, not a `font-*weight*` class:
`font-display` (Poppins Bold), `font-display-semibold`, `font-body`,
`font-body-medium`, `font-body-bold`.

**Component kit (`src/components/ui/`).** Compose screens from these; do not
hand-roll styled views. Variant maps live in `variants/*.ts` as pure cva
functions so they are unit-tested in the node lane.

- Actions: `button` (variants default/secondary/outline/dark/danger/ghost;
  shapes rounded/pill; sizes sm/default/lg), `chip` (full-pill filter)
- Surfaces: `card`, `list-row` (settings/profile rows), `badge` (status pills)
- Inputs: `input` (filled, optional label, teal focus border)
- Overlay: `dialog` (centered confirm; optional `icon` and `tone`
  primary/danger — used by insufficient-credits, logout, delete, report-success)
- Chrome: `screen` (scroll body with `header` + `bottomBar` slots and optional
  `withTabBar`), `screen-header` (dark flow bar with back + one action),
  `section-header`, `bottom-nav`, `app-icon`, `motion-view`
- Flow: `progress-steps` (post-a-listing header)

Screens present as full routes styled to match the mockups' sheets; there is no
modal bottom-sheet primitive.

## Local Commands

```bash
pnpm --filter @pataspace/mobile start
pnpm --filter @pataspace/mobile android
pnpm --filter @pataspace/mobile ios
pnpm --filter @pataspace/mobile web
pnpm --filter @pataspace/mobile test
pnpm --filter @pataspace/mobile build:apk
pnpm --filter @pataspace/mobile build:ios
```

## Tests

`jest.config.js` runs gate tests for pure logic under `src/**/__tests__/`
(no native modules, no jest-expo). Current coverage:

- `src/lib/capture-location.ts` — GPS freshness, anti-fraud (mocked/weak fix),
  and address-label rules used by the listing capture screen.
- `src/lib/listing-rules.ts` — the client-side photo-count contract.
- `src/lib/listings/amenities-field.ts` — toggling preset amenities over the
  comma-separated draft string.
- `src/lib/payments/*` — unlock summary (balance/percent), transaction view
  (filter/group/sign), and top-up status (the M-Pesa balance-poll completion
  rule).
- `src/lib/notifications/notification-view.ts` — notification category, chip
  filter, and Today/Earlier day bucketing.
- `src/components/ui/variants/*.ts` — the primitive cva variant maps
  (button/badge/chip), asserting each variant resolves to the intended token.

Add new pure-logic tests next to the module in an `__tests__` directory. UI
components stay presentation-only and are verified on-device in the Expo pass;
put testable branching in a pure `.ts` (e.g. a `variants/` cva map) so it lands
in this lane.

## APK Build

- `apps/mobile/eas.json` includes a `preview` profile that produces an installable Android `.apk`.
- The app config now uses `apps/mobile/app.config.ts` with the Android package id `com.pataspace.mobile`.
- Put your Android Maps key in `apps/mobile/.env` as `GOOGLE_MAPS_API_KEY=...` so `app.config.ts` can inject it into the standalone build config.
- `apps/mobile/.env.example` shows the expected shape without storing the real key in source.

```bash
cd apps/mobile
pnpm build:apk
```

If `npx eas-cli` fails on Windows with a temp-cache module error, use the packaged script above or run:

```bash
pnpm dlx eas-cli build --platform android --profile preview
```

For EAS cloud builds, also create the same `GOOGLE_MAPS_API_KEY` variable in the EAS project environment. Expo documents that EAS CLI does not use your local `.env` file for remote app-config resolution:
https://docs.expo.dev/eas/environment-variables/

## iOS Build

- `app.config.ts` now includes the iOS bundle identifier `com.pataspace.mobile`.
- Use the same `preview` EAS profile to create an internal iOS build.
- For a real iPhone install, Apple requires a paid Apple Developer account and device registration for ad hoc/internal distribution.

```bash
cd apps/mobile
pnpm build:ios
```

If you want to install the build on a physical iPhone, register the device first:

```bash
pnpm dlx eas-cli device:create
```

## Store Release (App Store & Google Play)

Production submission to the Apple App Store and Google Play is documented
end-to-end in [STORE_RELEASE.md](STORE_RELEASE.md): account setup, EAS environment
variables, build/submit commands, version bumps, and the compliance checklist.

`eas.json` profiles:

- `development` — dev-client internal build, `development` EAS environment.
- `preview` — installable internal `.apk`, `preview` EAS environment.
- `production` — store binaries (`.aab` / `.ipa`), `production` EAS environment,
  wired to `submit.production` for `eas submit`.

## Current Source Layout

- `src/app`: Expo Router routes (entry is `expo-router/entry` per package.json)
- `src/screens`: screen-level components
- `src/components`: reusable UI
- `src/features`: feature-specific logic (e.g. `features/account` — the
  store-required account-deletion flow, reachable from Settings → Danger zone)
- `src/lib`: utilities
- `src/types/expo-router.d.ts`: hand-maintained typed-routes list — **add new
  `src/app` routes here** or `<Link href>` to them will fail to type-check

## Dependencies

- API contracts and workflows defined by `apps/api`
- Shared visual direction from `packages/design-tokens`

## Development Rules

- Keep route files focused on navigation and screen composition.
- Place business and API interaction logic in feature-level modules instead of route files.
- Keep mobile-specific constraints aligned with the backend listing and unlock workflows.

## Money flow note (M-Pesa)

Buying credits triggers a real STK push via `POST /credits/purchase`. The
processing screen does **not** self-attest success: it captures the wallet
balance before the push and polls `GET /credits/balance` every few seconds
(`src/lib/payments/top-up-status.ts`), advancing to the success screen only once
the balance rises — i.e. after the server's `mpesa-callback` webhook credits the
wallet. No new endpoint was needed.

## Post-redesign backlog (backend / wiring)

Deferred from the restyle phases; none block the current behaviour:

- Photo/ID/evidence upload (avatar, report evidence): add `expo-image-picker`,
  reuse the existing S3 path in `src/lib/api/uploads.ts`.
- Phone/profile-visibility privacy settings (needs a settings field +
  server-side contact masking).
- Richer transaction receipt (balance before/after, payment method, property
  ref on the transaction DTO); listing bathrooms/furnished as structured
  fields; support ticket tracking; anonymous-review flag; referral reward from
  server config. Each is a contract + backend change.
- Device niceties: biometric login (`expo-local-authentication`), Auto/system
  theme (Appearance API), i18n language/currency.
