import { useEffect, useState } from 'react';
import type { StudySnapshot } from '../../shared/study';
const empty: StudySnapshot = { curricula: [], topics: [], reviews: [] };
export function useStudy() {
  const [snapshot, setSnapshot] = useState<StudySnapshot>(empty);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    const unsubscribe = window.workspaceAPI.on('study:changed', (next) => {
      if (alive) setSnapshot(next);
    });
    void window.workspaceAPI
      .invoke('study:snapshot')
      .then((next) => {
        if (alive) {
          setSnapshot(next);
          setReady(true);
        }
      })
      .catch((reason) => {
        if (alive) setError(String(reason));
      });
    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);
  return { snapshot, ready, error };
}
