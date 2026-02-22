import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import type { Habit, HabitLog } from '../types';

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

  const addHabit = async (data: { name: string; description?: string; frequency: string; time_of_day: string; days_of_week?: string; scheduled_time?: string }) => {
    await window.habitAPI.addHabit(data);
    await fetchHabits();
  };

  const editHabit = async (data: { id: number; name: string; description?: string; frequency: string; time_of_day: string; days_of_week?: string; scheduled_time?: string }) => {
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

  return { habits, archivedHabits, loading, fetchHabits, addHabit, editHabit, archiveHabit, restoreHabit, deleteHabit };
}

export function useTodayLogs() {
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const today = format(new Date(), 'yyyy-MM-dd');

  const fetchLogs = useCallback(async () => {
    try {
      const data = await window.habitAPI.getLogsByDate(today);
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const toggleLog = async (habitId: number, isCompleted: boolean, note?: string) => {
    await window.habitAPI.toggleLog({ habitId, logDate: today, isCompleted, note });
    await fetchLogs();
  };

  return { logs, loading, fetchLogs, toggleLog, today };
}

export function useWeeklyLogs(startDate: string, endDate: string) {
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await window.habitAPI.getWeeklyData({ startDate, endDate });
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch weekly logs:', err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { logs, loading, fetchLogs };
}
