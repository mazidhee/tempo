import type { EngineHabit, EngineLog } from './habits';
import type { Productivity } from './productivity';
import type { StudySnapshot } from './study';
export type PriorityKind = 'task' | 'habit' | 'study' | 'free';
export interface PlanPriority {
  id: string;
  kind: PriorityKind;
  linkId: string | null;
  title: string;
  done: boolean;
}
export interface DailyPlan {
  date: string;
  priorities: PlanPriority[];
  studyTopicIds: string[];
  evening: { completedAt: string | null; sleep: number | null; energy: number | null };
  updatedAt: string;
}
export interface JournalEntry {
  date: string;
  text: string;
  updatedAt: string;
}
export type GoalKind = 'habit' | 'focus' | 'chapter' | 'tasks';
export interface Goal {
  id: string;
  title: string;
  kind: GoalKind;
  linkType: 'habit' | 'project' | 'curriculum' | 'tag' | 'chapter' | 'all';
  linkId: string;
  start: string;
  deadline: string;
  target: number;
  weeks: number;
  archived: boolean;
  createdAt: string;
}
export interface GoalProgress {
  goal: Goal;
  current: number;
  target: number;
  percent: number;
  status: 'complete' | 'on-track' | 'behind';
  detail: string;
}
export interface Reminder {
  enabled: boolean;
  time: string;
}
export interface ReflectionSettings {
  morning: Reminder;
  evening: Reminder;
  weekly: Reminder & { day: number };
}
export const defaultReflectionSettings = (): ReflectionSettings => ({
  morning: { enabled: false, time: '08:00' },
  evening: { enabled: false, time: '20:00' },
  weekly: { enabled: false, time: '20:00', day: 0 },
});
export interface WeeklySummary {
  habits: {
    id: number;
    name: string;
    hits: number;
    target: number;
    misses: number;
    freezes: number;
    streakBefore: number;
    streakAfter: number;
  }[];
  reasons: Record<string, number>;
  focus: {
    seconds: number;
    previousSeconds: number;
    byProject: Record<string, number>;
    byCurriculum: Record<string, number>;
    byPreset: Record<string, number>;
    bestDay: string | null;
  };
  study: {
    topicsLearned: number;
    reviews: number;
    retained: number;
    retentionPercent: number | null;
    retentionLabel: string;
    progress: { id: string; title: string; learned: number; total: number }[];
  };
  tasks: { completed: number; created: number };
  plans: { done: number; total: number; evenings: number };
  journal: JournalEntry[];
  correlations: string[];
}
export interface WeeklyReview {
  start: string;
  end: string;
  generatedAt: string;
  summary: WeeklySummary;
  obstacle: string;
  change: string;
  editedAt: string | null;
}
export interface ReflectionData {
  plans: DailyPlan[];
  journal: JournalEntry[];
  reviews: WeeklyReview[];
  goals: Goal[];
  settings: ReflectionSettings;
}
export interface ReflectionSnapshot extends ReflectionData {
  source: {
    habits: EngineHabit[];
    logs: EngineLog[];
    productivity: Productivity;
    study: StudySnapshot;
  };
  goalProgress: GoalProgress[];
}
export type SavePlan = Pick<DailyPlan, 'date' | 'priorities' | 'studyTopicIds'>;
export type EveningInput = {
  date: string;
  doneIds: string[];
  journal: string;
  sleep: number | null;
  energy: number | null;
};
export type SaveGoal = Omit<Goal, 'id' | 'createdAt'> & { id?: string };
declare module './workspace' {
  interface WorkspaceRequests {
    'plan:snapshot': { input: undefined; output: ReflectionSnapshot };
    'plan:save': { input: SavePlan; output: DailyPlan };
    'plan:evening': { input: EveningInput; output: DailyPlan };
    'plan:saveSettings': { input: ReflectionSettings; output: ReflectionSettings };
    'journal:save': { input: { date: string; text: string }; output: JournalEntry };
    'journal:search': {
      input: { query: string; start?: string; end?: string };
      output: JournalEntry[];
    };
    'journal:lookup': { input: string; output: JournalEntry | null };
    'journal:lookupDates': { input: string[]; output: Record<string, string> };
    'review:generate': { input: { date: string; refresh?: boolean }; output: WeeklyReview };
    'review:save': {
      input: { start: string; obstacle: string; change: string };
      output: WeeklyReview;
    };
    'goals:save': { input: SaveGoal; output: Goal };
    'goals:archive': { input: { id: string; archived: boolean }; output: Goal };
  }
  interface WorkspaceEvents {
    'plan:changed': ReflectionSnapshot;
    'journal:changed': ReflectionSnapshot;
    'review:changed': ReflectionSnapshot;
    'goals:changed': ReflectionSnapshot;
  }
}
