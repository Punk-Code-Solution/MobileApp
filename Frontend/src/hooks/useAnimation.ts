/**
 * Hook para animações suaves em componentes React Native
 */

import { useRef, useEffect } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * Hook para animação de fade in/out
 */
export function useFadeIn(duration: number = 300) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [duration, opacity]);

  return opacity;
}

/**
 * Hook para animação de slide
 */
export function useSlideIn(from: 'top' | 'bottom' | 'left' | 'right' = 'bottom', duration: number = 300) {
  const translateValue = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const initialValue = from === 'top' ? -100 : from === 'bottom' ? 100 : from === 'left' ? -100 : 100;
    translateValue.setValue(initialValue);

    Animated.parallel([
      Animated.timing(translateValue, {
        toValue: 0,
        duration,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [from, duration, translateValue, opacity]);

  const translateX = from === 'left' || from === 'right' ? translateValue : 0;
  const translateY = from === 'top' || from === 'bottom' ? translateValue : 0;

  return { translateX, translateY, opacity };
}

/**
 * Hook para animação de scale (zoom)
 */
export function useScale(duration: number = 300, initialScale: number = 0.8) {
  const scale = useRef(new Animated.Value(initialScale)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [duration, scale, opacity]);

  return { scale, opacity };
}

/**
 * Hook para animação de bounce
 */
export function useBounce(duration: number = 500) {
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(bounce, {
        toValue: 1.2,
        duration: duration / 2,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(bounce, {
        toValue: 1,
        duration: duration / 2,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [duration, bounce]);

  return bounce;
}

