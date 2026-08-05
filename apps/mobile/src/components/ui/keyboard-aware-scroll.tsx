/**
 * Purpose: A ScrollView that keeps the focused text field visible above the
 * keyboard, plus the tail spacer that makes the last field reachable on iOS.
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
  Keyboard,
  Platform,
  ScrollView,
  TextInput,
  View,
  type HostInstance,
  type ScrollViewProps,
} from 'react-native';
import { nextScrollOffset } from '@/lib/keyboard/scroll-into-view';

/**
 * Android resizes the window for the keyboard (windowSoftInputMode=adjustResize
 * in AndroidManifest.xml), so the scroll viewport already ends above it and a
 * spacer would only add dead space. iOS overlays the keyboard, so the content
 * needs the extra tail to be scrollable into view.
 */
const RESERVES_SPACE_FOR_KEYBOARD = Platform.OS === 'ios';

/** Anything with measureInWindow — what currentlyFocusedInput() hands back. */
type Measurable = Pick<HostInstance, 'measureInWindow'>;

/** Keyboard top edge in window coordinates while up, else null. */
function useKeyboardScreenY(): number | null {
  const [screenY, setScreenY] = useState<number | null>(null);

  useEffect(() => {
    // iOS emits the will* pair alongside the animation, so the scroll starts in
    // step with the keyboard instead of a frame behind it. Android only ever
    // emits did*.
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setScreenY(event.endCoordinates.screenY);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setScreenY(null));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return screenY;
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
    // Viewport bottom edge in window coordinates, used to size the iOS spacer.
    const [viewportBottom, setViewportBottom] = useState(0);
    const keyboardScreenY = useKeyboardScreenY();

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
      (field: Measurable | null, currentKeyboardScreenY: number | null) => {
        // getNativeScrollRef is the host instance behind the ScrollView; the
        // ScrollView class itself does not expose measureInWindow.
        const viewport = scrollRef.current?.getNativeScrollRef();
        if (!viewport || typeof field?.measureInWindow !== 'function') {
          return;
        }

        // Window coordinates, not content-relative ones: measureLayout against
        // the scroll node drifts once Android resizes the window, while window
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
              keyboardScreenY: currentKeyboardScreenY,
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
      [fieldGap],
    );

    // Runs when the keyboard appears or changes height: switching between a
    // text and a numeric pad, an autocomplete bar opening, or rotation.
    useEffect(() => {
      if (keyboardScreenY === null) {
        return;
      }

      reveal(focusedRef.current, keyboardScreenY);
    }, [keyboardScreenY, reveal]);

    return (
      <ScrollView
        ref={setRefs}
        // Without this, the first tap on a button while the keyboard is up is
        // swallowed to dismiss it and the user has to tap twice.
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        scrollEventThrottle={16}
        onLayout={(event) => {
          if (RESERVES_SPACE_FOR_KEYBOARD) {
            scrollRef.current
              ?.getNativeScrollRef()
              ?.measureInWindow((_x, y, _width, height) => setViewportBottom(y + height));
          }
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
          reveal(field, keyboardScreenY);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          focusedRef.current = null;
          onBlur?.(event);
        }}
        {...props}
      >
        {children}
        <KeyboardSpacer keyboardScreenY={keyboardScreenY} viewportBottom={viewportBottom} />
      </ScrollView>
    );
  },
);

/**
 * Tail padding matching how far the keyboard reaches into the scroll viewport,
 * so the last field can be scrolled clear of it. Renders nothing on Android,
 * where adjustResize already shrank the window and this would only add dead
 * space below the form.
 */
function KeyboardSpacer({
  keyboardScreenY,
  viewportBottom,
}: {
  keyboardScreenY: number | null;
  viewportBottom: number;
}) {
  if (!RESERVES_SPACE_FOR_KEYBOARD || keyboardScreenY === null) {
    return null;
  }

  // Measured from the viewport's own bottom edge, so a bottom bar or tab bar
  // below the scroll area is already accounted for.
  const height = Math.max(0, viewportBottom - keyboardScreenY);

  return <View style={{ height }} pointerEvents="none" />;
}
