/**
 * Purpose: Gate test that every form shell scrolls the focused field clear of
 * the keyboard — that Screen and AuthScreen use KeyboardAwareScrollView rather
 * than a bare ScrollView, and that no screen reintroduces its own unmanaged one.
 * Why important: the failure is a text field hidden under the keyboard, so the
 * user types blind (reported on the M-Pesa phone number in Buy Credits). It
 * only shows on a device with a keyboard raised, which no test in this lane can
 * do: the mobile jest lane transforms `.ts` only and has no renderer. Reading
 * the source is the available deterministic check, same as
 * listing-taken-unlock-guard.test.ts. The scroll arithmetic itself is tested in
 * lib/keyboard/__tests__/scroll-into-view.test.ts.
 * Used by: `pnpm --filter @pataspace/mobile test`.
 */
import * as fs from 'fs';
import * as path from 'path';
import { stripComments } from '../jsx-nesting';

const srcDir = path.resolve(__dirname, '../..');
const read = (relativePath: string) =>
  stripComments(fs.readFileSync(path.join(srcDir, relativePath), 'utf8'));

const screenSource = read('components/ui/screen.tsx');
const authSharedSource = read('screens/auth/auth-shared.tsx');
const scrollSource = read('components/ui/keyboard-aware-scroll.tsx');

describe('Screen shell', () => {
  it('scrolls its body with the keyboard-aware scroll view', () => {
    expect(screenSource).toContain('<KeyboardAwareScrollView');
  });

  it('does not fall back to a plain ScrollView', () => {
    expect(screenSource).not.toContain('<ScrollView');
  });

  /**
   * The bottom bar and tab bar render as siblings below the scroll view, so the
   * viewport it measures already ends above them. A manual inset would
   * double-count and over-scroll every field by ~80-160pt.
   */
  it('passes no manual bottom inset', () => {
    expect(screenSource).not.toContain('bottomInset');
  });
});

describe('AuthScreen shell', () => {
  it('scrolls its body with the keyboard-aware scroll view', () => {
    expect(authSharedSource).toContain('<KeyboardAwareScrollView');
  });

  /**
   * KeyboardAvoidingView shrank the whole layout on iOS and did nothing on
   * Android. Nesting it around the aware scroll view would fight it: two
   * mechanisms adjusting for the same keyboard.
   */
  it('no longer nests a KeyboardAvoidingView', () => {
    expect(authSharedSource).not.toContain('KeyboardAvoidingView');
  });

  it('does not fall back to a plain ScrollView', () => {
    expect(authSharedSource).not.toContain('<ScrollView');
  });
});

describe('KeyboardAwareScrollView', () => {
  it('keeps taps working while the keyboard is up', () => {
    // Without this the first tap on a button is swallowed to dismiss the
    // keyboard, so submitting a form takes two taps.
    expect(scrollSource).toContain('keyboardShouldPersistTaps="handled"');
  });

  it('catches focus at the container rather than per field', () => {
    // Focus bubbles, so one handler covers every nested field. This is what
    // lets a screen add an Input with no keyboard code of its own.
    expect(scrollSource).toContain('onFocus={');
    expect(scrollSource).toContain('TextInput.State.currentlyFocusedInput()');
  });

  it('measures in window coordinates, not against the scroll content', () => {
    // measureLayout coordinates drift once Android resizes the window for the
    // keyboard; window coordinates stay correct on both platforms.
    expect(scrollSource).toContain('measureInWindow');
    expect(scrollSource).not.toContain('measureLayout');
  });

  it('reads the keyboard height from the IME inset, not RN Keyboard events', () => {
    // Under edge-to-edge (android/gradle.properties edgeToEdgeEnabled=true)
    // Android stops honouring adjustResize, and ReactRootView then reports
    // endCoordinates.screenY as the bottom of the visible area rather than the
    // keyboard's top edge. Every overlap computed to 0 and nothing scrolled.
    // Reanimated reads the real IME inset instead.
    expect(scrollSource).toContain('useAnimatedKeyboard()');
    expect(scrollSource).not.toContain('Keyboard.addListener');
  });

  it('re-reveals the field when the keyboard geometry changes', () => {
    // Switching from a text to a numeric pad changes the keyboard height with
    // no new focus event, and RN emits no event at all when only the height
    // moves. The inset updates on every frame, so reacting to the height covers
    // both cases.
    expect(scrollSource).toContain('reveal(focusedRef.current, keyboardHeight)');
    expect(scrollSource).toContain('}, [keyboardHeight, reveal]);');
  });

  it('pads the scroll tail on both platforms', () => {
    // The spacer used to be iOS-only, on the assumption that adjustResize had
    // already shrunk the window on Android. Edge-to-edge means it has not, so
    // without the spacer scrollTo clamps and the last field never clears.
    expect(scrollSource).toContain('<KeyboardSpacer');
    expect(scrollSource).not.toContain("Platform.OS === 'ios'");
  });

  it('delegates the scroll arithmetic to the tested pure module', () => {
    expect(scrollSource).toContain("from '@/lib/keyboard/scroll-into-view'");
    expect(scrollSource).toContain('nextScrollOffset({');
  });
});

/**
 * Any screen rendering its own ScrollView opts out of the shell's keyboard
 * handling. The gallery is a horizontal image pager with no text input, so it
 * is the one legitimate case.
 */
describe('screens do not bypass the shell', () => {
  const SCROLLVIEW_ALLOWED = new Set(['ListingGalleryScreen.tsx']);

  const screenFiles = fs
    .readdirSync(path.join(srcDir, 'screens'))
    .filter((file) => file.endsWith('.tsx'));

  it.each(screenFiles)('%s renders no unmanaged ScrollView', (file) => {
    if (SCROLLVIEW_ALLOWED.has(file)) {
      return;
    }

    expect(read(path.join('screens', file))).not.toContain('<ScrollView');
  });

  it('checked a meaningful number of screens', () => {
    // Guards the glob itself: a rename that empties this list would otherwise
    // make every assertion above vacuously pass.
    expect(screenFiles.length).toBeGreaterThan(10);
  });
});
