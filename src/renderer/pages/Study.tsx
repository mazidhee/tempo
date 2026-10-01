import { useMemo, useState } from 'react';
import {
  Plus,
  BookOpen,
  Pencil,
  Archive,
  RotateCcw,
  Trash2,
  Check,
  Timer,
  ChevronRight,
  ChevronDown,
  Upload,
  ChartNoAxesColumn,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStudy } from '../hooks/useStudy';
import { useProductivity } from '../hooks/ProductivityProvider';
import {
  curriculumProgress,
  studyTimeTotals,
  reviewGrades,
  type Curriculum,
  type StudyTopic,
  type ReviewGrade,
} from '../../shared/study';
import { localDate, focusRequest } from '../../shared/productivity';
import { PageHeader, Modal, Empty } from '../components/ui';
import { Progress } from '../components/ui/progress';
import { ChartContainer } from '../components/ui/chart';
import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import StudyImport from '../components/StudyImport';
import { formatStudyTime } from '../../shared/time';
const progressChart = { progress: { label: 'Learned', color: 'var(--ink-muted)' } };
export default function Study() {
  const { snapshot, ready, error } = useStudy();
  const { state } = useProductivity();
  const navigate = useNavigate();
  const [selected, setSelected] = useState('');
  const [archived, setArchived] = useState(false);
  const [curriculumDraft, setCurriculumDraft] = useState<Partial<Curriculum> | null>(null);
  const [topicDraft, setTopicDraft] = useState<Partial<StudyTopic> | null>(null);
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [importing, setImporting] = useState(false),
    [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const time = useMemo(() => studyTimeTotals(snapshot, state.sessions), [snapshot, state.sessions]);
  const curricula = snapshot.curricula.filter((c) => archived || !c.archived);
  const curriculum = curricula.find((c) => c.id === selected) || curricula[0];
  const topics = snapshot.topics
    .filter((t) => t.curriculumId === curriculum?.id && (archived || !t.archived))
    .sort((a, b) => a.order - b.order);
  const visible = new Set<string>();
  if (search.trim())
    for (const topic of topics.filter((t) =>
      t.title.toLowerCase().includes(search.toLowerCase()),
    )) {
      let current: StudyTopic | undefined = topic;
      while (current && !visible.has(current.id)) {
        visible.add(current.id);
        current = topics.find((t) => t.id === current!.parentId);
      }
    }
  const children = new Map<string | null, StudyTopic[]>();
  for (const topic of topics) {
    const key =
      topic.parentId && topics.some((t) => t.id === topic.parentId) ? topic.parentId : null;
    children.set(key, [...(children.get(key) ?? []), topic]);
  }
  const progress = curriculum
    ? curriculumProgress(snapshot, curriculum.id)
    : { learned: 0, total: 0, percent: 0 };
  const due = snapshot.topics.filter(
    (t) =>
      !t.archived &&
      t.learnedAt &&
      t.reviewDue &&
      t.reviewDue <= localDate() &&
      !snapshot.curricula.find((c) => c.id === t.curriculumId)?.archived,
  );
  const act = async (work: () => Promise<unknown>) => {
    setBusy(true);
    setActionError('');
    try {
      await work();
    } catch (reason) {
      setActionError(String(reason));
    } finally {
      setBusy(false);
    }
  };
  const startFocus = (topic?: StudyTopic, tracking = false) => {
    if (!curriculum) return;
    const link = {
      type: 'study' as const,
      id: topic?.id ?? curriculum.id,
      name: topic?.title ?? curriculum.title,
      curriculumId: curriculum.id,
    };
    const action = focusRequest(state.timer, link);
    if (
      action === 'confirm' &&
      !window.confirm(
        state.timer.stopwatch
          ? 'Save the current tracked time and switch to this topic?'
          : 'Replace the current focus session? Unfinished time will not be logged.',
      )
    )
      return;
    void act(async () => {
      if (action !== 'resume') {
        if (state.timer.stopwatch && state.timer.startedAt !== null)
          await window.workspaceAPI.invoke('focus:command', { action: 'stop' });
        await window.workspaceAPI.invoke('focus:command', {
          action: 'configure',
          phase: 'focus',
          timerMode: tracking ? 'stopwatch' : 'pomodoro',
          link,
        });
        await window.workspaceAPI.invoke('focus:command', { action: 'start' });
      }
      navigate('/focus');
    });
  };
  const renderTree = (parent: string | null, level = 0): React.ReactNode =>
    (children.get(parent) ?? [])
      .filter((t) => !search.trim() || visible.has(t.id))
      .map((topic) => (
        <li key={topic.id}>
          <div className="study-topic-row">
            {(children.get(topic.id)?.length ?? 0) > 0 ? (
              <button
                className="icon-button topic-expand"
                aria-label={`${expanded.has(topic.id) || search.trim() ? 'Collapse' : 'Expand'} ${topic.title}`}
                aria-expanded={expanded.has(topic.id) || !!search.trim()}
                onClick={() =>
                  setExpanded((old) => {
                    const next = new Set(old);
                    next.has(topic.id) ? next.delete(topic.id) : next.add(topic.id);
                    return next;
                  })
                }
              >
                {expanded.has(topic.id) || search.trim() ? <ChevronDown /> : <ChevronRight />}
              </button>
            ) : (
              <span className="topic-spacer" />
            )}
            <label>
              <input
                type="checkbox"
                disabled={busy || topic.archived}
                checked={!!topic.learnedAt}
                onChange={() =>
                  void act(() =>
                    window.workspaceAPI.invoke('study:learn', {
                      id: topic.id,
                      learned: !topic.learnedAt,
                    }),
                  )
                }
              />
              <span title={topic.details}>{topic.title}</span>
            </label>
            <span className="muted small">
              <strong className="study-topic-time" title="Recorded time, including subtopics">
                {formatStudyTime(time.topicSeconds[topic.id] || 0)}
              </strong>{' '}
              {topic.archived
                ? 'Archived'
                : topic.reviewDue
                  ? `Review ${topic.reviewDue}`
                  : 'To learn'}
            </span>
            <div className="row-actions">
              <button
                className="btn-secondary topic-track"
                disabled={busy || topic.archived || curriculum?.archived}
                aria-label={`Track time for ${topic.title}`}
                onClick={() => startFocus(topic, true)}
              >
                <Timer />
                Track
              </button>
              <button
                className="icon-button"
                disabled={busy || topic.archived || curriculum?.archived}
                aria-label={`Start focus for ${topic.title}`}
                title="Start Pomodoro for this topic"
                onClick={() => startFocus(topic)}
              >
                <Timer />
              </button>
              <button
                className="icon-button"
                aria-label={`Edit topic ${topic.title}`}
                onClick={() => setTopicDraft(topic)}
              >
                <Pencil />
              </button>
              <button
                className="icon-button"
                aria-label={`Add topic under ${topic.title}`}
                onClick={() =>
                  setTopicDraft({
                    curriculumId: topic.curriculumId,
                    parentId: topic.id,
                    title: '',
                    order: topics.length,
                  })
                }
              >
                <Plus />
              </button>
              <button
                className="icon-button"
                disabled={busy}
                aria-label={`${topic.archived ? 'Restore' : 'Archive'} topic ${topic.title}`}
                onClick={() =>
                  void act(() =>
                    window.workspaceAPI.invoke('study:saveTopic', {
                      ...topic,
                      archived: !topic.archived,
                    }),
                  )
                }
              >
                {topic.archived ? <RotateCcw /> : <Archive />}
              </button>
              <button
                className="icon-button"
                disabled={busy || !!topic.learnedAt}
                title={
                  topic.learnedAt ? 'Archive a studied topic to preserve its history.' : undefined
                }
                aria-label={`Delete topic ${topic.title}`}
                onClick={() => {
                  if (
                    window.confirm(`Delete “${topic.title}”? Child topics will become root topics.`)
                  )
                    void act(() => window.workspaceAPI.invoke('study:deleteTopic', topic.id));
                }}
              >
                <Trash2 />
              </button>
            </div>
          </div>
          {level < topics.length && (expanded.has(topic.id) || search.trim()) && (
            <ul>{renderTree(topic.id, level + 1)}</ul>
          )}
        </li>
      ));
  return (
    <div className="page study-page">
      <PageHeader
        title="Study"
        description="Curricula, learning progress and scheduled reviews."
        action={
          <div className="row-actions">
            <button className="btn-secondary" onClick={() => setImporting(true)}>
              <Upload />
              Import roadmaps
            </button>
            <button
              className="btn-primary"
              onClick={() => setCurriculumDraft({ title: '', description: '' })}
            >
              <Plus />
              New curriculum
            </button>
          </div>
        }
      />
      {(error || actionError) && (
        <p role="alert" className="inline-error">
          {error || actionError}
        </p>
      )}
      {!ready && !error ? (
        <p className="muted">Opening study…</p>
      ) : (
        <>
          <div className="study-toolbar">
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={archived}
                onChange={(e) => setArchived(e.target.checked)}
              />
              Show archived
            </label>
            <span className="muted">{due.length} reviews due</span>
          </div>
          <div className="study-layout">
            <aside className="panel curriculum-list" aria-label="Curricula">
              <h2>Curricula</h2>
              {curricula.map((c) => (
                <button
                  key={c.id}
                  className={`curriculum-option ${curriculum?.id === c.id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelected(c.id);
                    setExpanded(new Set());
                    setSearch('');
                  }}
                >
                  <BookOpen />
                  <span>
                    {c.title}
                    {c.archived && <small>Archived</small>}
                  </span>
                </button>
              ))}
              {!curricula.length && <p className="muted">Create a curriculum to begin.</p>}
            </aside>
            <section className="panel curriculum-content">
              {curriculum ? (
                <>
                  <div className="section-heading">
                    <div>
                      <h2>{curriculum.title}</h2>
                      <p className="muted">{curriculum.description}</p>
                    </div>
                    <div className="row-actions">
                      <button
                        className="icon-button"
                        aria-label="Edit curriculum"
                        onClick={() => setCurriculumDraft(curriculum)}
                      >
                        <Pencil />
                      </button>
                      <button
                        className="icon-button"
                        disabled={busy}
                        aria-label={
                          curriculum.archived ? 'Restore curriculum' : 'Archive curriculum'
                        }
                        onClick={() =>
                          void act(() =>
                            window.workspaceAPI.invoke('study:saveCurriculum', {
                              ...curriculum,
                              archived: !curriculum.archived,
                            }),
                          )
                        }
                      >
                        {curriculum.archived ? <RotateCcw /> : <Archive />}
                      </button>
                    </div>
                  </div>
                  <div className="study-progress">
                    <div className="study-progress-ring">
                      <ChartContainer config={progressChart}>
                        <RadialBarChart
                          data={[{ progress: progress.percent }]}
                          startAngle={90}
                          endAngle={-270}
                          innerRadius="76%"
                          outerRadius="100%"
                        >
                          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                          <RadialBar
                            dataKey="progress"
                            background={{ fill: 'var(--surface-3)' }}
                            fill="var(--color-progress)"
                            isAnimationActive={false}
                          />
                        </RadialBarChart>
                      </ChartContainer>
                      <strong>{Math.round(progress.percent)}%</strong>
                    </div>
                    <Progress value={progress.percent} aria-label="Curriculum progress" />
                    <span className="muted">
                      {progress.learned}/{progress.total} topics learned ·{' '}
                      {Math.round(progress.percent)}%{' · '}
                      {formatStudyTime(time.curriculumSeconds[curriculum.id] || 0)} recorded
                    </span>
                  </div>
                  <div className="study-toolbar">
                    <button
                      className="btn-secondary"
                      onClick={() =>
                        setTopicDraft({
                          curriculumId: curriculum.id,
                          parentId: null,
                          title: '',
                          order: topics.length,
                        })
                      }
                    >
                      <Plus />
                      Add topic
                    </button>
                    <button
                      className="btn-secondary"
                      disabled={curriculum.archived}
                      onClick={() => startFocus()}
                    >
                      <Timer />
                      Study with focus
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() =>
                        navigate(
                          `/statistics?view=time&curriculum=${encodeURIComponent(curriculum.id)}`,
                        )
                      }
                    >
                      <ChartNoAxesColumn />
                      View study time
                    </button>
                  </div>
                  <div className="study-tree-toolbar">
                    <input
                      className="input"
                      aria-label="Search study topics"
                      placeholder="Find a topic or subtopic…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <button
                      className="btn-secondary"
                      onClick={() => setExpanded(new Set(topics.map((t) => t.id)))}
                    >
                      Expand all
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        setExpanded(new Set());
                        setSearch('');
                      }}
                    >
                      Collapse all
                    </button>
                  </div>
                  <p className="muted small">
                    Time includes all sessions on a topic and its subtopics. Checkmarks track
                    learning separately; checking a topic keeps its time history.
                  </p>
                  <ul className="study-tree">{renderTree(null)}</ul>
                  {!topics.length && (
                    <Empty
                      icon={<BookOpen />}
                      title="Add your first topic"
                      description="Chapters can contain topics. Mark each learned topic to schedule its first review."
                    />
                  )}
                </>
              ) : (
                <Empty
                  icon={<BookOpen />}
                  title="Build a learning path"
                  description="Create a curriculum, then add its chapters and topics."
                />
              )}
            </section>
          </div>
          <section className="panel review-queue">
            <div className="section-heading">
              <h2>Review queue</h2>
              <span className="count-badge">{due.length}</span>
            </div>
            <p className="muted">
              Again: 1 day. Hard: previous interval × 1.2. Good: × 2. Easy: × 3. These are
              calendar-day intervals.
            </p>
            {due.map((topic) => (
              <div className="review-topic" key={topic.id}>
                <div>
                  <strong>{topic.title}</strong>
                  <p className="muted">
                    {snapshot.curricula.find((c) => c.id === topic.curriculumId)?.title} · due{' '}
                    {topic.reviewDue}
                  </p>
                </div>
                <div className="review-grades">
                  {reviewGrades.map((grade, index) => (
                    <button
                      key={grade}
                      className="btn-secondary"
                      disabled={busy}
                      onClick={() =>
                        void act(() =>
                          window.workspaceAPI.invoke('study:grade', {
                            id: topic.id,
                            grade: index as ReviewGrade,
                          }),
                        )
                      }
                    >
                      {index === 2 && <Check />}
                      {grade}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {!due.length && (
              <p className="muted inline-empty">
                No reviews due. Learned topics appear here when their review date arrives.
              </p>
            )}
          </section>
        </>
      )}
      {curriculumDraft && (
        <Modal
          title={curriculumDraft.id ? 'Edit curriculum' : 'New curriculum'}
          onClose={() => setCurriculumDraft(null)}
        >
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              void act(async () => {
                const saved = await window.workspaceAPI.invoke('study:saveCurriculum', {
                  ...curriculumDraft,
                  title: curriculumDraft.title!.trim(),
                  description: curriculumDraft.description || '',
                });
                setSelected(saved.id);
                setCurriculumDraft(null);
              });
            }}
          >
            <label>
              Title
              <input
                className="input"
                autoFocus
                required
                maxLength={200}
                value={curriculumDraft.title}
                onChange={(e) => setCurriculumDraft({ ...curriculumDraft, title: e.target.value })}
              />
            </label>
            <label>
              Description
              <textarea
                className="input"
                value={curriculumDraft.description}
                onChange={(e) =>
                  setCurriculumDraft({ ...curriculumDraft, description: e.target.value })
                }
              />
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setCurriculumDraft(null)}
              >
                Cancel
              </button>
              <button className="btn-primary" disabled={busy || !curriculumDraft.title?.trim()}>
                Save curriculum
              </button>
            </div>
          </form>
        </Modal>
      )}
      {importing && (
        <StudyImport
          onClose={() => setImporting(false)}
          onImported={(id) => {
            setSelected(id);
            setExpanded(new Set());
          }}
        />
      )}
      {topicDraft && (
        <Modal
          title={topicDraft.id ? 'Edit topic' : 'New topic'}
          onClose={() => setTopicDraft(null)}
        >
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              void act(async () => {
                await window.workspaceAPI.invoke('study:saveTopic', {
                  ...topicDraft,
                  title: topicDraft.title!.trim(),
                  curriculumId: topicDraft.curriculumId!,
                });
                setTopicDraft(null);
              });
            }}
          >
            <label>
              Title
              <input
                className="input"
                autoFocus
                required
                maxLength={200}
                value={topicDraft.title}
                onChange={(e) => setTopicDraft({ ...topicDraft, title: e.target.value })}
              />
            </label>
            <label>
              Parent chapter
              <select
                className="input"
                value={topicDraft.parentId || ''}
                onChange={(e) => setTopicDraft({ ...topicDraft, parentId: e.target.value || null })}
              >
                <option value="">Root topic</option>
                {topics
                  .filter((t) => t.id !== topicDraft.id && !t.archived)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Order
              <input
                className="input"
                type="number"
                min="0"
                value={topicDraft.order ?? 0}
                onChange={(e) => setTopicDraft({ ...topicDraft, order: Number(e.target.value) })}
              />
            </label>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setTopicDraft(null)}>
                Cancel
              </button>
              <button className="btn-primary" disabled={busy || !topicDraft.title?.trim()}>
                Save topic
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
