import { useEffect, useState } from 'react';
import { Download, RefreshCw, BarChart3 } from 'lucide-react';
import { useAnalytics } from '../hooks/useAnalytics';
import { useHabitData } from '../hooks/useHabitData';
import { Empty } from '../components/ui';
import StreakCard from '../components/dashboard/StreakCard';
import CompletionRateCard from '../components/dashboard/CompletionRateCard';
import HeatmapCalendar from '../components/dashboard/HeatmapCalendar';
import WeeklyBarChart from '../components/dashboard/WeeklyBarChart';
import BestWorstDay from '../components/dashboard/BestWorstDay';
import HabitTrendLine from '../components/dashboard/HabitTrendLine';
export default function Analytics() {
  const { active: habits, logs, loading: habitLoading } = useHabitData();
  const { streaks, completionRates, heatmapData, bestWorstDay, loading, error, fetchAll } =
    useAnalytics();
  const [exporting, setExporting] = useState(false),
    [message, setMessage] = useState('');
  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);
  const exportCSV = async () => {
    setExporting(true);
    setMessage('');
    try {
      const result = await window.habitAPI.exportCSV();
      if (result.success) setMessage('Habit CSV exported.');
    } catch (reason) {
      setMessage(`Export failed: ${String(reason)}`);
    } finally {
      setExporting(false);
    }
  };
  return (
    <section className="advanced-analytics" aria-label="Advanced habit analytics">
      <div className="section-heading">
        <div>
          <h2>Advanced habit analytics</h2>
          <p className="muted">Weekly breakdown, day patterns and individual trends.</p>
        </div>
        <div className="row-actions">
          <button className="btn-secondary" disabled={loading} onClick={() => void fetchAll()}>
            <RefreshCw />
            Refresh
          </button>
          <button className="btn-secondary" disabled={exporting} onClick={() => void exportCSV()}>
            <Download />
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
      </div>
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="muted" role="status">
          {message}
        </p>
      )}
      {habitLoading ? (
        <p className="muted">Opening habit analytics…</p>
      ) : !habits.length ? (
        <Empty
          icon={<BarChart3 />}
          title="No habits yet"
          description="Create a habit in Habits to see its analytics."
        />
      ) : (
        <div className="advanced-sections">
          <div className="chart-grid">
            {streaks && <StreakCard data={streaks} habits={habits} />}{' '}
            {completionRates && <CompletionRateCard data={completionRates} />}
          </div>
          {heatmapData && <HeatmapCalendar data={heatmapData} />}
          <div className="chart-grid">
            <WeeklyBarChart habits={habits} logs={logs} />
            {bestWorstDay && <BestWorstDay data={bestWorstDay} />}
          </div>
          <HabitTrendLine habits={habits} />
        </div>
      )}
    </section>
  );
}
