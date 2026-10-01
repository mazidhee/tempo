import { useState, useCallback } from 'react';
import type {
  StreakData,
  CompletionRateData,
  HeatmapData,
  BestWorstDayData,
  TrendPoint,
} from '../types';

export function useAnalytics() {
  const [streaks, setStreaks] = useState<StreakData | null>(null);
  const [completionRates, setCompletionRates] = useState<CompletionRateData | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [bestWorstDay, setBestWorstDay] = useState<BestWorstDayData | null>(null);
  const [habitTrends, setHabitTrends] = useState<Record<number, TrendPoint[]>>({});
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, c, h, b] = await Promise.all([
        window.habitAPI.getStreaks(),
        window.habitAPI.getCompletionRates(),
        window.habitAPI.getHeatmapData(),
        window.habitAPI.getBestWorstDay(),
      ]);
      setStreaks(s);
      setCompletionRates(c);
      setHeatmapData(h);
      setBestWorstDay(b);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHabitTrend = useCallback(async (habitId: number) => {
    try {
      const data = await window.habitAPI.getHabitTrend(habitId);
      setHabitTrends((prev) => ({ ...prev, [habitId]: data }));
    } catch (err) {
      console.error('Failed to fetch habit trend:', err);
    }
  }, []);

  return {
    streaks,
    completionRates,
    heatmapData,
    bestWorstDay,
    habitTrends,
    loading,
    fetchAll,
    fetchHabitTrend,
  };
}
