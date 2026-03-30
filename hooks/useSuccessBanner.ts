import { useCallback, useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';

/**
 * Muestra un mensaje breve (p. ej. en `SuccessBanner`) y dispara haptic de éxito.
 * El mensaje se limpia solo tras `durationMs`.
 */
export function useSuccessBanner(durationMs = 2800) {
  const [message, setMessage] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (msg: string) => {
      try {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        /* Web o dispositivo sin haptics */
      }
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setMessage(msg);
      timeoutRef.current = setTimeout(() => {
        setMessage(null);
        timeoutRef.current = null;
      }, durationMs);
    },
    [durationMs],
  );

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  return { message, show };
}
