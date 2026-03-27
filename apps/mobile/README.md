# Mobile App

## Purpose

`apps/mobile` is the Expo and React Native client for listing creation, browsing, unlock flows, confirmations, and tenant actions.

## Stack

- Expo
- Expo Router
- React Native
- NativeWind

## Local Commands

```bash
pnpm --filter @pataspace/mobile start
pnpm --filter @pataspace/mobile android
pnpm --filter @pataspace/mobile ios
pnpm --filter @pataspace/mobile web
pnpm --filter @pataspace/mobile build:apk
pnpm --filter @pataspace/mobile build:ios
```

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

## Current Source Layout

- `src/app`: Expo Router routes
- `src/screens`: screen-level components
- `src/components`: reusable UI
- `src/features`: feature-specific logic
- `src/navigation`: navigation composition
- `src/lib`: utilities

## Dependencies

- API contracts and workflows defined by `apps/api`
- Shared visual direction from `packages/design-tokens`

## Development Rules

- Keep route files focused on navigation and screen composition.
- Place business and API interaction logic in feature-level modules instead of route files.
- Keep mobile-specific constraints aligned with the backend listing and unlock workflows.

## Current Gaps

- The app includes the intended navigation surface but still needs deeper backend integration and fuller feature modularization.
