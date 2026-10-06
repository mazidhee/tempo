import { lazy, type ReactNode } from 'react';
import { NavLink, Navigate } from 'react-router-dom';
import Home from '../pages/Home';
import Today from '../pages/Today';
import Weekly from '../pages/Weekly';
import History from '../pages/History';
import Tasks from '../pages/Tasks';
import Focus from '../pages/Focus';
import Settings from '../pages/Settings';
import HabitDetail from '../pages/HabitDetail';
import Study from '../pages/Study';
const Statistics = lazy(() => import('../pages/Statistics'));
const Plan = lazy(() => import('../modules/reflection/Plan'));
const Journal = lazy(() => import('../modules/reflection/Journal'));
const Goals = lazy(() => import('../modules/reflection/Goals'));
const Review = lazy(() => import('../modules/reflection/Review'));
const Work = lazy(() => import('../pages/Work'));
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
  { path: '/plan', render: () => <Plan /> },
  { path: '/journal', render: () => <Journal /> },
  { path: '/goals', render: () => <Goals /> },
  { path: '/review', render: () => <Review /> },
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
  {
    path: '/habits/today',
    render: () => <Navigate to="/habits" replace />,
  },
  { path: '/study', render: () => <Study /> },
  { path: '/study/:curriculumId', render: () => <Study /> },
  { path: '/habits/:id', render: () => <HabitDetail /> },
  { path: '/tasks', render: () => <Tasks /> },
  { path: '/work', render: () => <Work /> },
  { path: '/focus', render: (context) => <Focus {...context} /> },
  { path: '/statistics', render: () => <Statistics /> },
  { path: '/analytics', render: () => <Statistics /> },
  { path: '/settings', render: () => <Settings /> },
  { path: '*', render: () => <Home /> },
];
function HabitsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="legacy-page habits-workspace">
      <div className="tabs habit-tabs">
        {[
          ['/habits', 'Today'],
          ['/weekly', 'Weekly'],
          ['/history', 'History'],
        ].map(([to, label]) => (
          <NavLink key={to} to={to} end className={({ isActive }) => (isActive ? 'selected' : '')}>
            {label}
          </NavLink>
        ))}
      </div>
      {children}
    </div>
  );
}
