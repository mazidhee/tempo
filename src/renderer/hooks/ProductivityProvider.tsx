import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { defaultProductivity, type Productivity } from '../../shared/productivity';
import '../../shared/focus';
import { accentTokens, themeTokens } from '../../shared/appearance';
import { reconcileProductivity } from '../../shared/productivitySync';
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
  const pendingWrites = useRef(0);
  const acceptSnapshot = useCallback((actual: Productivity) => {
    const reconciled = reconcileProductivity(actual, ref.current, pendingWrites.current);
    ref.current = reconciled;
    setState(reconciled);
  }, []);
  const update: Update = useCallback(
    (fn) => {
      if (!ready) return;
      const previous = ref.current;
      const next = fn(previous);
      if (next === previous) return;
      ref.current = next;
      setState(next);
      pendingWrites.current++;
      // Serialize disk writes: a pause can never be overwritten by an earlier tick.
      queue.current = queue.current
        .then(async () => {
          await window.habitAPI.saveProductivity(next);
          const snapshot =
            JSON.stringify(next.timer) !== JSON.stringify(previous.timer)
              ? await window.workspaceAPI.invoke('focus:legacyTimer', {
                  expectedRunId: previous.timer.runId,
                  timer: next.timer,
                })
              : await window.workspaceAPI.invoke('focus:snapshot');
          pendingWrites.current--;
          acceptSnapshot(snapshot.productivity);
          window.dispatchEvent(new Event('workspace-data-changed'));
        })
        .catch(async (e) => {
          pendingWrites.current--;
          const actual = await window.workspaceAPI.invoke('focus:snapshot').catch(() => null);
          if (actual) {
            acceptSnapshot(actual.productivity);
          }
          setError(
            `Could not save your changes: ${e.message}. Keep the app open and export a backup.`,
          );
        });
    },
    [ready, acceptSnapshot],
  );
  useEffect(() => {
    let alive = true;
    window.habitAPI
      .getProductivity()
      .then(async () => (await window.workspaceAPI.invoke('focus:snapshot')).productivity)
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
    return window.workspaceAPI.on('focus:changed', (snapshot) => {
      acceptSnapshot(snapshot.productivity);
      window.dispatchEvent(new Event('workspace-data-changed'));
    });
  }, [acceptSnapshot]);
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark =
        state.settings.theme === 'dark' || (state.settings.theme === 'system' && media.matches);
      document.documentElement.classList.toggle('dark', dark);
      document.documentElement.classList.toggle('light', !dark);
      document.documentElement.dataset.palette = state.settings.themePalette || 'default';
      const palette = themeTokens(state.settings.themePalette, !dark);
      for (const [property, value] of Object.entries({
        ...palette,
        ...accentTokens(state.settings.accent, !dark, palette['--surface-2']),
      }))
        document.documentElement.style.setProperty(property, value);
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [state.settings.theme, state.settings.accent, state.settings.themePalette]);
  const dismiss = useCallback(() => setError(''), []);
  const value = useMemo(
    () => ({ state, update, ready, error, dismiss }),
    [state, update, ready, error, dismiss],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export const useProductivity = () => useContext(Context);
