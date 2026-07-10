/**
 * Purpose: Gate-test that global.css is valid CSS and stays in sync with
 *   tailwind.config.js.
 * Why important: NativeWind compiles global.css through Tailwind as the last
 *   Metro module. If that compile throws (e.g. a stray star-slash inside a
 *   block comment leaks text into the parser), Metro hangs forever at 99.9%
 *   with no error — dev bundles, Expo Go, and EAS builds all silently stall.
 *   This happened on 2026-07-06 (glob path in a comment) and cost days.
 * Used by: `pnpm --filter @pataspace/mobile test`.
 */
import * as fs from 'fs';
import * as path from 'path';

const mobileRoot = path.resolve(__dirname, '../../..');
const cssPath = path.join(mobileRoot, 'global.css');

// pnpm isolates transitive deps, so resolve postcss through tailwindcss
// (which always ships with one) instead of assuming it is hoisted.
function loadPostcss(): { parse: (css: string, opts?: object) => unknown } {
  try {
    return require('postcss');
  } catch {
    const tailwindDir = path.dirname(require.resolve('tailwindcss/package.json'));
    return require(require.resolve('postcss', { paths: [tailwindDir] }));
  }
}

describe('global.css', () => {
  const css = fs.readFileSync(cssPath, 'utf8');

  it('parses as valid CSS (a parse error hangs Metro at 99.9%)', () => {
    const postcss = loadPostcss();
    expect(() => postcss.parse(css, { from: cssPath })).not.toThrow();
  });

  it('has no premature comment terminator (star-slash inside comment text)', () => {
    // Walk comments manually: inside /* ... */ the first */ ends the comment,
    // so text like a **/ glob truncates it and leaks garbage into the parser.
    const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(withoutComments).not.toMatch(/\*\//);
    expect(withoutComments).not.toMatch(/\/\*/);
  });

  it('defines every CSS variable tailwind.config.js references, in light and dark', () => {
    const twConfig = require(path.join(mobileRoot, 'tailwind.config.js'));
    const colorDefs: string[] = Object.values(
      twConfig.theme.extend.colors as Record<string, string>,
    );
    const referenced = colorDefs
      .map((v) => /var\((--[a-z0-9-]+)\)/.exec(v)?.[1])
      .filter((v): v is string => Boolean(v));
    expect(referenced.length).toBeGreaterThan(0);

    const lightBlock = /:root\s*\{([\s\S]*?)\}/.exec(css)?.[1] ?? '';
    const darkBlock = /\.dark:root\s*\{([\s\S]*?)\}/.exec(css)?.[1] ?? '';
    for (const varName of referenced) {
      expect(lightBlock).toContain(`${varName}:`);
      expect(darkBlock).toContain(`${varName}:`);
    }
  });
});
