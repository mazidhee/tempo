import { CurriculumCover } from '../components/CurriculumCover';
import '../styles/document-pages.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus,
  BookOpen,
  Pencil,
  Archive,
  RotateCcw,
  Trash2,
  Timer,
  ChevronRight,
  Upload,
  ArrowLeft,
  MoreHorizontal,
  Target,
  Play,
  ChartNoAxesColumn,
} from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useStudy } from '../hooks/useStudy';
import { useStudyFocus } from '../hooks/useStudyFocus';
import { useProductivity } from '../hooks/ProductivityProvider';
import {
  curriculumProgress,
  studyTimeTotals,
  reviewGrades,
  type Curriculum,
  type StudyTopic,
  type ReviewGrade,
} from '../../shared/study';
import { localDate } from '../../shared/productivity';
import {
  activeStudyTopics,
  isStudyFocus,
  studyContinuation,
  topicPath,
} from '../../shared/studyContinuity';
import { studyOptions } from '../../shared/picker';
import { PageHeader, Modal, Empty } from '../components/ui';
import { Progress } from '../components/ui/progress';
import { SearchPicker } from '../components/SearchPicker';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../components/ui/dropdown-menu';
import StudyImport from '../components/StudyImport';
import { formatStudyTime } from '../../shared/time';
import '../styles/study-workspace.css';

