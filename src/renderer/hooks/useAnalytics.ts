import { useState, useCallback } from 'react';
import type { StreakData, CompletionRateData, HeatmapData, BestWorstDayData } from '../types';

export function useAnalytics() {
  const [streaks, setStreaks] = useState<StreakData | null>(null);
  const [completionRates, setCompletionRates] = useState<CompletionRateData | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [bestWorstDay, setBestWorstDay] = useState<BestWorstDayData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
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
      setError(`Analytics could not be loaded: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    streaks,
    completionRates,
    heatmapData,
    bestWorstDay,
    error,
    loading,
    fetchAll,
  };
}
