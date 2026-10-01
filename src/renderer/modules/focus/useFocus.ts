import { useEffect, useState } from 'react';
import type { FocusSnapshot } from '../../../shared/focus';
export function useFocus() {
  const [snapshot, setSnapshot] = useState<FocusSnapshot | null>(null);
  const [error, setError] = useState('');
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
  async function run(operation: Promise<FocusSnapshot>) {
    setError('');
    try {
      setSnapshot(await operation);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return { snapshot, error, run };
}
