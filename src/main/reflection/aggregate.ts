import {
  dateRange,
  dayOutcome,
  habitStats,
  isComplete,
  isDue,
  logFor,
  periodSummary,
  shiftDay,
  weekStart,
} from '../../shared/habits';
import type { EngineHabit, EngineLog } from '../../shared/habits';
import { localDate, type Productivity, type Session } from '../../shared/productivity';
import type { StudySnapshot } from '../../shared/study';
import type { Goal, GoalProgress, ReflectionData, WeeklySummary } from '../../shared/reflection';
export interface Sources {
  habits: EngineHabit[];
  logs: EngineLog[];
  productivity: Productivity;
  study: StudySnapshot;
}
const within = (value: string | null, start: string, end: string) =>
  !!value && localDate(new Date(value)) >= start && localDate(new Date(value)) <= end;
const counts = (): Record<string, number> => Object.create(null) as Record<string, number>;
function closedStreak(habit: EngineHabit, logs: EngineLog[], boundary: string) {
  // The canonical engine keeps its current day open. Advance the observation day
  // without including later logs so a closed boundary miss really ends the run.
  return habitStats(
    habit,
    logs.filter((log) => log.log_date <= boundary),
    shiftDay(boundary, 1),
  ).current;
}
export function sessionProject(session: Session, state: Productivity) {
  return (
    session.link?.project ||
    state.tasks.find((t) => session.link?.type === 'task' && t.id === session.link.id)?.project ||
    'Unassigned'
  );
}
export function sessionCurriculum(session: Session, study: StudySnapshot) {
  return (
    session.link?.curriculumId ||
    study.topics.find((t) => session.link?.type === 'study' && t.id === session.link.id)
      ?.curriculumId ||
    'Unassigned'
  );
}
export function chapterTopics(study: StudySnapshot, id: string) {
  const ids = new Set([id]);
  for (let changed = true; changed;) {
    changed = false;
    for (const t of study.topics)
      if (t.parentId && ids.has(t.parentId) && !ids.has(t.id)) {
        ids.add(t.id);
        changed = true;
      }
  }
  return study.topics.filter((t) => ids.has(t.id) && !t.archived);
}
export function weeklySummary(
  source: Sources,
  data: ReflectionData,
  start: string,
  asOf: string,
): WeeklySummary {
  const end = shiftDay(start, 6),
    observed = end < asOf ? end : asOf;
  const days = dateRange(start, observed),
    reasons = counts();
  const habits = source.habits
    .filter(
      (h) =>
        !h.is_archived ||
        source.logs.some(
          (l) => l.habit_id === h.id && l.log_date >= start && l.log_date <= observed,
        ),
    )
    .map((h) => {
      const outcomes = days.map((d) => dayOutcome(h, source.logs, d, asOf));
      const hits = days.filter(
        (d) => isDue(h, d) && isComplete(h, logFor(source.logs, h, d)),
      ).length;
      const freezes = outcomes.filter((o) => o === 'freeze').length;
      let target = days.filter((d) => isDue(h, d)).length,
        weeklyMisses = 0;
      if (h.schedule_type === 'weekly_target') {
        const periods = new Set(days.map((d) => weekStart(d, h.week_start ?? 1)));
        target = [...periods].reduce((n, d) => {
          const period = periodSummary(h, source.logs, d, observed);
          if (period.end < asOf)
            weeklyMisses += Math.max(0, period.target - period.done - period.frozen);
          return (
            n +
            (period.end <= observed
              ? period.target
              : Math.min(period.target, period.done + period.frozen))
          );
        }, 0);
      }
      for (const l of source.logs.filter(
        (l) => l.habit_id === h.id && l.log_date >= start && l.log_date <= observed,
      )) {
        const reason = l.missed_reason || l.slip_reason;
        if (reason && !isComplete(h, l) && l.outcome !== 'freeze')
          reasons[reason] = (reasons[reason] || 0) + 1;
      }
      return {
        id: h.id,
        name: h.name || 'Habit',
        hits,
        target,
        misses:
          h.schedule_type === 'weekly_target'
            ? weeklyMisses
            : outcomes.filter((o) => o === 'missed' || o === 'slip').length,
        freezes,
        streakBefore: closedStreak(h, source.logs, shiftDay(start, -1)),
        streakAfter:
          observed < asOf
            ? closedStreak(h, source.logs, observed)
            : habitStats(h, source.logs, observed).current,
      };
    });
  const sessions = source.productivity.sessions.filter(
    (s) => s.phase === 'focus' && s.date >= start && s.date <= observed,
  );
  const byProject = counts(),
    byCurriculum = counts(),
    byPreset = counts(),
    byDay = counts();
  for (const s of sessions) {
    const project = sessionProject(s, source.productivity),
      curriculumId = sessionCurriculum(s, source.study),
      curriculum = source.study.curricula.find((c) => c.id === curriculumId)?.title || curriculumId;
    byProject[project] = (byProject[project] || 0) + s.duration;
    byCurriculum[curriculum] = (byCurriculum[curriculum] || 0) + s.duration;
    byPreset[s.presetName] = (byPreset[s.presetName] || 0) + s.duration;
    byDay[s.date] = (byDay[s.date] || 0) + s.duration;
  }
  const reviews = source.study.reviews.filter((r) => within(r.reviewedAt, start, observed)),
    retained = reviews.filter((r) => r.grade >= 2).length;
  const plans = data.plans.filter((p) => p.date >= start && p.date <= observed);
  const correlations: string[] = [];
  for (const [field, threshold] of [
    ['sleep', 7],
    ['energy', 4],
  ] as const) {
    const measured = plans.filter((p) => p.evening[field] !== null),
      high = measured.filter((p) => p.evening[field]! >= threshold),
      low = measured.filter((p) => p.evening[field]! < threshold);
    if (measured.length >= 3 && high.length && low.length) {
      const mean = (ps: typeof plans) =>
        Math.round(ps.reduce((n, p) => n + (byDay[p.date] || 0) / 60, 0) / ps.length);
      correlations.push(
        `Correlation only: days with ${field} ${field === 'sleep' ? '≥ 7 hours' : '≥ 4/5'} averaged ${mean(high)} focus minutes; other recorded days averaged ${mean(low)} (${measured.length} days, no causal claim).`,
      );
    }
  }
  return {
    habits,
    reasons,
    focus: {
      seconds: sessions.reduce((n, s) => n + s.duration, 0),
      previousSeconds: source.productivity.sessions
        .filter((s) => s.phase === 'focus' && s.date >= shiftDay(start, -7) && s.date < start)
        .reduce((n, s) => n + s.duration, 0),
      byProject,
      byCurriculum,
      byPreset,
      daily: dateRange(start, end).map((date) => ({
        date,
        seconds: date <= observed ? byDay[date] || 0 : null,
      })),
      bestDay:
        Object.entries(byDay).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ||
        null,
    },
    study: {
      topicsLearned: source.study.topics.filter((t) => within(t.learnedAt, start, observed)).length,
      reviews: reviews.length,
      retained,
      retentionPercent: reviews.length ? Math.round((retained / reviews.length) * 100) : null,
      retentionLabel:
        'Good or Easy grades / all reviews; self-reported recall, not a measured retention test',
      progress: source.study.curricula.map((c) => {
        const topics = source.study.topics.filter((t) => t.curriculumId === c.id && !t.archived);
        return {
          id: c.id,
          title: c.title,
          learned: topics.filter((t) => t.learnedAt).length,
          total: topics.length,
        };
      }),
    },
    tasks: {
      completed: source.productivity.tasks.filter((t) => within(t.completedAt, start, observed))
        .length,
      created: source.productivity.tasks.filter((t) => within(t.createdAt, start, observed)).length,
    },
    plans: {
      done: plans.reduce((n, p) => n + p.priorities.filter((q) => q.done).length, 0),
      total: plans.reduce((n, p) => n + p.priorities.length, 0),
      evenings: plans.filter((p) => p.evening.completedAt).length,
    },
    journal: data.journal.filter((j) => j.date >= start && j.date <= observed),
    correlations,
  };
}
export function goalProgress(goal: Goal, source: Sources, today: string): GoalProgress {
  const end = today < goal.deadline ? today : goal.deadline;
  let current = 0,
    target = goal.target,
    detail = '';
  if (goal.kind === 'habit') {
    const habit = source.habits.find((h) => String(h.id) === goal.linkId);
    target = goal.weeks;
    if (habit)
      for (let i = 0; i < goal.weeks; i++) {
        const start = shiftDay(goal.start, i * 7),
          finish = shiftDay(start, 6);
        if (start > end) break;
        const hits = dateRange(start, finish < end ? finish : end).filter(
          (d) => isDue(habit, d) && isComplete(habit, logFor(source.logs, habit, d)),
        ).length;
        if (hits >= goal.target) current++;
      }
    detail = `${goal.target} completions per 7-day period for ${goal.weeks} weeks. Freezes preserve streaks but do not count as completions.`;
  } else if (goal.kind === 'focus') {
    current = source.productivity.sessions
      .filter((s) => s.phase === 'focus' && s.date >= goal.start && s.date <= end)
      .filter(
        (s) =>
          goal.linkType === 'all' ||
          (goal.linkType === 'project' && sessionProject(s, source.productivity) === goal.linkId) ||
          (goal.linkType === 'curriculum' && sessionCurriculum(s, source.study) === goal.linkId) ||
          (goal.linkType === 'tag' &&
            source.productivity.tasks.some(
              (t) => s.link?.type === 'task' && t.id === s.link.id && t.tags.includes(goal.linkId),
            )),
      )
      .reduce((n, s) => n + s.duration / 3600, 0);
    detail = 'Completed focus hours in the goal period.';
  } else if (goal.kind === 'chapter') {
    const topics =
      goal.linkType === 'chapter'
        ? chapterTopics(source.study, goal.linkId)
        : source.study.topics.filter((t) => t.curriculumId === goal.linkId && !t.archived);
    target = topics.length;
    current = topics.filter((t) => t.learnedAt && localDate(new Date(t.learnedAt)) <= end).length;
    detail = `${current} of ${target} linked topics learned.`;
  } else {
    current = source.productivity.tasks.filter(
      (t) =>
        within(t.completedAt, goal.start, end) &&
        (goal.linkType === 'all' ||
          (goal.linkType === 'project' && t.project === goal.linkId) ||
          (goal.linkType === 'tag' && t.tags.includes(goal.linkId))),
    ).length;
    detail = 'Tasks completed in the goal period.';
  }
  const percent = target ? Math.min(100, (current / target) * 100) : 0;
  const span = (Date.parse(goal.deadline) - Date.parse(goal.start)) / 86400000 + 1,
    elapsed = Math.max(0, Math.min(span, (Date.parse(today) - Date.parse(goal.start)) / 86400000));
  let expected = (target * elapsed) / span;
  if (goal.kind === 'habit') expected = Math.min(goal.weeks, Math.floor(elapsed / 7));
  return {
    goal,
    current,
    target,
    percent,
    status:
      target > 0 && current >= target
        ? 'complete'
        : today > goal.deadline || current + 1e-8 < expected
          ? 'behind'
          : 'on-track',
    detail,
  };
}
