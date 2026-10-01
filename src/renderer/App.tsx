import React, { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Search, X, ArrowUpRight, Timer, EyeOff } from 'lucide-react';
import Sidebar, { navigation } from './components/Sidebar';
import Today from './pages/Today';
import Weekly from './pages/Weekly';
import History from './pages/History';
import Home from './pages/Home';
import Tasks from './pages/Tasks';
import Focus from './pages/Focus';
import HabitDetail from './pages/HabitDetail';
import RecoveryNotice from './components/RecoveryNotice';
const Statistics = lazy(() => import('./pages/Statistics'));
import Settings from './pages/Settings';
import { Modal } from './components/ui';
import { useProductivity } from './hooks/ProductivityProvider';
import { PrivacyContext } from './hooks/PrivacyContext';
import { secondsLeft, type Timer as TimerState } from '../shared/productivity';
import { useClock, useMinuteClock } from './hooks/useClock';
export default function App() {
  const { state, ready, error, dismiss } = useProductivity();
  const now = useMinuteClock();
  const location = useLocation();
  const navigate = useNavigate();
  const [command, setCommand] = useState(false);
  const [search, setSearch] = useState('');
  const [index, setIndex] = useState(0);
  const [zen, setZen] = useState(false);
  const [privacy, setPrivacy] = useState(localStorage.getItem('tempo-privacy') === 'true');
  useEffect(() => {
    localStorage.setItem('tempo-privacy', String(privacy));
  }, [privacy]);
  const main = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    main.current?.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommand((c) => !c);
        setSearch('');
        setIndex(0);
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setPrivacy((p) => !p);
      }
      if (e.key === 'Escape') setZen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  const commands = [
    ...navigation,
    { to: '/weekly', label: 'Weekly habit view', icon: Timer },
    { to: '/history', label: 'Habit history', icon: Timer },
  ].filter((n) => n.label.toLowerCase().includes(search.toLowerCase()));
  const select = (to: string) => {
    navigate(to);
    setCommand(false);
  };
  const label = navigation.find((n) => n.to === location.pathname)?.label || 'Habits';
  return (
    <PrivacyContext.Provider value={privacy}>
      <div
        className={`app-shell ${zen && location.pathname === '/focus' ? 'zen' : ''} ${privacy ? 'privacy' : ''}`}
      >
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <Sidebar
          openCommand={() => {
            setCommand(true);
            setSearch('');
            setIndex(0);
          }}
        />
        <div className="main-shell">
          <div className="topbar">
            <div className="breadcrumb">
              Workspace<span>/</span>
              <strong>{label}</strong>
            </div>
            <div className="topbar-actions">
              <button
                className="icon-button"
                aria-label="Toggle habit privacy"
                aria-pressed={privacy}
                title="Privacy · Ctrl+Shift+P"
                onClick={() => setPrivacy((p) => !p)}
              >
                <EyeOff />
              </button>
              {state.timer.deadline && location.pathname !== '/focus' && (
                <TimerBadge timer={state.timer} onOpen={() => navigate('/focus')} />
              )}
              <span className="topbar-date">
                {new Date(now).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              <button
                className="icon-button"
                aria-label="Open command palette"
                onClick={() => {
                  setCommand(true);
                  setSearch('');
                  setIndex(0);
                }}
              >
                <Search />
              </button>
            </div>
          </div>
          {error && (
            <div className="error-banner" role="alert">
              {error}
              <button className="icon-button" aria-label="Dismiss error" onClick={dismiss}>
                <X />
              </button>
            </div>
          )}
          <main ref={main} id="main-content" className="main-content" tabIndex={-1}>
            {ready && <RecoveryNotice />}
            {!ready ? (
              <div className="empty">
                <p>
                  {error
                    ? 'Local data could not be opened. Restart the app to try again.'
                    : 'Opening your workspace…'}
                </p>
              </div>
            ) : (
              <Suspense fallback={<div className="empty muted">Opening your insights…</div>}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route
                    path="/habits"
                    element={
                      <HabitsLayout>
                        <Today />
                      </HabitsLayout>
                    }
                  />
                  <Route
                    path="/weekly"
                    element={
                      <HabitsLayout>
                        <Weekly />
                      </HabitsLayout>
                    }
                  />
                  <Route
                    path="/history"
                    element={
                      <HabitsLayout>
                        <History />
                      </HabitsLayout>
                    }
                  />
                  <Route path="/habits/:id" element={<HabitDetail />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/focus" element={<Focus zen={zen} setZen={setZen} />} />
                  <Route path="/statistics" element={<Statistics />} />
                  <Route path="/analytics" element={<Statistics />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Home />} />
                </Routes>
              </Suspense>
            )}
          </main>
        </div>
        {command && (
          <Modal title="Go somewhere" onClose={() => setCommand(false)}>
            <input
              className="input command-input"
              aria-label="Search commands"
              placeholder="Search your workspace…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setIndex(0);
              }}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setIndex((i) => (i + 1) % Math.max(1, commands.length));
                }
                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setIndex((i) => (i - 1 + commands.length) % Math.max(1, commands.length));
                }
                if (e.key === 'Enter' && commands[index]) {
                  e.preventDefault();
                  select(commands[index].to);
                }
              }}
            />
            <div className="command-list">
              {commands.map(({ to, label, icon: Icon }, i) => (
                <button
                  className={`command-option ${i === index ? 'selected' : ''}`}
                  key={to}
                  onClick={() => select(to)}
                >
                  <Icon />
                  <span>{label}</span>
                  <ArrowUpRight />
                </button>
              ))}
              {!commands.length && <p className="muted">No matching commands.</p>}
            </div>
            <p className="command-hint muted">↑ ↓ to navigate · Enter to open · Esc to close</p>
          </Modal>
        )}
      </div>
    </PrivacyContext.Provider>
  );
}
function TimerBadge({ timer, onOpen }: { timer: TimerState; onOpen: () => void }) {
  const now = useClock();
  const remaining = Math.ceil(secondsLeft(timer, now));
  return (
    <button className="timer-pill" onClick={onOpen}>
      <Timer />
      {String(Math.floor(remaining / 60)).padStart(2, '0')}:
      {String(remaining % 60).padStart(2, '0')}
    </button>
  );
}
function HabitsLayout({ children }: { children: React.ReactNode }) {
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
