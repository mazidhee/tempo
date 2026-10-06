import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Check, ChevronLeft, ArrowUpRight, Archive, Undo2, Pencil } from 'lucide-react';
import { useProductivity } from '../hooks/ProductivityProvider';
import { activeTask, taskArea } from '../../shared/taskLifecycle';
import { formatStudyTime } from '../../shared/time';
import type { WorkProject } from '../../shared/work';
import '../styles/work-page.css';
export default function Work() {
  const { state, update, ready } = useProductivity();
  const [params, setParams] = useSearchParams();
  const projects = state.settings.workProjects ?? [];
  const selected = projects.find(p => p.id === params.get('project'));
  const [adding, setAdding] = useState(false), [title, setTitle] = useState(''), [description, setDescription] = useState('');
  const [milestone, setMilestone] = useState(''), [due, setDue] = useState(''), [error, setError] = useState('');
  const [archived, setArchived] = useState(false);
  const [editingProject, setEditingProject] = useState(false), [editingMilestone, setEditingMilestone] = useState<string | null>(null);
  const saveProjects = (fn: (current: WorkProject[]) => WorkProject[]) => update(s => ({ ...s, settings: { ...s.settings, workProjects: fn(s.settings.workProjects ?? []) } }));
  const workTasks = state.tasks.filter(t => taskArea(t) === 'work');
  const tasks = selected ? workTasks.filter(t => t.workProjectId === selected.id) : workTasks;
  const live = tasks.filter(activeTask);
  const focused = selected ? state.sessions.filter(s => s.phase === 'focus' && s.link?.type === 'task' && (s.link.workProjectId === selected.id || tasks.some(t => t.id === s.link?.id))).reduce((sum, s) => sum + s.duration, 0) :
    state.sessions.filter(s => s.phase === 'focus' && s.link?.type === 'task' && (s.link.area === 'work' || workTasks.some(t => t.id === s.link?.id))).reduce((sum, s) => sum + s.duration, 0);
  return <div className="work-page">
    {selected && <button className="btn-ghost work-back" onClick={() => { setParams({}); setMilestone(''); setDue(''); setEditingMilestone(null); setEditingProject(false); }}><ChevronLeft />All work projects</button>}
    <header className="work-header"><div><h1>{selected?.title ?? 'Work'}</h1><p>{selected?.description || 'Projects, milestones and the next thing to move forward.'}</p></div>
      {!selected && <button className="btn-ghost" disabled={!ready || projects.length >= 1000} onClick={() => setAdding(!adding)}><Plus />New project</button>}
      {selected && <div className="row-actions"><button className="btn-ghost" onClick={() => { setTitle(selected.title); setDescription(selected.description); setEditingProject(!editingProject); setError(''); }}><Pencil />Edit</button>
      <button className="btn-ghost" onClick={() => saveProjects(all => all.map(p => p.id === selected.id ? { ...p, archived: !p.archived } : p))}>{selected.archived ? <Undo2 /> : <Archive />}{selected.archived ? 'Restore project' : 'Archive project'}</button></div>}
    </header>
    <div className="work-context"><span>{live.length} open {live.length === 1 ? "task" : "tasks"}</span><span>{formatStudyTime(focused)} focused</span>
      <Link className="text-link" to={`/tasks?area=work&view=All${selected ? `&project=${selected.id}` : ''}`}>Open work tasks<ArrowUpRight /></Link>
      <Link className="text-link" to="/plan">Plan today<ArrowUpRight /></Link></div>
    {((adding && !selected) || (editingProject && selected)) && <form className="form-stack work-project-form" onSubmit={e => { e.preventDefault();
      if (!title.trim()) return;
      if (projects.some(p => p.id !== selected?.id && p.title.toLowerCase() === title.trim().toLowerCase())) { setError('A project with this name already exists. Open it or choose another name.'); return; }
      if (selected) {
        update(s => ({ ...s, tasks: s.tasks.map(t => t.workProjectId === selected.id ? { ...t, project:title.trim() } : t), settings: { ...s.settings, workProjects:(s.settings.workProjects ?? []).map(p => p.id === selected.id ? { ...p, title:title.trim(),description:description.trim() } : p) } }));
        setEditingProject(false); setError(''); return;
      }
      const project: WorkProject = { id: crypto.randomUUID(), title: title.trim(), description: description.trim(), archived: false, milestones: [] };
      saveProjects(all => [...all, project]); setParams({ project: project.id }); setAdding(false); setTitle(''); setDescription(''); setError('');
    }}><label>Project name<input className="input" required maxLength={200} autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Reporting pipeline" /></label>
      <label>What are you working towards?<textarea className="input" rows={2} maxLength={2000} value={description} onChange={e => setDescription(e.target.value)} placeholder="A short outcome or purpose" /></label>
      {error && <p className="inline-error" role="alert">{error}</p>}<div className="row-actions"><button className="btn-primary" disabled={!ready || !title.trim()}>{selected ? 'Save project' : 'Create project'}</button><button type="button" className="btn-ghost" onClick={() => { setAdding(false); setEditingProject(false); }}>Cancel</button></div></form>}
    {!selected ? <>
      <div className="section-heading"><h2>Your projects</h2><label className="row-actions"><input type="checkbox" checked={archived} onChange={e => setArchived(e.target.checked)} />Show archived</label></div>
      <ul className="work-projects">{projects.filter(p => archived || !p.archived).map(project => {
        const remaining = workTasks.filter(t => t.workProjectId === project.id && activeTask(t)).length;
        const complete = project.milestones.filter(m => m.completedAt).length;
        return <li key={project.id}><button onClick={() => setParams({ project: project.id })}><div><h3>{project.title}</h3><p>{project.description || 'Open this project to choose its next step.'}</p><small>{remaining} open {remaining === 1 ? "task" : "tasks"} · {complete}/{project.milestones.length} milestones{project.archived && ' · Archived'}</small></div><ArrowUpRight /></button></li>;
      })}</ul>
      {!projects.some(p => archived || !p.archived) && <div className="work-empty"><h2>One place for the work ahead.</h2><p>Create a project, choose its milestones, then add work tasks. Your personal tasks and studying stay alongside them.</p></div>}
    </> : <>
      <section className="work-milestones"><div className="section-heading"><h2>Milestones</h2><span className="muted small">{selected.milestones.filter(m => m.completedAt).length} of {selected.milestones.length} reached</span></div>
        {selected.milestones.length > 0 && <div className="progress-track"><i style={{ width: `${selected.milestones.filter(m => m.completedAt).length / selected.milestones.length * 100}%` }} /></div>}
        <ul>{selected.milestones.map(m => <li key={m.id}><button className={`check-button ${m.completedAt ? 'checked' : ''}`} aria-label={`${m.completedAt ? 'Reopen' : 'Complete'} milestone ${m.title}`} aria-pressed={!!m.completedAt}
          onClick={() => saveProjects(all => all.map(p => p.id === selected.id ? { ...p, milestones: p.milestones.map(item => item.id === m.id ? { ...item, completedAt: item.completedAt ? null : new Date().toISOString() } : item) } : p))}>{m.completedAt && <Check />}</button>
          <div><button className={`milestone-title${m.completedAt ? ' done-text' : ''}`} aria-label={`Edit milestone ${m.title}`} onClick={() => { setEditingMilestone(m.id); setMilestone(m.title); setDue(m.due); }}>{m.title}</button>{m.due && <small className="muted">{new Date(m.due + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</small>}</div></li>)}</ul>
        {!selected.archived && <form className="work-milestone-add" onSubmit={e => { e.preventDefault(); if (!milestone.trim()) return;
          saveProjects(all => all.map(p => p.id === selected.id ? { ...p, milestones: editingMilestone ? p.milestones.map(m => m.id === editingMilestone ? { ...m,title:milestone.trim(),due } : m) : [...p.milestones, { id: crypto.randomUUID(), title: milestone.trim(), due, completedAt: null }] } : p)); setMilestone(''); setDue(''); setEditingMilestone(null);
        }}><Plus /><input aria-label="New work milestone" maxLength={500} placeholder="Add a milestone…" value={milestone} onChange={e => setMilestone(e.target.value)} /><input type="date" aria-label="Milestone target date" value={due} onChange={e => setDue(e.target.value)} /><button className="btn-ghost" disabled={!ready || !milestone.trim() || (!editingMilestone && selected.milestones.length >= 500)}>{editingMilestone ? 'Save' : 'Add'}</button>
        {editingMilestone && <button type="button" className="btn-ghost" onClick={() => { setEditingMilestone(null); setMilestone(''); setDue(''); }}>Cancel</button>}</form>}
      </section>
      <section><div className="section-heading"><h2>Next tasks</h2><Link className="text-link" to={`/tasks?area=work&view=All&project=${selected.id}`}>Add or manage tasks<ArrowUpRight /></Link></div>
        <ul className="work-next-tasks">{live.slice(0, 8).map(t => <li key={t.id}><button className="check-button" aria-label={`Complete work task ${t.title}`} onClick={() => update(s => ({ ...s, tasks: s.tasks.map(task => task.id === t.id ? { ...task, completedAt: new Date().toISOString() } : task) }))} /><Link to={`/tasks?area=work&view=All&project=${selected.id}`}>{t.title}</Link></li>)}</ul>
        {!live.length && <p className="muted">Add a next step to this project, then start a focus session from its task.</p>}
      </section>
    </>}
  </div>;
}
