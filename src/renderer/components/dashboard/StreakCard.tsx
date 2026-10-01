import { Flame, Trophy, Zap } from 'lucide-react';
import type { StreakData } from '../../types';

interface StreakCardProps {
  data: StreakData;
}

export default function StreakCard({ data }: StreakCardProps) {
  const topStreaks = [...data.habits].sort((a, b) => b.currentStreak - a.currentStreak).slice(0, 5);

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-5 h-5 text-orange-500" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Streaks</h3>
      </div>

      <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-orange-600 dark:text-orange-400 font-medium uppercase tracking-wider">
              Overall Streak
            </p>
            <p className="text-3xl font-bold text-orange-700 dark:text-orange-300 mt-1">
              {data.overallStreak}
              <span className="text-sm font-medium ml-1">days</span>
            </p>
            <p className="text-[11px] text-orange-500/70 dark:text-orange-400/60 mt-0.5">
              All habits completed
            </p>
          </div>
          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
            <Zap className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
      </div>

      {topStreaks.length > 0 ? (
        <div className="space-y-3">
          {topStreaks.map((s) => (
            <div key={s.habitId} className="flex items-center justify-between">
              <span className="habit-name text-sm text-gray-700 dark:text-gray-300 truncate flex-1 mr-3">
                {s.habitName}
              </span>
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {s.currentStreak}
                  </span>
                  <span className="text-xs text-gray-400 ml-1">now</span>
                </div>
                <div className="text-right flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-amber-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {s.bestStreak} best
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 text-center py-4">No streak data yet</p>
      )}
    </div>
  );
}
