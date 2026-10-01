import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  defaultProductivity,
  finishTimer,
  secondsLeft,
  type Productivity,
} from '../../shared/productivity';
type Update = (fn: (s: Productivity) => Productivity) => void;
const Context = createContext<{
  state: Productivity;
  update: Update;
  ready: boolean;
  error: string;
  dismiss: () => void;
}>(null!);
export function ProductivityProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(defaultProductivity);
  const ref = useRef(state);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const queue = useRef(Promise.resolve());
  const update: Update = useCallback(
    (fn) => {
      if (!ready) return;
      const next = fn(ref.current);
      ref.current = next;
      setState(next);
      // Serialize disk writes: a pause can never be overwritten by an earlier tick.
      queue.current = queue.current
        .then(async () => {
          await window.habitAPI.saveProductivity(next);
        })
        .catch((e) =>
          setError(
            `Could not save your changes: ${e.message}. Keep the app open and export a backup.`,
          ),
        );
    },
    [ready],
  );
  useEffect(() => {
    let alive = true;
    window.habitAPI
      .getProductivity()
      .then((s) => {
        if (alive) {
          ref.current = s;
          setState(s);
          setReady(true);
        }
      })
      .catch((e) =>
        setError(`Could not load local data: ${e.message}. Your data has not been replaced.`),
      );
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    const tick = () => {
      const time = Date.now();
      const s = ref.current;
      if (s.timer.deadline !== null && secondsLeft(s.timer, time) <= 0) {
        update((current) => finishTimer(current, time));
        const message = `${s.timer.phase === 'focus' ? 'Focus session' : 'Break'} complete. ${s.timer.phase === 'focus' ? 'Time to recharge.' : 'Ready when you are.'}`;
        if (s.settings.notifications)
          window.habitAPI
            .notify(message)
            .catch(() => setError('Notifications are unavailable on this device.'));
        if (s.settings.sound) {
          try {
            const audio = new AudioContext();
            const oscillator = audio.createOscillator();
            const gain = audio.createGain();
            oscillator.type = 'sine';
            oscillator.frequency.value = 660;
            gain.gain.setValueAtTime(0.12, audio.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.7);
            oscillator.connect(gain);
            gain.connect(audio.destination);
            oscillator.start();
            oscillator.stop(audio.currentTime + 0.7);
            oscillator.onended = () => void audio.close();
          } catch {
            /* Audio is optional. */
          }
        }
      }
    };
    tick();
    const id = window.setInterval(tick, 250);
    window.addEventListener('focus', tick);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', tick);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [ready, update]);
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark =
        state.settings.theme === 'dark' || (state.settings.theme === 'system' && media.matches);
      document.documentElement.classList.toggle('dark', dark);
      document.documentElement.classList.toggle('light', !dark);
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [state.settings.theme]);
  const dismiss = useCallback(() => setError(''), []);
  const value = useMemo(
    () => ({ state, update, ready, error, dismiss }),
    [state, update, ready, error, dismiss],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export const useProductivity = () => useContext(Context);
