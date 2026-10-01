import { useMemo, useState } from 'react';
import { Timer, CircleCheck, ListTodo, TrendingUp, Download } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useProductivity } from '../hooks/ProductivityProvider';
import { useHabitData } from '../hooks/useHabitData';
import { localDate } from '../../shared/productivity';
import { habitStats, dateRange, shiftDay, collectiveYear } from '../../shared/habits';
import Heatmap from '../components/Heatmap';
import { PageHeader, download, durationLabel } from '../components/ui';
import Analytics from './Analytics';
import { FocusBreakStatistics } from '../modules/focus/FocusBreakStatistics';
import { useReflection } from '../modules/reflection/useReflection';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../components/ui/chart';
import { useSearchParams } from 'react-router-dom';
import TimeExplorer from '../components/TimeExplorer';
const focusChart = { focus: { label: 'Focus minutes', color: 'var(--chart-1)' } };
const taskChart = { tasks: { label: 'Tasks completed', color: 'var(--chart-2)' } };
export default function Statistics() {
  const [params, setParams] = useSearchParams();
  const { state } = useProductivity();
  const { snapshot } = useReflection();
  const { active: habits, habits: allHabits, logs, today } = useHabitData();
  const [period, setPeriod] = useState('Week');
  const [start, setStart] = useState(shiftDay(today, -6));
  const [end, setEnd] = useState(today);
  const [group, setGroup] = useState('Project');
  const [advanced, setAdvanced] = useState(false);
  const changePeriod = (p: string) => {
    setPeriod(p);
    setEnd(today);
    setStart(
      p === 'Day'
        ? today
        : p === 'Week'
          ? shiftDay(today, -6)
          : p === 'Month'
            ? shiftDay(today, -29)
            : [
                ...habits.map((h) => localDate(new Date(h.created_at))),
                ...logs.map((l) => l.log_date),
                ...state.sessions.map((s) => s.date),
                ...state.tasks.map((t) => t.createdAt.slice(0, 10)),
                today,
              ].sort()[0],
    );
  };
  const sessions = state.sessions.filter(
    (s) => s.phase === 'focus' && s.date >= start && s.date <= end,
  );
  const tasks = state.tasks.filter(
    (t) =>
      t.completedAt &&
      localDate(new Date(t.completedAt)) >= start &&
      localDate(new Date(t.completedAt)) <= end,
  );
  const total = sessions.reduce((n, s) => n + s.duration, 0);
  const rates = useMemo(
    () =>
      habits.map((h) => ({
        ...h,
        stats: habitStats(h, logs, end, start),
        streak: habitStats(h, logs, today),
      })),
    [habits, logs, end, start, today],
  );
  const year = useMemo(
    () => collectiveYear(allHabits, logs, end, today),
    [allHabits, logs, end, today],
  );
  const possible = rates.reduce((n, h) => n + h.stats.possible, 0);
  const completed = rates.reduce((n, h) => n + h.stats.done, 0);
  const { focusValues, trend, groups } = useMemo(() => {
    const focusValues: Record<string, number> = {};
    state.sessions
      .filter((s) => s.phase === 'focus')
      .forEach((s) => (focusValues[s.date] = (focusValues[s.date] || 0) + s.duration / 60));
    const allDays = dateRange(start, end);
    const bucket = allDays.length > 90 ? 'month' : allDays.length > 31 ? 'week' : 'day';
    const buckets = new Map<string, { date: string; focus: number; tasks: number }>();
    const key = (date: string) =>
      bucket === 'month'
        ? date.slice(0, 7)
        : bucket === 'week'
          ? shiftDay(start, Math.floor(allDays.indexOf(date) / 7) * 7)
          : date;
    allDays.forEach((d) => {
      const k = key(d);
      if (!buckets.has(k)) buckets.set(k, { date: k, focus: 0, tasks: 0 });
    });
    sessions.forEach((s) => {
      const b = buckets.get(key(s.date));
      if (b) b.focus += s.duration / 60;
    });
    tasks.forEach((t) => {
      const b = buckets.get(key(localDate(new Date(t.completedAt!))));
      if (b) b.tasks++;
    });
    const totals: Record<string, number> = {};
    sessions.forEach((s) => {
      const name =
        group === 'Curriculum'
          ? s.link?.curriculumId
            ? snapshot?.source.study.curricula.find((c) => c.id === s.link?.curriculumId)?.title ||
              s.link.project ||
              'Archived curriculum'
            : 'Unlinked'
          : group === 'Preset'
            ? s.presetName
            : group === 'Task / habit'
              ? s.link?.name || 'Unlinked'
              : s.link?.project || 'Personal';
      totals[name] = (totals[name] || 0) + s.duration;
    });
    return {
      focusValues,
      trend: [...buckets.values()],
      groups: Object.entries(totals).sort((a, b) => b[1] - a[1]),
    };
  }, [logs, state.sessions, start, end, group, state.tasks, snapshot?.source.study.curricula]);
  const exportSessions = () => {
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    download(
      `tempo-focus-${start}-${end}.csv`,
      [
        'date,duration_seconds,preset,phase,linked_item,project',
        ...state.sessions
          .filter((s) => s.date >= start && s.date <= end)
          .map((s) =>
            [
              s.date,
              s.duration,
              escape(s.presetName),
              s.phase,
              escape(s.link?.name || ''),
              escape(s.link?.project || ''),
            ].join(','),
          ),
      ].join('\n'),
      'text/csv',
    );
  };
  const timeView = params.get('view') === 'time';
  const viewTabs = (
    <div className="tabs statistics-view-tabs" aria-label="Statistics views">
      <button
        aria-pressed={!timeView}
        className={!timeView ? 'selected' : ''}
        onClick={() => setParams({ view: 'overview' })}
      >
        Overview
      </button>
      <button
        aria-pressed={timeView}
        className={timeView ? 'selected' : ''}
        onClick={() => setParams({ view: 'time' })}
      >
        Time explorer
      </button>
    </div>
  );
  if (timeView)
    return (
      <div className="page statistics-page">
        <PageHeader title="Statistics" description="Focus history and your study-time map." />
        {viewTabs}
        <TimeExplorer initialCurriculum={params.get('curriculum') || ''} />
      </div>
    );
  return (
    <div className="page statistics-page">
      <PageHeader
        title="Statistics"
        description="Habit consistency, completed tasks and focus time."
        action={
          <button className="btn-secondary" onClick={exportSessions}>
            <Download />
            Export sessions
          </button>
        }
      />
      {viewTabs}
      <div className="stats-toolbar">
        <div className="tabs">
          {['Day', 'Week', 'Month', 'All time'].map((p) => (
            <button
              key={p}
              className={period === p ? 'selected' : ''}
              aria-pressed={period === p}
              onClick={() => changePeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="range-inputs">
          <label>
            From
            <input
              className="input"
              type="date"
              value={start}
              max={end}
              onChange={(e) => {
                if (e.target.value && e.target.value <= end) {
                  setStart(e.target.value);
                  setPeriod('Custom');
                }
              }}
            />
          </label>
          <span>—</span>
          <label>
            To
            <input
              className="input"
              type="date"
              value={end}
              min={start}
              max={today}
              onChange={(e) => {
                if (e.target.value && e.target.value >= start && e.target.value <= today) {
                  setEnd(e.target.value);
                  setPeriod('Custom');
                }
              }}
            />
          </label>
        </div>
      </div>
      <div className="summary-grid stats-summary">
        <div className="summary-card">
          <span className="summary-label">
            <Timer />
            Focus time
          </span>
          <strong>
            {Number((total / 60).toFixed(1))}
            <span> min</span>
          </strong>
          <p className="muted">{sessions.length} completed focus sessions</p>
        </div>
        <div className="summary-card">
          <span className="summary-label">
            <CircleCheck />
            Habit completion
          </span>
          <strong>
            {possible ? Math.round((completed / possible) * 100) : 0}
            <span>%</span>
          </strong>
          <p className="muted">
            {completed} of {possible} scheduled check-ins
          </p>
        </div>
        <div className="summary-card">
          <span className="summary-label">
            <ListTodo />
            Tasks completed
          </span>
          <strong>
            {tasks.length}
            <span> done</span>
          </strong>
          <p className="muted">A little less on your mind</p>
        </div>
      </div>
      <div className="chart-grid">
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>Time well spent</h2>
              <p className="muted">Completed focus time · minutes</p>
            </div>
            <TrendingUp />
          </div>
          <div
            className="chart-frame"
            role="img"
            aria-label={`Focus trend, ${Number((total / 60).toFixed(1))} minutes across ${trend.length} periods`}
          >
            <ChartContainer config={focusChart} className="chart-frame">
              <AreaChart data={trend}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 6" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => d.slice(5)}
                  stroke="var(--muted)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={28}
                />
                <YAxis
                  stroke="var(--muted)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={35}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="focus"
                  stroke="var(--color-focus)"
                  fill="var(--color-focus)"
                  fillOpacity={0.08}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ChartContainer>
          </div>
        </section>
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>Things moved forward</h2>
              <p className="muted">Tasks completed over time</p>
            </div>
            <ListTodo />
          </div>
          <div
            className="chart-frame"
            role="img"
            aria-label={`${tasks.length} tasks completed across ${trend.length} periods`}
          >
            <ChartContainer config={taskChart} className="chart-frame">
              <BarChart data={trend}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 6" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => d.slice(5)}
                  stroke="var(--muted)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={28}
                />
                <YAxis
                  allowDecimals={false}
                  stroke="var(--muted)"
                  fontSize={11}
                  width={28}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="tasks"
                  name="Tasks completed"
                  fill="var(--color-tasks)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={24}
                  isAnimationActive={false}
                />
              </BarChart>
            </ChartContainer>
          </div>
        </section>
      </div>
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Where your attention went</h2>
            <p className="muted">Focus time grouped by what matters to you.</p>
          </div>
          <select
            className="input compact-select"
            aria-label="Group focus time by"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
          >
            {['Project', 'Curriculum', 'Task / habit', 'Preset'].map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </div>
        {groups.length ? (
          groups.map(([name, seconds]) => (
            <div className="group-stat" key={name}>
              <div>
                <strong className={group === 'Task / habit' ? 'habit-name' : ''}>{name}</strong>
                <span>{durationLabel(seconds)}</span>
              </div>
              <div className="progress-track">
                <i style={{ width: `${(seconds / Math.max(1, total)) * 100}%` }} />
              </div>
            </div>
          ))
        ) : (
          <p className="muted inline-empty">
            Complete your first focus session to see where your time goes.
          </p>
        )}
      </section>
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Habit consistency</h2>
            <p className="muted">
              Streaks respect scheduled days. Completion rates use the selected range.
            </p>
          </div>
        </div>
        {rates.length ? (
          <div className="table-scroll">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Habit</th>
                  <th>Current streak</th>
                  <th>Longest streak</th>
                  <th>Completion</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((h) => (
                  <tr key={h.id}>
                    <td className="habit-name">{h.name}</td>
                    <td>
                      {h.streak.current}{' '}
                      {h.schedule_type === 'weekly_target' ? 'weeks' : 'due occurrences'}
                    </td>
                    <td>
                      {h.streak.longest}{' '}
                      {h.schedule_type === 'weekly_target' ? 'weeks' : 'due occurrences'}
                    </td>
                    <td>
                      {h.stats.rate}%
                      <span className="muted">
                        {' '}
                        · {h.stats.done}/{h.stats.possible}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted inline-empty">Your habits will find their rhythm here.</p>
        )}
      </section>
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>A year of showing up</h2>
            <p className="muted">Habit check-ins · 365 days ending {end}</p>
          </div>
        </div>
        <Heatmap details={year} end={end} />
      </section>
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>A year of attention</h2>
            <p className="muted">Focus minutes · 365 days ending {end}</p>
          </div>
        </div>
        <Heatmap values={focusValues} unit="focus minutes" end={end} label="Focus activity" />
      </section>
      <div data-focus-break-slot>
        <FocusBreakStatistics start={start} end={end} />
      </div>
      <details
        className="legacy-analytics"
        open={advanced}
        onToggle={(e) => setAdvanced(e.currentTarget.open)}
      >
        <summary>More habit insights · weekly breakdown, best days & individual trends</summary>
        {advanced && <Analytics />}
      </details>
    </div>
  );
}
