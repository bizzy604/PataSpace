/**
 * Gate test: auth-screen layout stays responsive.
 *
 * Regression guard for the 2026-07-16 fix where the onboarding hero was a
 * fixed portrait frame (aspect-[3/4] at full width ≈ 437dp tall on a 360dp
 * phone) that pushed the title/description/dots off short screens and
 * cropped the landscape source photos. Same style as native-config.test.ts:
 * the jest lane here is node-only (no react-native transform), so these are
 * source contracts, not render tests.
 */
import * as fs from 'fs';
import * as path from 'path';

const authDir = path.resolve(__dirname, '..');
const read = (file: string) => fs.readFileSync(path.join(authDir, file), 'utf8');

describe('onboarding hero', () => {
  const source = read('OnboardingScreen.tsx');

  it('does not pin the hero to a fixed aspect ratio', () => {
    expect(source).not.toContain('aspect-[');
  });

  it('flexes with the screen and keeps a minimum height', () => {
    expect(source).toContain('min-h-[200px] flex-1 overflow-hidden');
    expect(source).toMatch(/Image[^>]*className="h-full w-full"[^>]*resizeMode="cover"/s);
  });

  it('references slide images that exist on disk', () => {
    const assetPaths = [...source.matchAll(/require\('([^']+)'\)/g)].map((m) => m[1]);
    expect(assetPaths.length).toBeGreaterThan(0);
    for (const assetPath of assetPaths) {
      expect(fs.existsSync(path.resolve(authDir, assetPath))).toBe(true);
    }
  });
});

describe('otp input boxes', () => {
  const source = read('fields.tsx');

  it('shrink on narrow screens instead of using a fixed width', () => {
    expect(source).toContain('max-w-[48px] flex-1');
    expect(source).not.toMatch(/['" ]w-12['" ]/);
  });
});

describe('auth screen shell', () => {
  const source = read('auth-shared.tsx');

  it('caps content and footer width for wide screens', () => {
    expect(source).toContain('w-full max-w-[480px] flex-1 self-center');
    expect(source).toContain('w-full max-w-[512px] self-center');
  });
});
