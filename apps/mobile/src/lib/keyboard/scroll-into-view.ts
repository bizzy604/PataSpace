/**
 * Purpose: The scroll arithmetic that lifts a focused field clear of the
 * keyboard — given where the field, the scroll viewport, and the keyboard sit
 * on screen, return the scroll offset that reveals the field, or null when it
 * is already visible.
 * Why important: a field at the bottom of a form is covered by the keyboard, so
 * the user types blind. This is same-input-same-output geometry, so it lives in
 * a pure module with tests instead of being eyeballed inside a component. Using
 * on-screen coordinates rather than content-relative ones makes it correct on
 * both platforms: Android resizes the window (adjustResize) so the measured
 * viewport already ends above the keyboard and the overlap comes out 0, while
 * iOS overlays the keyboard and the overlap is real.
 * Used by: components/ui/keyboard-aware-scroll.tsx, consumed by Screen and
 * AuthScreen through every Input / PhoneField / PasswordField on focus.
 */

/** Breathing room kept between the field's bottom edge and the keyboard. */
export const DEFAULT_FIELD_GAP = 16;

export type ScrollIntoViewInput = {
  /** Field's top edge in window coordinates (measureInWindow). */
  fieldScreenY: number;
  fieldHeight: number;
  /** Scroll viewport's top edge in window coordinates. */
  viewportScreenY: number;
  /** Scroll viewport's height, after any window resize the platform applied. */
  viewportHeight: number;
  /**
   * Keyboard's top edge in window coordinates (`endCoordinates.screenY`), or
   * null when no keyboard is up. A keyboard that starts below the viewport
   * bottom covers nothing and yields an overlap of 0.
   */
  keyboardScreenY: number | null;
  /** Current vertical scroll offset. */
  scrollY: number;
  /** Extra room to leave below the field. Defaults to DEFAULT_FIELD_GAP. */
  gap?: number;
};

/** How much of the viewport's bottom the keyboard hides. Never negative. */
export function keyboardOverlap(
  viewportScreenY: number,
  viewportHeight: number,
  keyboardScreenY: number | null,
): number {
  if (keyboardScreenY === null) {
    return 0;
  }

  return Math.max(0, viewportScreenY + viewportHeight - keyboardScreenY);
}

/**
 * The offset to scroll to so the field sits inside the unobstructed part of the
 * viewport, or null when no scroll is needed.
 *
 * Scrolls down when the keyboard (or the viewport's own bottom edge) covers the
 * field, and up when the field is above the viewport top — that second case
 * matters when focus moves backwards through a form, e.g. a validation error
 * sends the user back to an earlier field.
 *
 * A field taller than the unobstructed space cannot fit; its top edge is
 * aligned instead, so the user sees where they are typing rather than the tail
 * of a long multiline box.
 */
export function nextScrollOffset(input: ScrollIntoViewInput): number | null {
  const gap = input.gap ?? DEFAULT_FIELD_GAP;
  const overlap = keyboardOverlap(
    input.viewportScreenY,
    input.viewportHeight,
    input.keyboardScreenY,
  );
  const visibleHeight = input.viewportHeight - overlap;

  // A viewport with no usable height (keyboard taller than the scroll area)
  // has nowhere to reveal anything; leave the offset alone.
  if (visibleHeight <= 0) {
    return null;
  }

  // Field position expressed relative to the viewport's top edge.
  const fieldTopInViewport = input.fieldScreenY - input.viewportScreenY;
  const fieldBottomInViewport = fieldTopInViewport + input.fieldHeight;

  const hiddenBelow = fieldBottomInViewport + gap - visibleHeight;
  const hiddenAbove = gap - fieldTopInViewport;

  // Too tall to fit: align the top edge and let the rest run under the
  // keyboard rather than scrolling past the caret.
  if (input.fieldHeight + gap * 2 > visibleHeight) {
    if (hiddenAbove <= 0 && fieldTopInViewport < visibleHeight) {
      return null;
    }

    return Math.max(0, input.scrollY - hiddenAbove);
  }

  if (hiddenBelow > 0) {
    return Math.max(0, input.scrollY + hiddenBelow);
  }

  if (hiddenAbove > 0) {
    return Math.max(0, input.scrollY - hiddenAbove);
  }

  return null;
}
