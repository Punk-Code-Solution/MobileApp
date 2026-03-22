import { useEffect, useRef } from 'react';
import { BackHandler, Platform } from 'react-native';

/**
 * Android: botão voltar e gesto de borda (navegação por gestos) disparam o mesmo evento.
 * Retorne `true` se o evento foi tratado (não propaga / não minimiza o app).
 */
export function useHardwareBackPress(handler: () => boolean): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return undefined;
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => handlerRef.current());
    return () => sub.remove();
  }, []);
}
