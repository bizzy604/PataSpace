/**
 * Purpose: Gate-test the native-module contract between package.json and
 *   app.config.ts.
 * Why important: @clerk/expo >=3.6 ships compiled native modules. If its JS
 *   version floats ahead of the installed app binary, every screen importing
 *   Clerk throws "Cannot find native module 'ClerkExpo'" at runtime and
 *   expo-router logs bogus "missing default export" warnings for the routes
 *   in the import chain. This happened on 2026-07-10 after a dependency bump
 *   (3.1.10 -> 3.7.3) without a native rebuild.
 * Used by: `pnpm --filter @pataspace/mobile test`.
 */
import * as path from 'path';

const mobileRoot = path.resolve(__dirname, '../../..');

describe('native module config', () => {
  it('pins @clerk/expo to an exact version (native code must match the binary)', () => {
    const pkg = require(path.join(mobileRoot, 'package.json'));
    const spec: string = pkg.dependencies['@clerk/expo'];
    expect(spec).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('registers the @clerk/expo config plugin so prebuild applies its Gradle/Xcode mods', () => {
    // app.config.ts imports 'expo/config' types only; require the transpiled
    // default via ts-jest by reading the source and checking the plugin entry.
    const fs = require('fs') as typeof import('fs');
    const source = fs.readFileSync(path.join(mobileRoot, 'app.config.ts'), 'utf8');
    const pluginsBlock = /plugins:\s*\[([\s\S]*?)\n {2}\]/.exec(source)?.[1] ?? '';
    expect(pluginsBlock).toContain("'@clerk/expo'");
  });

  it('keeps installed @clerk/expo in sync with the pinned version', () => {
    const pkg = require(path.join(mobileRoot, 'package.json'));
    const installed = require('@clerk/expo/package.json').version;
    expect(installed).toBe(pkg.dependencies['@clerk/expo']);
  });
});
