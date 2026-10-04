import { useCallback, useEffect, useRef, useState } from 'react';
import type { DailyPlan, PlanPriority } from '../../../shared/reflection';

type Payload = { date: string; priorities: PlanPriority[]; studyTopicIds: string[] };
const signature = (value: Payload) => JSON.stringify(value);
/** Serialize writes and acknowledge the captured revision, never newer typing. */
export function usePlanAutosave(
  date: string,
  priorities: PlanPriority[],
  studyTopicIds: string[],
  ready: boolean,
  saved: DailyPlan | undefined,
) {
  const payload = { date, priorities, studyTopicIds };
  const revision = signature(payload);
  const latest = useRef<Payload | null>(null);
  if (ready) latest.current = payload;
  const acknowledged = useRef(new Map<string, string>());
  if (ready && !acknowledged.current.has(date))
    acknowledged.current.set(
      date,
      signature({
        date,
        priorities: saved?.priorities || [],
        studyTopicIds: saved?.studyTopicIds || [],
      }),
    );
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const alive = useRef(true);
  const [status, setStatus] = useState('Saved locally');
  const [error, setError] = useState('');
  const saveNow = useCallback((value = latest.current) => {
    if (!value) return Promise.resolve();
    const captured = signature(value);
    const job = queue.current
      .catch(() => undefined)
      .then(async () => {
        if (acknowledged.current.get(value.date) === captured) return;
        await window.workspaceAPI.invoke('plan:save', value);
        acknowledged.current.set(value.date, captured);
        if (alive.current && latest.current && signature(latest.current) === captured) {
          setStatus('Saved locally');
          setError('');
        }
      })
      .catch((reason) => {
        if (alive.current && latest.current && signature(latest.current) === captured) {
          setStatus('Changes kept on this device');
          setError('Could not save your plan. Try again before creating a backup.');
        }
        throw reason;
      });
    queue.current = job;
    return job;
  }, []);
  useEffect(() => {
    if (!ready) return;
    if (acknowledged.current.get(date) === revision) {
      setStatus('Saved locally');
      return;
    }
    setStatus('Saving…');
    const pending = setTimeout(() => {
      void saveNow(payload).catch(() => undefined);
    }, 600);
    return () => clearTimeout(pending);
  }, [date, revision, ready, saveNow]);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      void saveNow().catch(() => undefined);
    };
  }, [saveNow]);
  return { status, error, saveNow };
}
