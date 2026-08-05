/**
 * Purpose: A ScrollView that keeps the focused text field visible above the
 * keyboard, plus the tail spacer that makes the last field reachable.
 * Focus events bubble, so one listener on the scroll container serves every
 * field nested inside it without any per-screen wiring.
 * Why important: fields near the bottom of a form were covered by the keyboard,
 * so people typed blind (reported on the M-Pesa phone number in Buy Credits).
 * The scroll arithmetic lives in lib/keyboard/scroll-into-view.ts and is tested
 * there; this file only measures, listens, and scrolls.
 * Used by: components/ui/screen.tsx and screens/auth/auth-shared.tsx, which
 * between them wrap every Input, PhoneField, PasswordField, and OtpInput.
 */
import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  TextInput,
  View,
  useWindowDimensions,
  type HostInstance,
  type ScrollViewProps,
} from 'react-native';
import { useAnimatedKeyboard, useAnimatedReaction, runOnJS } from 'react-native-reanimated';
import { nextScrollOffset } from '@/lib/keyboard/scroll-into-view';

/** Anything with measureInWindow — what currentlyFocusedInput() hands back. */
type Measurable = Pick<HostInstance, 'measureInWindow'>;

/**
 * Keyboard height in dp, 0 when down.
 *
 * Reanimated reads this off the IME window inset. RN's own Keyboard events are
 * not usable here: this app runs edge-to-edge (android/gradle.properties
 * edgeToEdgeEnabled=true), which stops Android honouring adjustResize, and
 * ReactRootView then reports endCoordinates.screenY as the bottom of the visible
 * area instead of the keyboard's top edge. That made every overlap compute to 0
 * and no field ever scrolled. RN also only emits the event when visibility
 * flips, so a text-to-numeric pad swap was silent; the inset updates on every
 * frame of the animation instead.
 *
 * Kept off the UI thread deliberately: the scroll needs a JS-side measure pass,
 * so the shared value is mirrored into React state and reacted to there.
 */
function useKeyboardHeight(): number {
  const keyboard = useAnimatedKeyboard();
  const [height, setHeight] = useState(0);

  useAnimatedReaction(
    () => keyboard.height.value,
    (current, previous) => {
      // Whole pixels only: the animation emits fractional values every frame and
      // each distinct one would otherwise re-render and re-measure.
      const rounded = Math.round(current);
      if (previous === null || rounded !== Math.round(previous)) {
        runOnJS(setHeight)(rounded);
      }
    },
  );

  return height;
}

export type KeyboardAwareScrollViewProps = ScrollViewProps & {
  /** Room left between the field's bottom edge and the keyboard. */
  fieldGap?: number;
};

/**
 * Scrolls the focused field into view on focus, and again whenever the keyboard
 * geometry changes.
 *
 * Focus is caught with onFocus on the container rather than per-field props:
 * React Native bubbles focus events, so one handler covers arbitrarily nested
 * fields and adding a field to a screen needs no keyboard code at all.
 *
 * Nothing needs to be told about bottom bars or tab bars. Those render as
 * siblings below this scroll view, so the viewport this measures already ends
 * above them and the keyboard overlap comes out right on its own.
 */
