import {
  House,
  CalendarCheck,
  CircleCheck,
  ListTodo,
  Timer,
  BookOpen,
  ChartNoAxesColumnIncreasing,
  Target,
  NotebookPen,
  Settings2,
  type LucideIcon,
} from 'lucide-react';
export interface NavigationEntry {
  id: string;
  to: string;
  label: string;
  icon: LucideIcon;
  enabled?: boolean;
}
/** Enable a module only when its route is mounted. IDs are stable integration keys. */
export const navigationRegistry: NavigationEntry[] = [
  { id: 'home', to: '/', label: 'Home', icon: House },
  { id: 'plan', to: '/plan', label: 'Plan', icon: CalendarCheck, enabled: false },
  { id: 'habits', to: '/habits', label: 'Habits', icon: CircleCheck },
  { id: 'tasks', to: '/tasks', label: 'Tasks', icon: ListTodo },
  { id: 'focus', to: '/focus', label: 'Focus', icon: Timer },
  { id: 'study', to: '/study', label: 'Study', icon: BookOpen, enabled: false },
  { id: 'statistics', to: '/statistics', label: 'Statistics', icon: ChartNoAxesColumnIncreasing },
  { id: 'goals', to: '/goals', label: 'Goals', icon: Target, enabled: false },
  { id: 'review', to: '/review', label: 'Review', icon: NotebookPen, enabled: false },
  { id: 'settings', to: '/settings', label: 'Settings', icon: Settings2 },
];
export const navigation = navigationRegistry.filter((entry) => entry.enabled !== false);
