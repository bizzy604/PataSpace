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
```

## APK Build

- `apps/mobile/eas.json` includes a `preview` profile that produces an installable Android `.apk`.
- The app config now uses `apps/mobile/app.config.ts` with the Android package id `com.pataspace.mobile`.
- For standalone Android maps, set `GOOGLE_MAPS_API_KEY` before building so `react-native-maps` can render in the APK.

```bash
cd apps/mobile
set GOOGLE_MAPS_API_KEY=your_google_maps_android_key
pnpm build:apk
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