export const KeyboardAwareScrollView = forwardRef<ScrollView, KeyboardAwareScrollViewProps>(
  function KeyboardAwareScrollView(
    { fieldGap, onFocus, onBlur, onScroll, onLayout, children, ...props },
    forwardedRef,
  ) {
    const scrollRef = useRef<ScrollView | null>(null);
    const scrollYRef = useRef(0);
    // The focused field, so a keyboard that appears or resizes after focus can
    // re-reveal it, and so a stale async measure can be discarded.
    const focusedRef = useRef<Measurable | null>(null);
    // Viewport bottom edge in window coordinates, used to size the tail spacer.
    const [viewportBottom, setViewportBottom] = useState(0);
    const keyboardHeight = useKeyboardHeight();
    const { height: windowHeight } = useWindowDimensions();

    const setRefs = useCallback(
      (instance: ScrollView | null) => {
        scrollRef.current = instance;
        if (typeof forwardedRef === 'function') {
          forwardedRef(instance);
        } else if (forwardedRef) {
          forwardedRef.current = instance;
        }
      },
      [forwardedRef],
    );

    const reveal = useCallback(
      (field: Measurable | null, currentKeyboardHeight: number) => {
        // getNativeScrollRef is the host instance behind the ScrollView; the
        // ScrollView class itself does not expose measureInWindow.
        const viewport = scrollRef.current?.getNativeScrollRef();
        if (!viewport || typeof field?.measureInWindow !== 'function') {
          return;
        }

        // Window coordinates, not content-relative ones: measureLayout against
        // the scroll node drifts once the layout shifts, while window
        // coordinates stay correct on both platforms. See scroll-into-view.ts.
        viewport.measureInWindow((_x, viewportScreenY, _width, viewportHeight) => {
          if (focusedRef.current !== field) {
            return;
          }

          field.measureInWindow((_fx, fieldScreenY, _fw, fieldHeight) => {
            // Blurred or unmounted during the measure hop.
            if (focusedRef.current !== field) {
              return;
            }

            const offset = nextScrollOffset({
              fieldScreenY,
              fieldHeight,
              viewportScreenY,
              viewportHeight,
              keyboardHeight: currentKeyboardHeight,
              windowHeight,
              scrollY: scrollYRef.current,
              gap: fieldGap,
            });

            if (offset === null) {
              return;
            }

            scrollRef.current?.scrollTo({ y: offset, animated: true });
          });
        });
      },
      [fieldGap, windowHeight],
    );

    // Runs as the keyboard opens and on every height change: switching between a
    // text and a numeric pad, an autocomplete bar opening, or rotation.
    useEffect(() => {
      if (keyboardHeight <= 0) {
        return;
      }

      reveal(focusedRef.current, keyboardHeight);
    }, [keyboardHeight, reveal]);

    return (
      <ScrollView
        ref={setRefs}
        // Without this, the first tap on a button while the keyboard is up is
        // swallowed to dismiss it and the user has to tap twice.
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        scrollEventThrottle={16}
        onLayout={(event) => {
          scrollRef.current
            ?.getNativeScrollRef()
            ?.measureInWindow((_x, y, _width, height) => setViewportBottom(y + height));
          onLayout?.(event);
        }}
        onScroll={(event) => {
          scrollYRef.current = event.nativeEvent.contentOffset.y;
          onScroll?.(event);
        }}
        onFocus={(event) => {
          // The event target is a node handle; currentlyFocusedInput() returns
          // the instance, which is what exposes measureInWindow.
          const field = TextInput.State.currentlyFocusedInput() as Measurable | null;
          focusedRef.current = field;
          reveal(field, keyboardHeight);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          focusedRef.current = null;
          onBlur?.(event);
        }}
        {...props}
      >
        {children}
        <KeyboardSpacer
          keyboardHeight={keyboardHeight}
          viewportBottom={viewportBottom}
          windowHeight={windowHeight}
        />
      </ScrollView>
    );
  },
);

/**
 * Tail padding matching how far the keyboard reaches into the scroll viewport,
 * so the last field can be scrolled clear of it.
 *
 * Renders on both platforms. An earlier version skipped this on Android on the
 * assumption that adjustResize had already shrunk the window; edge-to-edge means
 * it has not, so without the spacer the scroll view has no room to move the last
 * field up and scrollTo silently clamps.
 */
function KeyboardSpacer({
  keyboardHeight,
  viewportBottom,
  windowHeight,
}: {
  keyboardHeight: number;
  viewportBottom: number;
  windowHeight: number;
}) {
  if (keyboardHeight <= 0) {
    return null;
  }

  // Measured against the viewport's own bottom edge, so a bottom bar or tab bar
  // below the scroll area is already accounted for and never double-counted.
  const keyboardTop = windowHeight - keyboardHeight;
  const height = Math.max(0, viewportBottom - keyboardTop);

  return <View style={{ height }} pointerEvents="none" />;
}
