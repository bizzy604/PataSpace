# Mobile App

## Purpose

`apps/mobile` is the Expo and React Native client for listing creation, browsing, unlock flows, confirmations, and tenant actions.

## Stack

- Expo
- Expo Router
- React Native
- NativeWind

## Design system (2026 redesign)

The rebuild follows `Docs/12_Mobile_Redesign_Plan.md`. Phase 0 laid the
foundation; screens adopt it phase by phase.

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
(`primary-container`). Radii: inputs/media 12px, cards/buttons 16px, sheets
24px, chips full-pill.

**Fonts.** Poppins (600/700) and DM Sans (400/500/700) load in
`src/app/_layout.tsx` via `useFonts`. On React Native each weight is its own
family, so use the family utility, not a `font-*weight*` class:
`font-display` (Poppins Bold), `font-display-semibold`, `font-body`,
`font-body-medium`, `font-body-bold`.

**Component kit (`src/components/ui/`).** Compose screens from these; do not
hand-roll styled views. Variant maps live in `variants/*.ts` as pure cva
functions so they are unit-tested in the node lane.

- Actions: `button` (variants default/secondary/outline/dark/danger; shapes
  rounded/pill; sizes sm/default/lg), `icon-button`, `fab`, `chip`
- Surfaces: `card`, `list-row`, `badge` (adds status pills), `bottom-nav`
- Inputs: `input` (filled, optional label, teal focus border)
- Overlays: `bottom-sheet` (Layer 3), `dialog` (centered confirm)
- Flow: `progress-steps` (post-a-listing header)

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
- `src/components/ui/variants/*.ts` — the primitive cva variant maps
  (button/badge/chip/icon-button), asserting each variant resolves to the
  intended design token.

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

## Current Gaps

- The app includes the intended navigation surface but still needs deeper backend integration and fuller feature modularization.
