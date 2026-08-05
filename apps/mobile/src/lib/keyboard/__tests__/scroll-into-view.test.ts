/**
 * Purpose: Gate tests for the keyboard scroll geometry — the offset that lifts
 * a focused field clear of the keyboard, and the overlap it is derived from.
 * Why important: The bug this guards is typing blind. A field at the bottom of
 * a form sits under the keyboard, so the user cannot see what they are entering
 * (reported on the M-Pesa phone field in Buy Credits). The math is pure
 * arithmetic, so it belongs in the deterministic lane: a renderer cannot tell
 * us the answer is right, but these can.
 * Used by: `pnpm --filter @pataspace/mobile test`.
 */
import {
  DEFAULT_FIELD_GAP,
  keyboardOverlap,
  nextScrollOffset,
  type ScrollIntoViewInput,
} from '../scroll-into-view';

/**
 * An 800pt-tall window with a viewport starting at y=100 and running 600pt, and
 * a 340pt keyboard — so its top edge lands at 800-340=460, it eats the bottom
 * 240pt of the viewport, and leaves 360pt visible.
 *
 * Height rather than a top edge because that is what the platform reports
 * reliably: Android under edge-to-edge gives a usable IME inset but a misleading
 * screenY. See scroll-into-view.ts.
 */
const base: ScrollIntoViewInput = {
  fieldScreenY: 200,
  fieldHeight: 48,
  viewportScreenY: 100,
  viewportHeight: 600,
  keyboardHeight: 340,
  windowHeight: 800,
  scrollY: 0,
};

describe('keyboardOverlap', () => {
  it('is zero with no keyboard up', () => {
    expect(keyboardOverlap(100, 600, 0, 800)).toBe(0);
  });

  it('measures how much of the viewport bottom the keyboard covers', () => {
    // Viewport ends at 700, keyboard top at 800-340=460 -> 240 covered.
    expect(keyboardOverlap(100, 600, 340, 800)).toBe(240);
  });

  it('is zero when the keyboard sits entirely below the viewport', () => {
    // Viewport ends at 460, keyboard top is also 460: nothing covered. This is
    // what a genuinely resized window looks like.
    expect(keyboardOverlap(100, 360, 340, 800)).toBe(0);
  });

  it('never reports a negative overlap', () => {
    // Short viewport high up the window, tiny keyboard: no contact at all.
    expect(keyboardOverlap(100, 100, 50, 800)).toBe(0);
  });

  it('covers the whole viewport when the keyboard is taller than the window below it', () => {
    // 700pt keyboard in an 800pt window puts its top at 100, the viewport's own
    // top edge, so all 600pt are hidden.
    expect(keyboardOverlap(100, 600, 700, 800)).toBe(600);
  });
});

describe('nextScrollOffset', () => {
  it('returns null for a field already fully visible', () => {
    // Field at 200..248, visible region ends at 460. Nothing to do.
    expect(nextScrollOffset(base)).toBeNull();
  });

  it('scrolls down just enough to clear a field under the keyboard', () => {
    // Field top at 500 is past the 460 keyboard line. Relative to the viewport
    // it spans 400..448; visible height is 360. It must move up by
    // 448 + 16 - 360 = 104.
    expect(nextScrollOffset({ ...base, fieldScreenY: 500 })).toBe(104);
  });

  it('adds the gap so the field is not flush against the keyboard', () => {
    // Field bottom lands exactly on the keyboard line: still scrolls by the gap.
    expect(nextScrollOffset({ ...base, fieldScreenY: 412 })).toBe(DEFAULT_FIELD_GAP);
  });

  it('honours a custom gap', () => {
    expect(nextScrollOffset({ ...base, fieldScreenY: 412, gap: 40 })).toBe(40);
  });

  it('accumulates onto the current scroll offset', () => {
    expect(nextScrollOffset({ ...base, fieldScreenY: 500, scrollY: 250 })).toBe(354);
  });

  it('scrolls up for a field above the viewport top', () => {
    // Focus moved backwards (e.g. a validation error). Field at y=60 is 40pt
    // above the viewport top, so scroll back by that plus the gap.
    expect(nextScrollOffset({ ...base, fieldScreenY: 60, scrollY: 300 })).toBe(244);
  });

  it('never returns a negative offset', () => {
    expect(nextScrollOffset({ ...base, fieldScreenY: 60, scrollY: 0 })).toBe(0);
  });

  it('still reveals a field below the fold with no keyboard up', () => {
    // No keyboard, but the field is past the viewport bottom: reveal it anyway.
    expect(nextScrollOffset({ ...base, keyboardHeight: 0, fieldScreenY: 720 })).toBe(84);
  });

  it('aligns the top edge of a field too tall to fit', () => {
    // A 400pt multiline box cannot fit in 360pt of visible space. Align its top
    // at the gap rather than scrolling to its bottom, so the caret stays on
    // screen instead of the tail of the box. Top sits at 400 in-viewport and
    // the whole field is below the 360pt fold, so it moves up by 400 - 16.
    expect(
      nextScrollOffset({ ...base, fieldScreenY: 500, fieldHeight: 400, scrollY: 0 }),
    ).toBe(384);
    // Same field scrolled off the top: come back down to the gap.
    expect(
      nextScrollOffset({ ...base, fieldScreenY: 60, fieldHeight: 400, scrollY: 300 }),
    ).toBe(244);
  });

  it('leaves an oversized field alone once its top is comfortably visible', () => {
    // Top at 100 in-viewport, well inside the 360pt visible region. The bottom
    // runs under the keyboard, but chasing it would push the caret off screen.
    expect(
      nextScrollOffset({ ...base, fieldScreenY: 200, fieldHeight: 400, scrollY: 0 }),
    ).toBeNull();
  });

  it('leaves the offset alone when the keyboard swallows the viewport', () => {
    // Landscape / small device: a 700pt keyboard leaves the 300pt viewport at
    // y=100 with no usable space, so any scroll is guesswork.
    expect(
      nextScrollOffset({ ...base, viewportHeight: 300, keyboardHeight: 700 }),
    ).toBeNull();
  });

  it('needs no scroll once the field sits above the keyboard line', () => {
    // Viewport shrunk to 360 so it ends at 460, exactly the keyboard top:
    // overlap is 0 and a field at the bottom of it is visible already.
    expect(
      nextScrollOffset({
        ...base,
        viewportHeight: 360,
        fieldScreenY: 380,
      }),
    ).toBeNull();
  });

  /**
   * The regression this rewrite exists for. Android with edge-to-edge never
   * resizes the window, so the viewport still runs the full 600pt underneath a
   * 340pt keyboard and a field near the bottom really is covered. The old
   * screenY-based version computed an overlap of 0 here and returned null,
   * which is exactly the "nothing scrolls" bug reported on device.
   */
  it('scrolls on Android edge-to-edge, where the window never resized', () => {
    expect(
      nextScrollOffset({ ...base, fieldScreenY: 640, fieldHeight: 48 }),
    ).toBe(244);
  });
});
