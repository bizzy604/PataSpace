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
