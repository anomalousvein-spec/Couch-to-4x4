import { useCallback } from 'react';

export function useHaptics() {
  const vibrate = useCallback((pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        console.warn('Haptic feedback not supported or failed:', e);
      }
    }
  }, []);

  const triggerWarningHaptic = useCallback(() => {
    vibrate(100);
  }, [vibrate]);

  const triggerPhaseChangeHaptic = useCallback(() => {
    vibrate([200, 100, 200]);
  }, [vibrate]);

  return {
    vibrate,
    triggerWarningHaptic,
    triggerPhaseChangeHaptic
  };
}