const pageSize = 30;
export default function Study() {
  const { snapshot, ready, error } = useStudy();
  const { state } = useProductivity();
  const focus = useStudyFocus(),
    navigate = useNavigate(),
    { curriculumId } = useParams();
  const [params, setParams] = useSearchParams();
  const [archived, setArchived] = useState(false),
    [search, setSearch] = useState(''),
    [page, setPage] = useState(0);
  const [tab, setTab] = useState('topics'),
    [busy, setBusy] = useState(false),
    [actionError, setActionError] = useState('');
  const working = useRef(false);
  const [curriculumDraft, setCurriculumDraft] = useState<Partial<Curriculum> | null>(null);
  const [topicDraft, setTopicDraft] = useState<Partial<StudyTopic> | null>(null),
    [importing, setImporting] = useState(false);
  useEffect(() => {
    setSearch('');
    setPage(0);
    setTab('topics');
  }, [curriculumId]);
  useEffect(() => {
    setPage(0);
  }, [search, tab, params.toString(), archived]);
  const curriculum = snapshot.curricula.find((c) => c.id === curriculumId);
  const curricula = snapshot.curricula.filter((c) => archived || !c.archived);
  const topics = useMemo(
    () =>
      archived
        ? snapshot.topics
            .filter((t) => t.curriculumId === curriculumId)
            .sort((a, b) => a.order - b.order)
        : activeStudyTopics(snapshot, curriculumId || ''),
    [snapshot, curriculumId, archived],
  );
  const time = useMemo(() => studyTimeTotals(snapshot, state.sessions), [snapshot, state.sessions]);
  const progress = curriculum
    ? curriculumProgress(snapshot, curriculum.id)
    : { total: 0, learned: 0, percent: 0 };
  const continuation = curriculum
    ? studyContinuation(snapshot, curriculum, state.sessions, state.timer)
    : null;
  const selectedTopic = topics.find((t) => t.id === params.get('topic'));
  const inspector = useRef<HTMLElement>(null);
  useEffect(() => {
    if (selectedTopic) inspector.current?.scrollIntoView({ block: 'nearest' });
  }, [selectedTopic?.id]);
  const parent =
    topics.find((t) => t.id === params.get('chapter')) ??
    (selectedTopic?.parentId ? topics.find((t) => t.id === selectedTopic.parentId) : undefined);
  const hasChildren = new Set(topics.map((t) => t.parentId));
  const due = topics.filter(
    (t) => t.learnedAt && t.reviewDue && t.reviewDue <= localDate() && !t.archived,
  );
  const needle = search.trim().toLocaleLowerCase();
  const filtered = (
    tab === 'reviews'
      ? due
      : needle
        ? topics
        : topics.filter((t) => (t.parentId || null) === (parent?.id || null))
  ).filter(
    (t) =>
      !needle ||
      [t.title, ...topicPath(snapshot, t).map((p) => p.title)]
        .join(' ')
        .toLocaleLowerCase()
        .includes(needle),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize)),
    currentPage = Math.min(page, pages - 1);
  const visible = filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const act = async (work: () => Promise<unknown>) => {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    setActionError('');
    try {
      await work();
    } catch (reason) {
      setActionError(String(reason));
    } finally {
      working.current = false;
      setBusy(false);
    }
  };
  const openTopic = (t: StudyTopic) => {
    setSearch('');
    setParams(hasChildren.has(t.id) ? { chapter: t.id } : { topic: t.id });
  };
  const saveCurriculum = (next: Partial<Curriculum>) =>
    void act(() => window.workspaceAPI.invoke('study:saveCurriculum', { ...curriculum!, ...next }));
  const forbiddenParents = new Set<string>();
  if (topicDraft?.id)
    for (const t of topics)
      if (topicPath(snapshot, t).some((p) => p.id === topicDraft.id)) forbiddenParents.add(t.id);
  const parentOptions = studyOptions(snapshot)
    .filter((o) => o.group === topicDraft?.curriculumId && !forbiddenParents.has(o.value.slice(6)))
    .map((o) => ({ ...o, value: o.value.slice(6) }));
  const addTopic = (parentId: string | null = null) =>
    setTopicDraft({
      curriculumId: curriculum!.id,
      parentId,
      title: '',
      order: Math.max(-1, ...topics.map((t) => t.order)) + 1,
    });
  const topicMenu = (topic: StudyTopic) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="icon-button"
          aria-label={`Actions for ${topic.title}`}
          disabled={busy || focus.busy}
        >
          <MoreHorizontal />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          disabled={
            topic.archived || curriculum?.archived || !!topic.learnedAt || hasChildren.has(topic.id)
          }
          onSelect={() => saveCurriculum({ currentTopicId: topic.id, studyFocus: true })}
        >
          <Target />
          Make current topic
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={topic.archived || curriculum?.archived}
          onSelect={() => void focus.start(curriculum!, topic, true)}
        >
          <Timer />
          Track time
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setTopicDraft(topic)}>
          <Pencil />
          Edit topic
        </DropdownMenuItem>
        <DropdownMenuItem disabled={curriculum?.archived} onSelect={() => addTopic(topic.id)}>
          <Plus />
          Add subtopic
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() =>
            void act(() =>
              window.workspaceAPI.invoke('study:saveTopic', {
                ...topic,
                archived: !topic.archived,
              }),
            )
          }
        >
          {topic.archived ? <RotateCcw /> : <Archive />}
          {topic.archived ? 'Restore' : 'Archive'} topic
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!!topic.learnedAt}
          onSelect={() => {
            if (window.confirm(`Delete “${topic.title}”? Child topics will become root topics.`))
              void act(() => window.workspaceAPI.invoke('study:deleteTopic', topic.id));
          }}
        >
          <Trash2 />
          Delete topic
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
  const curriculumRow = (c: Curriculum) => {
    const p = curriculumProgress(snapshot, c.id),
      next = studyContinuation(snapshot, c, state.sessions, state.timer);
    return (
      <Link className="study-library-row" key={c.id} to={`/study/${c.id}`}>
        <BookOpen />
        <div>
          <h3>{c.title}</h3>
          <p className="muted small">
            {c.archived ? 'Archived · ' : ''}
            {p.learned}/{p.total} learned · {formatStudyTime(time.curriculumSeconds[c.id] || 0)}{' '}
            recorded
          </p>
          <p className="muted study-library-next">
            {next.topic
              ? `Continue: ${next.topic.title}`
              : next.complete
                ? 'Learning path complete'
                : 'Add your first topic'}
          </p>
        </div>
        <div className="study-library-progress">
          <Progress value={p.percent} aria-label={`${c.title} progress`} />
          <span className="muted small">{Math.round(p.percent)}%</span>
        </div>
        <ChevronRight />
      </Link>
    );
  };
  return (
    <div className="page study-page study-workspace">
      {curriculumId && (
        <Link className="text-link study-back" to="/study">
          <ArrowLeft />
          Study library
        </Link>
      )}
      {curriculum && <CurriculumCover curriculum={curriculum} />}
      <PageHeader
        title={curriculum?.title || 'Study'}
        description={
          curriculum
            ? `${progress.learned}/${progress.total} topics learned · ${formatStudyTime(time.curriculumSeconds[curriculum.id] || 0)} recorded`
            : 'Your learning paths. One place to pick up where you left off.'
        }
        action={
          <div className="row-actions">
            {curriculum ? (
              <>
                <button className="btn-secondary" onClick={() => setCurriculumDraft(curriculum)}>
                  <Pencil />
                  Edit curriculum
                </button>
                <button
                  className="btn-primary"
                  disabled={busy || focus.busy || curriculum.archived || !continuation?.topic}
                  onClick={() => void focus.start(curriculum, continuation?.topic)}
                >
                  <Play />
                  Continue studying
                </button>
              </>
            ) : (
              <>
                <button className="btn-secondary" onClick={() => setImporting(true)}>
                  <Upload />
                  Import roadmaps
                </button>
                <button
                  className="btn-primary"
                  onClick={() =>
                    setCurriculumDraft({ title: '', description: '', studyFocus: true })
                  }
                >
                  <Plus />
                  New curriculum
                </button>
              </>
            )}
          </div>
        }
      />
      {(error || actionError || focus.error) && (
        <p role="alert" className="inline-error">
          {error || actionError || focus.error}
        </p>
      )}
      {!ready && !error ? (
        <p className="muted">Opening study…</p>
      ) : curriculumId && !curriculum ? (
        <Empty
          icon={<BookOpen />}
          title="Curriculum not found"
          description="Return to your library to choose an available curriculum."
        />
      ) : !curriculum ? (
        <>
          <div className="study-toolbar">
            <h2>Current focus</h2>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={archived}
                onChange={(e) => setArchived(e.target.checked)}
              />
              Show archived
            </label>
          </div>
          <p className="muted study-section-intro">
            Pin the subjects you’re working on now. Everything else stays ready for later.
          </p>
          <div className="study-library">
            {curricula.filter((c) => isStudyFocus(c)).map(curriculumRow)}
          </div>
          {!curricula.some((c) => isStudyFocus(c)) && (
            <p className="muted inline-empty">Open a curriculum and turn on Current study focus.</p>
          )}
          <h2 className="study-later-heading">Library</h2>
          <div className="study-library">
            {curricula.filter((c) => !isStudyFocus(c)).map(curriculumRow)}
          </div>
          {!curricula.length && (
            <Empty
              icon={<BookOpen />}
              title="Build a learning path"
              description="Import your roadmaps or create a curriculum to begin."
            />
          )}
        </>
      ) : (
        <>
          <div className="study-course-toolbar">
            <label className="toggle-row">
              <input
                type="checkbox"
                disabled={busy || curriculum.archived}
                checked={!!curriculum.studyFocus}
                onChange={(e) => saveCurriculum({ studyFocus: e.target.checked })}
              />
              Current study focus
            </label>
            {curriculum.focusUntil && (
              <span className="muted small">
                {isStudyFocus(curriculum) ? 'Until' : 'Focus period ended'} {curriculum.focusUntil}
              </span>
            )}
            <button
              className="text-link"
              onClick={() =>
                navigate(`/statistics?view=time&curriculum=${encodeURIComponent(curriculum.id)}`)
              }
            >
              <ChartNoAxesColumn />
              Study time
            </button>
            <button
              className="text-link"
              disabled={busy}
              onClick={() => saveCurriculum({ archived: !curriculum.archived })}
            >
              {curriculum.archived ? <RotateCcw /> : <Archive />}
              {curriculum.archived ? 'Restore' : 'Archive'}
            </button>
          </div>
          {curriculum.archived && (
            <p className="muted">Archived curriculum. Restore it to resume studying.</p>
          )}
          <div className="study-content-tabs tabs">
            <button className={tab === 'topics' ? 'selected' : ''} onClick={() => setTab('topics')}>
              Topics
            </button>
            <button
              className={tab === 'reviews' ? 'selected' : ''}
              onClick={() => setTab('reviews')}
            >
              Reviews{due.length ? ` (${due.length})` : ''}
            </button>
          </div>
          {selectedTopic && (
            <section ref={inspector} className="study-topic-inspector" aria-label="Selected topic">
              <div className="section-heading">
                <h2>{selectedTopic.title}</h2>
                <button
                  className="icon-button"
                  aria-label="Close topic details"
                  onClick={() => setParams(parent ? { chapter: parent.id } : {})}
                >
                  <ArrowLeft />
                </button>
              </div>
              <p className="muted">
                {formatStudyTime(time.topicSeconds[selectedTopic.id] || 0)} recorded across all
                sessions{selectedTopic.reviewDue ? ` · Review ${selectedTopic.reviewDue}` : ''}
              </p>
              {selectedTopic.details && (
                <p className="study-topic-details">{selectedTopic.details}</p>
              )}
              <div className="row-actions">
                <button
                  className="btn-primary"
                  disabled={focus.busy || curriculum.archived || selectedTopic.archived}
                  onClick={() => void focus.start(curriculum, selectedTopic)}
                >
                  <Play />
                  Start focus
                </button>
                <button
                  className="btn-secondary"
                  disabled={
                    busy ||
                    curriculum.archived ||
                    selectedTopic.archived ||
                    !!selectedTopic.learnedAt
                  }
                  onClick={() =>
                    saveCurriculum({ currentTopicId: selectedTopic.id, studyFocus: true })
                  }
                >
                  <Target />
                  Make current topic
                </button>
              </div>
            </section>
          )}
          <section className="study-topic-browser" aria-label="Topic browser">
            <div className="study-browser-header">
              <nav className="study-breadcrumbs" aria-label="Study chapters">
                <button
                  onClick={() => {
                    setParams({});
                    setSearch('');
                  }}
                >
                  All topics
                </button>
                {parent &&
                  topicPath(snapshot, parent).map((t) => (
                    <span key={t.id}>
                      <ChevronRight />
                      <button
                        onClick={() => {
                          setParams({ chapter: t.id });
                          setSearch('');
                        }}
                      >
                        {t.title}
                      </button>
                    </span>
                  ))}
              </nav>
              <button
                className="btn-secondary"
                disabled={curriculum.archived}
                onClick={() => addTopic(parent?.id || null)}
              >
                <Plus />
                Add topic
              </button>
            </div>
            <input
              className="input study-topic-search"
              aria-label="Search study topics"
              placeholder="Search this curriculum…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {tab === 'reviews' && (
              <p className="muted small">
                Grade what you remember. Again: 1 day · Hard: ×1.2 · Good: ×2 · Easy: ×3.
              </p>
            )}
            <div className="study-topic-list">
              {visible.map((t) => (
                <div
                  className={`study-browser-row ${selectedTopic?.id === t.id ? 'selected' : ''}`}
                  key={t.id}
                >
                  <input
                    type="checkbox"
                    aria-label={`Mark ${t.title} learned`}
                    disabled={busy || t.archived || curriculum.archived}
                    checked={!!t.learnedAt}
                    onChange={() =>
                      void act(() =>
                        window.workspaceAPI.invoke('study:learn', {
                          id: t.id,
                          learned: !t.learnedAt,
                        }),
                      )
                    }
                  />
                  <button className="study-topic-title" onClick={() => openTopic(t)}>
                    <span>
                      {t.title}
                      {hasChildren.has(t.id) && <ChevronRight />}
                    </span>
                    <small className="muted">
                      {needle
                        ? topicPath(snapshot, t)
                            .slice(0, -1)
                            .map((p) => p.title)
                            .join(' › ')
                        : hasChildren.has(t.id)
                          ? `${topics.filter((c) => c.parentId === t.id).length} topics`
                          : t.learnedAt
                            ? 'Learned'
                            : 'To learn'}
                      {t.id === curriculum.currentTopicId ? ' · Current topic' : ''}
                    </small>
                  </button>
                  <span className="study-row-time muted small">
                    {formatStudyTime(time.topicSeconds[t.id] || 0)}
                  </span>
                  {tab === 'reviews' ? (
                    <div className="review-grades">
                      {reviewGrades.map((grade, index) => (
                        <button
                          key={grade}
                          className="btn-secondary"
                          disabled={busy || curriculum.archived}
                          onClick={() =>
                            void act(() =>
                              window.workspaceAPI.invoke('study:grade', {
                                id: t.id,
                                grade: index as ReviewGrade,
                              }),
                            )
                          }
                        >
                          {grade}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <button
                      className="icon-button"
                      aria-label={`Start focus for ${t.title}`}
                      disabled={focus.busy || busy || t.archived || curriculum.archived}
                      onClick={() => void focus.start(curriculum, t)}
                    >
                      <Play />
                    </button>
                  )}
                  {topicMenu(t)}
                </div>
              ))}
            </div>
            {!filtered.length && (
              <p className="muted inline-empty">
                {needle
                  ? 'No matching topics. Try another search.'
                  : tab === 'reviews'
                    ? 'You’re up to date. Learned topics appear here when a review is due.'
                    : 'No topics here yet. Add a topic to get started.'}
              </p>
            )}
            {filtered.length > 0 && (
              <div className="study-pagination">
                <span role="status" className="muted small">
                  {currentPage * pageSize + 1}–
                  {Math.min(filtered.length, (currentPage + 1) * pageSize)} of {filtered.length} ·
                  Page {currentPage + 1}/{pages}
                </span>
                <div className="row-actions">
                  <button
                    className="btn-secondary"
                    disabled={currentPage === 0}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    Previous
                  </button>
                  <button
                    className="btn-secondary"
                    disabled={currentPage === pages - 1}
                    onClick={() => setPage(currentPage + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
            <label className="toggle-row study-show-archived">
              <input
                type="checkbox"
                checked={archived}
                onChange={(e) => setArchived(e.target.checked)}
              />
              Show archived topics
            </label>
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
                navigate(`/study/${saved.id}`);
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
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={!!curriculumDraft.studyFocus}
                onChange={(e) =>
                  setCurriculumDraft({ ...curriculumDraft, studyFocus: e.target.checked })
                }
              />
              Current study focus
            </label>
            <label>
              Focus until (optional)
              <input
                className="input"
                type="date"
                value={curriculumDraft.focusUntil || ''}
                onChange={(e) =>
                  setCurriculumDraft({ ...curriculumDraft, focusUntil: e.target.value || null })
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
            navigate(`/study/${id}`);
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
              <SearchPicker
                label="Parent chapter"
                value={topicDraft.parentId || ''}
                options={parentOptions}
                allowClear
                clearLabel="Root topic"
                emptyLabel="Root topic"
                onChange={(id) => setTopicDraft({ ...topicDraft, parentId: id || null })}
              />
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
