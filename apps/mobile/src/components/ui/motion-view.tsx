import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { Animated, type ViewProps } from 'react-native';

type MotionViewProps = ViewProps & {
  children: ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
  scaleFrom?: number;
};

export function MotionView({
  children,
  delay = 0,
  duration = 320,
  distance = 14,
  scaleFrom = 0.985,
  style,
  ...props
}: MotionViewProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(distance)).current;
  const scale = useRef(new Animated.Value(scaleFrom)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, distance, duration, opacity, scale, translateY]);

  return (
    <Animated.View
      style={[
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Animated.View>
  );
}
