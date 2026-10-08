import { useEffect, useState } from 'react';
import { Pause, Play, ArrowUpRight, X, SlidersHorizontal } from 'lucide-react';
import { useFocus } from './useFocus';
import { useClock } from '../../hooks/useClock';
import { secondsLeft, stopwatchSeconds, timerIsRunning } from '../../../shared/productivity';
import '../../../shared/focusWidget';
import '../../styles/floating-timer.css';
export default function FloatingTimer() {
  const { snapshot, run, busy, error } = useFocus(),
    now = useClock();
  const [controls, setControls] = useState(false),
    [opacity, setOpacity] = useState(100),
    [preferenceError, setPreferenceError] = useState('');
  const [privacy, setPrivacy] = useState(localStorage.getItem('tempo-privacy') === 'true');
  useEffect(() => {
    const changed = () => setPrivacy(localStorage.getItem('tempo-privacy') === 'true');
    window.addEventListener('storage', changed);
    return () => window.removeEventListener('storage', changed);
  }, []);
  useEffect(() => {
    void window.workspaceAPI
      .invoke('window:widgetPreferences')
      .then((p) => setOpacity(Math.round(p.opacity * 100)))
      .catch((e) => setPreferenceError(e.message));
  }, []);
  const timer = snapshot?.productivity.timer;
  const seconds = timer
    ? Math.ceil(timer.stopwatch ? stopwatchSeconds(timer, now) : secondsLeft(timer, now))
    : 0;
  const time = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const running = !!timer && timerIsRunning(timer),
    strict = !!snapshot?.settings.strict && timer?.startedAt !== null;
  return (
    <section className="floating-timer" aria-label="Floating focus timer">
      <header className="drag-region">
        <span>
          {privacy && timer?.link?.type === 'habit'
            ? 'Private habit'
            : timer?.link?.name || (timer?.phase === 'focus' ? 'Focus' : 'Break')}
        </span>
        <button
          className="no-drag icon-button"
          aria-label="Hide floating timer"
          onClick={() => void window.workspaceAPI.invoke('window:widgetHide')}
        >
          <X />
        </button>
      </header>
      <div className="floating-timer-body">
        <output aria-label={timer?.stopwatch ? 'Elapsed time' : 'Remaining time'}>{time}</output>
        <div className="floating-timer-actions">
          <button
            className="icon-button"
            aria-label={running ? 'Pause focus' : 'Resume focus'}
            title={strict ? 'Strict mode is active' : running ? 'Pause' : 'Resume'}
            disabled={busy || !timer || strict}
            onClick={() =>
              void run(() =>
                window.workspaceAPI.invoke('focus:command', {
                  action: running ? 'pause' : 'start',
                }),
              )
            }
          >
            {running ? <Pause /> : <Play />}
          </button>
          <button
            className="icon-button"
            aria-label="Open Focus"
            onClick={() => void window.workspaceAPI.invoke('window:widgetOpen')}
          >
            <ArrowUpRight />
          </button>
          <button
            className="icon-button"
            aria-label="Timer appearance"
            aria-expanded={controls}
            onClick={() => setControls(!controls)}
          >
            <SlidersHorizontal />
          </button>
        </div>
      </div>
      {controls && (
        <label className="floating-opacity">
          Opacity{' '}
          <input
            aria-label="Timer opacity"
            type="range"
            min="35"
            max="100"
            value={opacity}
            onChange={(e) => {
              const value = Number(e.target.value);
              setOpacity(value);
              void window.workspaceAPI
                .invoke('window:widgetOpacity', value / 100)
                .catch((e) => setPreferenceError(e.message));
            }}
          />
          <span>{opacity}%</span>
        </label>
      )}
      {(error || preferenceError) && <p role="alert">{error || preferenceError}</p>}
    </section>
  );
}
