import {
  House,
  CalendarCheck,
  CircleCheck,
  ListTodo,
  Timer,
  BookOpen,
  BookText,
  ChartNoAxesColumnIncreasing,
  Target,
  Files,
  Settings2,
  BriefcaseBusiness,
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
  { id: 'plan', to: '/plan', label: 'Plan', icon: CalendarCheck, enabled: true },
  { id: 'habits', to: '/habits', label: 'Habits', icon: CircleCheck },
  { id: 'tasks', to: '/tasks', label: 'Tasks', icon: ListTodo },
  { id: 'work', to: '/work', label: 'Work', icon: BriefcaseBusiness },
  { id: 'focus', to: '/focus', label: 'Focus', icon: Timer },
  { id: 'study', to: '/study', label: 'Study', icon: BookOpen },
  { id: 'notes', to: '/notes', label: 'Notes', icon: Files },
  { id: 'statistics', to: '/statistics', label: 'Statistics', icon: ChartNoAxesColumnIncreasing },
  { id: 'goals', to: '/goals', label: 'Goals', icon: Target, enabled: true },
  { id: 'journal', to: '/journal', label: 'Journal', icon: BookText },
  { id: 'settings', to: '/settings', label: 'Settings', icon: Settings2 },
];
export const navigation = navigationRegistry.filter((entry) => entry.enabled !== false);
