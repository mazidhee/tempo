import { Flame, Trophy } from 'lucide-react';
import type { StreakData, Habit } from '../../types';
export default function StreakCard({ data, habits }: { data: StreakData; habits: Habit[] }) {
  const top = [...data.habits].sort((a, b) => b.currentStreak - a.currentStreak).slice(0, 5);
  return (
    <section className="panel advanced-streaks">
      <div className="section-heading">
        <h2>Streaks</h2>
        <Flame />
      </div>
      <div className="advanced-metric">
        <span className="muted">Collective streak</span>
        <strong>
          {data.overallStreak}
          <small> days</small>
        </strong>
        <p className="muted">
          Days with every due habit completed or protected. Neutral days are excluded.
        </p>
      </div>
      {top.length ? (
        <table className="stats-table">
          <thead>
            <tr>
              <th>Habit</th>
              <th>Current</th>
              <th>Best</th>
            </tr>
          </thead>
          <tbody>
            {top.map((s) => (
              <tr key={s.habitId}>
                <td className="habit-name">
                  {s.habitName}
                  <small className="muted">
                    {habits.find((h) => h.id === s.habitId)?.schedule_type === 'weekly_target'
                      ? 'Qualifying weeks'
                      : 'Due occurrences'}
                  </small>
                </td>
                <td>{s.currentStreak}</td>
                <td>
                  <span className="advanced-best">
                    <Trophy />
                    {s.bestStreak}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="muted">No streak data yet.</p>
      )}
    </section>
  );
}
