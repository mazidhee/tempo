import { lazy, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import Home from '../pages/Home';
import Today from '../pages/Today';
import Weekly from '../pages/Weekly';
import History from '../pages/History';
import Tasks from '../pages/Tasks';
import Focus from '../pages/Focus';
import Settings from '../pages/Settings';
import HabitDetail from '../pages/HabitDetail';
const Statistics = lazy(() => import('../pages/Statistics'));
export interface RouteContext {
  zen: boolean;
  setZen: (value: boolean) => void;
}
export interface WorkspaceRoute {
  path: string;
  render: (context: RouteContext) => ReactNode;
}
export const routeRegistry: WorkspaceRoute[] = [
  { path: '/', render: () => <Home /> },
  {
    path: '/habits',
    render: () => (
      <HabitsLayout>
        <Today />
      </HabitsLayout>
    ),
  },
  {
    path: '/weekly',
    render: () => (
      <HabitsLayout>
        <Weekly />
      </HabitsLayout>
    ),
  },
  {
    path: '/history',
    render: () => (
      <HabitsLayout>
        <History />
      </HabitsLayout>
    ),
  },
  { path: '/habits/:id', render: () => <HabitDetail /> },
  { path: '/tasks', render: () => <Tasks /> },
  { path: '/focus', render: (context) => <Focus {...context} /> },
  { path: '/statistics', render: () => <Statistics /> },
  { path: '/analytics', render: () => <Statistics /> },
  { path: '/settings', render: () => <Settings /> },
  { path: '*', render: () => <Home /> },
];
function HabitsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="legacy-page">
      <div className="tabs habit-tabs">
        {[
          ['/habits', 'Today & manage'],
          ['/weekly', 'Weekly view'],
          ['/history', 'History'],
        ].map(([to, label]) => (
          <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'selected' : '')}>
            {label}
          </NavLink>
        ))}
      </div>
      {children}
    </div>
  );
}
