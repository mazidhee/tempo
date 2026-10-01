import { useSyncExternalStore } from 'react';

// Clock changes never broadcast through productivity data. Timer displays
// subscribe at 250 ms; calendar consumers change only at a minute boundary.
const listeners = new Set<() => void>();
let interval: ReturnType<typeof setInterval> | undefined;
const emit = () => listeners.forEach((listener) => listener());
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!interval) {
    interval = setInterval(emit, 250);
    window.addEventListener('focus', emit);
    document.addEventListener('visibilitychange', emit);
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      clearInterval(interval);
      interval = undefined;
      window.removeEventListener('focus', emit);
      document.removeEventListener('visibilitychange', emit);
    }
  };
}
const timerSnapshot = () => Math.floor(Date.now() / 250) * 250;
const minuteSnapshot = () => Math.floor(Date.now() / 60_000) * 60_000;
export const useClock = () => useSyncExternalStore(subscribe, timerSnapshot);
export const useMinuteClock = () => useSyncExternalStore(subscribe, minuteSnapshot);
