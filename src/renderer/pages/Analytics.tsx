import { useEffect, useState } from 'react';
import { Download, RefreshCw, BarChart3 } from 'lucide-react';
import { useAnalytics } from '../hooks/useAnalytics';
import { useHabitData } from '../hooks/useHabitData';
import StreakCard from '../components/dashboard/StreakCard';
import CompletionRateCard from '../components/dashboard/CompletionRateCard';
import HeatmapCalendar from '../components/dashboard/HeatmapCalendar';
import WeeklyBarChart from '../components/dashboard/WeeklyBarChart';
import BestWorstDay from '../components/dashboard/BestWorstDay';
import HabitTrendLine from '../components/dashboard/HabitTrendLine';

export default function Analytics() {
  const { active: habits, logs: allLogs } = useHabitData();
  const { streaks, completionRates, heatmapData, bestWorstDay, loading, fetchAll } = useAnalytics();
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

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

  const activeHabits = habits;

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
              onClick={() => {
                fetchAll();
              }}
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
              <WeeklyBarChart habits={activeHabits} logs={allLogs} />
              {bestWorstDay && <BestWorstDay data={bestWorstDay} />}
            </div>

            {activeHabits.length > 0 && <HabitTrendLine habits={activeHabits} />}
          </div>
        )}
      </div>
    </div>
  );
}
