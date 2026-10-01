import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMinuteClock } from './useClock';
import { localDate } from '../../shared/productivity';
import type { Habit, HabitLog } from '../types';
export const habitDataChanged = () => window.dispatchEvent(new Event('habit-data-changed'));
export function useHabitData() {
  const now = useMinuteClock();
  const today = localDate(new Date(now));
  const [data, setData] = useState<{ habits: Habit[]; logs: HabitLog[] }>({ habits: [], logs: [] });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try {
      setData(await window.habitAPI.getHabitSnapshot());
      setError('');
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
    window.addEventListener('habit-data-changed', refresh);
    return () => window.removeEventListener('habit-data-changed', refresh);
  }, [refresh, today]);
  const mutate = async (work: () => Promise<unknown>) => {
    await work();
    habitDataChanged();
    await refresh();
  };
  const active = useMemo(() => data.habits.filter((h) => !h.is_archived), [data.habits]);
  const archived = useMemo(() => data.habits.filter((h) => h.is_archived), [data.habits]);
  return {
    ...data,
    active,
    archived,
    today,
    now,
    error,
    loading,
    refresh,
    mutate,
  };
}
