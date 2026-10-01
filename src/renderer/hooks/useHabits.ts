import { useState, useEffect, useCallback } from 'react';
import type { Habit } from '../types';

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [archivedHabits, setArchivedHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHabits = useCallback(async () => {
    try {
      const all = await window.habitAPI.getHabits(true);
      setHabits(all.filter((h: Habit) => !h.is_archived));
      setArchivedHabits(all.filter((h: Habit) => h.is_archived));
    } catch (err) {
      console.error('Failed to fetch habits:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const addHabit = async (data: import('../../shared/habitValidation').HabitInput) => {
    await window.habitAPI.addHabit(data);
    await fetchHabits();
  };
  const editHabit = async (
    data: import('../../shared/habitValidation').HabitInput & { id: number },
  ) => {
    await window.habitAPI.editHabit(data);
    await fetchHabits();
  };

  const archiveHabit = async (id: number) => {
    await window.habitAPI.archiveHabit(id);
    await fetchHabits();
  };

  const restoreHabit = async (id: number) => {
    await window.habitAPI.restoreHabit(id);
    await fetchHabits();
  };

  const deleteHabit = async (id: number) => {
    await window.habitAPI.deleteHabit(id);
    await fetchHabits();
  };

  return {
    habits,
    archivedHabits,
    loading,
    fetchHabits,
    addHabit,
    editHabit,
    archiveHabit,
    restoreHabit,
    deleteHabit,
  };
}
