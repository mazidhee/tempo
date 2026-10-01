import type { HabitAPI } from '../main/preload';
import type { EngineHabit, EngineLog } from '../shared/habits';

declare global {
  interface Window {
    habitAPI: HabitAPI;
  }
}

export interface Habit extends EngineHabit {
  id: number;
  name: string;
  description: string | null;
  frequency: 'daily' | 'weekly';
  time_of_day: 'morning' | 'afternoon' | 'evening' | 'anytime';
  days_of_week: string; // like 'mon,wed,fri' etc
  scheduled_time: string | null; // time in HH:mm or null
  created_at: string;
  is_archived: number;
}

export interface HabitLog extends EngineLog {
  id: number;
  habit_id: number;
  log_date: string;
  is_completed: number;
  note: string | null;
  missed_reason: string | null;
  habit_name?: string;
  frequency?: string;
  time_of_day?: string;
  description?: string;
}

export interface StreakData {
  habits: {
    habitId: number;
    habitName: string;
    currentStreak: number;
    bestStreak: number;
  }[];
  overallStreak: number;
}

export interface CompletionRateData {
  habits: {
    habitId: number;
    habitName: string;
    rates: Record<string, number>;
  }[];
  overall: Record<string, number>;
}

export interface HeatmapDay {
  log_date: string;
  completed_count: number;
}

export interface HeatmapData {
  days: HeatmapDay[];
  totalHabits: number;
}

export interface DayStats {
  day_name: string;
  day_num: number;
  avg_rate: number;
  total_logs: number;
}

export interface BestWorstDayData {
  best: DayStats | null;
  worst: DayStats | null;
  all: DayStats[];
}

export interface TrendPoint {
  date: string;
  completed: number;
  average: number;
}
