import { Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Search, X, Timer, Eye, EyeOff, Plus, BookOpen } from 'lucide-react';
import { FocusEmergency } from './modules/focus/EmergencyExit';
import { useFocus } from './modules/focus/useFocus';
import type { JournalEntry } from '../shared/reflection';
import Sidebar, { navigation } from './components/Sidebar';
import RecoveryNotice from './components/RecoveryNotice';
import { routeRegistry } from './registry/routes';
import { WindowControls } from './components/WindowControls';
import { Modal } from './components/ui';
import { SearchHints } from './components/SearchHints';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from './components/ui/command';
import { Toaster } from './components/ui/sonner';
import { SidebarProvider, SidebarTrigger } from './components/ui/sidebar';
import { newTimer, startTimer, localDate } from '../shared/productivity';
import { useProductivity } from './hooks/ProductivityProvider';
import { PrivacyContext } from './hooks/PrivacyContext';
import { secondsLeft, stopwatchSeconds, type Timer as TimerState } from '../shared/productivity';
import { useClock, useMinuteClock } from './hooks/useClock';
export default function App() {
  const { state, update, ready, error, dismiss } = useProductivity();
  const now = useMinuteClock();
  const location = useLocation();
  const navigate = useNavigate();
  const [command, setCommand] = useState(false);
  const [search, setSearch] = useState('');
  const [journalResults, setJournalResults] = useState<JournalEntry[]>([]);
  useEffect(() => {
    if (!command || !search.trim()) {
      setJournalResults([]);
      return;
    }
    let alive = true;
    const timeout = setTimeout(() => {
      void window.workspaceAPI
        .invoke('journal:search', { query: search })
        .then((rows) => {
          if (alive) setJournalResults(rows.slice(0, 5));
        })
        .catch(() => {
          if (alive) setJournalResults([]);
        });
    }, 180);
    return () => {
      alive = false;
      clearTimeout(timeout);
    };
  }, [command, search]);
  const [sidebarOpen, setSidebarOpen] = useState(
    () => localStorage.getItem('tempo-sidebar') !== 'collapsed',
  );
  const [zen, setZen] = useState(false);
  const [privacy, setPrivacy] = useState(localStorage.getItem('tempo-privacy') === 'true');
  useEffect(() => {
    localStorage.setItem('tempo-privacy', String(privacy));
    document.documentElement.classList.toggle('privacy', privacy);
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
  const select = (to: string) => {
    navigate(to);
    setCommand(false);
  };
  const secondaryLabels: Record<string, string> = {
    '/journal': 'Journal',
    '/history': 'History',
    '/weekly': 'Weekly habits',
    '/habits/today': 'Today’s habits',
    '/analytics': 'Statistics',
  };
  const label =
    navigation.find((n) => n.to === location.pathname)?.label ||
    secondaryLabels[location.pathname] ||
    (location.pathname.startsWith('/habits/')
      ? 'Habit details'
      : location.pathname.startsWith('/study/')
        ? 'Study'
        : 'Workspace');
  return (
    <PrivacyContext.Provider value={privacy}>
      <SidebarProvider
        open={sidebarOpen}
        onOpenChange={(open) => {
          setSidebarOpen(open);
          localStorage.setItem('tempo-sidebar', open ? 'expanded' : 'collapsed');
        }}
        className={`app-shell ${zen && location.pathname === '/focus' ? 'zen' : ''} ${privacy ? 'privacy' : ''}`}
      >
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <Sidebar
          openCommand={() => {
            setCommand(true);
            setSearch('');
          }}
        />
        <div className="main-shell">
          <div className="topbar drag-region">
            <div className="breadcrumb">
              <SidebarTrigger className="no-drag" />
              <span className="breadcrumb-workspace">Workspace</span>
              <span>/</span>
              <strong>{label}</strong>
            </div>
            <div className="topbar-actions no-drag">
              <button
                className="icon-button"
                aria-label="Toggle habit privacy"
                aria-pressed={privacy}
                title={`Privacy mode ${privacy ? 'on: habit names hidden' : 'off'} · Ctrl+Shift+P`}
                onClick={() => setPrivacy((p) => !p)}
              >
                {privacy ? <EyeOff /> : <Eye />}
              </button>
              {state.timer.startedAt !== null && location.pathname !== '/focus' && (
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
                }}
              >
                <Search />
              </button>
              <WindowControls />
            </div>
          </div>
          <FocusSafety />
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
                  {routeRegistry.map((route) => (
                    <Route
                      key={route.path}
                      path={route.path}
                      element={route.render({ zen, setZen })}
                    />
                  ))}
                </Routes>
              </Suspense>
            )}
          </main>
        </div>
        {command && (
          <Modal title="Search workspace" variant="search" onClose={() => setCommand(false)}>
            <Command>
              <CommandInput
                aria-label="Search commands"
                placeholder="Navigate, focus, or add a task…"
                value={search}
                onValueChange={setSearch}
              />
              <CommandList>
                <CommandEmpty>No matching commands.</CommandEmpty>
                <CommandGroup heading="Navigate">
                  {[
                    ...navigation,
                    { to: '/weekly', label: 'Weekly habit view', icon: Timer },
                    { to: '/habits/today', label: 'Today and manage habits', icon: Timer },
                    { to: '/history', label: 'Habit history', icon: Timer },
                  ].map(({ to, label, icon: Icon }) => (
                    <CommandItem key={to} value={label} onSelect={() => select(to)}>
                      <Icon />
                      <span>{label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandGroup heading="Focus presets">
                  {state.presets.map((preset) => (
                    <CommandItem
                      key={preset.id}
                      value={`Start focus ${preset.name}`}
                      onSelect={() => {
                        if (
                          (state.timer.deadline || state.timer.startedAt) &&
                          !window.confirm(
                            state.timer.stopwatch
                              ? 'Save the current tracked time and start this Pomodoro?'
                              : 'Replace the current focus session? Unfinished time will not be logged.',
                          )
                        )
                          return;
                        update((s) => ({
                          ...s,
                          timer: startTimer(newTimer(preset, 'focus', 0), Date.now()),
                        }));
                        select('/focus');
                      }}
                    >
                      <Timer />
                      <span>Start {preset.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                {journalResults.length > 0 && (
                  <CommandGroup heading="Journal">
                    {journalResults.map((entry) => (
                      <CommandItem
                        key={entry.date}
                        value={`Journal ${search} ${entry.date}`}
                        onSelect={() =>
                          select(`/journal?date=${entry.date}&query=${encodeURIComponent(search)}`)
                        }
                      >
                        <BookOpen />
                        <span className="reflection-journal-line">
                          {entry.date} - {entry.text.slice(0, 90)}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                <CommandGroup heading="Tasks">
                  <CommandItem
                    value={`Add task ${search}`}
                    onSelect={() => {
                      const title = search.trim().replace(/^add task\s*/i, '');
                      if (!title) {
                        select('/tasks');
                        return;
                      }
                      update((s) => ({
                        ...s,
                        tasks: [
                          ...s.tasks,
                          {
                            id: crypto.randomUUID(),
                            title,
                            due: localDate(),
                            priority: 'medium',
                            project: '',
                            tags: [],
                            subtasks: [],
                            createdAt: new Date().toISOString(),
                            completedAt: null,
                          },
                        ],
                      }));
                      select('/tasks');
                    }}
                  >
                    <Plus />
                    <span>{search.trim() ? `Add task “${search.trim()}”` : 'Add a task'}</span>
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
            <SearchHints action="Open" />
          </Modal>
        )}
        <Toaster />
      </SidebarProvider>
    </PrivacyContext.Provider>
  );
}
function FocusSafety() {
  const { snapshot } = useFocus();
  if (!snapshot || (snapshot.productivity.timer.startedAt === null && !snapshot.guard.error))
    return null;
  return (
    <div className="focus-safety no-drag">
      <FocusEmergency compact />
    </div>
  );
}
function TimerBadge({ timer, onOpen }: { timer: TimerState; onOpen: () => void }) {
  const now = useClock();
  const remaining = Math.floor(
    timer.stopwatch ? stopwatchSeconds(timer, now) : Math.ceil(secondsLeft(timer, now)),
  );
  return (
    <button
      className="timer-pill"
      title={timer.stopwatch ? 'Open time tracking' : 'Open focus timer'}
      onClick={onOpen}
    >
      <Timer />
      {String(Math.floor(remaining / 60)).padStart(2, '0')}:
      {String(remaining % 60).padStart(2, '0')}
    </button>
  );
}
