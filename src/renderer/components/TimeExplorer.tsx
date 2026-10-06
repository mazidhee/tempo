import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, CalendarDays, List } from 'lucide-react';
import { useProductivity } from '../hooks/ProductivityProvider';
import { useStudy } from '../hooks/useStudy';
import { useHabitData } from '../hooks/useHabitData';
import { usePrivacy } from '../hooks/PrivacyContext';
import { localDate, type Link, type Session } from '../../shared/productivity';
import { shiftDay } from '../../shared/habits';
import { sessionStart, formatStudyTime } from '../../shared/time';
import { activeTask, taskFocusLink } from '../../shared/taskLifecycle';
import { Modal } from './ui';
import StudySunburst from './StudySunburst';
const monday = (day: string) => shiftDay(day, -((new Date(day + 'T12:00:00').getDay() + 6) % 7));
const dateInput = (date: Date) =>
  `${localDate(date)}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
export default function TimeExplorer({ initialCurriculum = '' }: { initialCurriculum?: string }) {
  const { state } = useProductivity(),
    { snapshot: study } = useStudy(),
    { active: habits } = useHabitData();
  const privacy = usePrivacy();
  const calendarScroll = useRef<HTMLDivElement>(null);
  const [week, setWeek] = useState(monday(localDate())),
    [layout, setLayout] = useState('calendar');
  const [curriculum, setCurriculum] = useState(initialCurriculum),
    [range, setRange] = useState('all');
  const [customStart, setCustomStart] = useState(shiftDay(localDate(), -29)),
    [customEnd, setCustomEnd] = useState(localDate());
  const [editing, setEditing] = useState<Session | null | undefined>(undefined),
    [error, setError] = useState('');
  const days = Array.from({ length: 7 }, (_, index) => shiftDay(week, index));
  const from =
    range === 'week'
      ? week
      : range === 'month'
        ? `${localDate().slice(0, 7)}-01`
        : range === 'custom'
          ? customStart
          : '';
  const until =
    range === 'week'
      ? days[6]
      : range === 'month'
        ? localDate()
        : range === 'custom'
          ? customEnd
          : '9999-12-31';
  const sessions = state.sessions
    .filter(
      (s) =>
        s.phase === 'focus' &&
        (!curriculum || s.link?.curriculumId === curriculum || s.link?.id === curriculum) &&
        s.date >= from &&
        s.date <= until,
    )
    .sort((a, b) => Date.parse(b.endedAt) - Date.parse(a.endedAt));
  useEffect(() => {
    const calendar = calendarScroll.current;
    if (layout !== 'calendar' || !calendar) return;
    const start = new Date(week + 'T00:00:00').getTime();
    const end = new Date(shiftDay(week, 7) + 'T00:00:00').getTime();
    const entries = state.sessions.filter(
      (s) =>
        s.phase === 'focus' &&
        (!curriculum || s.link?.curriculumId === curriculum || s.link?.id === curriculum) &&
        s.date >= from &&
        s.date <= until &&
        sessionStart(s) < end &&
        Date.parse(s.endedAt) > start,
    );
    const todayEntries = entries.filter(
      (s) => localDate(new Date(sessionStart(s))) === localDate(),
    );
    const first = (todayEntries.length ? todayEntries : entries).sort(
      (a, b) => sessionStart(a) - sessionStart(b),
    )[0];
    const anchor = first ? new Date(Math.max(start, sessionStart(first))) : new Date();
    const hour =
      first || (localDate() >= week && localDate() < shiftDay(week, 7)) ? anchor.getHours() : 8;
    calendar.scrollTop = Math.max(0, hour - 1) * 30;
    const day = Math.max(
      0,
      Math.min(
        6,
        Math.round(
          (new Date(localDate(anchor) + 'T12:00:00').getTime() -
            new Date(week + 'T12:00:00').getTime()) /
            86400000,
        ),
      ),
    );
    const dayWidth = (calendar.scrollWidth - 64) / 7;
    calendar.scrollLeft = calendar.clientWidth < 760 ? day * dayWidth : 0;
  }, [week, layout, curriculum, from, until, state.sessions]);
  const links = useMemo<Link[]>(
    () => [
      ...state.tasks.filter(activeTask).map(taskFocusLink),
      ...habits.map((habit) => ({
        type: 'habit' as const,
        id: String(habit.id),
        name: habit.name,
      })),
      ...study.curricula.map((c) => ({
        type: 'study' as const,
        id: c.id,
        name: c.title,
        curriculumId: c.id,
      })),
      ...study.topics.map((topic) => ({
        type: 'study' as const,
        id: topic.id,
        name: topic.title,
        curriculumId: topic.curriculumId,
      })),
    ],
    [state.tasks, habits, study],
  );
  const title = (session: Session) =>
    privacy && session.link?.type === 'habit'
      ? 'Private habit'
      : session.link?.name || session.note || 'Unlinked focus';
  return (
    <div className="time-explorer">
      <section className="panel time-controls">
        <div className="section-heading">
          <div>
            <h2>Time explorer</h2>
            <p className="muted">
              {formatStudyTime(sessions.reduce((sum, s) => sum + s.duration, 0))} recorded ·{' '}
              {sessions.length} focus entries
            </p>
          </div>
          <button className="btn-primary" onClick={() => setEditing(null)}>
            <Plus />
            Add session
          </button>
        </div>
        <div className="time-filters">
          <label>
            Curriculum
            <select
              className="input"
              aria-label="Time curriculum"
              value={curriculum}
              onChange={(e) => setCurriculum(e.target.value)}
            >
              <option value="">All focus time</option>
              {study.curricula.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Date range
            <select
              className="input"
              aria-label="Time date range"
              value={range}
              onChange={(e) => setRange(e.target.value)}
            >
              <option value="all">All time</option>
              <option value="week">Displayed week</option>
              <option value="month">This month</option>
              <option value="custom">Custom dates</option>
            </select>
          </label>
          {range === 'custom' && (
            <>
              <label>
                From
                <input
                  className="input"
                  aria-label="Time from date"
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                />
              </label>
              <label>
                Until
                <input
                  className="input"
                  aria-label="Time until date"
                  type="date"
                  value={customEnd}
                  min={customStart}
                  onChange={(e) => setCustomEnd(e.target.value)}
                />
              </label>
            </>
          )}
        </div>
        <p className="muted small">
          Pomodoro, tracked and manual time share this history. Pauses do not add to recorded
          duration. Entries use their end date for daily totals.
        </p>
      </section>
      {error && (
        <p role="alert" className="inline-error">
          {error}
        </p>
      )}
      <section className="panel time-calendar-panel">
        <div className="section-heading">
          <div className="tabs" aria-label="Time views">
            <button
              className={layout === 'calendar' ? 'selected' : ''}
              aria-pressed={layout === 'calendar'}
              onClick={() => setLayout('calendar')}
            >
              <CalendarDays />
              Calendar
            </button>
            <button
              className={layout === 'list' ? 'selected' : ''}
              aria-pressed={layout === 'list'}
              onClick={() => setLayout('list')}
            >
              <List />
              Session list
            </button>
          </div>
          {layout === 'calendar' && (
            <div className="week-nav">
              <button
                className="icon-button"
                aria-label="Previous time week"
                onClick={() => setWeek(shiftDay(week, -7))}
              >
                <ChevronLeft />
              </button>
              <span>
                {week} — {days[6]}
              </span>
              <button
                className="icon-button"
                aria-label="Next time week"
                onClick={() => setWeek(shiftDay(week, 7))}
              >
                <ChevronRight />
              </button>
              <button className="btn-secondary" onClick={() => setWeek(monday(localDate()))}>
                This week
              </button>
            </div>
          )}
        </div>
        {layout === 'calendar' ? (
          <div className="time-calendar-scroll" ref={calendarScroll}>
            <div className="time-calendar" aria-label="Weekly focus timeline">
              <div className="time-hour-labels">
                <div className="time-day-heading">Local time</div>
                {Array.from({ length: 24 }, (_, hour) => (
                  <span key={hour} style={{ top: `${44 + hour * 30}px` }}>
                    {String(hour).padStart(2, '0')}:00
                  </span>
                ))}
              </div>
              {days.map((day) => {
                const start = new Date(day + 'T00:00:00').getTime(),
                  end = new Date(shiftDay(day, 1) + 'T00:00:00').getTime();
                const entries = sessions
                  .filter((s) => sessionStart(s) < end && Date.parse(s.endedAt) > start)
                  .sort((a, b) => sessionStart(a) - sessionStart(b));
                const lanes: number[] = [],
                  placed = entries.map((session) => {
                    const begins = Math.max(start, sessionStart(session)),
                      ends = Math.min(end, Date.parse(session.endedAt));
                    let lane = lanes.findIndex((last) => last <= begins);
                    if (lane < 0) lane = lanes.length;
                    lanes[lane] = ends;
                    return { session, begins, ends, lane };
                  });
                const minute = (timestamp: number) =>
                  timestamp === end
                    ? 1440
                    : new Date(timestamp).getHours() * 60 + new Date(timestamp).getMinutes();
                return (
                  <div className="time-day" key={day}>
                    <div className={`time-day-heading ${day === localDate() ? 'is-today' : ''}`}>
                      {new Date(day + 'T12:00:00').toLocaleDateString(undefined, {
                        weekday: 'short',
                      })}
                      <span>{day.slice(5)}</span>
                    </div>
                    <div className="time-day-body">
                      {Array.from({ length: 24 }, (_, hour) => (
                        <i
                          className="time-hour-line"
                          style={{ top: `${hour * 30}px` }}
                          key={hour}
                        />
                      ))}
                      {placed.map(({ session, begins, ends, lane }) => (
                        <button
                          key={session.id}
                          className="time-calendar-entry"
                          aria-label={`Edit session ${title(session)}`}
                          title={`${title(session)} · ${formatStudyTime(session.duration)} · ${new Date(begins).toLocaleTimeString()}–${new Date(ends).toLocaleTimeString()}`}
                          style={{
                            top: `${minute(begins) / 2}px`,
                            height: `${Math.max(22, (minute(ends) - minute(begins)) / 2)}px`,
                            width: `calc(${100 / Math.max(1, lanes.length)}% - 4px)`,
                            left: `${(lane * 100) / Math.max(1, lanes.length)}%`,
                          }}
                          onClick={() => setEditing(session)}
                        >
                          <strong>{title(session)}</strong>
                          <span>{formatStudyTime(session.duration)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="time-session-list">
            {sessions.slice(0, 200).map((session) => (
              <div className="time-session-row" key={session.id}>
                <div>
                  <strong>{title(session)}</strong>
                  <p className="muted">
                    {session.date} ·{' '}
                    {new Date(sessionStart(session)).toLocaleTimeString(undefined, {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    –
                    {new Date(session.endedAt).toLocaleTimeString(undefined, {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    ·{' '}
                    {session.source === 'manual'
                      ? 'Manual / edited'
                      : session.source === 'tracked'
                        ? 'Tracked'
                        : session.presetName}
                  </p>
                </div>
                <strong>{formatStudyTime(session.duration)}</strong>
                <div className="row-actions">
                  <button
                    className="icon-button"
                    aria-label={`Edit session ${title(session)}`}
                    onClick={() => setEditing(session)}
                  >
                    <Pencil />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={`Delete session ${title(session)}`}
                    onClick={async () => {
                      if (
                        !window.confirm(
                          'Delete this recorded session? Its time will be removed from all totals.',
                        )
                      )
                        return;
                      try {
                        await window.workspaceAPI.invoke('focus:deleteSession', session.id);
                      } catch (reason) {
                        setError(String(reason));
                      }
                    }}
                  >
                    <Trash2 />
                  </button>
                </div>
              </div>
            ))}
            {!sessions.length && (
              <p className="muted inline-empty">
                No focus entries in this range. Add forgotten time or start a linked session.
              </p>
            )}
            {sessions.length > 200 && (
              <p className="muted">
                Showing the latest 200 entries. Narrow the date range to find older sessions.
              </p>
            )}
          </div>
        )}
      </section>
      <StudySunburst study={study} sessions={sessions} />
      {editing !== undefined && (
        <SessionEditor
          session={editing}
          links={links}
          allSessions={state.sessions}
          privacy={privacy}
          onClose={() => setEditing(undefined)}
        />
      )}
    </div>
  );
}
function SessionEditor({
  session,
  links,
  allSessions,
  privacy,
  onClose,
}: {
  session: Session | null;
  links: Link[];
  allSessions: Session[];
  privacy: boolean;
  onClose: () => void;
}) {
  const [start, setStart] = useState(
      dateInput(new Date(session ? sessionStart(session) : Date.now() - 25 * 60000)),
    ),
    [end, setEnd] = useState(dateInput(new Date(session?.endedAt ?? Date.now())));
  const [linked, setLinked] = useState(
      session?.link ? `${session.link.type}:${session.link.id}` : '',
    ),
    [note, setNote] = useState(session?.note || ''),
    [allowOverlap, setAllowOverlap] = useState(false),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const available =
    session?.link && !links.some((l) => l.type === session.link?.type && l.id === session.link.id)
      ? [...links, session.link]
      : links;
  const duration = (Date.parse(end) - Date.parse(start)) / 1000;
  const overlap = allSessions.some(
    (s) =>
      s.id !== session?.id &&
      s.phase === 'focus' &&
      sessionStart(s) < Date.parse(end) &&
      Date.parse(s.endedAt) > Date.parse(start),
  );
  const unchangedTimes =
    !!session &&
    start === dateInput(new Date(sessionStart(session))) &&
    end === dateInput(new Date(session.endedAt));
  return (
    <Modal title={session ? 'Edit focus session' : 'Add focus session'} onClose={onClose}>
      <form
        className="form-stack"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError('');
          try {
            await window.workspaceAPI.invoke('focus:saveSession', {
              ...(session ? { id: session.id } : {}),
              startedAt: unchangedTimes
                ? new Date(sessionStart(session!)).toISOString()
                : new Date(start).toISOString(),
              endedAt: unchangedTimes ? session!.endedAt : new Date(end).toISOString(),
              preserveDuration: unchangedTimes,
              link: available.find((l) => `${l.type}:${l.id}` === linked) || null,
              note,
              allowOverlap,
            });
            onClose();
          } catch (reason) {
            setError(String(reason));
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Started
          <input
            className="input"
            type="datetime-local"
            required
            aria-label="Session start"
            value={start}
            onChange={(e) => {
              setStart(e.target.value);
              setAllowOverlap(false);
            }}
          />
        </label>
        <label>
          Ended
          <input
            className="input"
            type="datetime-local"
            required
            aria-label="Session end"
            value={end}
            onChange={(e) => {
              setEnd(e.target.value);
              setAllowOverlap(false);
            }}
          />
        </label>
        <label>
          Working on
          <select
            className="input"
            aria-label="Session working on"
            value={linked}
            onChange={(e) => setLinked(e.target.value)}
          >
            <option value="">Unlinked focus</option>
            {available.map((link) => (
              <option key={`${link.type}:${link.id}`} value={`${link.type}:${link.id}`}>
                {privacy && link.type === 'habit'
                  ? 'Private habit'
                  : `${link.type === 'study' ? 'Study' : link.type}: ${link.curriculumId && link.curriculumId !== link.id ? (links.find((l) => l.id === link.curriculumId)?.name || 'Previous curriculum') + ' › ' : ''}${link.name}`}
              </option>
            ))}
          </select>
        </label>
        <label>
          Note
          <textarea
            className="input"
            aria-label="Session note"
            maxLength={1000}
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        <p className="muted">
          {unchangedTimes
            ? formatStudyTime(session!.duration)
            : duration > 0
              ? formatStudyTime(duration)
              : 'Choose a positive duration.'}{' '}
          · updates Study totals and Statistics.
        </p>
        <p className="muted small">
          Changing start or end records the full new interval. Keeping both times preserves the
          original duration, excluding pauses.
        </p>
        {overlap && (
          <label className="toggle-row overlap-warning">
            <input
              type="checkbox"
              checked={allowOverlap}
              onChange={(e) => setAllowOverlap(e.target.checked)}
            />
            This overlaps another entry. I have checked that this time should be counted.
          </label>
        )}
        {error && (
          <p role="alert" className="inline-error">
            {error}
          </p>
        )}
        <div className="modal-actions">
          {session && (
            <button
              type="button"
              className="btn-secondary"
              disabled={busy}
              onClick={async () => {
                if (!window.confirm('Delete this entry and remove its time from all totals?'))
                  return;
                setBusy(true);
                try {
                  await window.workspaceAPI.invoke('focus:deleteSession', session.id);
                  onClose();
                } catch (reason) {
                  setError(String(reason));
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Trash2 />
              Delete entry
            </button>
          )}
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            disabled={busy || !(duration > 0) || (overlap && !allowOverlap)}
          >
            {busy ? 'Saving…' : 'Save session'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
