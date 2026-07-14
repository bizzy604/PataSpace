/**
 * Purpose: Gate-test the native-module contract between package.json and
 *   app.config.ts.
 * Why important: Native-module Expo packages that ship a config plugin
 *   (expo-camera, expo-location, ...) need a matching entry in app.config.ts's
 *   plugins array, or prebuild silently skips their Gradle/Xcode setup and the
 *   feature breaks at runtime with no build-time signal. This file used to
 *   guard @clerk/expo specifically — a third-party native SDK that required
 *   an exact version pin kept in sync with the installed binary (see
 *   2026-07-10's "Cannot find native module 'ClerkExpo'" incident, caused by
 *   a JS-only version bump with no native rebuild). Clerk is fully removed as
 *   of Docs/14_Clerk_Removal_Email_Password_Auth_Plan.md Phase 2, so this now
 *   guards: (1) Clerk staying gone, (2) the camera/location plugins that are
 *   still real native-module registrations, and (3) expo-secure-store, which
 *   the new SecureStore-backed auth session (features/auth/auth-provider.tsx)
 *   depends on to persist the refresh token across app restarts — losing that
 *   dependency would silently break session persistence, not throw.
 * Used by: `pnpm --filter @pataspace/mobile test`.
 */
import * as path from 'path';

const mobileRoot = path.resolve(__dirname, '../../..');

function readAppConfigSource(): string {
  // app.config.ts imports 'expo/config' types only; require the transpiled
  // default via ts-jest by reading the source and checking the plugin entry.
  const fs = require('fs') as typeof import('fs');
  return fs.readFileSync(path.join(mobileRoot, 'app.config.ts'), 'utf8');
}

function readPluginsBlock(source: string): string {
  return /plugins:\s*\[([\s\S]*?)\n {2}\]/.exec(source)?.[1] ?? '';
}

describe('native module config', () => {
  it('has no @clerk/expo dependency left', () => {
    const pkg = require(path.join(mobileRoot, 'package.json'));
    expect(pkg.dependencies['@clerk/expo']).toBeUndefined();
  });

  it('no longer registers the @clerk/expo config plugin', () => {
    expect(readAppConfigSource()).not.toContain("'@clerk/expo'");
  });

  it('has no orphaned expo-auth-session / expo-web-browser deps (SSO-only, Clerk removed)', () => {
    const pkg = require(path.join(mobileRoot, 'package.json'));
    expect(pkg.dependencies['expo-auth-session']).toBeUndefined();
    expect(pkg.dependencies['expo-web-browser']).toBeUndefined();
  });

  it('depends on expo-secure-store for the auth session refresh token', () => {
    const pkg = require(path.join(mobileRoot, 'package.json'));
    expect(pkg.dependencies['expo-secure-store']).toBeDefined();
  });

  it('registers the expo-camera and expo-location config plugins app.config.ts configures native permissions for', () => {
    const pluginsBlock = readPluginsBlock(readAppConfigSource());
    expect(pluginsBlock).toContain("'expo-camera'");
    expect(pluginsBlock).toContain("'expo-location'");
  });
});
