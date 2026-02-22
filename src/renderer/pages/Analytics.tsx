import React, { useEffect, useState, useCallback } from 'react';
import { Download, RefreshCw, BarChart3 } from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { useAnalytics } from '../hooks/useAnalytics';
import { useHabits } from '../hooks/useHabits';
import StreakCard from '../components/dashboard/StreakCard';
import CompletionRateCard from '../components/dashboard/CompletionRateCard';
import HeatmapCalendar from '../components/dashboard/HeatmapCalendar';
import WeeklyBarChart from '../components/dashboard/WeeklyBarChart';
import BestWorstDay from '../components/dashboard/BestWorstDay';
import HabitTrendLine from '../components/dashboard/HabitTrendLine';

export default function Analytics() {
  const { habits } = useHabits();
  const { streaks, completionRates, heatmapData, bestWorstDay, loading, fetchAll } = useAnalytics();
  const [weeklyLogs, setWeeklyLogs] = useState<any[]>([]);
  const [exporting, setExporting] = useState(false);

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  const fetchWeeklyLogs = useCallback(async () => {
    try {
      const data = await window.habitAPI.getWeeklyData({
        startDate: format(weekStart, 'yyyy-MM-dd'),
        endDate: format(weekEnd, 'yyyy-MM-dd'),
      });
      setWeeklyLogs(data);
    } catch (err) {
      console.error('Failed to fetch weekly logs:', err);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    fetchWeeklyLogs();
  }, [fetchAll, fetchWeeklyLogs]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await window.habitAPI.exportCSV();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const activeHabits = habits.filter((h) => h.frequency === 'daily');

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Deep dive into your habit performance
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { fetchAll(); fetchWeeklyLogs(); }}
              className="btn-secondary flex items-center gap-2"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleExport}
              className="btn-primary flex items-center gap-2"
              disabled={exporting}
            >
              <Download className="w-4 h-4" />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
        </div>

        {habits.length === 0 ? (
          <div className="text-center py-20">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-slate-700" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No habits yet. Create some on the Today page to see analytics!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {streaks && <StreakCard data={streaks} />}
              {completionRates && <CompletionRateCard data={completionRates} />}
            </div>

            {heatmapData && <HeatmapCalendar data={heatmapData} />}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WeeklyBarChart
                habits={activeHabits.map((h) => ({ id: h.id, name: h.name }))}
                logs={weeklyLogs}
              />
              {bestWorstDay && <BestWorstDay data={bestWorstDay} />}
            </div>

            {activeHabits.length > 0 && <HabitTrendLine habits={activeHabits} />}
          </div>
        )}
      </div>
    </div>
  );
}
