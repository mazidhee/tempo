import { useEffect, useRef, useState } from 'react';
import type { DailyPlan, PlanPriority } from '../../../shared/reflection';

type Draft = {
  date: string;
  priorities: PlanPriority[];
  topics: string[];
  sleep: string;
  energy: string;
  choice: string;
  title: string;
};
/** Per-day local recovery is synchronous: navigating away cannot race an IPC save. */
export function usePlanDraft(date: string, saved: DailyPlan | undefined, ready: boolean) {
  const [draft, setDraft] = useState<Draft>({
    date: '',
    priorities: [],
    topics: [],
    sleep: '',
    energy: '',
    choice: 'free',
    title: '',
  });
  const latest = useRef(draft);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!ready) return;
    const value: Draft = {
      date,
      priorities: saved?.priorities || [],
      topics: saved?.studyTopicIds || [],
      sleep: saved?.evening.sleep == null ? '' : String(saved.evening.sleep),
      energy: saved?.evening.energy == null ? '' : String(saved.evening.energy),
      choice: 'free',
      title: '',
    };
    try {
      const stored = localStorage.getItem(`tempo-plan-draft:${date}`);
      if (stored) {
        const recovered = JSON.parse(stored) as Draft;
        if (
          recovered.date === date &&
          Array.isArray(recovered.priorities) &&
          recovered.priorities.length <= 3 &&
          Array.isArray(recovered.topics) &&
          ['sleep', 'energy', 'choice', 'title'].every(
            (key) => typeof recovered[key as keyof Draft] === 'string',
          )
        )
          Object.assign(value, recovered);
      }
    } catch {
      /* Invalid recovery data leaves the saved plan intact. */
    }
    latest.current = value;
    setDraft(value);
    // Only opening a day hydrates its draft; background snapshots must not erase typing.
  }, [date, ready]);
  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    const next = { ...latest.current, [key]: value };
    latest.current = next;
    try {
      localStorage.setItem(`tempo-plan-draft:${next.date}`, JSON.stringify(next));
      setError('');
    } catch {
      setError('Draft storage is full. Save priorities before changing pages.');
    }
    setDraft(next);
  };
  return {
    ...draft,
    draftError: error,
    setPriorities: (value: PlanPriority[]) => update('priorities', value),
    setTopics: (value: string[]) => update('topics', value),
    setSleep: (value: string) => update('sleep', value),
    setEnergy: (value: string) => update('energy', value),
    setChoice: (value: string) => update('choice', value),
    setTitle: (value: string) => update('title', value),
  };
}
