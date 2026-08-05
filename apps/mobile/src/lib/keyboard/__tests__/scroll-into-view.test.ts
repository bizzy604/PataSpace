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
 * A 800pt-tall window with a viewport starting at y=100 and running 600pt, and
 * a keyboard whose top edge is at y=460 — so it eats the bottom 240pt of the
 * viewport and leaves 360pt visible. Mirrors iOS, where the keyboard overlays.
 */
const base: ScrollIntoViewInput = {
  fieldScreenY: 200,
  fieldHeight: 48,
  viewportScreenY: 100,
  viewportHeight: 600,
  keyboardScreenY: 460,
  scrollY: 0,
};

describe('keyboardOverlap', () => {
  it('is zero with no keyboard up', () => {
    expect(keyboardOverlap(100, 600, null)).toBe(0);
  });

  it('measures how much of the viewport bottom the keyboard covers', () => {
    // Viewport ends at 700, keyboard starts at 460 -> 240 covered.
    expect(keyboardOverlap(100, 600, 460)).toBe(240);
  });

  it('is zero when the keyboard starts below the viewport', () => {
    // This is the Android adjustResize case: the window already shrank, so the
    // viewport ends above the keyboard and nothing is covered.
    expect(keyboardOverlap(100, 360, 460)).toBe(0);
  });

  it('never reports a negative overlap', () => {
    expect(keyboardOverlap(100, 100, 900)).toBe(0);
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
    expect(nextScrollOffset({ ...base, keyboardScreenY: null, fieldScreenY: 720 })).toBe(84);
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
    // Landscape / small device: no usable space, so any scroll is guesswork.
    expect(
      nextScrollOffset({ ...base, viewportHeight: 300, keyboardScreenY: 100 }),
    ).toBeNull();
  });

  it('needs no scroll on Android where the window already resized', () => {
    // adjustResize shrank the viewport to 360, so overlap is 0 and a field at
    // the very bottom of that shrunken viewport is visible without scrolling.
    expect(
      nextScrollOffset({
        ...base,
        viewportHeight: 360,
        keyboardScreenY: 460,
        fieldScreenY: 380,
      }),
    ).toBeNull();
  });
});
