import { useProductivity } from '../hooks/ProductivityProvider';
import { Link } from 'react-router-dom';
export default function TaskSettings() {
  const { state, update } = useProductivity();
  return <section className="thought-settings"><h2>Task cleanup</h2>
    <p className="muted">Completed and archived tasks move to recoverable Trash. Focus sessions, project milestones and habits stay saved. Trash is never emptied automatically.</p>
    <label className="setting-row"><span>Move old tasks to Trash automatically</span><input type="checkbox" checked={state.settings.taskCleanup !== false}
      onChange={e => update(s => ({ ...s, settings: { ...s.settings, taskCleanup: e.target.checked } }))} /></label>
    <label className="setting-name">Keep completed or archived tasks for<select className="input" aria-label="Task retention period" value={state.settings.taskRetentionDays ?? 30}
      onChange={e => update(s => ({ ...s, settings: { ...s.settings, taskRetentionDays: Number(e.target.value) } }))}>
      {[7, 14, 30, 60, 90, 180, 365].map(days => <option key={days} value={days}>{days} days</option>)}
      {![7, 14, 30, 60, 90, 180, 365].includes(state.settings.taskRetentionDays ?? 30) && <option value={state.settings.taskRetentionDays}>{state.settings.taskRetentionDays} days</option>}
    </select></label><p className="muted small">Open a task and choose Keep to exempt it. Restored tasks are kept until you turn that off.</p>
    <Link className="text-link" to="/tasks?view=Trash">Open task Trash</Link>
  </section>;
}
