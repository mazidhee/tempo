import { useEffect, useState, useRef } from 'react';
import type { FocusSnapshot } from '../../../shared/focus';
export function useFocus() {
  const [snapshot, setSnapshot] = useState<FocusSnapshot | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  useEffect(() => {
    let alive = true;
    const off = window.workspaceAPI.on('focus:changed', (s) => {
      if (alive) setSnapshot(s);
    });
    window.workspaceAPI
      .invoke('focus:snapshot')
      .then((s) => {
        if (alive) setSnapshot(s);
      })
      .catch((e) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
      off();
    };
  }, []);
  async function run(operation: Promise<FocusSnapshot> | (() => Promise<FocusSnapshot>)) {
    if (pending.current && typeof operation === 'function') return;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      setSnapshot(await (typeof operation === 'function' ? operation() : operation));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return { snapshot, error, run, busy };
}
