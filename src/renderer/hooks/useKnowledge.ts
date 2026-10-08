import { useEffect, useState } from 'react';
import type { KnowledgeSnapshot } from '../../shared/knowledge';
export function useKnowledge() {
  const [snapshot, setSnapshot] = useState<KnowledgeSnapshot | null>(null),
    [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    const off = window.workspaceAPI.on('notes:changed', (next) => {
      if (alive) setSnapshot(next);
    });
    void window.workspaceAPI
      .invoke('notes:snapshot')
      .then((next) => {
        if (alive) setSnapshot(next);
      })
      .catch((e) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
      off();
    };
  }, []);
  return { snapshot, setSnapshot, error };
}
