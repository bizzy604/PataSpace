<!--
Purpose: End-to-end runbook for shipping apps/mobile to the Apple App Store and
  Google Play via EAS Build + EAS Submit.
Why important: Store releases depend on external accounts, credentials, and
  compliance steps that are not visible in code; this is the single source of
  truth for getting a build approved and live.
Used by: whoever cuts a mobile release; pairs with eas.json and app.config.ts.
-->

# PataSpace Mobile — Store Release Runbook

Pipeline: **EAS Build** produces signed binaries in the cloud, **EAS Submit**
uploads them to App Store Connect and Google Play. Config lives in
[eas.json](eas.json) and [app.config.ts](app.config.ts).

## Gating dependencies (must be true before submitting)

1. **Public production API.** `EXPO_PUBLIC_API_BASE_URL` must be a public
   **HTTPS** URL. Reviewers run the app on their own network — a LAN/localhost
   API is an automatic rejection. ([api-client.ts](src/lib/api-client.ts))
2. **Production Clerk instance.** Use a `pk_live_…` publishable key, not
   `pk_test_…`. ([_layout.tsx](src/app/_layout.tsx))
3. **In-app account deletion.** Required by Apple 5.1.1(v) and Google. See the
   account-deletion flow in Settings.
4. **Payments position.** Buying credits to unlock listings uses M-Pesa. Apple
   3.1.1 demands In-App Purchase for *digital* goods; 3.1.3(e) permits external
   payment for **real-world services**. Be ready to justify the real-world-service
   classification in App Review notes — this is the top iOS rejection risk.

## One-time account setup (external)

| Store | Account | Notes |
| --- | --- | --- |
| Apple | Apple Developer Program ($99/yr) | Need the **Team ID** and an **App Store Connect API key** (`.p8` + key id + issuer id) for EAS Submit. |
| Google | Google Play Console ($25 once) | Need a Google Cloud **service-account JSON** with Play access. New personal accounts must run **closed testing with 12 testers for 14 days** before production unlocks. |

Then create the app records (bundle/package **`com.pataspace.mobile`**, name
**PataSpace**) in App Store Connect and Play Console, and fill in
[eas.json](eas.json) `submit.production` (`ascAppId`, `appleTeamId`, and place the
Play JSON at `apps/mobile/credentials/play-service-account.json` — gitignored).

## EAS environment variables (per environment)

EAS does **not** read your local `.env` for cloud builds. Create the variables in
each environment (`development`, `preview`, `production`) once:

```bash
cd apps/mobile
eas env:create --environment production --name EXPO_PUBLIC_API_BASE_URL --value "https://api.<domain>/api/v1" --visibility plaintext
eas env:create --environment production --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --value "pk_live_…" --visibility plaintext
eas env:create --environment production --name GOOGLE_MAPS_API_KEY --value "<android-maps-key>" --visibility sensitive
```

The build profiles in [eas.json](eas.json) load these via their `environment` field.

## Build → test → submit

```bash
cd apps/mobile

# 1. Authenticate (stores managed credentials in your Expo account).
eas login

# 2. Production builds (.aab for Play, .ipa for App Store).
eas build --profile production --platform android
eas build --profile production --platform ios     # prompts to create iOS credentials

# 3. Submit. Android first goes to the `internal` track as a draft (see eas.json).
eas submit --profile production --platform android --latest
eas submit --profile production --platform ios --latest
```

Promote internal → closed → production from the store consoles after testing.

## Version bumps (required before every store upload)

`appVersionSource` is `local`, so increment manually in [app.config.ts](app.config.ts):

- iOS: bump `ios.buildNumber` (and `version` for user-facing releases).
- Android: bump `android.versionCode` (and `version`).

## Store listing checklist (content you supply)

- Screenshots (iPhone 6.7", Android phone), Play **feature graphic** (1024×500).
- App name, subtitle/short description, full description, keywords, category.
- **Privacy policy URL** (required by both stores) and support URL.
- Apple **privacy nutrition label** + Google **Data safety** form — declare
  location, photos, account, and payment data (the app collects all four).
- Content/age rating questionnaire; export-compliance is pre-answered
  (`ITSAppUsesNonExemptEncryption: false` in app.config.ts).

## CI (GitHub Actions)

`.github/workflows/mobile-eas.yml` runs builds/submits from CI:

- **Manual:** Actions → "Mobile EAS Build" → Run workflow, choosing platform,
  profile, and whether to auto-submit.
- **Tagged release:** push a `mobile-v*` tag (e.g. `mobile-v1.0.0`) → production
  build for both platforms + auto-submit.

Add one repo secret, **`EXPO_TOKEN`** (Settings → Secrets → Actions), an Expo
access token from <https://expo.dev/accounts/[account]/settings/access-tokens>.
Everything else (signing credentials, `EXPO_PUBLIC_*`) is resolved by EAS, not CI.

> The **first** store submission should still be done manually (you must create
> the App Store Connect / Play Console app records, complete listings, and clear
> Google's 12-tester / 14-day closed-testing gate before production opens).

## Common pitfalls

- Missing `EXPO_PUBLIC_*` in the EAS environment → blank API base / Clerk crash on
  launch (the app `throw`s if the publishable key is absent).
- Adaptive-icon foreground needs safe-zone padding or Android crops the logo.
- Forgetting to bump `buildNumber`/`versionCode` → store rejects the duplicate.
