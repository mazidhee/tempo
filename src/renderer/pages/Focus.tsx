import { useState } from 'react';
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
  Timer,
  Check,
} from 'lucide-react';
import { useProductivity } from '../hooks/ProductivityProvider';
import { useClock } from '../hooks/useClock';
import { usePrivacy } from '../hooks/PrivacyContext';
import { useHabits } from '../hooks/useHabits';
import {
  finishTimer,
  newTimer,
  pauseTimer,
  secondsLeft,
  startTimer,
  localDate,
  type Preset,
  type Phase,
  type Link,
} from '../../shared/productivity';
import { PageHeader, Modal, durationLabel } from '../components/ui';
const phases: Record<Phase, string> = { focus: 'Focus', short: 'Short break', long: 'Long break' };
export default function Focus({ zen, setZen }: { zen: boolean; setZen: (z: boolean) => void }) {
  const privacy = usePrivacy();
  const { state, update } = useProductivity();
  const now = useClock();
  const { habits } = useHabits();
  const timer = state.timer;
  const [editing, setEditing] = useState<Preset | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Preset | null>(null);
  const running = timer.deadline !== null;
  const inProgress = timer.startedAt !== null;
  const preset = state.presets.find((p) => p.id === timer.presetId)!;
  const remaining = Math.ceil(secondsLeft(timer, now));
  const progress = 1 - remaining / timer.duration;
  const linked = timer.link ? `${timer.link.type}:${timer.link.id}` : '';
  const links: Link[] = [
    ...state.tasks
      .filter((t) => !t.completedAt)
      .map((t) => ({ type: 'task' as const, id: t.id, name: t.title, project: t.project })),
    ...habits.map((h) => ({ type: 'habit' as const, id: String(h.id), name: h.name })),
  ];
  const changePreset = (p: Preset) =>
    update((s) => ({ ...s, timer: newTimer(p, 'focus', 0, s.timer.link) }));
  const reset = () => {
    if (inProgress && !window.confirm('Reset this phase? Unfinished time will not be logged.'))
      return;
    update((s) => ({ ...s, timer: newTimer(preset, timer.phase, timer.completed, timer.link) }));
  };
  const savePreset = (p: Preset) => {
    update((s) => {
      const presets = s.presets.some((x) => x.id === p.id)
        ? s.presets.map((x) => (x.id === p.id ? p : x))
        : [...s.presets, p];
      return { ...s, presets, timer: newTimer(p, 'focus', 0, s.timer.link) };
    });
    setEditing(undefined);
  };
  const todaySessions = state.sessions.filter((s) => s.date === localDate() && s.phase === 'focus');
  return (
    <div className="page focus-page">
      <PageHeader
        eyebrow="ONE THING AT A TIME"
        title="Find your flow."
        description="Give your attention a little room to breathe."
        action={
          <button className="btn-secondary" onClick={() => setZen(!zen)}>
            {zen ? <Minimize2 /> : <Maximize2 />}
            {zen ? 'Exit focus mode' : 'Focus mode'}
          </button>
        }
      />
      <div className="focus-layout">
        <section className="panel timer-panel">
          <div className="tabs phase-tabs">
            {(Object.keys(phases) as Phase[]).map((p) => (
              <button
                disabled={inProgress}
                key={p}
                className={timer.phase === p ? 'selected' : ''}
                onClick={() =>
                  update((s) => ({ ...s, timer: newTimer(preset, p, timer.completed, timer.link) }))
                }
              >
                {phases[p]}
              </button>
            ))}
          </div>
          <div className="timer-dial">
            <svg viewBox="0 0 300 300" aria-hidden="true">
              <circle className="dial-track" cx="150" cy="150" r="139" />
              <circle
                className="dial-progress"
                cx="150"
                cy="150"
                r="139"
                strokeDasharray="873.36"
                strokeDashoffset={873.36 * (1 - Math.max(0, progress))}
              />
            </svg>
            <div className="timer-display">
              <span className="eyebrow">{phases[timer.phase]}</span>
              <div
                className="timer-digits"
                role="timer"
                aria-label={`${remaining} seconds remaining`}
              >
                {String(Math.floor(remaining / 60)).padStart(2, '0')}
                <span>:</span>
                {String(remaining % 60).padStart(2, '0')}
              </div>
              <span className="muted">
                {running
                  ? 'You’re right where you need to be.'
                  : inProgress
                    ? 'Take your time. It’s paused.'
                    : 'Ready when you are.'}
              </span>
            </div>
          </div>
          <div className="timer-controls">
            <button
              className="icon-button"
              aria-label="Reset timer"
              title="Reset timer"
              onClick={reset}
            >
              <RotateCcw />
            </button>
            <button
              className="btn-primary start-button"
              onClick={() =>
                update((s) => ({
                  ...s,
                  timer: running
                    ? pauseTimer(s.timer, Date.now())
                    : startTimer(s.timer, Date.now()),
                }))
              }
            >
              {running ? <Pause /> : <Play />}
              {running
                ? 'Pause'
                : inProgress
                  ? 'Resume'
                  : `Start ${timer.phase === 'focus' ? 'focus' : 'break'}`}
            </button>
            <button
              className="icon-button"
              aria-label="Skip phase"
              title="Skip phase"
              onClick={() => {
                if (
                  inProgress &&
                  !window.confirm('Skip this phase? Unfinished time will not be logged.')
                )
                  return;
                update((s) => finishTimer(s, Date.now(), true));
              }}
            >
              <SkipForward />
            </button>
          </div>
          <div className="session-counter">
            <div>
              {Array.from({ length: Math.min(preset.cycles, 12) }, (_, i) => (
                <i key={i} className={i < timer.completed % preset.cycles ? 'filled' : ''} />
              ))}
            </div>
            <span className="muted">
              {timer.completed} completed · long break every {preset.cycles} sessions
            </span>
          </div>
          <label className="focus-link-label">
            Working on
            <select
              className={`input ${timer.link?.type === 'habit' ? 'habit-name' : ''}`}
              disabled={inProgress}
              value={linked}
              onChange={(e) =>
                update((s) => ({
                  ...s,
                  timer: {
                    ...s.timer,
                    link: links.find((x) => `${x.type}:${x.id}` === e.target.value) || null,
                  },
                }))
              }
            >
              <option value="">Unlinked focus session</option>
              {timer.link && !links.some((x) => `${x.type}:${x.id}` === linked) && (
                <option value={linked}>
                  {privacy && timer.link.type === 'habit'
                    ? `Private habit ${timer.link.id}`
                    : timer.link.name}
                </option>
              )}
              <optgroup label="Tasks">
                {links
                  .filter((l) => l.type === 'task')
                  .map((l) => (
                    <option key={l.id} value={`task:${l.id}`}>
                      {privacy && l.type === 'habit' ? `Private habit ${l.id}` : l.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Habits">
                {links
                  .filter((l) => l.type === 'habit')
                  .map((l) => (
                    <option key={l.id} value={`habit:${l.id}`}>
                      {privacy && l.type === 'habit' ? `Private habit ${l.id}` : l.name}
                    </option>
                  ))}
              </optgroup>
            </select>
          </label>
          <p className="muted small">
            Completed phases save automatically. The next phase waits for you.
          </p>
        </section>
        <div className="focus-details">
          <section className="panel presets-panel">
            <div className="section-heading">
              <h2>Your rhythms</h2>
              <button
                className="icon-button"
                aria-label="Create preset"
                disabled={inProgress}
                onClick={() => setEditing(null)}
              >
                <Plus />
              </button>
            </div>
            <p className="muted">Different days, different rhythms.</p>
            <div className="preset-list">
              {state.presets.map((p) => (
                <div key={p.id} className={`preset-row ${timer.presetId === p.id ? 'active' : ''}`}>
                  <button
                    className="preset-select"
                    disabled={inProgress}
                    onClick={() => changePreset(p)}
                  >
                    <span className="preset-icon">
                      {timer.presetId === p.id ? <Check /> : <Timer />}
                    </span>
                    <span>
                      <strong>{p.name}</strong>
                      <span className="muted">
                        {durationLabel(p.focus)} focus · {durationLabel(p.short)} break
                      </span>
                    </span>
                  </button>
                  <div className="row-actions">
                    <button
                      className="icon-button"
                      disabled={inProgress}
                      aria-label={`Edit preset ${p.name}`}
                      onClick={() => setEditing(p)}
                    >
                      <Pencil />
                    </button>
                    <button
                      className="icon-button"
                      disabled={inProgress || state.presets.length === 1}
                      aria-label={`Delete preset ${p.name}`}
                      onClick={() => setDeleting(p)}
                    >
                      <Trash2 />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {inProgress && (
              <p className="small muted">Reset this phase before changing its rhythm or link.</p>
            )}
          </section>
          <section className="panel">
            <div className="section-heading">
              <h2>Today’s focus</h2>
              <span className="count-badge">{todaySessions.length} sessions</span>
            </div>
            <div className="focus-total">
              {Math.floor(todaySessions.reduce((n, s) => n + s.duration, 0) / 60)}
              <span className="muted"> minutes of attention</span>
            </div>
            {todaySessions.length ? (
              todaySessions
                .slice(-4)
                .reverse()
                .map((s) => (
                  <div className="session-row" key={s.id}>
                    <div>
                      <strong className={s.link?.type === 'habit' ? 'habit-name' : ''}>
                        {s.link?.name || s.presetName}
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
              <p className="muted">Your first session is a fresh start.</p>
            )}
          </section>
          <div className="focus-note">
            <span className="eyebrow">A GENTLE REMINDER</span>
            <p>
              Progress comes from showing up.
              <br />
              The pace is yours to choose.
            </p>
          </div>
        </div>
      </div>
      {editing !== undefined && (
        <PresetForm preset={editing} onSave={savePreset} onClose={() => setEditing(undefined)} />
      )}
      {deleting && (
        <Modal title="Delete preset?" onClose={() => setDeleting(null)}>
          <p className="muted">
            Remove “{deleting.name}”? Past session records will keep their original rhythm.
          </p>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setDeleting(null)}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                update((s) => {
                  const presets = s.presets.filter((p) => p.id !== deleting.id);
                  return {
                    ...s,
                    presets,
                    timer:
                      s.timer.presetId === deleting.id
                        ? newTimer(presets[0], 'focus', 0, s.timer.link)
                        : s.timer,
                  };
                });
                setDeleting(null);
              }}
            >
              Delete preset
            </button>
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
