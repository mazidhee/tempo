import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, ChevronUp, ChevronDown, Pause, Play } from 'lucide-react';
import { useProductivity } from '../hooks/ProductivityProvider';
import { defaultThoughtLibrary, type Thought } from '../../shared/thoughts';
import '../styles/daily-thought.css';
export default function ThoughtSettings() {
  const { state, update, ready } = useProductivity();
  const library = state.settings.thoughtLibrary ?? defaultThoughtLibrary();
  const [draft, setDraft] = useState<Thought | null>(null);
  const change = (entries: Thought[]) => update(s => ({ ...s, settings: { ...s.settings,
    thoughtLibrary: { ...(s.settings.thoughtLibrary ?? defaultThoughtLibrary()), entries } } }));
  const move = (id: string, delta: number) => {
    const entries = [...library.entries], index = entries.findIndex(v => v.id === id);
    if (index + delta < 0 || index + delta >= entries.length) return;
    [entries[index], entries[index + delta]] = [entries[index + delta], entries[index]];
    change(entries);
  };
  return <section className="thought-settings">
    <div className="section-heading"><h2>Daily thoughts</h2><button className="btn-ghost" disabled={!ready || library.entries.length >= 1000}
      onClick={() => setDraft({ id: crypto.randomUUID(), text: '', author: 'A note to myself', prompt: '', active: true })}><Plus />Add a thought</button></div>
    <p className="muted">One thought for each local day. Add your own words or a quote with its author; pause entries to leave them out of rotation. Changes apply to future days.</p>
    <label className="setting-name">Home display<select className="input" aria-label="Thought Home display" value={state.settings.greetingStyle ?? 'mixed'}
      onChange={e => update(s => ({ ...s, settings: { ...s.settings, greetingStyle: e.target.value as 'mixed' | 'simple' | 'stoic' } }))}>
      <option value="mixed">Varied and personal</option><option value="simple">Simple greeting</option><option value="stoic">Daily Stoic and personal thought</option>
    </select></label>
    {draft && <form className="form-stack thought-edit" onSubmit={e => { e.preventDefault();
      const saved = { ...draft, text: draft.text.trim(), author: draft.author.trim(), prompt: draft.prompt.trim() };
      if (!saved.text) return;
      change(library.entries.some(v => v.id === saved.id) ? library.entries.map(v => v.id === saved.id ? saved : v) : [...library.entries, saved]); setDraft(null);
    }}>
      <label>Thought or quote<textarea className="input" autoFocus required maxLength={2000} rows={4} value={draft.text} onChange={e => setDraft({ ...draft, text: e.target.value })} /></label>
      <label>Attribution<input className="input" maxLength={200} value={draft.author} onChange={e => setDraft({ ...draft, author: e.target.value })} placeholder="Author, or A note to myself" /></label>
      <label>Evening reflection question <span className="muted">(optional)</span><input className="input" maxLength={500} value={draft.prompt} onChange={e => setDraft({ ...draft, prompt: e.target.value })} /></label>
      <div className="row-actions"><button className="btn-primary" disabled={!ready || !draft.text.trim()}>Save thought</button><button className="btn-ghost" type="button" onClick={() => setDraft(null)}>Cancel</button></div>
    </form>}
    <p className="muted small">{library.entries.filter(v => v.active).length} active · Stored locally · <Link to="/">Preview Home</Link></p>
    {!library.entries.some(v => v.active) && <p className="muted">Resume an entry or add your own to show a daily thought.</p>}
    <ul className="thought-library">{library.entries.map((entry, index) => <li key={entry.id}>
      <div><p>{entry.text}</p><small className="muted">{entry.author || 'Your thought'}{!entry.active && ' · Paused'}</small>
      {entry.source && <a className="thought-source" href={entry.source} target="_blank" rel="noreferrer">Source idea</a>}</div>
      <div className="row-actions">
        <button className="icon-button" disabled={index === 0 || !ready} aria-label={`Move thought ${index + 1} up`} onClick={() => move(entry.id, -1)}><ChevronUp /></button>
        <button className="icon-button" disabled={index === library.entries.length - 1 || !ready} aria-label={`Move thought ${index + 1} down`} onClick={() => move(entry.id, 1)}><ChevronDown /></button>
        <button className="icon-button" disabled={!ready} aria-label={`Edit thought ${index + 1}`} onClick={() => setDraft({ ...entry })}><Pencil /></button>
        <button className="icon-button" disabled={!ready} aria-label={`${entry.active ? 'Pause' : 'Resume'} thought ${index + 1}`} onClick={() => change(library.entries.map(v => v.id === entry.id ? { ...v, active: !v.active } : v))}>{entry.active ? <Pause /> : <Play />}</button>
      </div></li>)}</ul>
    <p className="muted small">The included Stoic entries are original paraphrases of source ideas, labelled “Inspired by”. Your own quotations keep the attribution you provide.</p>
  </section>;
}
