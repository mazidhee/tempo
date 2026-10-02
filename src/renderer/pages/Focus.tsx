import { useEffect, useState } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Plus,
  Pencil,
  Trash2,
  Maximize2,
  Minimize2,
  Shield,
  Timer,
  Square,
} from 'lucide-react';
import { useProductivity } from '../hooks/ProductivityProvider';
import { useClock } from '../hooks/useClock';
import { usePrivacy } from '../hooks/PrivacyContext';
import { useHabits } from '../hooks/useHabits';
import {
  secondsLeft,
  stopwatchSeconds,
  timerIsRunning,
  newTimer,
  localDate,
  type Preset,
  type Phase,
  type Link,
} from '../../shared/productivity';
import type { StudySnapshot } from '../../shared/study';
import { PageHeader, Modal, durationLabel } from '../components/ui';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { FocusEmergency } from '../modules/focus/EmergencyExit';
import { useFocus } from '../modules/focus/useFocus';
import { GuardNotice } from '../modules/focus/GuardNotice';
import { SearchPicker } from '../components/SearchPicker';
import { studyOptions } from '../../shared/picker';
import '../modules/focus/focus.css';
const phases: Record<Phase, string> = { focus: 'Focus', short: 'Short break', long: 'Long break' };
const dial = { center: 150, radius: 139, circumference: Math.PI * 278 };
export default function Focus({ zen, setZen }: { zen: boolean; setZen: (z: boolean) => void }) {
  const privacy = usePrivacy();
  const { state, update } = useProductivity();
  const { snapshot, error, run, busy } = useFocus();
  const now = useClock();
  const { habits } = useHabits();
  const [study, setStudy] = useState<StudySnapshot>({ curricula: [], topics: [], reviews: [] });
  useEffect(() => {
    let alive = true;
    window.workspaceAPI
      .invoke('study:snapshot')
      .then((s) => {
        if (alive) setStudy(s);
      })
      .catch(() => undefined);
    const off = window.workspaceAPI.on('study:changed', (s) => setStudy(s));
    return () => {
      alive = false;
      off();
    };
  }, []);
  const timer = state.timer;
  const [editing, setEditing] = useState<Preset | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Preset | null>(null);
  const running = timerIsRunning(timer);
  const tracking = !!timer.stopwatch;
  const inProgress = timer.startedAt !== null;
  const strict = !!snapshot?.settings.strict && inProgress;
  const preset = state.presets.find((p) => p.id === timer.presetId) || state.presets[0];
  const remaining = tracking
    ? Math.floor(stopwatchSeconds(timer, now))
    : Math.min(Math.ceil(timer.duration), Math.ceil(secondsLeft(timer, now)));
  const progress = tracking ? 0 : Math.min(1, Math.max(0, 1 - remaining / timer.duration));
  const linked = timer.link ? `${timer.link.type}:${timer.link.id}` : '';
  const links: Link[] = [
    ...state.tasks
      .filter((t) => !t.completedAt)
      .map((t) => ({ type: 'task' as const, id: t.id, name: t.title, project: t.project })),
    ...habits.map((h) => ({ type: 'habit' as const, id: String(h.id), name: h.name })),
    ...study.topics
      .filter((t) => !t.archived)
      .map((t) => ({
        type: 'study' as const,
        id: t.id,
        name: t.title,
        curriculumId: t.curriculumId,
      })),
  ];
  const configure = (options: {
    presetId?: string;
    phase?: Phase;
    link?: Link | null;
    timerMode?: 'pomodoro' | 'stopwatch';
  }) =>
    void run(() =>
      window.workspaceAPI.invoke('focus:command', { action: 'configure', ...options }),
    );
  const reset = () => {
    if (
      !tracking &&
      inProgress &&
      !window.confirm('Stop this phase? Unfinished time will not be logged.')
    )
      return;
    void run(() => window.workspaceAPI.invoke('focus:command', { action: 'stop' }));
  };
  const savePreset = (p: Preset) => {
    update((s) => ({
      ...s,
      presets: s.presets.some((x) => x.id === p.id)
        ? s.presets.map((x) => (x.id === p.id ? p : x))
        : [...s.presets, p],
      timer: newTimer(p, 'focus', s.timer.completed, s.timer.link),
    }));
    setEditing(undefined);
  };
  const todaySessions = state.sessions.filter((s) => s.date === localDate() && s.phase === 'focus');
  const events = snapshot?.events || [];
  const latest = state.sessions.at(-1);
  const latestAttempts = latest
    ? events.filter((e) => e.runId === latest.id && e.kind === 'attempt')
    : [];
  return (
    <div className="page focus-page">
      <PageHeader
        title="Focus"
        description="Use a focus rhythm or track your time as you work."
        action={
          <div className="focus-actions">
            <FocusEmergency />
            <Button variant="outline" onClick={() => setZen(!zen)}>
              {zen ? <Minimize2 /> : <Maximize2 />}
              {zen ? 'Exit focus mode' : 'Focus mode'}
            </Button>
          </div>
        }
      />
      {snapshot && <GuardNotice guard={snapshot.guard} error={error} />}
      <div className="focus-workspace">
        <section className="panel focus-timer-card" aria-label="Focus timer">
          <div className="focus-field focus-link-field">
            <span>Working on</span>
            <SearchPicker
              label="Choose focus link"
              value={linked}
              disabled={inProgress || busy}
              emptyLabel="Unlinked focus session"
              selectedLabel={
                privacy && timer.link?.type === 'habit' ? 'Private habit' : timer.link?.name
              }
              options={[
                ...links
                  .filter((l) => l.type !== 'study')
                  .map((l) => ({
                    value: `${l.type}:${l.id}`,
                    label: privacy && l.type === 'habit' ? `Private habit ${l.id}` : l.name,
                    group: l.type,
                    groupLabel: l.type === 'task' ? 'Tasks' : 'Habits',
                  })),
                ...studyOptions(study),
              ]}
              allowClear
              clearLabel="Unlinked focus session"
              onChange={(value) =>
                configure({
                  phase: timer.phase,
                  link: links.find((l) => `${l.type}:${l.id}` === value) || null,
                })
              }
            />
          </div>
          <div className="focus-phase-tabs" role="group" aria-label="Timer mode">
            <Button
              variant={!tracking ? 'secondary' : 'ghost'}
              aria-pressed={!tracking}
              disabled={inProgress}
              onClick={() => configure({ timerMode: 'pomodoro', phase: 'focus' })}
            >
              Pomodoro
            </Button>
            <Button
              variant={tracking ? 'secondary' : 'ghost'}
              aria-pressed={tracking}
              disabled={inProgress}
              onClick={() => configure({ timerMode: 'stopwatch', phase: 'focus' })}
            >
              Time tracking
            </Button>
          </div>
          {!tracking && (
            <div className="focus-phase-tabs" role="group" aria-label="Timer phase">
              {(Object.keys(phases) as Phase[]).map((p) => (
                <Button
                  variant={timer.phase === p ? 'secondary' : 'ghost'}
                  aria-pressed={timer.phase === p}
                  disabled={inProgress}
                  key={p}
                  onClick={() => configure({ phase: p })}
                >
                  {phases[p]}
                </Button>
              ))}
            </div>
          )}
          <div className="focus-ring">
            <svg viewBox="0 0 300 300" aria-hidden="true">
              <circle
                className="focus-ring-track"
                cx={dial.center}
                cy={dial.center}
                r={dial.radius}
              />
              <circle
                className="focus-ring-progress"
                cx={dial.center}
                cy={dial.center}
                r={dial.radius}
                strokeDasharray={dial.circumference}
                strokeDashoffset={dial.circumference * (1 - progress)}
              />
            </svg>
            <div className="focus-ring-content">
              <span className="muted">{tracking ? 'Time tracked' : phases[timer.phase]}</span>
              <div
                className="focus-timer-number"
                role="timer"
                aria-label={`${remaining} seconds ${tracking ? 'tracked' : 'remaining'}`}
              >
                {String(Math.floor(remaining / 60)).padStart(2, '0')}:
                {String(remaining % 60).padStart(2, '0')}
              </div>
              <span className="muted">
                {running ? 'In progress' : inProgress ? 'Paused' : 'Ready to begin'}
              </span>
            </div>
          </div>
          <div className="focus-actions">
            <Button
              variant="outline"
              size={tracking ? 'default' : 'icon'}
              aria-label={tracking ? 'Save and stop tracking' : 'Stop timer'}
              title={tracking ? 'Save and stop tracking' : 'Stop timer'}
              disabled={strict || busy}
              onClick={reset}
            >
              {tracking ? (
                <>
                  <Square />
                  Save and stop
                </>
              ) : (
                <RotateCcw />
              )}
            </Button>
            <Button
              disabled={busy || (strict && running)}
              onClick={() =>
                void run(() =>
                  window.workspaceAPI.invoke('focus:command', {
                    action: running ? 'pause' : 'start',
                  }),
                )
              }
            >
              {running ? <Pause /> : <Play />}
              {running
                ? 'Pause'
                : inProgress
                  ? 'Resume'
                  : tracking
                    ? 'Start tracking'
                    : `Start ${timer.phase === 'focus' ? 'focus' : 'break'}`}
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Skip phase"
              title="Skip phase"
              disabled={strict || tracking || busy}
              onClick={() => {
                if (
                  inProgress &&
                  !window.confirm('Skip this phase? Unfinished time will not be logged.')
                )
                  return;
                void run(() => window.workspaceAPI.invoke('focus:command', { action: 'skip' }));
              }}
            >
              <SkipForward />
            </Button>
          </div>
          {strict && (
            <p className="muted small">Strict mode is on. Use Emergency exit to end this phase.</p>
          )}
          <p className="muted small">
            {tracking
              ? 'Counts up. Pauses are excluded. Save and stop adds this time to your history.'
              : `${timer.completed} completed · long break every ${preset.cycles} sessions`}
          </p>
          <div className="focus-actions">
            <Shield />
            <span className="muted small">
              {snapshot?.guard.appsActive
                ? `${snapshot.settings.mode === 'gentle' ? 'App Guard: notify only' : 'App Guard: closes chosen apps'}${snapshot.guard.websitesActive ? ' · Websites blocked' : ''}`
                : snapshot?.guard.websitesActive
                  ? 'Websites blocked'
                  : snapshot?.guard.pending
                    ? 'Applying Guard — timer controls remain available'
                    : snapshot?.settings.enabled
                      ? 'Guard will activate when a phase starts'
                      : 'Guard is off — opt in under Settings → Focus'}
              {strict ? ' · Strict mode' : ''}
            </span>
          </div>
          <p className="muted small">
            {tracking
              ? 'Tracked time stays active until you save and stop. Pauses do not add time. Your tracker continues in the tray when the window closes.'
              : 'Phases save automatically. The next phase waits for you. Your timer continues in the tray when the window closes.'}
          </p>
        </section>
        <div>
          <section className="panel focus-rhythms">
            <div className="section-heading">
              <h2>Your rhythms</h2>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Create preset"
                disabled={inProgress}
                onClick={() => setEditing(null)}
              >
                <Plus />
              </Button>
            </div>
            {state.presets.map((p) => (
              <div className="focus-rhythm-row" key={p.id}>
                <Button
                  variant={p.id === timer.presetId ? 'secondary' : 'ghost'}
                  className="focus-rhythm-select"
                  disabled={inProgress}
                  onClick={() => configure({ presetId: p.id, timerMode: 'pomodoro' })}
                >
                  <strong>{p.name}</strong>
                  <span className="muted small">
                    {durationLabel(p.focus)} focus · {durationLabel(p.short)} break
                  </span>
                </Button>
                <div className="focus-actions">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={inProgress}
                    aria-label={`Edit preset ${p.name}`}
                    onClick={() => setEditing(p)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={inProgress || state.presets.length === 1}
                    aria-label={`Delete preset ${p.name}`}
                    onClick={() => setDeleting(p)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            ))}
            {inProgress && (
              <p className="muted small">Stop this phase before changing its rhythm or link.</p>
            )}
          </section>
          <section className="panel focus-history">
            <div className="section-heading">
              <h2>Today’s focus</h2>
              <Badge variant="secondary">{todaySessions.length} sessions</Badge>
            </div>
            <p>
              {Math.floor(todaySessions.reduce((n, s) => n + s.duration, 0) / 60)} minutes of
              attention
            </p>
            {todaySessions.length ? (
              todaySessions
                .slice(-4)
                .reverse()
                .map((s) => (
                  <div className="session-row" key={s.id}>
                    <div>
                      <strong className={s.link?.type === 'habit' ? 'habit-name' : ''}>
                        {privacy && s.link?.type === 'habit'
                          ? `Private habit ${s.link.id}`
                          : s.link?.name || s.presetName}
                      </strong>
                      <span className="muted">
                        {new Date(s.endedAt).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        · {s.presetName}
                      </span>
                    </div>
                    <span>{durationLabel(s.duration)}</span>
                  </div>
                ))
            ) : (
              <p className="muted">
                <Timer /> Your completed focus sessions will appear here.
              </p>
            )}
            {latestAttempts.length > 0 && (
              <p className="focus-summary">
                Last phase:{' '}
                {Object.entries(
                  latestAttempts.reduce<Record<string, number>>(
                    (counts, e) => ({ ...counts, [e.target]: (counts[e.target] || 0) + 1 }),
                    {},
                  ),
                )
                  .map(
                    ([name, count]) =>
                      `You tried to open ${name} ${count} ${count === 1 ? 'time' : 'times'}.`,
                  )
                  .join(' ')}
              </p>
            )}
            <p className="muted small">
              {
                events.filter(
                  (e) => e.kind === 'emergency' && localDate(new Date(e.at)) === localDate(),
                ).length
              }{' '}
              emergency focus breaks today
            </p>
          </section>
        </div>
      </div>
      {editing !== undefined && (
        <PresetForm preset={editing} onSave={savePreset} onClose={() => setEditing(undefined)} />
      )}
      {deleting && (
        <Modal title="Delete preset?" onClose={() => setDeleting(null)}>
          <p className="muted">
            Remove “{deleting.name}”? Past sessions keep their original rhythm.
          </p>
          <div className="modal-actions">
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (timer.presetId === deleting.id) {
                  const next = state.presets.find((p) => p.id !== deleting.id)!;
                  await window.workspaceAPI.invoke('focus:command', {
                    action: 'configure',
                    presetId: next.id,
                  });
                }
                update((s) => ({ ...s, presets: s.presets.filter((p) => p.id !== deleting.id) }));
                setDeleting(null);
              }}
            >
              Delete preset
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
function PresetForm({
  preset,
  onSave,
  onClose,
}: {
  preset: Preset | null;
  onSave: (p: Preset) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(preset?.name || '');
  const [durations, setDurations] = useState({
    focus: (preset?.focus || 1500) / 60,
    short: (preset?.short || 300) / 60,
    long: (preset?.long || 900) / 60,
  });
  const [cycles, setCycles] = useState(preset?.cycles || 4);
  const valid =
    !!name.trim() &&
    Object.values(durations).every((v) => Number.isFinite(v) && v > 0) &&
    Number.isInteger(cycles) &&
    cycles > 0;
  return (
    <Modal title={preset ? 'Edit preset' : 'Create a rhythm'} onClose={onClose}>
      <form
        className="form-stack"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid)
            onSave({
              id: preset?.id || crypto.randomUUID(),
              name: name.trim(),
              focus: durations.focus * 60,
              short: durations.short * 60,
              long: durations.long * 60,
              cycles,
            });
        }}
      >
        <label>
          Name
          <input
            className="input"
            required
            autoFocus
            placeholder="e.g. Deep work 50/10"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        {(Object.keys(durations) as Phase[]).map((p) => (
          <label key={p}>
            {phases[p]} <span className="muted">(minutes)</span>
            <input
              className="input"
              type="number"
              min="0.001"
              step="any"
              required
              value={durations[p]}
              onChange={(e) => setDurations({ ...durations, [p]: Number(e.target.value) })}
            />
          </label>
        ))}
        <label>
          Sessions before a long break
          <input
            className="input"
            type="number"
            min="1"
            step="1"
            required
            value={cycles}
            onChange={(e) => setCycles(Number(e.target.value))}
          />
        </label>
        <p className="muted small">
          Any positive duration, including fractional minutes. No maximum.
        </p>
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" disabled={!valid}>
            Save preset
          </button>
        </div>
      </form>
    </Modal>
  );
}
