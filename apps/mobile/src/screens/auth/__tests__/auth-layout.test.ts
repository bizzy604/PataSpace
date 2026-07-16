/**
 * Gate test: auth-screen layout stays responsive and logo-only.
 *
 * Regression guards for two 2026-07-16 fixes:
 * 1. The onboarding hero was a fixed portrait photo frame (aspect-[3/4] at
 *    full width ≈ 437dp tall on a 360dp phone) that pushed the title,
 *    description, and dots off short screens. Auth screens are logo-only now.
 * 2. Image dimensions came from className (h-16 w-16); css-interop drops
 *    class sizing on Image on web, so the 1024px logo rendered at natural
 *    size and buried the screen. Every auth Image must size via the style
 *    prop instead.
 *
 * Same style as native-config.test.ts: the jest lane here is node-only (no
 * react-native transform), so these are source contracts, not render tests.
 */
import * as fs from 'fs';
import * as path from 'path';

const authDir = path.resolve(__dirname, '..');
const read = (file: string) => fs.readFileSync(path.join(authDir, file), 'utf8');

const screensWithLogo = ['WelcomeScreen.tsx', 'OnboardingScreen.tsx', 'LoginScreen.tsx'];

describe.each(screensWithLogo)('%s images', (file) => {
  const source = read(file);

  it('uses only the logo asset, no photos', () => {
    expect(source).toContain('PataSpace Logo.png');
    expect(source).not.toMatch(/photo\d+\.(jpg|jpeg|png)/);
  });

  it('sizes every Image via the style prop, never className', () => {
    const imageTags = source.match(/<Image[^>]*\/>/gs) ?? [];
    expect(imageTags.length).toBeGreaterThan(0);
    for (const tag of imageTags) {
      expect(tag).toMatch(/style=\{\{ height: \d+, width: \d+ \}\}/);
      expect(tag).not.toContain('className');
    }
  });

  it('references assets that exist on disk', () => {
    for (const [, assetPath] of source.matchAll(/require\('(\.[^']+)'\)/g)) {
      expect(fs.existsSync(path.resolve(authDir, assetPath))).toBe(true);
    }
  });
});

describe('onboarding hero', () => {
  const source = read('OnboardingScreen.tsx');

  it('flexes with the screen instead of a fixed aspect ratio', () => {
    expect(source).not.toContain('aspect-[');
    expect(source).toContain('min-h-[200px] flex-1');
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
