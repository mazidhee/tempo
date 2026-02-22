import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  CalendarCheck,
  LayoutGrid,
  Clock,
  BarChart3,
  Archive,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const navItems = [
  { to: '/', icon: CalendarCheck, label: 'Today' },
  { to: '/weekly', icon: LayoutGrid, label: 'Weekly' },
  { to: '/history', icon: Clock, label: 'History' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
];

export default function Sidebar() {
  const { isDark, toggle } = useTheme();
  const location = useLocation();

  return (
    <aside className="w-[220px] h-screen flex flex-col bg-white dark:bg-slate-950 border-r border-gray-200 dark:border-slate-800 select-none">
      <div className="drag-region h-14 flex items-center px-5 border-b border-gray-100 dark:border-slate-800/50">
        <div className="no-drag flex items-center gap-2.5 mt-1">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
            <CalendarCheck className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight text-gray-900 dark:text-white">
            Habit Tracker
          </span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors
                ${
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800/60 hover:text-gray-900 dark:hover:text-gray-200'
                }
              `}
            >
              <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-brand-600 dark:text-brand-400' : ''}`} />
              {label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-100 dark:border-slate-800/50 space-y-0.5">
        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800/60 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
        >
          {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>
    </aside>
  );
}
